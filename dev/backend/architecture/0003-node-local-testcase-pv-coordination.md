---
title: "ADR 0003: Coordinate node-local testcase PV loading and eviction"
description: "Give each node-local testcase cache one owner for concurrent loads, Iris-owned testcase descriptors, and capacity-based GC."
status: proposed
date: "2026-11-04"
owner: "Backend team"
decision_makers: []
supersedes: []
superseded_by: null
---

# ADR 0003: Coordinate node-local testcase PV loading and eviction

## Context

[ADR 0001](./0001-versioned-local-testcase-replication.md) selects immutable testcase versions and a cache on each judge node. It leaves the production storage medium and lock API open. This proposal assumes the local cache is a node-local persistent volume (PV), with compressed originals in S3 and verified, unpacked artifacts on the PV. The separate PV PoC intentionally omits coordination and garbage collection (GC).

Iris currently supplies testcase input to libjudger through its execution interface and handles expected-output comparison; libjudger does not directly read the cached testcase input or expected-output files. Iris must therefore own and read the testcase file descriptors (FDs), while libjudger continues to receive input through the existing interface. The cache may be shared by concurrent submissions and, depending on deployment, multiple Iris processes. Without coordination, several misses can download the same version; a reader can encounter an incomplete install; and GC can remove a path before Iris has opened it. A process-local mutex does not protect a PV shared by multiple processes. The cache must never substitute a different or currently active testcase version for the version pinned to the submission.

## Decision drivers

- Serve only the exact requested, checksum-verified testcase version.
- Prevent duplicate downloads and partial-file reads under concurrent misses.
- Bound PV usage while keeping acquired testcase data readable by Iris even after GC removes its cache paths.
- Keep the common path for an immutable cache hit simple.
- Work when more than one caller uses a node's PV.

## Considered options

| Option | Benefit | Cost or limitation |
| --- | --- | --- |
| Atomic loader without a manager | Smallest solution if the cache has no GC or shared coordination | Concurrent misses can duplicate downloads; each caller must handle eviction races separately. |
| Manager in every Iris process | No additional process or API | In-memory locks, usage counts, and LRU state cannot coordinate a PV shared by multiple processes. |
| One owner per node-local PV | Loading, publication, usage, and eviction share one state machine | Requires a node-local API if several Iris processes use the PV. **Proposed.** |
| Shared filesystem locks and independent GC workers | Avoids a single owner process | Lock ordering, usage tracking, crash recovery, and GC ownership become distributed across callers. |

The TC Manager task also asks to compare a manager-owned cache-through loader with caller-owned cache-aside loading. Both can be PoC variants, but neither an RLock-only nor an RWLock API is itself the architectural requirement. The required behavior is safe publication, single-flight loading, and safe eviction across all callers of the PV.

## Decision

We propose **one TC Manager owner for each node-local PV**. It coordinates artifact state and local GC. A storage adapter performs S3 download, checksum verification, unpacking, and PV operations. The manager does not choose the active testcase version, update submission metadata, or delete S3 originals.

### Acquisition and FD ownership

The manager exposes an operation equivalent to `Acquire(version, expectedChecksum, testcaseSet) -> {manifest, readOnlyFDs}`. It returns descriptors for the exact version's input and expected-output files only after the artifact is fully installed and verified. The descriptor-to-testcase mapping is part of the response. Acquisition follows this sequence:

1. Under the manager's per-version coordination, ensure the artifact is `ready` and open **every input and expected-output file the request will need** with read-only access. Opening the complete set and selecting the entry for eviction are mutually exclusive; GC cannot unlink files halfway through this step. A directory FD alone does not preserve files that have not been opened.
2. Transfer the file FDs to Iris using `SCM_RIGHTS` ancillary data over a Unix domain socket, as described in [Linux `unix(7)`](https://man7.org/linux/man-pages/man7/unix.7.html). Sending the integer FD values in an ordinary response is insufficient. The manager closes its local copies after transfer; failure paths close all locally owned FDs, and Iris closes any incomplete response.
3. Iris owns the received descriptors, reads testcase input through them, supplies that input to libjudger through the existing execution interface, and reads expected output for comparison. Iris does not reopen the cache paths or pass cache FDs to libjudger. This decision does not require a libjudger testcase file-I/O API or FD inheritance into that process.
4. Iris closes each FD once its last read is complete, including expected-output comparison, and closes all remaining FDs on completion, cancellation, or error. An optional `Release` notification may update manager telemetry, but data lifetime depends on closing FDs, not on an RPC or a lease.

Each acquire opens its own files so concurrent Iris requests do not share a mutable read offset. Published files are immutable: the manager never truncates or overwrites an opened inode. Reinstalling an evicted version creates new files through the verified atomic installation path.

### Why unlink does not invalidate an acquired file

On Linux, unlinking a pathname removes a directory entry. An already-open FD still refers to the same file and can be read after that path disappears. Once the last hard link is gone, file data is reclaimed after the last FD referring to it closes; see [Linux `unlink(2)`](https://man7.org/linux/man-pages/man2/unlink.2.html). GC can therefore remove an acquired artifact's cache paths while Iris continues reading its open input and expected-output FDs. No per-version `flock` guard needs to survive until libjudger exits.

The relevant lifetime is **Iris's last use of the testcase FDs**, including comparison, rather than libjudger's process exit alone. If Iris exits or crashes, Linux closes its FDs automatically. A surviving libjudger process holds no cache FDs and cannot keep that data alive; it may only continue with input already supplied. An attempt interrupted before all input and comparison work completes must fail or retry through normal recovery. Cache FDs should be close-on-exec so unrelated child processes do not retain them accidentally.

A manager restart cannot invalidate descriptors already received by Iris. New acquisitions still require verified, complete artifacts. This removes the need to reconstruct reader locks or expire leases to reclaim unlinked files. A stalled Iris can nevertheless retain unlinked bytes until its FDs close or the process exits.

### Kubernetes placement

The manager and its Iris clients must run on **the same Kubernetes node** so Unix socket FD passing uses the same Linux kernel. The manager mounts that node's cache PV, whose node affinity must enforce placement. If manager and Iris run in different Pods, they share the Unix socket path through a node-local mount. Iris does not need to mount or resolve the cache paths to read received FDs, and libjudger needs no cache mount for this design. A generic cluster Service that routes Iris to a manager on another node cannot carry these descriptors.

When an Iris Pod's processes exit, their FDs close. Ending only libjudger does not close FDs still owned by Iris. If the entire node fails, its processes and open descriptors are lost together; a replacement node must load the requested immutable version again. The PoC must verify open-file reads after unlink on the actual node-local filesystem.

### Loading and GC

For each immutable version, the manager tracks `absent`, `loading`, `ready`, or `evicting`. At most one load of a version runs per node. Other callers wait for its result; loads of different versions may proceed concurrently within a configured limit. A load downloads and unpacks into a unique temporary directory on the same PV, verifies the expected checksum and manifest, and atomically publishes the complete directory. An error wakes waiters, removes the temporary data, and leaves the version retryable. Only `ready` artifacts can be acquired. If the requested version is unavailable, judging reports an infrastructure error; it does not use another version.

GC uses a configurable cache byte budget with high and low watermarks. When usage exceeds the high watermark, it unlinks least-recently-used `ready` entries until actual usage reaches the low watermark or no eligible entry remains. It may unlink entries whose file FDs have already been acquired, but never a `loading` entry or one whose complete FD set is still being opened. An entry moves to `evicting` before its directory is removed, excluding new acquires until deletion completes. A later acquire reloads the exact version if necessary. Temporary downloads have a separate age-based cleanup rule. A restart inventories committed artifacts and removes abandoned temporary directories before serving them.

**Unlinking cache paths does not necessarily free disk space immediately.** Usage checks must include filesystem allocation held by open, unlinked files, not just a sum of visible cache directories. This remains necessary after manager restart. A reload may coexist with an unlinked copy still open in Iris. Apply backpressure or return a resource error if actual free space is insufficient; do not assume namespace eviction has recovered capacity. Bound in-flight acquisitions and handle FD-limit failures without returning partial file sets.

Only one process may **manage the cache namespace** on a node-local PV at a time; multiple Iris processes may read descriptors obtained from that owner. The owner can live inside Iris **only if** one Iris process exclusively manages that PV; in that case it can hand over file objects directly. If several Pods or processes use it, use a node-local manager process and route their acquires through it; in-memory locks in each Iris process are insufficient. The PoC should test two independent clients against one owner. The production deployment form remains subject to verification of Iris scheduling and PV mounts.

For the requested lock comparison, implement cache-through as the baseline: the owner performs a miss end to end. Compare cache-aside only against the same invariants and workload, with callers proposing an artifact for verified installation. Do not carry two production implementations merely because the PoC compares them.

## Consequences

- Warm reads need no remote transfer or long-lived file lock. Iris reads acquired FDs even when their cache paths have been removed, while libjudger keeps its existing input interface.
- The manager adds local state, a capacity policy, and possibly an API/process. Unix socket FD passing adds Linux-specific integration work, and Iris must reliably close received files. A hung Iris can retain unlinked disk allocation.
- In the cache-through baseline, a cold miss may wait for the manager's in-progress download of the requested version. Open-but-unlinked files can delay capacity recovery and cause duplicate resident copies after a reload. Insufficient space or FDs must produce backpressure or a resource error.
- Node loss can cause another node to download the same version. Peer-node fallback is outside the manager's core contract; if added, it must fetch the exact requested version and retain S3 as the recoverable source.
- Legacy testcase migration, artifact publishing, and active-version selection remain separate work under ADR 0001.

## Verification

The manager PoC should verify:

- Concurrent acquires of one version cause one source download; Iris receives only complete, checksum-valid file sets. Failed loads wake waiters and can be retried.
- Race GC against acquisition: either all requested input and expected-output files are opened before unlink, or acquisition waits/reloads. A partial FD set is never returned as success.
- Acquire files, unlink their cache directory before starting libjudger, then read input and expected output through Iris's FDs and complete judging. Repeat with unlink during input reading and before comparison; no cache path is reopened.
- LRU eviction removes eligible paths while reads remain valid. Actual allocated space is retained until the last FD for an unlinked file closes. Closing one of two clients' FD sets must leave the other readable. Test acquisition and reload of the same immutable version after eviction.
- Kill Iris, cancel a request, fail a descriptor transfer, and exhaust the FD limit; verify descriptor cleanup. Confirm a surviving libjudger has inherited no cache FDs. Restart the manager while Iris holds FDs, including unlinked files, and verify continued reads and accurate free-space admission.
- Run two independent clients and a Kubernetes integration with manager and Iris in separate Pods on one node: verify PV placement, shared socket access, FD transfer, and cleanup after Pod termination. Exercise low free space with open, unlinked files and ensure the manager applies backpressure.

Measure cold and warm acquire latency, wait time, source bytes, duplicate loads prevented, visible cache bytes, actual filesystem usage/free space, open FD count, and eviction count. Compare cache-through and cache-aside with the same tests and workload.

Before production acceptance, establish the number of Iris processes per node/PV, the PV byte budget and watermarks, FD and acquisition limits, and the Iris integration for reading input and expected output from received FDs. Those values are not specified by the current task.

## Links and change history

- [ADR 0001: Versioned local testcase replication](./0001-versioned-local-testcase-replication.md)
- [TC Manager task (TAS-3061)](https://app.notion.com/p/3ebef9cff545803b8ad4e2631857f95e)
- [Persistent Volume PoC (TAS-3060)](https://app.notion.com/p/3ebef9cff545803286a1f921b1bd337a)
- [Testcase caching design](https://app.notion.com/p/3e6ef9cff545805585cacb7239602b9f)
- [Kubernetes local volume scheduling and node affinity](https://kubernetes.io/docs/concepts/storage/volumes/#local)
- [Linux `unix(7)`: Unix socket descriptor passing](https://man7.org/linux/man-pages/man7/unix.7.html)
- [Linux `unlink(2)`: open-file lifetime after unlink](https://man7.org/linux/man-pages/man2/unlink.2.html)
- 2026-11-04 — Backend team — Proposed this PV-specific coordination and GC decision for review.
- 2026-11-04 — Backend team — Clarified that libjudger uses PV input and output files directly; the usage guard lasts through process exit.
- 2026-11-05 — Backend team — Proposed an inherited file-lock guard so dead callers release it without a timeout.
- 2026-11-05 — Backend team — Explained Linux lock lifetime and the Kubernetes node-local placement requirement.
- 2026-11-09 — Backend team — Corrected testcase I/O ownership to Iris; replaced inherited lock guards with read-only testcase FDs and documented unlink lifetime, capacity accounting, and revised verification.
