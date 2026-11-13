---
title: "ADR 0005: Cache immutable testcase manifests and bundles on a node-local PV"
description: "Use immutable manifests and verified compressed bundles with a persistent local cache to preserve testcase versions and avoid repeated reads from S3."
status: proposed
date: "2026-11-13"
owner: "Backend team"
decision_makers: []
supersedes: []
superseded_by: null
---

# ADR 0005: Cache immutable testcase manifests and bundles on a node-local PV

## Context

[ADR 0001](./0001-versioned-local-testcase-replication.md) records a testcase version with each submission. The testcases in that version must not change. Judge nodes keep local copies so Iris can reuse the same files across submissions instead of downloading them again. The choice between local PV and Silo object storage remains open until both approaches have been evaluated.

This proposal uses a persistent volume (PV) backed by storage on each judge node. S3 stores a manifest JSON file and compressed bundles of testcase input and expected-output files. The manifest lists the cases in a version, the bundle containing each case, and the filenames to read. Iris caches the manifest and the files extracted from verified bundles on the PV. A request is fully warm when the manifest and all files needed for that request are already cached.

## Decision drivers

- Execute the testcase version recorded in the request, even if the problem has since been updated.
- Avoid S3 reads for fully warm requests.
- Allow Iris to read a cached bundle only after download, checksum verification, and extraction have completed.
- Download only the bundles needed by the request's testcase filter.
- Preserve existing request behavior and reuse cached data across Pod recreation.

## Considered options

| Option | Benefit | Cost or limitation |
| --- | --- | --- |
| Read manifests and bundles from S3 on every request | No local copies to install, retain, or delete | Repeats transfer and decompression. |
| Cache unpacked bundles on a local PV; fetch manifests on every request | Reuses testcase files across requests and Pod recreation | Warm requests still depend on S3. |
| Cache manifests and unpacked bundles in memory | Avoids S3 reads while entries remain cached | Uses process memory; separate processes duplicate entries and lose them on restart. |
| Cache manifests and unpacked bundles on a node-local PV | Fully warm requests read local files; cache survives Pod recreation | Requires Pods to use the correct node’s volume, concurrent writes to be coordinated, and old files to be deleted when space is needed. **Proposed.** |
| Cache through a node-local Silo object store | Lets Iris access cached data through an object API instead of filesystem paths | Requires a local storage service and API calls to read testcase files; evaluated in ADR 0006. |

## Decision

We propose caching **immutable testcase manifests and verified, unpacked public/hidden bundles on a node-local PV**. This combines local reads with reuse across Pod recreation. Compressed originals remain in S3 so missing cache entries can be downloaded again.

This defines the PV alternative. Production storage selection still requires comparison with the Silo proposal in ADR 0006.

### Manifest and version contract

Each version has a manifest at `testcases/<testcaseSetId>/manifest.json`. It contains:

- `testcaseSetId`: the immutable version identifier.
- `bundles`: each bundle's `id`, exact S3 `objectKey`, and `checksum`.
- `testcases`: each case's `id`, `bundleId`, `input` and `output` paths, `hidden` flag, and `scoreWeight`.

For each testcase, Iris follows `bundleId` to the bundle’s S3 `objectKey`, then reads the `input` and `output` files named in the manifest. It does not list S3 objects to discover which files belong to a version. This requires the process that creates and uploads testcases to keep the manifest and bundle contents consistent. PV and Silo use the same manifest format. `scoreWeight` is recorded in that format; this ADR does not establish whether Iris uses it to calculate scores.

Iris rejects a manifest if its `testcaseSetId` differs from the request. Bundle IDs and testcase IDs must each be unique, checksums must use the expected SHA-256 format, and file paths must stay within the bundle directory. Every testcase must reference a listed bundle. A hidden testcase must reference the hidden bundle, and a public testcase the public bundle.

Once a manifest or bundle is available in S3, its contents must not be replaced at the same object key. Upload bundles before making the manifest that references them available. Keep old versions in S3 while pending submissions or rejudging may still need them.

For judge/run requests, `testcaseSetId` selects the version and `manifestKey` locates its manifest:

