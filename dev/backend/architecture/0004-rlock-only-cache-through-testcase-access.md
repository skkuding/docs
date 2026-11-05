---
title: "ADR 0004: Use RLock-only cache-through access for node-local testcases"
description: "Judges only read testcases under a kernel-held flock read lock; a single Manager owns loading, publication, and GC."
status: proposed
date: "2026-11-05"
owner: "유진 (weno7)"
decision_makers: []
supersedes: []
superseded_by: null
---

# ADR 0004: Use RLock-only cache-through access for node-local testcases

## 1. Context

Today, Iris looks up the testcases for a judge request by problem ID. If testcases change between the time Backend creates the request and the time Iris looks them up, Iris can run different testcases from the ones Backend expected. The Versioned Local Testcase Replication ADR solves this by pinning each request to an immutable, checksum-based testcase version.

Fetching testcases from external storage (S3 or similar) for every submission also causes repeated network requests and download cost. To reduce this, each judge node needs to store testcases in a local cache (a node-local PV) and reuse them.

However, when several judge processes use the local cache at the same time, the following problems can occur:

- Several judges can download the same testcase at the same time.
- Another process can read testcase files before installation is complete.
- GC can delete files while a judge is still using them. Because libjudger opens input and output files on the PV directly, a deletion during judging breaks the remaining testcases.
- Different testcase versions can be mixed, or incomplete files can be exposed.

We therefore need to separate the component that creates and deletes cache entries, and decide how judges can read the cache safely.

## 2. Decision Drivers

This design is evaluated against the following criteria:

1. **Concurrent reads**: Multiple judges must be able to use the same testcase at the same time.
2. **Data consistency**: A judge request must use the same testcase version from start to finish. It must never fall back to a different version.
3. **Cache integrity**: A testcase that has not finished downloading and verification must never reach a judge.
4. **GC safety**: A testcase in use by a judge (including libjudger) must not be deleted.
5. **Failure recovery**: If a process exits abnormally, its locks must be released without timeouts or manual cleanup.
6. **Simplicity**: The judge's read path should not contain unnecessary write or cache-creation logic.
7. **Performance**: When the cache exists, local files must be reused without accessing external storage.

## 3. Considered Options

### Option A. RWLock + Cache-Aside

The judge (Iris) checks whether the cache exists and, on a miss, downloads and installs the testcase itself.

- Acquire the Read Lock first, then check whether the cache exists. Checking before locking leaves a window in which GC can delete the entry.
- On a miss, release the Read Lock, acquire the Write Lock, check again (double-check), then download and install.
- Installation and GC are protected by the Write Lock.

**Pros**

- Can be implemented as a library, with no separate manager process or API.
- The caller controls cache-miss handling explicitly.

**Cons**

- The judge path takes on cache checks, downloads and installation.
- When several Iris processes miss at the same time, preventing duplicate downloads across processes needs a separate file lock. An in-process mutex cannot do it.
- The switch from Read Lock to Write Lock needs careful lock ordering and re-checking. On Linux, `flock` does not convert locks atomically.
- Holding the Write Lock during a download blocks every other judge using the same version.
- Writers are spread across many processes, so it is hard to keep cache creation and deletion in one place.

### Option B. RLock-only + Cache-Through

The judge does not decide whether the cache exists or needs a download. It asks the Manager to use a specific testcase version.

The Manager checks whether that version is cached. If not, it downloads, verifies and installs it from external storage. Only after installation completes does it hand the judge a readable path and a Read Lock.

- Cache hit: acquire a Read Lock on the existing cache entry.
- Cache miss: the Manager finishes download, verification and installation, then provides the Read Lock.
- Judge: uses the returned path read-only. The judge never takes the Write Lock.
- GC: never tries to delete a testcase that is in use.

**Pros**

- The judge only reads testcases, which keeps its implementation simple.
- Cache misses and downloads are encapsulated inside the Manager.
- One Manager owns cache creation for each version.
- Multiple judges can read the same cache entry concurrently.
- There is no Read-to-Write lock switch, so lock-ordering problems do not arise.

**Cons**

- On a cache miss, the request waits until the Manager finishes downloading and installing.
- Cache creation and usage-state management are concentrated in the Manager.
- The Read Lock's lifetime must match the lifetime of the process that actually uses the files (libjudger).
- A node-local API is added between the Manager and Iris.

## 4. Decision

**We adopt RLock-only + Cache-Through (Option B).**

The judge never creates or modifies testcase cache entries. It asks the Manager to use a specific testcase version, and uses the cache once the Manager provides a ready entry and a read lock. Only the Manager takes the Write Lock (exclusive lock).

The core of this decision is separating the judge's read path from the cache-management path.

