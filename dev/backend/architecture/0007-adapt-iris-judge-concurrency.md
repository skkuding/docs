---
title: "ADR 0007: Adapt Iris judge concurrency to node contention"
description: "Introduce measured, bounded judge admission in small steps, then separate a Kubernetes control plane from execution workers as needed."
status: proposed
date: "2026-11-14"
owner: "Lee Haesung"
decision_makers: []
supersedes: []
superseded_by: null
---

# ADR 0007: Adapt Iris judge concurrency to node contention

## Context

Jobs sharing CPU cores, last-level cache (LLC), memory controllers, and bandwidth can change each other's measured execution time. Cache evictions and memory stalls can shift CPU time, while scheduler wait can increase elapsed time. A verdict near a time limit can therefore depend on neighboring work. The Wave 1 direct Judger reproduction observed higher CPU and elapsed times as concurrency increased for a fixed fixture. Safe operating limits and production verdict effects still need validation. [Wave 1 comparison](https://github.com/skkuding/iris-load-test-toolset/blob/dcff9a9/docs/WAVE1-COMPARISON.md)

The number of running jobs is an incomplete measure of pressure. Compute-heavy programs can leave shared memory resources available, while memory-heavy programs at the same concurrency can cause cache or bandwidth contention. A fixed cap safe for a demanding mix can leave usable capacity idle during other mixes. We propose testing whether runtime-based admission improves throughput at the same judging accuracy.

**Assume no prior knowledge of a user's CPU or memory access pattern.** A new program can change phases or behave differently on the next input. Memory usage in bytes does not establish memory traffic per second. Historical estimates can help only after their errors and cold-start behavior have been evaluated.

The inspected implementation routes submissions, tests, and rejudges through separate RabbitMQ queues. Iris uses manual acknowledgements and prefetch 1. A submission request contains a problem's testcase set, which the judge handler executes sequentially. The compiler and runner share the judger sandbox implementation, but the compiler invokes the compiler binary through `exec.CommandContext`, while execution invokes libjudger. Build-unit setup can run concurrently within one request. [Workload routing](https://github.com/skkuding/codedang/pull/3724), [worker pools](https://github.com/skkuding/codedang/pull/3723), [consumer](https://github.com/skkuding/codedang/blob/2528d9cc1/apps/iris/src/connector/rabbitmq/consumer.go), [compiler](https://github.com/skkuding/codedang/blob/2528d9cc1/apps/iris/src/service/sandbox/judger/compiler.go), [task runner](https://github.com/skkuding/codedang/blob/2528d9cc1/apps/iris/src/handler/runner.go)

## Decision drivers

- Preserve repeatable resource measurements and near-limit verdicts under changing load.
- Use available capacity without requiring prior classification of user programs.
- Start with observable, reversible changes and preserve existing request and result contracts.
- Evaluate accuracy, queue latency, capacity cost, and recovery together.
- Keep worker admission independent of the choice of hypervisor or durable request transport.

## Considered options

| Option | Benefit | Cost or limitation |
| --- | --- | --- |
| Keep the existing deployment with fixed concurrency | Smallest operational change and a useful baseline | A cap chosen for demanding mixes can waste capacity during lighter mixes. |
| Add instrumentation, local admission limits, and controlled physical placement first | Establishes accuracy and capacity evidence with the existing queue and execution paths | Shared services still require explicit placement or intake limits. **Initial approach.** |
| Add a Kubernetes CP with RPC workers on bare metal | Centralizes worker capacity and admission without a VM lifecycle | Requires RPC recovery and effective host isolation. **Target when remote coordination is introduced.** |
| Add separate judge and compile/test VMs | Provides separate guest kernels and configurable resource groups | Adds artifact transfer and VM operations, while shared LLC and memory bandwidth still need controls. **Evaluate later.** |

## Decision

Implement **bounded, measured admission in stages**. Start with the existing RabbitMQ contracts and a controlled bare-metal execution environment. Qualify a judge-only physical host as the initial reference configuration using available hardware. Evaluate resource partitioning on a shared host if dedicated capacity has an unacceptable cost or insufficient availability. Qualify each placement against mixed-load measurements.