- Both present: load the named manifest and require its set ID to match the request.
- Both absent: use the existing testcase retrieval path based on `problemId`.
- Only one present: reject the request.

User-supplied testcases are used directly without loading stored testcases. If Iris cannot load the requested version, it fails the request instead of retrying through `problemId` or selecting the problem’s current version.

### Manifest caching

Store manifests at `<TESTCASE_CACHE_PATH>/manifests/<SHA-256(manifestKey string)>.json`. Hashing the key prevents request strings from becoming filesystem paths. This hash identifies the cache entry; it does not verify the manifest's contents.

Parse and validate the local copy on every read. If it is missing, unreadable, or invalid, fetch and validate the manifest from S3. If the cached JSON is valid but its `testcaseSetId` differs from the request, fail without fetching from S3. Since the object at `manifestKey` must never be replaced, fetching that key again should return the same version.

Write a validated manifest to a temporary file, then rename it into place so readers do not see a partial write. A cache-write failure does not fail the request; Iris can use the manifest it already fetched. Later requests may need to fetch it again.

Because the JSON stored at a manifest key must never change, Iris does not expire cached manifests or ask S3 whether they have changed. The local filename depends only on `manifestKey`, not on the S3 bucket or service endpoint. If the bucket or endpoint changes, use a separate cache directory; the same key string may identify different contents in the new storage.

### Bundle selection and identity

Keep public and hidden cases in separate bundles. A single bundle would mean fewer files to create, upload, and track, but public-only requests would also download and unpack hidden data. Separate bundles avoid that work but require two S3 objects and their manifest entries.

Judge defaults to all cases and supports hidden-only selection. Run defaults to public cases and supports including hidden cases. Iris installs only the required bundles and preserves manifest order. `bundleId` tells Iris which archive contains the testcase files; `hidden` tells it whether the testcase is public or hidden. Iris checks that these fields agree. Storing hidden files separately does not itself prevent unauthorized requests from accessing them.

Pack multiple testcase files into a tar archive so Iris downloads one object per required bundle instead of one object per file. Compress the archive with zstd to potentially reduce the bytes transferred. Decompression adds CPU work and temporary disk use. No comparison establishes zstd as superior to other compression formats.

A bundle's checksum is SHA-256 of the **final compressed bytes**, formatted as `sha256:<64 lowercase hex>`. Iris hashes the downloaded `.tar.zst` bytes and compares the result with the manifest’s checksum. This detects a download that differs from the expected bundle; it does not prove who created the manifest or bundle. Unpacked files are stored at:

```text
<TESTCASE_CACHE_PATH>/sha256/<first two digest characters>/<full digest>/
```

The default cache root is `/cache/testcases`. Using the checksum rather than `testcaseSetId` as the directory name lets two versions reuse the same downloaded bundle. The two-character prefix groups bundle directories into smaller parent directories. Reuse requires identical compressed bytes: repackaging the same testcase files can produce a different checksum and a separate cache directory.

### Installation and reads

On a cache miss:

1. Download the S3 object named by `objectKey` into a temporary directory on the same filesystem as the cache. Compute SHA-256 during download and reject a mismatch with the manifest.
2. Extract the archive. Reject absolute paths or paths that escape the directory, symbolic/hard links, special files, duplicate entries, and incomplete compressed data. Write the extracted files as read-only.
3. Check that every input and expected-output file the manifest assigns to this bundle exists as a regular file.
4. Rename the completed directory to the checksum-based cache path. If download, verification, extraction, or rename returns an error, remove the temporary files.

The rename makes the complete installation visible at once. Readers do not see a directory while it is still being populated. It does not stop two Iris processes from downloading the same bundle or stop another process from deleting files that Iris is about to read.

On a hit, Iris reads requested files through `os.Root`, which confines file access to the bundle directory. It trusts the installed content instead of repeating download, hashing, and decompression. Missing files fail the request; this path does not automatically repair bundles. Skipping repeated integrity checks saves work but can leave later corruption undetected.

### Persistence and coordination

A local PV retains the cache when a Pod is recreated on the same storage. It does not preserve the cache after node loss. Each node holds its own copy, and Pods must be placed where they can access that node's volume. `ReadWriteOnce` does not prevent multiple processes from writing concurrently.