### 4.1. Testcase access flow

1. Backend includes the exact testcase version identifier (checksum) in the judge request.
2. Iris asks the Manager to use that version (`Acquire(version, checksum)`).
3. The Manager checks whether the version exists in the local cache and what state it is in.
4. If it does not exist, the Manager downloads it from external storage into a temporary directory.
5. When the download completes, the Manager verifies size and checksum, then unpacks it.
6. The Manager publishes the verified directory to the local cache atomically with `rename(2)`.
7. The Manager opens the version's lock file, takes a Read Lock on it, hands that file to Iris, and closes its own copy. It also returns the readable path.
8. Iris passes this descriptor to libjudger when it starts libjudger.
9. When judging finishes, Iris and libjudger each close their own descriptor with `close`. The Read Lock is released when the last holder closes it.

If the cache is not ready or integrity verification fails, the testcase is never handed to the judge.

### 4.2. Role and implementation of the Read Lock

The Read Lock prevents GC from deleting a testcase while a judge is using it. Because every judge using the same version can hold a Read Lock at the same time, concurrent reads are allowed.

The Read Lock is implemented with Linux `flock` on a lock file, for these reasons:

- **The kernel manages its lifetime.** If a process exits abnormally, the kernel closes its descriptors and releases the lock. No timeout or heartbeat is needed.
- **Passing the descriptor passes the lock.** A `flock` belongs to the open file description, so the lock stays held while libjudger is alive, even if Iris exits first.
- **The lock survives a Manager restart.** Lock state lives in the kernel, not in the Manager's memory.

Rules to follow:

- **Release with `close`, not `LOCK_UN`.** Duplicated descriptors share one lock, so a `LOCK_UN` from Iris would also release the lock for a libjudger that is still running.
- **Keep lock files outside the artifact directory** (for example `locks/<hash>.lock`). The lock file must survive artifact deletion; otherwise different processes can end up locking different files.
- **Timeouts limit waiting; they never authorize deletion.** A long-running libjudger never has its lock forcibly released.
- `flock` is an advisory lock. It is safe because every deletion path in the Manager goes through the exclusive lock.

### 4.3. GC

A Read Lock alone does not make cache creation and deletion safe. The Manager manages installation and GC through an exclusive lock (`LOCK_EX`).

1. When disk usage exceeds the high watermark, choose candidates in LRU order (least recently used entries are deleted first).
2. Try the exclusive lock with `flock(LOCK_EX | LOCK_NB)`, **without waiting**. If it fails, the entry is in use (someone holds a read lock), so move on to the next candidate.
3. If it succeeds, mark the entry `evicting` in the Manager, rename the directory into `trash/`, then close the lock. From this moment, new requests see the version as `absent` and load it again.
4. Empty `trash/` asynchronously, outside the lock.
5. Stop at the low watermark. If every candidate is in use, do not force-delete; report the disk shortage instead.

### 4.4. Cache-through policy

In cache-through mode the judge never handles a cache miss itself. The Manager checks the requested version and, if it is not cached, fetches it from external storage into the local cache. Only then can the judge access the files.

The Manager tracks each version through `absent` (not cached) → `loading` (downloading and installing) → `ready` (available) → `evicting` (being deleted).

- When concurrent requests arrive for the same version, only one load runs (singleflight); the others wait for its result.
- Loads of different versions run in parallel up to a configured concurrency limit.
- Temporary download files live in `tmp/` on the same PV and are never exposed to judges. The entry becomes `ready` only after verification and installation both complete.
- Only `ready` versions can be acquired.

### 4.5. Manager restart

When the Manager restarts, its in-memory state table is lost, but the locks remain in the kernel. On startup it does the following before serving requests:

1. Delete anything left in `tmp/` and `trash/`.
2. Scan the cache directory and register published (valid) versions as `ready`.
3. Initialize LRU order from directory modification times.

Because GC always tries the exclusive lock before deleting, it never deletes a testcase in use, even though the Manager does not know what was in use before it restarted.

## 5. Consequences

### Positive Consequences

- The judge can focus on reading testcases. Write locks and lock-conversion logic disappear from the judge path.
- Cache-miss handling and download logic are isolated inside the Manager.
- Duplicate-download prevention needs only a singleflight inside the Manager process. No cross-process download lock is required.
- Multiple judges can use the same testcase version concurrently.
- Once cached, local files are reused, reducing external storage access and egress cost.
- Testcases in use are protected from deletion. If Iris or libjudger exits abnormally, the kernel releases the lock, so no separate recovery logic is needed.

### Negative Consequences