Keep the execution profile fixed across workload mixes. This includes physical CPU placement, SMT and clock policy, NUMA allocation, and any CAT allocation. Changes to that profile require a drained worker and a separate baseline. Workload changes drive the number of newly admitted jobs. Goroutines manage admitted subprocesses, and the slot remains occupied until the subprocess exits.

### Step 1 — Establish measurement and a fixed-cap baseline

Use the existing Iris entry points and RabbitMQ routes. Track queue wait, build time, admission wait, sandbox CPU and elapsed time, memory, active subprocesses by class, and completion or error state. Account for parallel build units. Verify that sandbox processes remain within the intended CPU and resource boundaries.

Measure isolated judging and representative mixed loads on the qualified host. For an initial execution-only harness, precompiled fixtures allow contention to be studied separately from compilation. Then exercise the normal build and execution path. Obtain a conservative fixed admission cap, with configured build and test caps, before adding adaptive behavior. On a judge-only host, colocated compilation still needs explicit validation or relocation to a separate worker pool.

### Step 2 — Add observation-driven admission

Introduce a local admission interface that accepts a maximum running job count and exposes active jobs and health. Start from the validated fixed cap. Increase the target gradually after sustained low pressure and reduce new starts after sustained contention. Running jobs drain when the target falls below the active count. Sampling periods, recovery windows, and thresholds are experimental parameters to calibrate on each host configuration.

