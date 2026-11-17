---
title: "ADR 0008: Integrate Iris with a node-local testcase cache manager"
description: "Use the PV artifact format with manager-owned loading and GC, and Iris-owned testcase file descriptors."
status: accepted
date: "2026-11-17"
owner: "Lee Haesung"
decision_makers:
  - "Lee Haesung"
supersedes: ["0003", "0005"]
superseded_by: null
implementation_status: integrated_poc
---

# ADR 0008: Integrate Iris with a node-local testcase cache manager

> The Manager–Iris integration is implemented and verified as a PoC. Production deployment remains future work.

## Context

ADR 0003 proposed a single PV owner, cache-through loading, LRU eviction and Iris-owned file descriptors. ADR 0005 described a standalone Iris loader with external immutable manifests and public/hidden zstd bundles. The original Manager PoC used gzip bundles containing a manifest. Integrating them required adopting one artifact format and connecting the Manager to Iris.

## Decision drivers

- Execute exactly the version pinned to the submission, as required by ADR 0001.
- Keep manifest interpretation, cache publication and deletion under one node-local owner.
- Reuse the verified PV artifact format and existing Linux FD-transfer implementation.
- Preserve existing Iris judging and legacy requests without introducing a shared Go module.

## Considered options

- Keep Iris-owned loading and add filesystem locks: retains duplicate cache ownership and spreads GC coordination across processes.
- Share an artifact/client library between programs: adds module coupling when Iris only needs a wire contract, not manifest parsing.
- Move PV loading into the Manager and move its FD client into Iris: selected; the two programs independently implement a small socket contract and validate it with integration tests.

## Decision

The Manager is the sole owner of the node-local versioned testcase cache. It fetches the immutable external manifest selected by `testcaseSetId` and `manifestKey`, selects public/hidden cases, and installs only required `.tar.zst` bundles. The manifest contains the existing PV fields and immutable object keys. Bundle SHA-256 is over compressed bytes. Preserve manifest order and checksum-based `sha256/<prefix>/<digest>` cache paths. Manifest cache keys hash the origin key; a different origin requires a separate cache root. This does not select Silo as the production storage medium or supersede ADR 0006.

Iris sends `acquire` with `testcaseSetId`, `manifestKey` and `filter` (`all`, `public`, `hidden`) over a node-local Unix SOCK_SEQPACKET socket. Success returns the version and an ordered array of testcase metadata (ID, hidden flag and score weight), followed by read-only input/output FDs in that same order, two FDs per testcase. An empty selection returns no FDs. The client rejects incomplete, excessive, inconsistent or truncated responses and closes all acquired FDs. FDs use SCM_RIGHTS, not integer values in JSON, and close-on-exec on receipt. Packet splitting bounds each FD transfer. Errors distinguish invalid requests, unavailable artifacts and resource exhaustion; none permits fallback to another version.

Manifest parsing, caching and safe zstd installation belong to the Manager. Iris owns the socket FD receiving and cleanup code. The programs have no shared package or cross-module dependency; socket integration tests check their independently defined wire types. The Manager retains fixture and stats tools.

The Manager coalesces loads by bundle checksum, serializes cold installations, and protects all bundles needed by a preparing acquire against eviction. Opening the complete requested file set and GC are mutually exclusive. Only fully verified, atomically published bundles are returned. Failed opens/transfers close all local files. Iris reads received FDs into its existing Testcase representation, closes them on success, cancellation or error, and then runs the existing judge. No cache FD is inherited by libjudger. Legacy unversioned and user-provided testcase behavior remains unchanged. Manager failure is an infrastructure failure, not permission to access the version cache directly.

GC may unlink paths after acquisition because Iris owns open file descriptions. Actual allocation is retained until the last FD closes; admission uses filesystem allocated and available bytes, including unlinked files. LRU eviction excludes pending acquisitions and installations. Account for manifests, compressed downloads, extracted files, temporary data and filesystem overhead. Bound archive/file counts, compressed and unpacked sizes and FD/concurrent requests. Reject an artifact when actual space cannot be recovered. Clean incomplete installation data and validate committed entries at startup. The integrated PoC uses a new cache root and does not migrate the obsolete gzip PoC cache.

Manager and Iris must run on the same Linux node and share the socket mount. Only the Manager mounts the version cache PV. Enforce local PV node affinity; a cluster Service cannot transfer FDs across nodes. Recreating a Manager or Iris Pod on the same PV must reuse the cache; node loss requires loading the exact version on a new node.

## Consequences

- Warm requests can avoid all origin reads, while concurrent requests reuse one bundle load and safe publication.
- Iris keeps its existing in-memory Testcase and libjudger interfaces; memory use is not reduced by this integration.
- Unix FD transfer is Linux-specific; the Manager is a node-local availability dependency. Stalled readers retain unlinked allocation.
- Two small wire definitions require contract tests. S3 artifact publishing, legacy migration and active-version selection remain separate work under ADR 0001.

## Verification

Run Manager artifact/install/GC tests and Iris FD/client tests, including race detection. Verify the actual socket across separate processes, split FD responses, truncated/incomplete transfers, cancellation, descriptor exhaustion, metadata ordering and cleanup. With real Iris judge/run, verify exact versions, filtering, warm zero-origin reads, same-checksum single-flight, shared bundles across versions, GC during multi-bundle preparation and acquired reads, Manager restart and last-FD space recovery. In kind, test separate same-node Pods, local PV placement, Pod recreation and cache reuse. Report unexecuted deployment checks explicitly.

## Links and change history

- [ADR 0001](./0001-versioned-local-testcase-replication.md)
- [Superseded ADR 0003](./0003-node-local-testcase-pv-coordination.md)
- [Superseded ADR 0005](./0005-node-local-pv-testcase-cache-poc.md)
- [Silo alternative ADR 0006](./0006-cache-versioned-testcases-in-node-local-silo.md)
- [PV PoC PR #1](https://github.com/skkuding/tc-local-caching/pull/1)
- 2026-11-17 — Lee Haesung — Accepted the integration design and replacement of ADRs 0003 and 0005.
- 2026-11-17 — Lee Haesung — Integrated Manager-owned PV artifacts and Iris-owned FD consumption in tc-local-caching (commits `3eba4e0f`, `c865c35c`, `cabeedee`). Manager and Iris FD tests passed Linux race checks. Actual C judging passed in Compose with a Silo origin and in separate same-node kind Pods with a dedicated ext4 local PV. Removing the origin and recreating both Pods preserved all verdict checks with zero new bundle downloads. Evidence and reproduction limits are recorded in `apps/tc-local-caching/VERIFICATION.md`; RabbitMQ/PostgreSQL transport and the full service startup remain outside these checks.