- On a cache miss, the judge request waits until the Manager finishes downloading and installing.
- Even a cache hit needs a round trip to the Manager and a descriptor transfer. If the Manager is down, all judging on that node fails.
- The Manager must manage cache state, download state and capacity policy together.
- Descriptor transfer and inheritance by libjudger are Linux-specific and need additional implementation.
- A hung libjudger keeps its testcase pinned until the process exits. The entry can be reclaimed only after the process is terminated.
- The Manager and every Iris must run on the same node and mount the same PV. Remote PVs where `flock` is not guaranteed (such as NFS) cannot be used.

## 6. Edge Cases

### 6.1. Concurrent cache misses for the same version

Many judges can request the same testcase version at once. The start of a contest is the typical case.

The Manager marks the version `loading` and runs a single download. The other requests wait for its result. Waiting is bounded by a per-request timeout, but a timeout never cancels the in-progress download, because other waiters still need it. Contest problems are warmed up in advance to avoid this situation.

### 6.2. Failure during download

If the download or checksum verification fails, the entry is not published as usable.

The Manager cleans up the temporary files and returns the failure to every waiting request. The state goes back to `absent`, so later requests for the same version can retry. If the Manager dies mid-download, only the temporary directory is left behind, and it is cleaned up on restart.

In short, a failed file never becomes `ready`.

### 6.3. GC while a judge is running

GC may try to delete a cache entry while a judge is using it.

In that case GC cannot acquire the exclusive lock, so the deletion is deferred. GC does not wait; it moves on to the next candidate and tries again in the next GC cycle.

### 6.4. GC between Acquire and libjudger start

GC could run after the Manager returns the path but before Iris starts libjudger. Because the Manager takes the Read Lock before returning the path, GC cannot obtain the exclusive lock in this window either.

### 6.5. Abnormal exit of the judge or Iris

If the lock were tied only to the Iris process, files could be deleted while libjudger keeps running separately from Iris.

Therefore Iris passes the lock descriptor to libjudger (step 8 in 4.1). This keeps both cases safe:

- If Iris dies first while libjudger is alive, libjudger's descriptor keeps the lock held.
- If both die, the kernel closes all descriptors and GC can obtain the exclusive lock.

If libjudger runs inside the Iris process (via cgo), nothing needs to be passed; Iris's descriptor is itself the lock.

### 6.6. Manager crash or lost connection

Judges that already received a descriptor are unaffected, because Iris and libjudger hold the lock. New Acquire calls are treated as retryable infrastructure errors until the Manager is back.

### 6.7. The requested version cannot be cached

If the requested version cannot be downloaded or recovered, the judge request must fail.

It must never use a different testcase version or the "current active testcases" in RDS instead. This prevents a mismatch between the version Backend requested and the version the judge actually runs.

### 6.8. Disk full with no evictable candidate

If every cache entry is in use or pinned for a contest, there is no room to install a new version. In that case the Manager does not force-delete an entry in use; it returns a resource error for the request and raises an alert.

## 7. Open Questions

The following must be confirmed before implementation.

- [ ] Does Iris start libjudger as a child process, or call it inside the same process via cgo? (해성님은 아시겟죠)
- [ ] If it is a child process, can the current launch path pass extra descriptors without closing them?
- [ ] How many Iris processes or Pods share each node (PV)? If there is only one, the Manager can live inside Iris.
- [ ] What timeouts should apply to waiting on a concurrent cache miss, and to the download itself?
- [ ] What are the PV capacity budget, the high/low watermarks and the concurrent-load limit?
- [ ] How much do the Manager round trip on a cache hit and the wait on a cache miss affect actual judging throughput?

## 8. Verification

(Claude's suggestion~~)

The PoC verifies the following, using at least two independent client processes rather than only goroutines in one process.

| Test | Pass condition |
| --- | --- |
| 50 concurrent Acquire calls for the same version | One source download; all 50 judge successfully |
| Inject a checksum error | No judge sees the corrupted files; every waiter receives the failure; a retry succeeds |
| Force GC during judging | Zero in-use versions deleted; after libjudger exits, entries are evicted in LRU order |
| GC right after Acquire, before libjudger starts | Not deleted |
| `kill -9` Iris while libjudger is running | GC cannot delete; after libjudger exits, deletion is possible |
| Restart the Manager while locks are held | Zero in-use versions deleted; `tmp/` cleaned up |
| Kubernetes: Manager and Iris as separate Pods on the same node | Socket sharing, descriptor transfer, and lock release after Pod termination all work |
| Compare with Option A under the same load | Warm/cold Acquire latency, source download bytes, duplicate downloads prevented, PV usage, eviction count |

## 9. Links and change history

- Notion~~
- 2026-11-05 — 유진 — Proposed this ADR.