The current lookup checks for an installed bundle before calling the installer. If two processes both find the bundle missing, both can download and extract it. The first can rename its directory successfully; the second fails because the destination now exists. Renaming a completed directory prevents partial reads but does not make both requests succeed.

[ADR 0003](./0003-node-local-testcase-pv-coordination.md) proposes a Manager that coordinates downloads and deletes cached bundles to reclaim space, called garbage collection (GC). The Manager must open all files a request needs before GC can remove their paths. Iris reads through those open file descriptors and closes them after use. The separate Manager's implementation status is not assessed here.

## Consequences

- Fully warm requests use only local data. A public-only request does not warm the hidden bundle needed by a later all-cases request.
- Cold requests still pay for transfer, verification, extraction, and local writes. Unpacked copies consume disk on every node; this cache path has no capacity limit or GC policy.
- Keeping the contents of existing S3 keys unchanged is required both to reproduce a submission’s testcase version and to reuse cached manifests safely.
- Later bundle corruption has no automatic repair path. Abrupt termination can also leave temporary installation data behind.
- Cached testcases may be readable during an S3 outage, but Iris may still require S3 to start. Test Pod startup and retry behavior separately from local file reads.
- Compare PV and Silo with the same testcase data and the same rule for caching manifests. ADR 0006 currently specifies a manifest fetch on every request. Otherwise, a timing difference could come from the extra S3 request rather than from PV or Silo itself.

## Verification

The implementation report and test results refer to [`378997b99`](https://github.com/skkuding/codedang/commit/378997b99). They were supplied for this revision, not independently reviewed or rerun. This revision caches manifests. A change that allowed concurrent installers to reuse the first completed installation was reverted. The results below distinguish tests before and after that merge.

| Evidence | Reported result | Limit |
| --- | --- | --- |
| Before manifest caching: kind/MinIO functional tests | Judging, selective loading, bundle reuse after Pod recreation, and version/checksum rejection passed. | Warm requests still made one manifest GET. |
| Before manifest caching: benchmark | Warm median load time was about 39–96% lower than cold across repeated/random 1/10/50 MiB fixtures, with five pairs per condition. | Local synthetic data; OS page cache retained; compilation and judging excluded. Does not measure the manifest-cache improvement. |
| After merge: Go tests with `-count=1` | Iris, handlers, testcase service, loader, and artifact/benchmark tools passed. Coverage includes warm loads without a source, manifest recovery, filters, and failure paths. | Benchmark counters report three cold object opens and zero warm opens. They do not measure HTTP retries or wire bytes. |

Before production adoption:

- Confirm which commit the running Iris image contains and which cache directory the Pod actually uses. Check MinIO request logs for zero GETs on a fully warm request. Recreate a Pod using the same PV and verify reuse of both manifests and bundles.
- Repeat the benchmark under equivalent conditions. Local results do not predict production latency or savings.
- With the Manager connected, test simultaneous requests for a missing bundle and deletion of cached bundles while Iris is reading testcase files.
- Check startup during an S3 outage and ensure lookup failures follow ADR 0001's retryable infrastructure-error policy.

## Links and change history

- [ADR 0001: Versioned local testcase replication](./0001-versioned-local-testcase-replication.md)
- [ADR 0003: Coordinate node-local testcase PV loading and eviction](./0003-node-local-testcase-pv-coordination.md)
- [ADR 0006: Cache versioned testcases in node-local Silo object storage](./0006-cache-versioned-testcases-in-node-local-silo.md)
- [Persistent Volume PoC (TAS-3060)](https://app.notion.com/p/3ebef9cff545803286a1f921b1bd337a)
- [PoC deployment resources](https://github.com/skkuding/codedang/tree/378997b99/infra/k8s/iris/poc/local-pv) and [benchmark tool](https://github.com/skkuding/codedang/tree/378997b99/apps/iris/example/tools/tc-cache-bench).
- 2026-11-11 — Proposed the original record with the baseline and amendments.
- 2026-11-13 — Revised the proposal around cache contracts and technical tradeoffs; recorded the merged baseline and separated pre-merge measurements from post-merge validation gaps.
