---
title: "ADR 0001: Versioned local testcase replication for judging"
description: "Immutable testcase versions and node-local reuse to reduce repeated AWS transfer and keep judging consistent."
status: accepted
date: "2026-10-05"
owner: "Lee Haesung"
decision_makers:
  - "Lee Haesung"
  - "금정빈"
  - "이유진"
  - "전유빈"
  - "이준하"
  - "송현준"
  - "조윤상"
supersedes: []
superseded_by: null
implementation_status: not_started
---

# ADR 0001: Versioned local testcase replication for judging

> **Accepted, not implemented.** This records the architecture decision; implementation has not started, and the current testcase loading paths remain in use.

## Context and evidence

Iris currently reloads active testcases from S3 or RDS for each submission. The backend creates result rows from the active testcase IDs, but Iris resolves the active set again later. An update between those steps can make the recorded and executed testcases differ.

The internal research document reports:

| Historical observation | Value |
| --- | --- |
| RDS cost in April–May 2026 | $166.22 total; $71.83 (43.2%) was data transfer out |
| May 30 contest day | $60.62 of RDS transfer, estimated at about 481 GB or 62.6 MB per submission |
| Current S3 loader | One LIST plus three requests per testcase per submission; 301 requests for 100 testcases |
| Recent assignment/contest use | 21 of 41 problems used in the preceding 30 days were more than one year old |

Repeated testcase retrieval is a **hypothesis**, not a confirmed cause of the transfer spike. Submission timing, testcase sizes, and AWS transfer metrics still need to be correlated. As a scale example, 100,000 submissions reading an unchanged 10 MB set would transfer roughly 1,000 GB; five nodes each loading it once would initially transfer roughly 50 MB, before misses, new versions, and retries. These are illustrative volumes, not predicted savings.

## Decision drivers

- Stop transferring the same testcase set from AWS for every submission.
- Make result creation, judging, retries, and rejudging refer to the same immutable testcase version.
- Keep local storage recoverable and prevent GC or downloads from racing with a judge read.

## Considered options

| Approach | Benefit | Drawback |
| --- | --- | --- |
| Keep per-submission S3/RDS reads | No migration | Repeated transfer and the active-set race remain. |
| Move bodies to S3 but keep per-submission reads | Removes large bodies from RDS | Moves the transfer cost without fixing repeated reads or version consistency. |
| Use one shared on-premises cache | Downloads each version once for the cluster | Adds a shared bottleneck, failure domain, and network hop for judging. |
| Pin a version and cache it on each judge node | Warm reads stay local; failures are isolated by node | Duplicates storage and requires local loading, locking, and GC. **Selected.** |

Key design choices within the selected approach:

| Choice | Options and tradeoff | Decision or open evaluation |
| --- | --- | --- |
| Identity | A mutable problem ID is simpler but needs invalidation and can race; a versioned key is stable. | Pin a testcase-set ID and checksum in each judge request. |
| Artifact | Individual objects permit selective reads but multiply requests; a compressed bundle is easier to verify and replicate. | Compressed S3 bundle, unpacked read-only local copy. |
| Local storage | A node-local PV permits direct file reuse; a node-local Silo offers object APIs but adds a service and may require repeated local transfers. | Compare both in a PoC; choose neither for production yet. |
| Loading | Prefetch reduces first-hit delay but needs coordination; on-demand loading is simpler. | Cold start and load on demand; consider contest warm-up. |
| Cleanup | Age-only TTL can evict old problems still in use; LRU needs access tracking. | Capacity-based LRU with in-use protection. |
| Migration | A one-shot move simplifies reads but raises cutover risk; coexistence adds routing complexity. | PoC may omit legacy support; production needs explicit, staged migration. |

## Decision

We will publish immutable testcase artifacts to S3 and keep metadata plus an active-version pointer in RDS. The backend will choose one version for both result-row creation and the judge request. Iris will execute that version, not look up the currently active set again. Referenced old versions will remain available for pending submissions and rejudging.

Each judge node will keep a local replica. A miss loads and verifies the requested version before exposing it; a corrupt copy is replaced. If that version cannot be obtained, judging reports a retryable infrastructure failure rather than using another active set.

**We will build a node-local TC manager for locks and GC.** Iris will hold a lock while accessing testcase data directly from the local PV or Silo. The manager will select eviction candidates and delete only when no judge is using them. The PoC will compare exposing only a read lock (manager downloads on a miss) with exposing read and write locks (Iris may download under a write lock). The production lock API and storage medium remain undecided.

## Consequences and open work

- Expected benefit: after a node loads a version, later submissions can reuse it without AWS transfer. Cold misses, node churn, and new versions still incur transfer and preparation delay.
- Cost: the backend request and testcase publishing flow must change; each node needs storage, integrity checks, and observability.
- Implementation: build the node-local TC manager for artifact locks and GC, and integrate the download path. With a read-lock-only API the manager downloads; with a read/write-lock API Iris can download under a write lock.
- Migration: legacy RDS bodies and existing S3 objects need an explicit read path until converted and verified. The PoC's lack of compatibility must not be carried into production.
- Before implementation: compare PV and Silo, both lock APIs, contest warm-up needs, disk limits, legacy migration, and whether a same-version peer-node fallback is worthwhile. Record the production storage and lock choices in a follow-up ADR after the PoC.

## Verification

First verify the suspected source of egress with submission and transfer data. In the PoC, measure AWS bytes per submission, cold and warm preparation time, cache hit rate, and disk use. Test concurrent misses, testcase updates between submission creation and judging, failed downloads, node restarts, and GC during a read. Every result row must correspond to the exact artifact version executed.

## Source and history

- *Reducing Testcase Egress with Versioned Local Replification* (internal research document, September 25, 2026). Its “Final Decision” is a research direction, not deployed behavior.
- 2026-10-05 — Lee Haesung — Proposed this ADR; implementation has not started.
- 2026-10-05 — Lee Haesung — Accepted the architecture direction; implementation has not started.
