---
title: 'ADR 0006: Cache versioned testcases in node-local Silo object storage'
description: 'Evaluate an S3-compatible node-local Silo cache for verified, unpacked testcase bundles without repeated origin downloads.'
status: proposed
date: '2026-11-11'
owner: 'Backend team'
decision_makers: []
supersedes: []
superseded_by: null
---

# ADR 0006: Cache versioned testcases in node-local Silo object storage

## Context

[ADR 0001](./0001-versioned-local-testcase-replication.md) adopts immutable testcase versions and node-local reuse to reduce repeated AWS data transfer and prevent a submission from being judged against a different active testcase set. It leaves the production local storage medium open pending comparison of a persistent-volume (PV) cache and an object-storage cache. [ADR 0003](./0003-node-local-testcase-pv-coordination.md) separately proposes coordination and eviction for a PV-based implementation; it does not decide how an object-storage cache should operate.

Today, repeatedly retrieving testcase bodies from S3 or RDS for individual submissions can transfer the same bytes across the AWS-to-on-premises boundary many times. The internal cost investigation identified a substantial RDS transfer charge during a contest, but the proportion directly attributable to testcase reads has not yet been established. Moving testcase bodies to S3 without reuse would change the origin, not eliminate repeated downloads.

The Object Storage Phase 1 proof of concept (PoC) must establish whether an S3-compatible Silo instance can serve as a local replica for testcases, independently of Iris integration. It uses the same manifest and artifact contract as the parallel PV PoC so that the two approaches can be compared. Phase 1 intentionally excludes a TC Manager, garbage collection (GC), concurrent installation coordination, node-to-node fallback, and production migration of legacy testcase storage.

## Decision drivers

- Avoid fetching unchanged, large testcase bundles from the AWS origin for every submission.
- Resolve the exact version named by the request; never silently replace it with the currently active testcase set.
- Share one testcase artifact and manifest contract with the PV PoC, including public/hidden filtering and checksum verification.
- Keep the initial PoC small enough to run with Docker Compose and an Express.js test client, without changes to the production Iris judging path.
- Make the difference between cold and warm loads measurable, including origin request counts, transferred bytes, and elapsed time.
- Reject incomplete or corrupted cache installations instead of making invalid testcases available for judging.

## Considered options

| Option                                                                    | Benefit                                                                                       | Cost or limitation                                                                                                               |
| ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Read testcase bundles from S3 on every request                            | Few moving parts and no local cache lifecycle                                                 | Repeats AWS egress and decompression on every submission.                                                                        |
| Cache unpacked testcase files directly on a node-local PV                 | Iris can read files without a local object API hop; covered by the parallel PV PoC            | Requires filesystem mounts and eventually node-local coordination and eviction.                                                  |
| Cache unpacked testcase files in a node-local S3-compatible Silo instance | Reuses familiar object APIs and allows the cache interface to be tested independently of Iris | Adds a local storage service, object requests for individual files, and explicit completeness checks. **Selected for this PoC.** |
| Cache compressed bundles in Silo and unpack on each read                  | Reduces cached object count and preserves the origin layout                                   | Repeats decompression on warm requests, reducing the benefit of local reuse.                                                     |

Choosing Silo for this PoC is **not** a decision to use Silo instead of PV in production. Production storage selection depends on comparative measurements, reliability, and operational complexity.

## Decision

For the **Object Storage Phase 1 PoC**, we use a **node-local Silo instance with an S3-compatible API** as a cache of **unpacked testcase files**. The origin stores immutable, compressed `.tar.zst` bundles and their manifest. Silo stores files unpacked from successfully verified bundles under keys derived from each bundle's content checksum. An Express.js API demonstrates the read path before it is integrated with Iris.

### Request and artifact contract

The versioned request supplies `testcaseSetId` and `manifestKey` together, with a filtering option such as `judgeOnlyHiddenTestcases`. Phase 1 implements only requests where both version fields are present; legacy `problemId` lookup remains outside its scope. A missing field or a mismatch between the requested `testcaseSetId` and the manifest's `testcaseSetId` is an error, not a reason to fall back to another version.

The PoC follows the PV team's shared manifest format:

```json
{
  "testcaseSetId": "tcset-42",
  "bundles": [
    {
      "id": "public",
      "objectKey": "testcases/tcset-42/<public-digest>.tar.zst",
      "checksum": "sha256:<public-digest>"
    },
    {
      "id": "hidden",
      "objectKey": "testcases/tcset-42/<hidden-digest>.tar.zst",
      "checksum": "sha256:<hidden-digest>"
    }
  ],
  "testcases": [
    {
      "id": 1001,
      "bundleId": "public",
      "input": "1001.in",
      "output": "1001.out",
      "hidden": false,
      "scoreWeight": 1
    },
    {
      "id": 1002,
      "bundleId": "hidden",
      "input": "1002.in",
      "output": "1002.out",
      "hidden": true,
      "scoreWeight": 1
    }
  ]
}
```

`<public-digest>` and `<hidden-digest>` stand for the full 64-character hexadecimal SHA-256 digests of the **compressed** bundle bytes, not of the unpacked files. Each bundle's `objectKey` identifies an immutable origin object. The PoC uses the exact key from the manifest rather than constructing it from `problemId` or listing the origin prefix.

Before loading, the client checks the manifest schema, unique IDs, valid relative paths, bundle references, checksum syntax, and agreement between `bundleId` and `hidden`. It selects only the testcases and bundles required by the requested public/hidden filter, preserving manifest testcase order.

### Cache miss and cache hit

The read path is:

```text
versioned request (testcaseSetId, manifestKey, filter)
  -> GET and validate origin manifest on each request
  -> select required public/hidden testcases and bundles
  -> look up each bundle by its checksum in local Silo
     -> HIT: read requested unpacked files from Silo
     -> MISS: GET exact .tar.zst object from origin
              -> SHA-256 of downloaded compressed bytes
              -> reject mismatches or unsafe archive entries
              -> unpack and validate required files
              -> upload unpacked files to Silo
              -> mark bundle complete only after all writes succeed
              -> read/return requested files
```

For the PoC, a suggested cache key namespace is `sha256/<first-two-digest-characters>/<full-digest>/<file-name>`. A separate completion marker such as `_complete.json` may record the expected file list and signal that all uploads succeeded. **This namespace and marker are object-storage implementation choices, not part of the shared origin manifest contract.** A hit must require a completed installation and the presence of all requested files; object existence alone is insufficient.

On a miss, the loader verifies the compressed bytes against the manifest's `sha256:<digest>` before exposing any unpacked data. Unpacking must reject absolute paths, `..` traversal, symlinks, duplicate archive entries, and unexpected content, and should enforce size and file-count limits. If download, integrity verification, extraction, or cache installation fails, the request fails; it must not execute a different testcase version or present a partially installed bundle as ready.

The manifest is deliberately fetched on each request, including warm requests, to keep the comparison with the PV PoC consistent. Cache hits therefore avoid **bundle** downloads, not all origin requests. Cached unpacked files are treated as immutable; automatic repair of a corrupted completed cache is not part of Phase 1.

### PoC boundary

Docker Compose runs Silo and the Express.js client. The client connects to the origin through an S3-compatible API and to the local cache through Silo's S3-compatible endpoint. The two stores have separate endpoints and bucket identities. The original research calls for a real S3 origin; locally generated compatible artifacts may be used for repeatable testing, provided the report distinguishes local-origin measurements from actual AWS egress.

Phase 1 does not add a TC Manager, cross-process single-flight loads, GC, an eviction policy, cold-start prefetch, peer-node fallback, legacy migration, or production Iris integration. Those are separate decisions or follow-up phases. The cache's persistence and placement across actual Kubernetes node restarts are also unverified until integration testing.

## Consequences

- **Positive:** After the first verified installation of a checksum, later requests for the same bundle can reuse local unpacked files without downloading that bundle from AWS again.
- **Positive:** Immutable checksum keys let public and hidden bundles, different testcase-set versions, and repeated requests coexist without mutable-key invalidation.
- **Positive:** The shared manifest contract allows the PV and Silo PoCs to exercise equivalent testcase selection and verification scenarios.
- **Negative:** Reading each testcase's `.in` and `.out` objects introduces local object API overhead compared with direct PV file reads. A large number of small files may increase local request count and latency.
- **Negative:** The local Silo service adds lifecycle, configuration, storage-capacity, monitoring, and failure considerations. Keeping unpacked copies may consume more local space than retaining compressed bundles.
- **Negative:** The origin manifest is still requested for every operation. Cold loads still incur download, verification, extraction, and cache-write latency. Concurrent misses may duplicate work in Phase 1.
- **Risk:** A completion marker alone does not provide full concurrency control, eviction safety, or ongoing cache-integrity guarantees. Those require a production coordination design if Silo is selected.
- **Follow-up:** Compare PV and Silo under identical fixtures and resource limits before selecting the production medium. Decide how Silo is deployed per judge node, how incomplete/corrupt entries recover, and how cache capacity and concurrent access will be managed. Integrate with Iris only after the basic PoC behavior is established.

## Verification

The Phase 1 PoC should demonstrate the following using the same generated manifest and `.tar.zst` fixtures as the PV implementation:

1. **Version identity:** A request with both version fields loads only the exact manifest; mismatched IDs or invalid metadata fail without legacy fallback.
2. **Filtering:** A hidden-only request avoids downloading the public bundle; a public-only request avoids the hidden bundle; an all-testcases request preserves the manifest's testcase order and metadata.
3. **Cold and warm behavior:** The first request for a bundle is a miss and downloads the compressed bundle; a repeated request is a hit and downloads zero additional **bundle** bytes from the origin. Manifest requests are counted separately.
4. **Version isolation:** Requests for different bundle checksums do not overwrite one another, and an earlier version remains retrievable while cached.
5. **Integrity and safety:** Invalid SHA-256, missing expected files, malformed manifests, invalid archive paths, and failed writes cannot produce a successful completed cache entry.
6. **Performance:** Record cold/warm median and range of elapsed times, origin manifest GETs, origin bundle GETs, origin bundle bytes, local Silo request counts, and local storage bytes, using fixed fixtures and repeated trials. Where AWS is not used, report avoided **origin bytes** rather than claiming measured AWS bill savings.

A successful PoC verifies technical feasibility; it is not evidence that Silo outperforms PV, that AWS transfer costs have already fallen, or that the storage medium is ready for production. Add measured results and links to the implementation PR when available.

## Links and change history

- [ADR 0001: Versioned local testcase replication for judging](./0001-versioned-local-testcase-replication.md)
- [ADR 0003: Coordinate node-local testcase PV loading and eviction](./0003-node-local-testcase-pv-coordination.md)
- [Object Storage PoC task (TAS-3059)](https://app.notion.com/p/3ebef9cff54580328107cb575bd76e3c)
- [Persistent Volume PoC task (TAS-3060)](https://app.notion.com/p/3ebef9cff545803286a1f921b1bd337a)
- [PV PoC implementation notes](https://app.notion.com/p/40def9cff545808eab0be9a940a988e6)
- [Testcase caching architecture research](https://app.notion.com/p/3e6ef9cff545805585cacb7239602b9f)
- 2026-11-11 — Backend team — Proposed Silo-backed, checksum-keyed, unpacked testcase caching as an Object Storage Phase 1 PoC for comparison with the PV alternative.
