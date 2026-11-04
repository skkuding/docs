---
title: "ADR 0003: Coordinate node-local testcase PV loading and eviction"
description: "Give each node-local testcase cache one owner for concurrent loads, active-use protection, and capacity-based GC."
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

The unpacked input and expected-output files on the PV will be used directly by a libjudger process. They are not merely staging files that Iris copies into memory before judging. The cache may be shared by concurrent submissions and, depending on deployment, multiple Iris processes. Without coordination, several misses can download the same version; libjudger can encounter an incomplete install; and GC can remove a path while libjudger still needs to open or read it. A process-local mutex does not protect a PV shared by multiple processes. The cache must never substitute a different or currently active testcase version for the version pinned to the submission.

## Decision drivers

- Serve only the exact requested, checksum-verified testcase version.
- Prevent duplicate downloads and partial-file reads under concurrent misses.
- Bound PV usage without deleting an artifact until its libjudger process has finished using the input and expected-output files.
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

The manager exposes an operation equivalent to `Acquire(version, expectedChecksum) -> handle` and a corresponding `Release(handle)`. `Acquire` returns read-only paths to the exact version's input and expected-output files only after the artifact is fully installed. A handle must be active before the paths are returned, so GC cannot select the artifact between lookup and process start. Iris passes the guard to libjudger when starting the process; `Release` closes Iris's copy after libjudger exits. An open descriptor for an input file is not sufficient: libjudger may open another path after GC has unlinked it.

For the Linux node-local PV PoC, represent the guard with a shared `flock` on a stable, per-version lock file **outside** the evictable artifact directory. The manager hands Iris a locked file descriptor over a Unix domain socket; Iris passes that descriptor to libjudger across process start. The manager closes its copy after transfer. GC marks the entry `evicting` and takes an exclusive lock before deleting its directory. It cannot acquire that lock while either Iris or libjudger retains the shared descriptor. If passing a descriptor to libjudger is infeasible, process-exit tracking must provide the same guarantee before this design is accepted.

### Why the operating system holds the guard

The Linux kernel tracks which processes still have the shared lock file descriptor open. It closes a process's descriptors when that process exits, even if the process crashes or is killed before calling `Release`. The lock remains held if libjudger inherited the descriptor and is still running after Iris exits. Once the last holder exits or closes it, GC can obtain the exclusive lock. A restarted manager checks the same lock file, so its lost in-memory handle table cannot cause it to delete an artifact still used by libjudger.

Here, `Release` means **close the descriptor**, not call `LOCK_UN`: Linux associates `flock` with the shared open-file description, and an explicit unlock through one duplicate would also unlock it for the other holders. Iris and libjudger must each close only their own descriptor when finished.

A fixed lease timeout cannot safely replace this rule. Iris may crash while libjudger continues to run, or libjudger may take longer than the timeout to open an input or expected-output path. Expiring the lease then would let GC unlink a file that the live process still needs. Timeouts may bound waiting for a download or lock, but must not authorize eviction of a live reader. A stuck libjudger can pin disk space; terminate or recover that process before reclaiming its artifact. `flock` is advisory: it protects files only because every manager GC path obtains the exclusive lock before deletion.

### Kubernetes placement

The manager and every Iris/libjudger caller of a node-local PV must be scheduled on **the same Kubernetes node** and mount that node's cache volume. Local PV node affinity must enforce this placement. If the manager and Iris run in different Pods, they must share the Unix socket path through a node-local mount; the socket transfers the locked descriptor between their processes. Iris must deliberately pass the descriptor into the libjudger process when it starts it, because an ordinary process launch may close extra descriptors. All these processes use the same node's Linux kernel for the local file lock, even when their Pods have separate process namespaces. A generic cluster Service that routes Iris to a manager on another node would break the PV ownership rule.

Kubernetes termination does not change the lock lifetime: when a Pod's processes finally exit, Linux closes their descriptors. If Iris exits first while libjudger remains alive, libjudger's inherited descriptor still blocks GC. If the entire node fails, those processes and their local lock state are lost together; a replacement node must load the requested immutable version again. This proposal requires a genuinely node-local filesystem with working `flock` semantics, not a remote PV whose locking behavior has not been verified.

For each immutable version, the manager tracks `absent`, `loading`, `ready`, or `evicting`. At most one load of a version runs per node. Other callers wait for its result; loads of different versions may proceed concurrently within a configured limit. A load downloads and unpacks into a unique temporary directory on the same PV, verifies the expected checksum and manifest, and atomically publishes the complete directory. An error wakes waiters, removes the temporary data, and leaves the version retryable. Only `ready` artifacts can be acquired. If the requested version is unavailable, judging reports an infrastructure error; it does not use another version.