Use timestamped observations of LLC occupancy, MBM traffic where available, scheduler pressure, memory availability, and execution variability. Memory capacity estimates help with reservation and exhaustion prevention. Bandwidth observations help detect memory traffic pressure. Interpret LLC occupancy together with misses and timing evidence. Initial adaptation uses aggregate runtime observations and conservative ceilings. Validate any per-program predictor separately. [Linux resctrl](https://docs.kernel.org/filesystems/resctrl.html), [scheduler statistics](https://docs.kernel.org/scheduler/sched-stats.html)

codedang8's reported E5-2620 v4 CPU flags include CAT and MBM, with MBA absent. Fixed CAT allocation can separate cache allocation between groups. Include the host default group's mask when qualifying cache isolation. Jobs sharing a socket still share memory bandwidth. If compilation and tests share that socket, include their starts and measured pressure in admission policy.

When metrics are stale or unavailable, stop increasing admission and use a validated conservative operating mode. If the worker cannot maintain that mode, pause new execution. Admission reacts to observations, so a phase change inside an already-running job can cause interference before the controller responds. Measure this exposure explicitly.

### Step 3 — Separate the Kubernetes CP and RPC workers

Keep the Iris control plane (CP) in the existing Kubernetes environment when introducing centralized coordination. Run Iris execution workers outside the general backend Kubernetes worker pool, initially on qualified physical hosts. The CP can reside on another physical server. It consumes requests, tracks worker capacity, selects workers, sets per-worker maximum running jobs, and collects results. Worker-side enforcement bounds actual subprocess execution.

A host agent collects hardware observations and reports intervals, attribution, and freshness. The CP considers shared LLC and memory domains across all workers on a host. RPC is used for job execution and state reconciliation. A worker can later run inside a VM through the same job interface.

For separate build and judge pools, define compiled-artifact identity, transfer, availability, and cleanup. Introduce the split with compatible request and result handling. Define job and attempt identity, result deduplication, and recovery from CP or worker restart. RPC timeout can leave a job running. Reconcile it before releasing its slot or retrying. CP replica coordination and worker enforcement must preserve one effective capacity budget per worker.

### Workload and transport behavior

| Work | Admission policy | Execution behavior |
| --- | --- | --- |
| Submission and rejudge | Share accuracy-oriented admission while retaining their queue identities | Preserve problem limits, testcase results, and submission summaries. |
| Compilation | Separate concurrency budget including parallel build units | Preserve compiler deadlines and failure handling. |
| Test requests (`run`, `userTestCase`) | Separate bounded intake and execution | Preserve existing time and memory limits and response fields. |

The inspected test model requires positive time and memory limits, and the runner applies them. Classify authoring workloads such as `generate` and `validate` explicitly if those routes are consumed. [Test model](https://github.com/skkuding/codedang/blob/2528d9cc1/apps/iris/src/handler/run/models.go), [sandbox runner](https://github.com/skkuding/codedang/blob/2528d9cc1/apps/iris/src/service/sandbox/judger/runner.go)

Retain RabbitMQ request and result routes during these steps. Bound prefetch and locally staged work so the backlog stays durable and worker capacity limits intake. Define the terminal outcome permitting acknowledgement and retry handling for partial results and publication failure. The inspected connector attempts acknowledgement even after some timeout or publish-error paths, so recovery needs review before increasing in-flight work. [Connector](https://github.com/skkuding/codedang/blob/2528d9cc1/apps/iris/src/connector/rabbitmq/connector.go), [RabbitMQ acknowledgements](https://www.rabbitmq.com/docs/confirms)

## Consequences

- Dedicated physical capacity simplifies the initial interference baseline. Reserving headroom can increase idle capacity cost, and adding physical hosts can make capacity changes coarser or slower. Existing spare hosts, provisioning time, peak demand, and queue-latency targets determine the actual cost.
- VM deployment can reuse a shared host pool and simplify some lifecycle operations, but host contention, reserved resources, image startup, and warm-up still affect usable capacity. Compare cost per completed job at the same accuracy target and scale-out readiness before selecting placement.
- Controlled sharing may improve utilization but adds interference policy and validation. Qualifying a host for judging includes background services, compilation, tests, and collectors.
- Saturation increases queue wait. Admission accuracy and end-to-end latency need separate targets.
- Starting with the existing transport and local admission makes failures easier to attribute. Remote coordination, transport replacement, and low-level regulation each add independent lifecycle work.

## Future work

### Durable database job queue versus RabbitMQ

A centralized CP can use a durable database job table as its request source and dispatch execution over RPC. Evaluate PostgreSQL polling as a possible replacement for the judge request queues. The CP manages scheduling, while the request source must retain pending work across CP failure and support recovery. Existing result consumers need a separately designed migration if result messaging is also replaced.

A DB-backed design could create a job in the same transaction as submission state, reducing one database-to-broker handoff. Claim a bounded batch using a short transaction with `FOR UPDATE SKIP LOCKED`, update ownership and lease state, then commit before RPC dispatch. PostgreSQL documents `SKIP LOCKED` as useful for multiple consumers of a queue-like table. [PostgreSQL SELECT locking clauses](https://www.postgresql.org/docs/current/sql-select.html#SQL-FOR-UPDATE-SHARE)

Define explicit job states, attempts, owner and lease expiry, worker job identity, and completion checks. Lease expiry can coexist with a still-running subprocess. Reconcile worker state before a retry starts, and use attempt or fencing checks to reject stale completions. Short claim transactions release their row locks before execution. Recovery relies on persisted state and worker reconciliation. Specify delayed retries, priority and fairness across submission/test/rejudge, cancellation, terminal failures, and result idempotency.

Use indexed, bounded polling with measured intervals and backoff. Compare pickup latency, DB CPU/I/O, locking, table churn and cleanup, burst handling, outage recovery, and operational cost with the existing broker. A benchmark should include an existing submission backlog, idle polling, multiple CP instances, and CP failure between claim, dispatch, and completion. Measure peak and idle behavior alongside normal backend DB traffic.

Database polling is a credible simplification if those tests meet the latency and recovery targets with acceptable DB load. Keep the choice open until measured. Replacing the judge transport requires a compatible migration for existing producers, pending jobs, and result consumers. Scope the change to judging interfaces even if other services continue to use RabbitMQ.

### VM isolation and hypervisor choice

Compare the qualified bare-metal layout with judge and compile/test VM workers only after establishing the admission baseline. The CP remains in Kubernetes and uses RPC in each case. VM workers run outside the general backend Kubernetes worker pool. Hold CPU, NUMA, clock, CAT, and memory-backing profiles fixed within each comparison and include compiled-artifact transfer costs.

KVM is an initial implementation candidate because the existing experiments and Linux host tools can be reused. Host-local collection remains useful with a remote CP. Xen's CPU pools and resource controls are an alternative to compare if host scheduling interference remains material. Evaluate observation quality, collector overhead, maintenance effort, near-limit verdicts, and throughput before choosing the hypervisor. codedang8's MBA limitation applies to both. [KVM tracing](https://www.linux-kvm.org/page/Perf_events), [libvirt resource configuration](https://libvirt.org/formatdomain.html), [Xen management and resource controls](https://xenbits.xenproject.org/docs/4.19-testing/man/xl.1.html)

### Local bandwidth regulation and workload models

If admission alone leaves unacceptable burst interference, evaluate MemGuard-style local regulation first against compilation and test aggressors. Study budget enforcement, PMU event coverage, writes and prefetch traffic, KVM guest accounting, and interrupt or throttling overhead on the actual CPU and kernel. Keep reservation, reclaim, and sharing modes as separate experiments. Fixed regulation of measured judging needs its own isolated reference profile. [MemGuard, RTAS 2013](https://ittc.ku.edu/~heechul/papers/memguard-rtas13.pdf), [author implementation](https://github.com/heechul/memguard)

An eBPF instrumentation and sched_ext regulator is another experimental implementation candidate. Check kernel configuration, permitted execution contexts, preemption and replenishment behavior, and failure fallback before claiming bounded bandwidth enforcement. Treat this as a separate low-level project after the admission experiments. [Linux sched_ext](https://docs.kernel.org/scheduler/sched-ext.html)

Use Bubble-Up's pressure/sensitivity methodology to design offline interference tests. Consider Paragon-inspired runtime models only after collecting representative observations, with unseen programs and phase changes held out for evaluation. Prior knowledge of a user's access pattern is unavailable. [Bubble-Up, MICRO 2011](https://www.cs.virginia.edu/~skadron/Papers/mars_micro2011.pdf), [Paragon, ASPLOS 2013](https://csl.stanford.edu/~christos/publications/2013.paragon.asplos.pdf)

### Testcase dispatch and storage

Later split submission execution into testcase-level jobs, defining build reuse, aggregation, retries, and `StopOnNotAccepted` semantics. Evaluate a Longhorn-backed shared filesystem for the artifacts it would serve, its timing impact, and its interaction with immutable version pinning and local cache ownership. Production cache selection remains open between the PV and Silo proposals. [ADR 0001](./0001-versioned-local-testcase-replication.md), [ADR 0003](./0003-node-local-testcase-pv-coordination.md), [PV PoC](./0005-node-local-pv-testcase-cache-poc.md), [Silo PoC](./0006-cache-versioned-testcases-in-node-local-silo.md)

## Verification

- Complete each stage's baseline and failure checks before adding the next mechanism. Establish acceptance thresholds before evaluation.
- Hold the execution profile fixed and compare isolated runs, fixed caps, and observation-driven admission under compute-, cache-, latency-, and bandwidth-heavy mixes. Include real compilation and tests as external load.
- Give the controller only normal metadata and runtime observations. Keep workload labels, future phase changes, and isolated reference times in the evaluator. Include first-seen programs, equal-memory/different-bandwidth pairs, abrupt phase changes, short bursts, and changing testcase behavior.
- Report CPU and elapsed-time distributions, both fast and slow tails, near-limit verdict agreement, and all failed or contaminated attempts. Measure throughput and queue age at the same accuracy target.
- Include collector overhead, stale metrics, shrinking limits, cancellation, restart, concurrent dispatch, partial results, and lost connectivity. Verify bounded execution and release slots only after process exit is confirmed.
- For placement and future transport experiments, compare readiness time, idle and peak cost, failure recovery, and production-like dependency load alongside accuracy.

## Links and change history

- [Host-direct CAT experiment](https://github.com/skkuding/iris-load-test-toolset/blob/5ed7488/docs/CAT-DIRECT-AB.md)
- [Full Iris and RabbitMQ benchmark](https://github.com/skkuding/iris-load-test-toolset/blob/dcff9a9/docs/FULL-IRIS-EXTERNAL.md)
- 2026-11-14 — Lee Haesung — Proposed node-local adaptive concurrency for Iris.
- 2026-11-17 — Lee Haesung — Revised the proposal to a Kubernetes CP and RPC VM workers, with CP-managed VM concurrency, fixed CAT allocation, and application-level bandwidth admission on codedang8.
- 2026-11-17 — Lee Haesung — Revised the proposed implementation sequence to measurement, local admission, and remote CP coordination. Added bare-metal placement as the initial baseline and deferred VM selection, database polling, low-level regulation, and workload models to measured follow-up work.
