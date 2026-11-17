---
title: "ADR 0007: Build Iris 2.0 as a standalone judge service and validate execution control"
description: "Build a standalone judging core, establish its capacity and reproducibility, and compare fixed and observation-driven admission before distributed integration."
status: proposed
date: "2026-11-14"
owner: "Lee Haesung"
decision_makers: []
supersedes: []
superseded_by: null
---

# ADR 0007: Build Iris 2.0 as a standalone judge service and validate execution control

## Decision

**Build Iris 2.0 as a new standalone judge service. Establish a single-execution baseline, then compare fixed concurrency and observation-driven admission to find a policy that achieves both judge reproducibility and useful throughput.**

The execution control and instrumentation we need require structural changes to the existing Iris service. We choose to design the execution boundary in a separate service and reuse useful existing components.

To support the current multi-host environment and future growth, use a central control plane (CP) and remote execution workers. Keep the CP in Kubernetes and run the workers outside the general backend Kubernetes worker pool. Validate locally before adding distributed coordination so the effects of execution policy can be evaluated independently.

This ADR sets the development direction and experimental sequence. **Adoption of dynamic control and the final concurrency limits will be decided from experimental results.**

## Context

**The judge service must provide consistent verdicts for the same submission while sustaining sufficient throughput.** Higher concurrency can improve throughput, but shared-resource contention can shift execution times and change near-limit verdicts. Conservative limits can leave capacity idle and increase waiting time.

The Wave 1 experiment observed higher CPU and elapsed times for the same program and input as concurrency increased. Even CPU-time-based judging must account for interference through shared caches and memory bandwidth. [Wave 1 comparison](https://github.com/skkuding/iris-load-test-toolset/blob/dcff9a9/docs/WAVE1-COMPARISON.md)

Interference can depend on the workload mix. A fixed cap chosen for a demanding mix may underuse capacity during other mixes. Observation-driven admission is a candidate for using that headroom, but delayed observations and execution-phase changes can undermine it. It needs comparison with fixed limits.

Assume no prior knowledge of a user's CPU or memory access pattern. Runtime observations can inform admission, while future demand and phase changes remain unknown. Distinguish measured judging from compilation and tests, and include their interference when they share hardware.

We currently lack a validated concurrency range that preserves reproducibility for the workloads and host configurations we intend to support. **The first experimental objective is to characterize capacity and interference.**

## Alternatives and rationale

| Question | Alternatives | Choice and rationale |
| --- | --- | --- |
| Development base | Modify existing Iris / build a new service | Build a new service because execution control and instrumentation require structural changes. |
| Validation sequence | Build the full distributed system together / validate locally before expansion | Expand in stages to distinguish execution-policy effects from remote job management. |
| Execution policy | Fixed limits / observation-driven admission | Compare under the same conditions before selecting a policy. |

## Validation stages

| Stage | Main question | Deliverable |
| --- | --- | --- |
| 1. Single execution | Can one complete request be judged correctly, and how stable are repeated measurements? | A functionally verified execution core and an isolated-execution baseline. |
| 2. Fixed concurrent execution | What concurrency range preserves reproducibility for each workload mix? | The relationship between concurrency, reproducibility, throughput, and waiting time. |
| 3. Observation-driven control | Can more capacity be used than with fixed limits at the same reproducibility level? | A decision on whether and under what conditions to adopt dynamic control. |
| 4. Distributed control | Can execution policy and job state be managed consistently across physical hosts? | A CP/remote-worker design and failure-recovery validation results. |

The initial execution core receives a complete request containing code or an executable, execution limits, testcase data, and the other information needed to judge it, then returns results. The caller has already retrieved the testcases. Integration with production transport and storage comes later.

Keep the execution environment fixed within each comparison and use the preceding stage's baseline. Include compute-heavy and memory-heavy programs, mixed loads, abrupt phase changes, and interference from compilation and tests. Start with a controlled reference host and evaluate shared-host placement separately when needed. Each worker enforces its running-job limit and retains the execution slot until the subprocess exits.

## Evaluation and follow-up decisions

First measure natural variation in isolated execution and the behavior of fixed concurrent execution. Use these observations together with operational requirements to define acceptable bounds, and state them before comparing subsequent policies.

The main metrics are execution-time distributions, near-limit verdict agreement, throughput, and waiting time. Include instrumentation and control overhead, both fast and slow timing tails, and failed attempts.

- Adopt dynamic control where it provides a benefit at the same reproducibility level.
- Retain a fixed policy where a fixed cap is sufficient or dynamic control costs more than it gains.
- Evaluate resource isolation and additional regulation if neither policy adequately controls interference.

For distributed validation, include delayed or lost observations, CP/worker restarts, and RPC retries. An RPC timeout can leave a job running, so reconcile worker state before freeing capacity or retrying execution.

## Consequences and follow-up scope

A new service lets us validate execution policy independently, but requires compatibility evaluation and migration from the existing Iris service. Execution limits for reproducibility can increase waiting time. Distributed control adds job-state reconciliation and recovery work.

Choose production transport and storage, VM placement, additional bandwidth regulation, and testcase-level dispatch separately, using the requirements and limits found in these experiments. For placement, compare dedicated physical capacity with controlled sharing at the same accuracy target, including idle cost and scale-out readiness.

Future work can compare a durable DB job table and polling with RabbitMQ once the CP's intake and recovery requirements are clear. It can also compare bare-metal workers with KVM or Xen, investigate MemGuard or eBPF/sched_ext regulation if burst interference remains, and evaluate Longhorn or testcase-level scheduling where the execution model calls for them. These mechanisms are follow-up candidates whose adoption depends on measured needs.

## Links and change history

- [Host-direct CAT experiment](https://github.com/skkuding/iris-load-test-toolset/blob/5ed7488/docs/CAT-DIRECT-AB.md)
- [Full Iris benchmark](https://github.com/skkuding/iris-load-test-toolset/blob/dcff9a9/docs/FULL-IRIS-EXTERNAL.md)
- 2026-11-14 — Lee Haesung — Proposed an investigation of judge concurrency and shared-resource interference.
- 2026-11-17 — Lee Haesung — Revised the proposal through CP/worker and placement discussions, then selected a standalone single-request MVP as the starting point.
- 2026-11-17 — Lee Haesung — Consolidated the ADR around the development direction, four validation stages, and experiment-dependent policy selection.
