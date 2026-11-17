---
title: "ADR 0007: Build Iris 2.0 as a standalone judge service with adaptive admission"
description: "Start a new judge service with a single complete request and supplied testcases, then validate concurrent execution, adaptive admission, and remote coordination in stages."
status: proposed
date: "2026-11-14"
owner: "Lee Haesung"
decision_makers: []
supersedes: []
superseded_by: null
---

# ADR 0007: Build Iris 2.0 as a standalone judge service with adaptive admission

## Context

Jobs sharing CPU cores, last-level cache (LLC), memory controllers, and bandwidth can change each other's measured execution time. Cache evictions and memory stalls can shift CPU time, while scheduler wait can increase elapsed time. A verdict near a time limit can therefore depend on neighboring work. The Wave 1 direct Judger reproduction observed higher CPU and elapsed times as concurrency increased for a fixed fixture. Safe operating limits and production verdict effects still need validation. [Wave 1 comparison](https://github.com/skkuding/iris-load-test-toolset/blob/dcff9a9/docs/WAVE1-COMPARISON.md)

Compute-heavy programs can leave shared memory resources available, while memory-heavy programs at the same concurrency can cause cache or bandwidth contention. A fixed cap safe for a demanding mix can leave usable capacity idle during other mixes. We need to evaluate whether observation-driven admission improves throughput at the same execution-time and verdict-reproducibility targets.

**Assume no prior knowledge of a user's CPU or memory access pattern.** A program can change phases or behave differently on the next input. Memory usage in bytes does not establish memory traffic per second. Estimates need evaluation on first-seen programs and phase changes.

Iris 2.0 is a new service design. Its execution contract, admission policy, and eventual CP/worker boundary need independent validation. A small judging MVP can establish this foundation using a fully prepared request whose testcase data has already been retrieved by the caller. Compilation, tests, and other services remain potential interference sources to evaluate as execution concurrency grows.

## Decision drivers

- Establish a correct, runnable judging path before adding resource control or distributed coordination.
- Preserve repeatable resource measurements and near-limit verdicts under changing load.
- Use available capacity without requiring prior classification of user programs.
- Keep each development step independently runnable and measurable.
- Compare throughput, waiting time, and placement cost at the same accuracy target.

## Considered options

| Service approach | Benefit | Cost or limitation |
| --- | --- | --- |
| Incrementally restructure the existing Iris service | Can reuse its integrated request and data paths | Couples the new design experiments to changes in the existing service. |
| Build the full CP, workers, storage, and transport together | Exercises the intended end-to-end architecture | Introduces several failure sources before the judging core has a baseline. |
| Build a standalone judging MVP and expand it in stages | Establishes a small execution contract and isolates the effect of each added mechanism | Production integration and migration require later work. **Proposed.** |

For concurrency, compare a conservative fixed cap, a higher fixed cap, and observation-driven admission under a fixed execution profile. Use fixed caps as experimental baselines before deciding on adaptive policy.

## Decision

Develop **Iris 2.0 as a new standalone judge service**, starting with one complete judging request. The caller supplies the code or prepared executable, language/runtime configuration, limits, and testcase input and expected-output data. The MVP executes the supplied work and returns structured results. Existing sandbox libraries, result semantics, and useful components can be reused where suitable.

Expand that runnable core through fixed concurrent execution, observation-driven admission, and then a Kubernetes CP with remote execution workers. Validate each addition against the preceding baseline. Choose production transport, storage, and migration after the execution design has evidence.

Keep the execution profile fixed across workload mixes, including physical CPU placement, SMT and clock policy, NUMA allocation, and any CAT allocation. Profile changes require a drained worker and a separate baseline. Admission changes when new jobs may start. Goroutines manage admitted subprocesses, and an execution slot stays occupied until its subprocess exits.

## Implementation sequence

### Step 1 — Judge one fully prepared request

