---
title: "ADR 0007: Build Iris 2.0 as a standalone judge service and validate execution control"
description: "Build a standalone judging core, compare execution policies, and validate distributed workers and VM isolation in stages."
status: proposed
date: "2026-11-14"
owner: "Lee Haesung"
decision_makers: []
supersedes: []
superseded_by: null
---

# ADR 0007: Build Iris 2.0 as a standalone judge service and validate execution control

> [ADR 0010](./0010-distributed-iris-judging.md) proposes replacing this ADR with the distributed prototype design.

## Context

The judge service must provide consistent verdicts for the same submission while sustaining sufficient throughput. Higher concurrency can improve throughput, but shared-resource contention can shift execution times and change near-limit verdicts. Conservative limits can leave capacity idle and increase waiting time.

The Wave 1 experiment observed higher CPU and elapsed times for the same program and input as concurrency increased. Even CPU-time-based judging must account for interference through shared caches and memory bandwidth. [Wave 1 comparison](https://github.com/skkuding/iris-load-test-toolset/blob/dcff9a9/docs/WAVE1-COMPARISON.md)

Interference depends on the workload mix. A fixed cap chosen for memory-heavy work may underuse capacity during compute-heavy mixes. Observation-driven admission could use that headroom, but delayed observations and execution-phase changes can undermine it. We lack a validated concurrency range for the workloads and host configurations we intend to support. Characterizing capacity and interference is the first experimental objective.

Assume no prior knowledge of a user's CPU or memory access pattern. Runtime observations can inform admission, while future demand and phase changes remain unknown. Measured judging must be distinguished from compilation and tests, whose interference also matters when they share hardware.

The execution control and instrumentation we need require structural changes to the existing Iris service. A separate service provides an execution boundary that can be validated locally before production integration or distributed coordination.

## Decision drivers

- Establish a correct, independently runnable judging core before adding control mechanisms.
- Preserve execution-time and verdict reproducibility while making useful capacity available.
- Evaluate policies without requiring prior knowledge of user program behavior.
- Separate execution-policy effects from distributed coordination and placement effects.
- Compare accuracy, throughput, waiting time, operational cost, and recovery.

## Considered options

| Question | Alternatives | Choice and rationale |
| --- | --- | --- |
| Development base | Modify existing Iris / build a new service | Build a new service because execution control and instrumentation require structural changes. Reuse useful existing components. |
| Validation sequence | Build the full distributed system together / validate locally before expansion | Expand in stages to distinguish execution-policy effects from remote job management. |
| Execution policy | Fixed limits / observation-driven admission | Compare under the same conditions before selecting a policy. |
| Worker placement | Bare-metal execution / separate judge and compile/test VMs | Establish a controlled bare-metal reference, then compare VM isolation and its cost. |

## Decision

**Build Iris 2.0 as a new standalone judge service. Establish a single-execution baseline, then compare fixed concurrency and observation-driven admission to find a policy that achieves both judge reproducibility and useful throughput.**

To support the current multi-host environment and future growth, use a central control plane (CP) and remote execution workers. Keep the CP in Kubernetes and run workers outside the general backend Kubernetes worker pool. Validate locally before adding distributed coordination, then evaluate VM isolation through the same worker interface.

This ADR sets the development direction and experimental sequence. Adoption of dynamic control, final concurrency limits, and production VM placement depend on experimental results.

### Step 1 — Build a single-request judging MVP

Accept a complete request containing code or an executable, runtime configuration, execution limits, testcase inputs and expected outputs, and the comparison rule. The caller has already retrieved the testcase data. Run one request at a time and return testcase results, resource measurements, and a request summary. Keep any required build preparation separate from measured execution.

Verify correct and wrong outputs, limits, applicable build errors, runtime errors, and temporary-artifact cleanup. Repeat isolated execution to measure natural variation. The deliverable is a runnable judging core and a single-execution baseline. Production transport and testcase storage integration follow later.

### Step 2 — Characterize fixed concurrent execution

Allow several complete requests under a fixed running-job cap. Track actual subprocess activity, waiting time, build time, sandbox CPU and elapsed time, memory, and errors. Keep a slot occupied until the subprocess exits, and verify CPU and resource containment.

Start with a controlled physical host. Vary concurrency across compute-heavy, cache-heavy, memory-latency, bandwidth-heavy, and mixed workloads. Add compilation and tests as interference sources. Establish the relationship between concurrency, reproducibility, throughput, and waiting time, including a conservative fixed-cap reference.

### Step 3 — Compare observation-driven admission

Use runtime observations to adjust the running-job limit through the same local interface. Compare against fixed caps at the same reproducibility target. Evaluate gradual increases during sustained headroom, reductions after contention, response delay, and a conservative fallback for stale or missing observations. Lower limits let running jobs finish while delaying new starts.

Observe LLC occupancy, memory bandwidth through MBM where available, scheduler pressure, and memory availability. Memory capacity and memory traffic describe different demands. Interpret LLC occupancy with misses and timing evidence. Include first-seen programs and abrupt phase changes, and keep future workload behavior hidden from the controller. Select the policy and applicable conditions from the results.

### Step 4 — Validate the Kubernetes CP and remote workers

Run the CP in Kubernetes and dispatch work over RPC to workers outside the general backend Kubernetes worker pool. The CP may run on another physical server. It tracks worker state, selects workers, manages running-job limits, and collects results. Workers enforce those limits locally. A host agent reports hardware observations with measurement intervals, attribution, and freshness.

Validate consistent capacity accounting across CP replicas and restarts, delayed or lost observations, RPC retries, and worker failure. An RPC timeout can leave a job running, so reconcile worker state before releasing capacity or retrying execution. Define artifact transfer and lifetime when build and judge workers are separated. The deliverable is a distributed execution path with measured overhead and verified recovery behavior.

### Step 5 — Evaluate VM isolation and hypervisor choice

Compare the controlled bare-metal workers with separate judge and compile/test VM workers using the same CP and execution contract. The judge VM runs submission and rejudge execution, and the other VM runs compilation and tests. Several judge jobs may run in one VM under the CP-managed limit. Exercise actual external load to test how much interference the VM layout prevents.

Keep physical CPU placement, SMT and clock policy, NUMA allocation, CAT allocation, and memory backing fixed within each comparison. Account for host services, emulator/I/O threads, and the host default CAT group. codedang8 supports CAT and MBM but lacks MBA, so shared-socket memory bandwidth remains a constraint for both KVM and Xen.

KVM can reuse existing experiments and Linux host tools. Host-local collection remains useful with a remote CP. Compare Xen's CPU pools and controls where they could improve the measured result. Evaluate observation quality, execution-time and verdict reproducibility, collector and virtualization overhead, artifact transfer, maintenance effort, idle cost, and scale-out readiness. Choose the deployment form and hypervisor from these results. [KVM tracing](https://www.linux-kvm.org/page/Perf_events), [libvirt configuration](https://libvirt.org/formatdomain.html), [Xen controls](https://xenbits.xenproject.org/docs/4.19-testing/man/xl.1.html)

## Consequences

- A new service makes execution policy independently testable, while creating compatibility and migration work for production adoption. Useful existing components can be reused.
- Conservative admission can increase waiting time. Dynamic control introduces measurement and response costs whose benefit must be demonstrated at the same accuracy target.
- Dedicated physical capacity simplifies the initial reference, but idle capacity and host provisioning affect cost and scaling. Shared-host or VM placement requires interference validation at comparable accuracy.
- Distributed control adds capacity reconciliation, artifact delivery, and failure recovery. Local validation provides a baseline for measuring these costs.
- Build and test execution need separate bounded budgets when integrated, and their interference belongs in shared-hardware validation. Existing test-request time and memory limits should be checked during compatibility work.

## Verification

First measure natural variation in isolated execution and the behavior of fixed concurrent execution. Use these observations together with operational requirements to define acceptable bounds before comparing subsequent policies. Hold the execution profile fixed and compare each stage with the preceding baseline.

The main metrics are CPU and elapsed-time distributions, both fast and slow tails, near-limit verdict agreement, throughput, and waiting time. Include instrumentation/control overhead and all failed or contaminated attempts. Give the controller only normal metadata and runtime observations, with workload labels, future phases, and isolated reference times held by the evaluator.

- Adopt dynamic control where it provides a benefit at the same reproducibility level. Retain fixed limits where sufficient or where adaptation costs more than it gains.
- Test equal-memory/different-bandwidth workloads, short bursts, sudden phase changes, changing testcase behavior, compilation, and tests. Measure the interference window before a controller reacts.
- In Step 4, verify local limit enforcement and job-state reconciliation through connection loss, retries, partial results, and CP/worker restarts. Separate dispatch and waiting time from measured execution.
- In Step 5, measure isolation under actual neighboring load and compare readiness time and cost at the same accuracy target. If fixed and dynamic admission still leave unacceptable interference, use the evidence to scope additional regulation.

## Future work

### Production integration and durable job transport

After validating the execution contract, define backend and testcase-provider integration. Check supported languages, judging modes, limits, output comparison, cancellation, and result compatibility. Plan request routing, in-flight job/result reconciliation, and rollback when introducing the service alongside existing Iris.

Evaluate a durable PostgreSQL job table and polling against RabbitMQ once CP intake and recovery needs are clear. A job created in the submission transaction could simplify the DB-to-broker handoff. A short, bounded claim transaction with `FOR UPDATE SKIP LOCKED` is a candidate. Compare pickup latency, idle and burst DB load, fairness, cleanup, and operational cost. [PostgreSQL locking clauses](https://www.postgresql.org/docs/current/sql-select.html#SQL-FOR-UPDATE-SHARE)

Both choices need durable pending work, defined ownership, retries, cancellation, and idempotent results. For DB polling, lease expiry can coexist with a still-running job, so worker reconciliation and stale-completion checks are required. Transport selection and migration remain separate decisions based on these tests.

### Local memory bandwidth regulation

If the admission and placement experiments leave unacceptable burst interference, evaluate MemGuard-style local regulation, initially against compilation/test aggressors. Its per-core PMU budgets can enforce limits without knowing program access patterns in advance. Check actual CPU event coverage, reads, writes, prefetch traffic, guest accounting, timer/interrupt overhead, and the delay and overshoot between budget exhaustion and enforcement. Treat reservation, reclaim, and spare sharing as separate experiments. Regulation of measured judge execution needs a baseline under the same fixed budget. [MemGuard, RTAS 2013](https://ittc.ku.edu/~heechul/papers/memguard-rtas13.pdf), [author implementation](https://github.com/heechul/memguard)

An eBPF instrumentation and sched_ext implementation is another candidate for local enforcement. Verify kernel configuration, allowed execution contexts, vCPU preemption, budget replenishment, and fallback if the scheduler detaches. Compare implementation cost, overhead, and regulation effectiveness with the module approach before adopting either. The remote CP sets policy while local enforcement handles short timescales. [Linux sched_ext](https://docs.kernel.org/scheduler/sched-ext.html)

### Interference characterization and prediction

Use Bubble-Up's pressure/sensitivity methodology to characterize fixtures and interference offline. Vary external pressure to identify where timing and verdicts become unstable. This can guide safe operating regions without assuming that a new submission's sensitivity is known. [Bubble-Up, MICRO 2011](https://www.cs.virginia.edu/~skadron/Papers/mars_micro2011.pdf)

After collecting runtime data, evaluate Paragon-inspired models for interference caused and tolerated, alongside simple history-based predictors. Measure profiling cost, underprediction, first-seen programs, and phase-change recovery on held-out workloads. A prediction must demonstrate additional benefit over observation-only admission at the same accuracy target. [Paragon, ASPLOS 2013](https://csl.stanford.edu/~christos/publications/2013.paragon.asplos.pdf)

### Testcase dispatch and artifact storage

Evaluate testcase-level dispatch after the submission-level execution contract is established. Define build reuse, testcase identity, result aggregation, retries, and `StopOnNotAccepted` semantics. Compare scheduling flexibility and worker utilization with added coordination and artifact-transfer costs.

Evaluate Longhorn-backed shared storage for the artifacts it would serve and for its effect on judge timing. Integrate with immutable testcase version pinning and cache ownership, and compare with the PV and Silo proposals before choosing production storage. The caller-supplied testcase boundary lets providers be evaluated independently of the judging core. [ADR 0001](./0001-versioned-local-testcase-replication.md), [ADR 0003](./0003-node-local-testcase-pv-coordination.md), [PV PoC](./0005-node-local-pv-testcase-cache-poc.md), [Silo PoC](./0006-cache-versioned-testcases-in-node-local-silo.md)

## Links and change history

- [Host-direct CAT experiment](https://github.com/skkuding/iris-load-test-toolset/blob/5ed7488/docs/CAT-DIRECT-AB.md)
- [Full Iris benchmark](https://github.com/skkuding/iris-load-test-toolset/blob/dcff9a9/docs/FULL-IRIS-EXTERNAL.md)
- 2026-11-14 — Lee Haesung — Proposed an investigation of judge concurrency and shared-resource interference.
- 2026-11-17 — Lee Haesung — Revised the proposal through CP/worker and placement discussions, then selected a standalone single-request MVP as the starting point.
- 2026-11-17 — Lee Haesung — Consolidated the ADR around the development direction, four validation stages, and experiment-dependent policy selection.
- 2026-11-17 — Lee Haesung — Restored the standard ADR section order, added VM isolation as Step 5 after distributed control, and expanded follow-up experiments and integration decisions.
