---
title: "ADR 0007: Adapt Iris judge concurrency to node contention"
description: "Run the Iris control plane in Kubernetes and dispatch RPC jobs to VM workers with concurrency limits adapted to measured contention."
status: proposed
date: "2026-11-14"
owner: "Lee Haesung"
decision_makers: []
supersedes: []
superseded_by: null
---

# ADR 0007: Adapt Iris judge concurrency to node contention

## Context

Concurrent jobs on the same node compete for last-level cache (LLC), memory bandwidth, and CPU scheduling time. Cache evictions and memory stalls can shift the CPU time of a fixed program. Run-queue delay can increase elapsed time. Either can make a verdict near a time limit depend on what else happened to run on the node. The Wave 1 direct Judger reproduction observed higher median CPU and elapsed times as concurrency increased for a fixed fixture. It establishes timing sensitivity in that setup. The contribution of each source of interference, a safe limit for each node, and the production effect on verdicts still need validation. [Wave 1 comparison](https://github.com/skkuding/iris-load-test-toolset/blob/dcff9a9/docs/WAVE1-COMPARISON.md)

The number of running jobs is a poor proxy for shared resource pressure. Compute-bound programs whose working sets fit in private caches can keep CPU cores busy while placing little demand on the shared LLC and DRAM. Memory-heavy programs can evict other jobs' cache lines or saturate memory bandwidth with the same number of workers. A fixed concurrency cap calibrated for a memory-heavy mix can leave cores idle and submissions queued during compute-heavy periods. A higher fixed cap calibrated for compute-heavy traffic can admit enough memory-heavy jobs to distort execution times and near-limit verdicts. The controller therefore adapts the active worker limit to observed contention as the mix changes.

Codedang already routes submissions, tests, and rejudges to separate RabbitMQ request queues, with separate Iris deployments and a shared result route. Each Iris process subscribes to one request queue with manual acknowledgements and prefetch 1. A judge request covers one submission for a problem. Its handler walks the testcases sequentially and emits testcase results and a submission summary. [Workload routing change](https://github.com/skkuding/codedang/pull/3724), [worker pool deployment change](https://github.com/skkuding/codedang/pull/3723), [RabbitMQ consumer](https://github.com/skkuding/codedang/blob/2528d9cc1/apps/iris/src/connector/rabbitmq/consumer.go), [judge handler](https://github.com/skkuding/codedang/blob/2528d9cc1/apps/iris/src/handler/judge/task.go)

The compiler and runner share the `judger` sandbox implementation. The current compiler invokes the compiler binary directly with `exec.CommandContext` and a deadline. The runner invokes the libjudger executable. A submission can involve more than one build unit, with setup currently performed concurrently. The interference policy needs to distinguish build processes from executions whose resource measurements contribute to a verdict. [Compiler](https://github.com/skkuding/codedang/blob/2528d9cc1/apps/iris/src/service/sandbox/judger/compiler.go), [runner](https://github.com/skkuding/codedang/blob/2528d9cc1/apps/iris/src/service/sandbox/judger/runner.go), [task runner](https://github.com/skkuding/codedang/blob/2528d9cc1/apps/iris/src/handler/runner.go)

## Decision drivers

- Keep execution measurements and near-limit verdicts reproducible under load.
- Use available capacity when node conditions allow and keep excess demand in RabbitMQ.
- Preserve the request routing, execution limits, and result contracts for existing callers.
- Keep the control plane in Kubernetes while isolating measured execution in VMs outside the Kubernetes worker pool.
- Give the control plane a consistent view of each VM's capacity and of shared resources on its physical host.

## Considered options

| Option | Benefit | Cost or limitation |
| --- | --- | --- |
| Keep separate Iris replicas per workload | Reuses the current deployment and queue topology | Each process sees only its own work. Co-located processes can interfere without a shared limit. |
| Use VM workers with fixed concurrency caps | Simple to operate and provides a baseline and fallback | A conservative cap can leave usable CPU capacity idle while work is queued. A higher cap can allow memory-heavy mixes to distort measured execution times. |
| Run an Iris control plane in Kubernetes with RPC VM workers and runtime-based concurrency limits | Centralizes capacity management across VMs and adapts to contention within a fixed execution profile | Requires RPC lifecycle handling, reliable measurements, bounded buffering, and validation of the control policy. **Proposed.** |

## Decision

Run the **Iris control plane (CP) in the existing Kubernetes environment**. It consumes the submission, test, and rejudge RabbitMQ queues, tracks VM state, chooses workers, manages per-VM maximum running job counts, and collects results. The CP reaches workers over RPC and can run separately from the physical judge hosts.

Run an **Iris worker inside each execution VM**. The judge VM operates outside the Kubernetes worker pool and executes measured submission and rejudge jobs. A separate compile and test VM executes builds and test requests. VM isolation is intended to reduce interference from services outside the judge group. Within the judge VM, several jobs may run concurrently under CP-managed admission limits. Validate the VM resource profile and the physical placement of other workloads together.

The CP dispatches build jobs, arranges the compiled-artifact handoff to judge workers, and dispatches execution when a slot is available. Define artifact identity, transfer, and cleanup in the RPC workflow. Each worker reports active jobs, completions, health, and resource state. The CP accounts for shared LLC and memory bandwidth domains when several VMs share a physical host. CP replica coordination and worker-side admission enforcement must preserve one effective capacity budget for each VM.

### Execution policy

| Work | CP and VM policy | Execution limits |
| --- | --- | --- |
| Submission and rejudge execution | The CP adjusts each judge VM's maximum running job count. Its worker uses goroutines to manage admitted subprocesses. Both workloads require reproducible resource measurements. Preserve separate queue identities and make arbitration across them explicit. | Preserve the existing sandbox and problem limits. |
| Compilation and build setup | Bound concurrent builds with a separate budget. Account for actual compiler processes, including parallel build units within a request. Reduce or defer build starts when mixed load would destabilize judging. | Preserve compiler deadlines and existing failure handling. |
| Test execution (`run`, `userTestCase`) | Exempt test execution from the accuracy-oriented judge pool. Keep test intake and execution bounded separately and include their pressure in the node policy when they share judge hardware. | Preserve the current sandbox limits and response fields. |

`run` and `userTestCase` already use the test routing key, require positive time and memory limits, and execute with the configured CPU and memory limits and a real-time limit derived by the runner. Their response includes measured resource usage. The exemption applies to judge admission. Authoring workloads such as `generate` and `validate` need an explicit classification if the node consumes them. [Backend AMQP routing](https://github.com/skkuding/codedang/blob/2528d9cc1/apps/backend/libs/amqp/src/amqp.service.ts), [test request and result model](https://github.com/skkuding/codedang/blob/2528d9cc1/apps/iris/src/handler/run/models.go), [sandbox runner](https://github.com/skkuding/codedang/blob/2528d9cc1/apps/iris/src/service/sandbox/judger/runner.go)

### Runtime measurement and admission

Run lightweight collectors alongside the workers and on physical hosts where hardware counters require host access. Report observations to the CP with timestamps and VM or hardware-domain attribution. Sample LLC occupancy, memory bandwidth, cache-miss or eviction indicators for cache pollution, and scheduler pressure such as runnable wait or context switches. Interpret these signals together with execution-time variation and active work by class. LLC occupancy describes cache use. A change in occupancy alone cannot establish harmful eviction or explain a timing shift. Use host capabilities to choose the available counters and evaluate interference by LLC or NUMA domain where placement and attribution are supported. [Linux resctrl](https://docs.kernel.org/filesystems/resctrl.html), [Linux scheduler statistics](https://docs.kernel.org/scheduler/sched-stats.html)

codedang8's reported CPU flags include CAT and memory bandwidth monitoring (MBM), with MBA absent. Use a fixed CAT allocation to separate the judge group from other groups and manage bandwidth pressure at the application level through admission. Estimated job memory usage or working-set demand can inform how many jobs to admit, with observed MBM traffic providing feedback where available. Memory capacity in bytes and memory traffic per second describe different demands. Calibrate the estimates against measured traffic and timing under mixed workloads. Controlling concurrent jobs aims to reduce cache pollution and bandwidth saturation, and its accuracy must be verified under changing load. Shared-host compilation and tests contribute to this pressure even when they run in another VM.

The controller starts with a conservative, benchmarked cap. It reduces new admissions when pressure persists and increases concurrency gradually after sustained recovery, up to a ceiling validated across representative workload mixes for the node. Admission changes control how many jobs may run at once. All submissions and rejudges on a node use the same configured execution environment, including CPU placement policy, cache allocation, and memory bandwidth settings. If required metrics are stale, unavailable, or unsupported, fall back to a validated fixed cap. Establish safe capacity before admitting measured work on a new node class. Choose the collectors, sampling interval, thresholds, and recovery windows through measurement, including the collectors' own overhead.

The CP adjusts the number of concurrently admitted jobs for each judge VM. The worker gates entry before launching the measured subprocess and counts the slot until that process has exited, including on error or cancellation. Reducing the target lets running work drain while pausing new starts. The current submission-level request and sequential testcase loop remain the unit of dispatch. Track queue, RPC, and admission delays separately from the timing reported by the sandbox.

### RabbitMQ backpressure and delivery

Keep per-queue prefetch and the total number of deliveries staged by the CP and workers finite. Size intake for the compilation and execution phases so a full downstream stage limits further intake and pending work stays primarily in RabbitMQ. Prefetch limits unacknowledged messages. CP admission and worker enforcement bound running subprocess work, including work whose RPC or request may have timed out. [RabbitMQ acknowledgements and prefetch](https://www.rabbitmq.com/docs/confirms)

Define job identity and status reconciliation across RPC timeouts, retries, and CP or worker restarts. A timed-out RPC can leave a subprocess running. Reconcile its state before releasing its slot or retrying execution, and handle repeated completion messages consistently.

Review acknowledgement and recovery before allowing several deliveries in flight. The current connector attempts to acknowledge after the result loop, including when it exits on timeout or logs a publish error. Define the terminal outcome that permits acknowledgement and the retry behavior for infrastructure failures. Verify that result publishing under concurrent handlers, redelivery after shutdown, and partial results cannot silently lose a submission or corrupt its recorded results. [Current RabbitMQ connector](https://github.com/skkuding/codedang/blob/2528d9cc1/apps/iris/src/connector/rabbitmq/connector.go)

## Consequences

- Under saturation, submissions can spend longer waiting in RabbitMQ. Provisioning for peak demand must consider queue age alongside execution accuracy.
- Dedicated nodes reduce interference from general backend workloads. Compilers, tests, and necessary node services can still share hardware with judge jobs and must be included in mixed-load validation.
- The Kubernetes CP and VM workers introduce a network and lifecycle boundary. Rollout, lost connectivity, and recovery need explicit drain, delivery, and running-job reconciliation tests.

## Future work

- Follow-up work will split submission execution into testcase-level jobs. It must define build artifact reuse, result aggregation, retries, and `StopOnNotAccepted` semantics.
- Follow-up work will introduce a Longhorn-backed shared filesystem. Its design must specify which artifacts are shared, preserve immutable testcase version identity, and measure the effect of shared I/O on judge timing. Production testcase cache selection remains open pending comparison of the node-local PV and Silo proposals. Evaluate how the shared filesystem would coexist with the selected cache and its ownership model. [ADR 0001](./0001-versioned-local-testcase-replication.md), [ADR 0003](./0003-node-local-testcase-pv-coordination.md), [PV PoC](./0005-node-local-pv-testcase-cache-poc.md), [Silo PoC](./0006-cache-versioned-testcases-in-node-local-silo.md), [Longhorn RWX volumes](https://longhorn.io/docs/1.13.0/nodes-and-volumes/volumes/rwx-volumes/)

### Xen-based isolation

Evaluate Xen as the hypervisor for the judge and compile/test VM workers. The Iris CP remains in Kubernetes and reaches each worker over RPC. Xen exposes VM-level resource controls, so separating the VMs lets us observe their hardware resource use independently where the host supports it. Test CPU pools and vCPU pinning alongside LLC and NUMA placement. CPU placement alone can leave shared cache and memory bandwidth contention. Verify CAT and MBM on the target host. codedang8 provides the recorded baseline for application-level bandwidth admission with MBA unavailable. [Xen CPU pools and affinity](https://xenbits.xen.org/docs/4.16-testing/man/xl.1.html), [Xen resource monitoring and allocation](https://xenbits.xenproject.org/docs/4.17-testing/misc/xl-psr.html)

**The Kubernetes Iris CP adjusts each VM's job concurrency in real time** as measured pressure changes. Workers enforce that limit when starting jobs, using goroutines to manage their execution. Lowering the limit pauses new judge starts as needed while in-flight executions finish.

**Keep Xen resource settings fixed across workload mixes.** Use one benchmarked resource profile for the judge VM on each qualified host configuration. It fixes CPU placement and cache allocation for normal operation, with bandwidth allocation included on hardware that supports it. The CP reads host metrics from a service in Xen's management domain (Dom0) while judging is active and uses those metrics to adjust admission. Apply an approved profile change only during a benchmark or scheduled maintenance. The CP pauses new admissions and waits for all in-flight judge executions to exit. The Dom0 service applies the profile through `xl` or `libxl` and confirms the effective settings before the CP resumes admission.

Compare bare-metal Iris with pinned Xen guests on the same host using the same fixtures and limits. Test judge-only traffic and mixed compilation and test bursts. Compare near-limit verdict agreement, both tails of CPU and elapsed-time drift, throughput at comparable accuracy, and the cost of handing artifacts between guests. Use the results to decide whether the added VM boundary is worthwhile.

## Verification

- Compare isolated runs, fixed caps, and dynamic admission on each target node class. Repeat CPU-, cache-, and bandwidth-heavy fixtures alongside submission, rejudge, compilation, and test bursts. Measure CPU time, elapsed time, memory, both tails of timing drift, and near-limit verdict agreement against a same-node isolated baseline.
- With a sustained backlog, switch between compute-heavy and memory-heavy mixes under a fixed execution profile. Verify that dynamic admission uses capacity left idle by the conservative fixed cap during compute-heavy periods and meets the same timing and verdict criteria when memory pressure rises. Compare throughput and queue age at the same accuracy target.
- Measure queue age, end-to-end latency, throughput, in-flight work by class, and collector overhead. Confirm that growing the backlog increases wait time without materially shifting sandbox measurements or verdicts. Agree on acceptance thresholds before rollout.
- Exercise metrics loss and recovery, limits shrinking below active counts, sandbox cancellation, broker reconnects, result publish failures, and VM drain. Include RPC retries, connectivity loss, concurrent CP dispatch, and CP or worker restart. Verify that effective concurrency stays bounded, slots are released only after exit, and legacy queues and message types still follow their intended policies.
- Confirm that the CP runs in Kubernetes and that the judge VM runs outside its worker pool. Check RPC dispatch to VM workers, build-artifact handoff and cleanup, fixed judge resource profiles, and physical isolation from normal backend workloads.

## Links and change history

- [Host-direct CAT experiment and resource measurements](https://github.com/skkuding/iris-load-test-toolset/blob/5ed7488/docs/CAT-DIRECT-AB.md)
- [Full Iris and RabbitMQ benchmark](https://github.com/skkuding/iris-load-test-toolset/blob/dcff9a9/docs/FULL-IRIS-EXTERNAL.md)
- 2026-11-14 — Lee Haesung — Proposed node-local adaptive concurrency for Iris.
- 2026-11-17 — Lee Haesung — Revised the proposal to a Kubernetes CP and RPC VM workers, with CP-managed VM concurrency, fixed CAT allocation, and application-level bandwidth admission on codedang8.
