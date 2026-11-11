---
title: "ADR 0005: Implement the node-local PV testcase cache PoC"
description: "Record how the PV PoC fetches, verifies, installs, and reads versioned testcase bundles without a manager, and the proposed amendments from a second implementation."
status: proposed
date: "2026-11-11"
# Person responsible for drafting the ADR and coordinating its review.
owner: "송현준"
# People who participated in making the decision; leave empty while proposed.
decision_makers: 
  - "이준하"
  - "송현준"
# IDs of older ADRs that this decision replaces, if any.
supersedes: []
# ID of a later ADR that replaces this one; set only when superseded.
superseded_by: null
---

# ADR 0005: Implement the node-local PV testcase cache PoC

## Context

[ADR 0001](./0001-versioned-local-testcase-replication.md) pins each judge request to an immutable testcase version and keeps a replica on each judge node. It leaves the storage medium and lock API to a PoC. [ADR 0003](./0003-node-local-testcase-pv-coordination.md) proposes a TC Manager that coordinates loading and GC for a node-local persistent volume (PV).

This ADR records the PV PoC (TAS-3060), which implements the cache path **without a manager**: Iris fetches a versioned manifest, selects the public and hidden bundles it needs, installs each verified bundle on the PV, and reads testcase files from there. The PoC excludes GC, locking, and cache repair, and was validated on a local kind cluster with MinIO as the S3 substitute.

Two implementations were made independently so the better one can be merged:

- **Baseline** (`t3060-local-pv-poc`): the design in [Decision](#decision).
- **Amendments** (`t3060-1-local-pv-poc`, based on the baseline): two changes in [Proposed amendments](#proposed-amendments). The two authors have not yet reviewed each other's work, so the amendments are proposals within this proposal.

The artifact and request formats follow the agreed testcase artifact structure and are not changed by either implementation.

## Decision drivers

- Serve only the requested version. A failed versioned lookup must not fall back to the current `problemId` testcases.
- Never expose a partially downloaded or unverified bundle as a cache entry.
- Keep existing judge/run request fields, testcase filters, and user-supplied testcases working.
- Make a warm request avoid repeated remote transfer.
- Keep the PoC small enough to compare with a manager-based design later.

## Considered options

Choices already settled by ADR 0001 (versioned key, compressed remote bundle, unpacked local copy, node-local cache) are not repeated here. The PoC made these additional choices:

| Choice | Options | Baseline choice |
| --- | --- | --- |
| Bundles to install | All bundles of the set, or only those required by the request filter | Only bundles required by the filter |
| Cache hit check | Trust a published directory, or re-hash files on every hit | Trust the published directory; integrity is checked once at install |
| Manifest retrieval | Fetch on every request, or cache locally | Fetch on every request (changed by amendment B) |
| Bundle identity | Arbitrary IDs, or fixed `public`/`hidden` | Fixed `public`/`hidden`, cross-checked with each testcase's `hidden` flag |
| Legacy requests | Require versioned fields, or keep the `problemId` path when they are absent | Keep the legacy path only when both versioned fields are absent |
| Concurrent installs | Assume callers serialize, tolerate races without locks, or coordinate with a manager | Assume callers serialize (changed by amendment A; ADR 0003 covers coordination) |

## Decision

For the PV PoC, Iris reads versioned testcases from a node-local PV cache as follows.

### Remote and local layout

```
S3:  testcases/<testcaseSetId>/manifest.json
     testcases/<testcaseSetId>/<checksum>.tar.zst

PV:  <TESTCASE_CACHE_PATH>/sha256/<first 2 hex>/<64 hex>/<testcase files>
```

- A bundle checksum is the SHA-256 of the final compressed bytes, written as `sha256:<64 lowercase hex>`.
- The cache path is derived only from the checksum, so a published directory is immutable and shared by any request referencing the same bundle.
- `TESTCASE_CACHE_PATH` defaults to `/cache/testcases`, the PV mount point.

### Manifest contract

The manifest lists the bundles (`id`, `objectKey`, `checksum`) and testcases (`id`, `bundleId`, `input`, `output`, `hidden`, `scoreWeight`). Iris rejects a manifest before installing anything unless:

- `testcaseSetId` is non-empty and equals the requested ID.
- Bundle IDs are `public` or `hidden`, and bundle and testcase IDs are unique.
- Every checksum is a normalized SHA-256 value.
- Every testcase references an existing bundle, and `hidden` matches its `bundleId`.
- Testcase file names are valid relative paths.

### Installation on a miss

1. Fetch the exact `objectKey` from S3. Do not list a prefix or query the database.
2. Download into a `.install-*` staging directory next to the destination, on the same filesystem, while computing SHA-256. Reject a checksum mismatch.
3. Extract the zstd tar archive. Reject path traversal, absolute paths, backslashes, links, non-regular entries, and duplicate entries. Write files read-only (`0440`) without restoring archive owners or modes. Read to the end of the zstd frame to detect truncation.
4. Confirm that every input and output file the manifest assigns to this bundle exists as a regular file.
5. Publish by renaming the staging payload to the checksum path. Remove staging data on every failure.

### Reading and request handling

- A published directory is a hit. Files are read through `os.Root`, confined to the bundle directory. Testcases are returned in manifest order with the existing `ALL`, `PUBLIC_ONLY`, and `HIDDEN_ONLY` filters.
- Judge and run requests accept optional `testcaseSetId` and `manifestKey`.
  - Both fields present: use the versioned path.
  - Both absent: use the existing `problemId` path.
  - Only one present: reject the request.
- A versioned lookup failure is reported as a testcase error. Iris never retries it with `problemId`. Iris logs the message ID, `testcaseSetId`, `manifestKey`, and cause; the external response format is unchanged.
- User-supplied testcases continue to bypass storage.

### Out of scope

No GC, no locking, no repair of a corrupt hit, and no manifest caching. Production storage medium, lock API, and GC remain with ADR 0003 and a follow-up ADR.

## Proposed amendments

These changes are implemented on `t3060-1-local-pv-poc` and keep all baseline contracts above.

### A. Idempotent bundle installation

**Problem.** The baseline returns an error if the destination already exists, and fails when the final rename meets an existing directory. Several Iris Pods share each node's PV: the base deployment runs 20 replicas spread across about five nodes. When the first submissions for a new version reach different Pods on one node, every installer except the first fails the submission.

**Change.**
- If the checksum directory already exists, return it without downloading.
- If the rename fails because another installer published first (`EEXIST`/`ENOTEMPTY`, both `fs.ErrExist`), discard the staging copy and use the existing directory.
- A non-directory at the destination is an error. An existing installation is never replaced.

Because the path is derived from the verified checksum, every completed installation of a path has identical content, so no lock is needed for correctness. Concurrent Pods may still download the same bundle more than once.

### B. Local manifest cache

**Problem.** The baseline fetches the manifest on every request. A fully warm request still makes one S3 request. If S3 is unreachable, Iris cannot judge a version whose bundles are already on the PV.

**Change.**
- Store each fetched manifest at `<TESTCASE_CACHE_PATH>/manifests/<sha256(manifestKey)>.json`. Hashing the key keeps request values out of file paths.
- On every read, parse and validate the local copy as a remote manifest is validated.
- If the copy is unreadable or invalid, delete it and fetch again.
- If a valid copy has a different `testcaseSetId` than requested, fail without a remote request and keep the copy. The same immutable key would return the same manifest.
- Write with a temporary file and rename. A failed write does not fail the request.

This relies on the existing contract that a versioned manifest key is never overwritten.

**Consequences.**

- Positive: After a node installs a version, later requests read bundles from the PV. Amendment B also removes the manifest request, so a warm request makes no remote request. Verified, atomically published installs mean a reader never sees partial data, and a pinned version is never replaced by the current active set.
- Positive: Amendment A removes submission failures from concurrent first installs on a shared PV without adding locks.
- Negative: There is no GC, so PV usage grows with every installed version. There is no locking: concurrent Pods may download the same bundle more than once, and nothing prevents a future GC from deleting a path being read.
- Negative: A corrupt file in a published directory is not detected on a hit and is not repaired
  automatically. Staging directories left by a killed process are not cleaned up.
- Negative: With amendment B, judging during an S3 outage works only in Iris Pods that were already running. Iris checks S3, RabbitMQ, and Postgres at startup and exits if one is unreachable, so a Pod (re)started during an outage cannot judge, even with a warm PV.
- Follow-up: Choose the production storage medium, lock API, and GC through ADR 0003 or a follow-up ADR. Decide whether Iris startup should tolerate an unreachable S3. Measure both implementations with the same benchmark on the same machine before merging.

## Verification

**Unit tests** (`apps/iris/src/loader`, `apps/iris/src/service/testcase`, `apps/iris/src/handler`) cover:

- Baseline: manifest validation; exact-key fetch; checksum mismatch; corrupt, truncated, and incomplete archives; unsafe tar entries; staging cleanup; filters and hit/miss; versioned/legacy request selection; no fallback after a versioned failure.
- Amendment A: re-install returns the existing path without a download. An installer that loses the rename race uses the winner and leaves no staging data. Eight concurrent installers sharing only the cache directory all succeed; this test fails on the baseline with `rename ...: file exists`. A non-directory destination is rejected.
- Amendment B: a second request makes no remote request. A warm request succeeds with the manifest deleted remotely and with no source. A corrupt local copy is replaced. A mismatching `testcaseSetId` fails without a remote request. A failed write does not fail the request. A key such as `../../escape` stays inside the cache directory.

**kind + MinIO integration**, using the PoC manifests under `infra/k8s/iris/poc/local-pv/`.

*Baseline functional tests.*

| Test | Result |
| --- | --- |
| PV persistence across Pod recreation | Passed |
| Cold judge (public 1001 `1 2` → `3`, hidden 1002 `-10 7` → `-3`) | Accepted; 3 GETs (manifest + 2 bundles); bundle files installed under `sha256/` |
| Warm judge in the same Pod | Accepted; **1 GET (manifest only)**, no bundle download |
| Warm judge after Iris Pod recreation on the same PVC | Accepted; 1 GET (manifest only), no bundle download |
| Run request (public only), then judge request (all) | First fetched manifest + public bundle; second fetched manifest + hidden bundle only |
| `testcaseSetId` not matching the manifest | Rejected with result code 7 (`manifest version mismatch`); no testcase executed |
| Bundle checksum not matching the manifest | Rejected with result code 7; nothing installed; no staging directory left |

*Amendment tests.* These target the behavior changed by the amendments. The amendment image and the baseline image were run side by side on the same machine, cluster, fixture, and step order. The PV was cleared before each image's cold request.

| Scenario | Baseline | Amendments |
| --- | --- | --- |
| Cold judge, MinIO up | Accepted | Accepted; the PV also holds `manifests/<sha256(manifestKey)>.json` |
| Warm judge, MinIO stopped | Failed: result code 7, manifest `GetObject` error | Accepted, with no remote request |
| Iris Pod started with MinIO stopped | Exits at startup (`HeadBucket`) | Same |

The warm judge with MinIO stopped verifies amendment B. The startup run shows that the outage tolerance applies only to Pods already running. The concurrent-install race in amendment A was verified only by unit tests, because one Iris Pod handles one message at a time.

**Benchmark.**
 
`example/tools/tc-cache-bench` measures load time (manifest lookup, download, checksum,
extraction, and file reads) and object traffic, using synthetic data (repeated and random, 1/10/50 MiB,
five cold/warm pairs each) on the local cluster. For the baseline, warm loads made no bundle download
and reduced the median load time by about 39–96% depending on the condition; every warm load still
opened the manifest (one object, about 1 KB). These are local synthetic results and do not predict S3
latency, judging time, or cost.

## Links and change history

- [ADR 0001: Versioned local testcase replication](./0001-versioned-local-testcase-replication.md)
- [ADR 0003: Coordinate node-local testcase PV loading and eviction](./0003-node-local-testcase-pv-coordination.md)
- [Persistent Volume PoC (TAS-3060)](https://app.notion.com/p/3ebef9cff545803286a1f921b1bd337a)
- Baseline: [`t3060-local-pv-poc`](https://github.com/skkuding/codedang/tree/t3060-local-pv-poc)
- Amendments: [`t3060-1-local-pv-poc`](https://github.com/skkuding/codedang/tree/t3060-1-local-pv-poc) — `1e10bed9e` (idempotent installation), `4f3326286` (local manifest cache)
- 2026-11-11 — Proposed this ADR with the baseline implementation and proposed amendments.