Expose a minimal entry point that accepts one self-contained request. It includes a request identifier, submitted code or an executable artifact, the language/runtime configuration, time and memory limits, the supplied testcase inputs and expected outputs, and the output-comparison rule. Testcase bodies can be carried directly or supplied as already-readable local artifacts. The caller has completed testcase selection and retrieval before invocation.

Handle one request at a time. For source submissions, perform the minimal build preparation required for that request and record build failure separately. Run the executable in the sandbox against each supplied testcase, collect CPU time, elapsed time, memory, exit state, and output, and return testcase results with a request summary. Clean up request-owned temporary artifacts after their use. Keep build preparation and waiting time separate from measured execution.

Use a local test harness and supplied fixtures to demonstrate a complete request-to-result path. Verify output comparison, limits, runtime errors, build errors where applicable, and cleanup. This MVP establishes functional correctness and isolated execution measurements with the supplied data. Its deliverable is a runnable judging core that can be exercised independently of the existing service's request transport and testcase storage.

### Step 2 — Add fixed concurrent execution and measurement

Allow several complete requests through a bounded local worker interface. Count actual subprocess execution, including parallel build work if introduced. Track active jobs, waiting time, build time, sandbox measurements, and completion or error state. Verify that sandbox processes stay inside the intended CPU and resource boundaries.

Use an available judge-only physical host as the initial bare-metal reference. Compare isolated runs with fixed caps under compute-, cache-, latency-, and bandwidth-heavy mixes. Add real compilation and test workloads as external interference. Obtain a conservative fixed cap and quantify throughput and time drift before adding feedback control. Evaluate partitioned sharing separately if dedicated capacity has unacceptable cost or insufficient availability.

### Step 3 — Add observation-driven admission

Use the same local worker interface to adjust the maximum running job count. Start from the validated fixed cap. Increase the target gradually after sustained low pressure and reduce new starts after sustained contention. Running jobs drain when the target falls below the active count. Calibrate sampling periods, recovery windows, and thresholds on each host configuration.