GC uses a configurable cache byte budget with high and low watermarks. When usage exceeds the high watermark, it removes least-recently-used `ready` entries with no active handles until usage reaches the low watermark or no eligible entry remains. It never evicts a `loading` or guarded entry. An entry moves to `evicting` before its directory is removed so a new acquire cannot receive a path being deleted. It reports unresolved disk pressure rather than force-deleting one. Temporary downloads have a separate age-based cleanup rule. A restart inventories committed artifacts and removes abandoned temporary directories before serving them.

Only one process may **manage the cache namespace** on a node-local PV at a time; multiple Iris/libjudger processes may mount and read the same PV. The owner can live inside Iris **only if** one Iris process exclusively manages that PV. If several Pods or processes mount it, use a node-local manager process and route their acquires through it; in-memory locks in each Iris process are insufficient. The PoC should test two independent clients against one owner. The production deployment form remains subject to verification of Iris scheduling and PV mounts.

For the requested lock comparison, implement cache-through as the baseline: the owner performs a miss end to end. Compare cache-aside only against the same invariants and workload, with callers proposing an artifact for verified installation. Do not carry two production implementations merely because the PoC compares them.

## Consequences

- Warm reads need no remote transfer or write lock on the immutable artifact; an acquired guard remains held during libjudger's direct file use.
- The manager adds local state, a capacity policy, and possibly an API/process. File-descriptor passing and process inheritance add Linux-specific integration work, but dead Iris and libjudger processes release their guards automatically. A hung process may still pin an artifact until it is terminated.
- In the cache-through baseline, a cold miss may wait for the manager's in-progress download of the requested version. A full PV with no evictable entry must produce a resource error rather than corrupt or replace an active artifact.
- Node loss can cause another node to download the same version. Peer-node fallback is outside the manager's core contract; if added, it must fetch the exact requested version and retain S3 as the recoverable source.
- Legacy testcase migration, artifact publishing, and active-version selection remain separate work under ADR 0001.

## Verification

The manager PoC should show that concurrent acquires of one version cause one source download; libjudger never sees a partial or checksum-invalid input or output file; failed loads wake all waiters and can be retried; GC cannot remove an artifact between acquire and process start or while libjudger is running; GC evicts eligible versions in LRU order after process exit; and a restart recovers committed entries while cleaning stale temporary data. Kill Iris while libjudger remains alive and verify GC still cannot evict; then terminate libjudger and verify GC can evict. Also restart the manager while a guard is held. Exercise multiple clients sharing one PV, not just goroutines within one caller. Run an integration test in Kubernetes with manager and Iris in separate Pods on one node: verify local-PV scheduling, shared socket access, descriptor passing to libjudger, and guard release after Pod termination. Measure cold and warm acquire latency, wait time, source bytes, duplicate loads prevented, PV usage, and eviction count. Compare cache-through and cache-aside with the same tests and workload.

Before production acceptance, establish the number of Iris processes per node/PV, the PV byte budget and watermarks, and whether the libjudger launch path can inherit the guard descriptor. Those values are not specified by the current task.

## Links and change history

- [ADR 0001: Versioned local testcase replication](./0001-versioned-local-testcase-replication.md)
- [TC Manager task (TAS-3061)](https://app.notion.com/p/3ebef9cff545803b8ad4e2631857f95e)
- [Persistent Volume PoC (TAS-3060)](https://app.notion.com/p/3ebef9cff545803286a1f921b1bd337a)
- [Testcase caching design](https://app.notion.com/p/3e6ef9cff545805585cacb7239602b9f)
- [Kubernetes local volume scheduling and node affinity](https://kubernetes.io/docs/concepts/storage/volumes/#local)
- [Linux `flock(2)` lock lifetime](https://man7.org/linux/man-pages/man2/flock.2.html) and [Unix socket descriptor passing](https://man7.org/linux/man-pages/man7/unix.7.html)
- 2026-11-04 — Backend team — Proposed this PV-specific coordination and GC decision for review.
- 2026-11-04 — Backend team — Clarified that libjudger uses PV input and output files directly; the usage guard lasts through process exit.
- 2026-11-05 — Backend team — Proposed an inherited file-lock guard so dead callers release it without a timeout.
- 2026-11-05 — Backend team — Explained Linux lock lifetime and the Kubernetes node-local placement requirement.