Collect timestamped LLC occupancy, MBM traffic where available, scheduler pressure, memory availability, and execution variability. Memory capacity estimates support reservation and exhaustion prevention. Bandwidth observations indicate memory traffic pressure. Interpret LLC occupancy with misses and timing evidence. Start with aggregate runtime observations and conservative ceilings, and evaluate per-program predictors separately. [Linux resctrl](https://docs.kernel.org/filesystems/resctrl.html), [scheduler statistics](https://docs.kernel.org/scheduler/sched-stats.html)

codedang8's reported E5-2620 v4 CPU flags include CAT and MBM, with MBA absent. Fixed CAT allocation can separate cache allocation between groups. Include the host default group's mask when qualifying isolation. Jobs sharing a socket still share memory bandwidth, so include colocated compilation and test activity in the admission policy.

When metrics are stale or unavailable, stop increasing admission and use a validated conservative mode. Pause new execution if the worker cannot maintain that mode. A phase change inside a running job can cause interference before the controller responds. Measure that exposure explicitly.

### Step 4 — Introduce the Kubernetes CP and RPC workers

Run the new service's control plane (CP) in the existing Kubernetes environment. Run execution workers outside the general backend Kubernetes worker pool, initially on qualified physical hosts. The CP can reside on another physical server. It accepts work, tracks capacity, selects workers, sets per-worker running-job limits, and collects results. Workers enforce actual execution limits.

A host agent reports hardware observations with measurement intervals, attribution, and freshness. The CP considers shared LLC and memory domains across workers on a host. Use RPC for execution and job-state reconciliation. A worker can later run inside a VM through the same execution interface.

Keep one effective capacity budget per worker across CP replicas and restarts. An RPC timeout can leave a job running, so reconcile worker state before releasing its slot or retrying. Define artifact transfer and lifetime when separating build and judge pools. The MVP's supplied-testcase contract provides an execution boundary for later integration with testcase providers.

### Workload policy as the service expands

Submission and rejudge execution share accuracy-oriented admission. Compilation and test execution have separate bounded budgets, and their interference is included when they share hardware with judging. Test-request integration should respect the existing positive time and memory limits. Validate compatibility at the integration stage. [Existing test model](https://github.com/skkuding/codedang/blob/2528d9cc1/apps/iris/src/handler/run/models.go)

## Consequences

- The first deliverable can demonstrate judging correctness with caller-supplied data. Each later mechanism has a working baseline for comparison.
- A new service requires explicit production integration, compatibility evaluation, and migration planning. Successful local experiments alone establish neither production readiness nor safe replacement of the existing Iris service.
- Dedicated physical capacity simplifies the initial interference baseline. Reserving headroom can increase idle cost, and host provisioning affects scale-out readiness. Existing spare hosts, peak demand, and waiting-time targets determine the actual tradeoff.
- Controlled sharing can improve utilization but requires interference policy and mixed-load validation. Include background services, compilation, tests, and collectors.
- Saturation increases waiting time. Judge reproducibility and end-to-end latency need separate targets.
- Remote coordination adds job-state reconciliation and recovery work after local execution and admission have been evaluated.

## Future work

### Production integration and durable job transport

After validating the execution design, define how backend requests and testcase providers supply the complete judging contract. Evaluate compatibility for supported languages, judging modes, limits, result fields, and cancellation. Plan how to route work between the existing service and Iris 2.0, reconcile in-flight jobs and results, and roll back a transition.

A centralized CP can use a durable database job table and RPC dispatch. Evaluate PostgreSQL polling against RabbitMQ for pickup latency, idle and burst DB load, fairness, and recovery. Creating a job in the submission transaction could simplify the DB-to-broker handoff. A bounded claim transaction using `FOR UPDATE SKIP LOCKED` is a candidate. [PostgreSQL locking clauses](https://www.postgresql.org/docs/current/sql-select.html#SQL-FOR-UPDATE-SHARE)

Retain pending work across CP failure and define ownership, lease recovery, attempts, cancellation, and idempotent results. Lease expiry can coexist with a still-running job, requiring worker reconciliation and stale-completion checks. Select transport after comparing behavior and operational cost. Define migration for request producers, pending work, and result consumers.

### VM isolation and hypervisor choice

Compare the qualified bare-metal layout with judge and compile/test VM workers after establishing the execution and admission baselines. The CP remains in Kubernetes and uses RPC in each case. VM workers run outside the general backend Kubernetes worker pool. Hold CPU, NUMA, clock, CAT, and memory-backing profiles fixed within each comparison and include artifact-transfer costs.

VM deployment can reuse a shared host pool and simplify some lifecycle operations, but host contention, reserved resources, image startup, and warm-up affect usable capacity. Compare cost per completed job at the same accuracy target and scale-out readiness with dedicated physical capacity.

KVM is an initial candidate because the existing experiments and Linux host tools can be reused. Host-local collection remains useful with a remote CP. Compare Xen's CPU pools and resource controls if host scheduling interference remains material. Evaluate observation quality, collector overhead, maintenance effort, near-limit verdicts, and throughput. codedang8's MBA limitation applies to both. [KVM tracing](https://www.linux-kvm.org/page/Perf_events), [libvirt configuration](https://libvirt.org/formatdomain.html), [Xen controls](https://xenbits.xenproject.org/docs/4.19-testing/man/xl.1.html)

### Local bandwidth regulation and workload models

If admission alone leaves unacceptable burst interference, evaluate MemGuard-style local regulation first against compilation and test aggressors. Study budget enforcement, PMU event coverage, writes and prefetch traffic, guest accounting when using VMs, and interrupt or throttling overhead on the actual CPU and kernel. Keep reservation, reclaim, and sharing modes as separate experiments. Fixed regulation of measured judging needs its own isolated reference profile. [MemGuard, RTAS 2013](https://ittc.ku.edu/~heechul/papers/memguard-rtas13.pdf), [author implementation](https://github.com/heechul/memguard)

An eBPF instrumentation and sched_ext regulator is another experimental candidate. Check kernel configuration, permitted execution contexts, preemption and replenishment, and failure fallback before claiming bounded bandwidth enforcement. Evaluate this low-level mechanism after the admission experiments. [Linux sched_ext](https://docs.kernel.org/scheduler/sched-ext.html)

Use Bubble-Up's pressure/sensitivity methodology for offline interference tests. Consider Paragon-inspired runtime models after collecting representative observations, with unseen programs and phase changes held out for evaluation. Prior knowledge of user access patterns is unavailable. [Bubble-Up, MICRO 2011](https://www.cs.virginia.edu/~skadron/Papers/mars_micro2011.pdf), [Paragon, ASPLOS 2013](https://csl.stanford.edu/~christos/publications/2013.paragon.asplos.pdf)

### Testcase dispatch and storage

Later split submission execution into testcase-level jobs, defining build reuse, aggregation, retries, and `StopOnNotAccepted` semantics. Evaluate a Longhorn-backed shared filesystem for artifact delivery, timing impact, and interaction with immutable version pinning and local cache ownership. Production cache selection remains open between PV and Silo proposals. Integrate the selected provider with the complete-request execution contract. [ADR 0001](./0001-versioned-local-testcase-replication.md), [ADR 0003](./0003-node-local-testcase-pv-coordination.md), [PV PoC](./0005-node-local-pv-testcase-cache-poc.md), [Silo PoC](./0006-cache-versioned-testcases-in-node-local-silo.md)

## Verification

- Step 1 accepts a fully supplied request and returns correct testcase results and a request summary. Exercise accepted and wrong outputs, limits, runtime errors, applicable build errors, and temporary-artifact cleanup.
- Step 2 holds the execution profile fixed and compares isolated execution with fixed concurrent caps. Include normal request preparation and external compilation or tests after isolating execution effects.
- Step 3 compares observation-driven admission against the fixed-cap baselines at the same accuracy target. Give the controller only normal metadata and runtime observations. Keep workload labels, future phases, and isolated reference times in the evaluator.
- Include first-seen programs, equal-memory/different-bandwidth pairs, abrupt phase changes, short bursts, and changing testcase behavior. Report CPU and elapsed-time distributions, both tails, near-limit verdict agreement, and all failed or contaminated attempts. Measure throughput and waiting time.
- Exercise collector overhead, stale metrics, shrinking limits, cancellation, concurrent starts, and confirmed process exit before slot release. In Step 4 add RPC loss, partial results, CP/worker restarts, and multiple CP replicas.
- Evaluate future placement, transport, and regulation work against its own accuracy, cost, and recovery questions. Agree on acceptance thresholds before each evaluation.

## Links and change history

- [Host-direct CAT experiment](https://github.com/skkuding/iris-load-test-toolset/blob/5ed7488/docs/CAT-DIRECT-AB.md)
- [Full Iris and RabbitMQ benchmark](https://github.com/skkuding/iris-load-test-toolset/blob/dcff9a9/docs/FULL-IRIS-EXTERNAL.md)
- 2026-11-14 — Lee Haesung — Proposed node-local adaptive concurrency for Iris.
- 2026-11-17 — Lee Haesung — Revised the proposal to a Kubernetes CP and RPC VM workers, with CP-managed VM concurrency, fixed CAT allocation, and application-level bandwidth admission on codedang8.
- 2026-11-17 — Lee Haesung — Revised the proposed implementation sequence to measurement, local admission, and remote CP coordination. Added bare-metal placement as the initial baseline and deferred VM selection, database polling, low-level regulation, and workload models to measured follow-up work.
- 2026-11-17 — Lee Haesung — Focused context and options on the admission decision, separated the rollout sequence, and condensed transport and infrastructure follow-up work.
- 2026-11-17 — Lee Haesung — Reframed Iris 2.0 as a new standalone service. Added a single-request judging MVP with caller-supplied testcases before concurrency, adaptive admission, and CP/worker distribution.
