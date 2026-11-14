---
title: "ADR 0007: Adapt Iris judge concurrency to node contention"
description: "Use one Iris process per dedicated judge node to adjust execution concurrency from runtime measurements while keeping RabbitMQ queues as the backlog."
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

Codedang already routes submissions, tests, and rejudges to separate RabbitMQ request queues, with separate Iris deployments and a shared result route. Each Iris process subscribes to one request queue with manual acknowledgements and prefetch 1. A judge request covers one submission for a problem. Its handler walks the testcases sequentially and emits testcase results and a submission summary. [Workload routing change](https://github.com/skkuding/codedang/pull/3724), [worker pool deployment change](https://github.com/skkuding/codedang/pull/3723), [RabbitMQ consumer](https://github.com/skkuding/codedang/blob/2528d9cc1/apps/iris/src/connector/rabbitmq/consumer.go), [judge handler](https://github.com/skkuding/codedang/blob/2528d9cc1/apps/iris/src/handler/judge/task.go)

The compiler and runner share the `judger` sandbox implementation. The current compiler invokes the compiler binary directly with `exec.CommandContext` and a deadline. The runner invokes the libjudger executable. A submission can involve more than one build unit, with setup currently performed concurrently. The interference policy needs to distinguish build processes from executions whose resource measurements contribute to a verdict. [Compiler](https://github.com/skkuding/codedang/blob/2528d9cc1/apps/iris/src/service/sandbox/judger/compiler.go), [runner](https://github.com/skkuding/codedang/blob/2528d9cc1/apps/iris/src/service/sandbox/judger/runner.go), [task runner](https://github.com/skkuding/codedang/blob/2528d9cc1/apps/iris/src/handler/runner.go)

## Decision drivers

- Keep execution measurements and near-limit verdicts reproducible under load.
- Use available capacity when node conditions allow and keep excess demand in RabbitMQ.
- Preserve the request routing, execution limits, and result contracts for existing callers.
- Give one Iris process control over work competing for the same judge node's resources.

## Considered options

| Option | Benefit | Cost or limitation |
| --- | --- | --- |
| Keep separate Iris replicas per workload | Reuses the current deployment and queue topology | Each process sees only its own work. Co-located processes can interfere without a shared limit. |
| Use one Iris process with a fixed concurrency cap per node | Simple to operate and provides a baseline and fallback | A fixed cap safe for memory-heavy mixes can leave capacity idle during lighter mixes. |
| Use one Iris process per node with runtime-based concurrency limits | Adapts to changes in workload mix and contention while retaining a calibrated ceiling | Requires reliable measurements, bounded buffering, and validation of the control policy. **Proposed.** |

## Decision

Run **one active Iris process on each dedicated judge node**. Use node selection and taints to separate judge nodes from general backend workloads, including during migration. Separate RabbitMQ consumers within the process retain the submission, test, and rejudge queues and feed a common node-level controller. A Kubernetes DaemonSet targeting judge nodes is a deployment candidate. Rollout must drain the old consumer and its running tasks before its replacement takes ownership on the same node. [Kubernetes DaemonSet](https://kubernetes.io/docs/concepts/workloads/controllers/daemonset/)

### Execution policy

| Work | Node-level policy | Execution limits |
| --- | --- | --- |
| Submission and rejudge execution | Share the pool of dynamically limited judge goroutines. Both require reproducible resource measurements. Preserve separate queue identities and make arbitration across them explicit. | Preserve the existing sandbox and problem limits. |
| Compilation and build setup | Bound concurrent builds with a separate budget. Account for actual compiler processes, including parallel build units within a request. Reduce or defer build starts when mixed load would destabilize judging. | Preserve compiler deadlines and existing failure handling. |
| Test execution (`run`, `userTestCase`) | Exempt test execution from the accuracy-oriented judge pool. Keep test intake and execution bounded separately and include their pressure in the node policy when they share judge hardware. | Preserve the current sandbox limits and response fields. |

`run` and `userTestCase` already use the test routing key, require positive time and memory limits, and execute with the configured CPU and memory limits and a real-time limit derived by the runner. Their response includes measured resource usage. The exemption applies to judge admission. Authoring workloads such as `generate` and `validate` need an explicit classification if the node consumes them. [Backend AMQP routing](https://github.com/skkuding/codedang/blob/2528d9cc1/apps/backend/libs/amqp/src/amqp.service.ts), [test request and result model](https://github.com/skkuding/codedang/blob/2528d9cc1/apps/iris/src/handler/run/models.go), [sandbox runner](https://github.com/skkuding/codedang/blob/2528d9cc1/apps/iris/src/service/sandbox/judger/runner.go)

### Runtime measurement and admission

Run lightweight collectors alongside the workers. Sample LLC occupancy, memory bandwidth, cache-miss or eviction indicators for cache pollution, and scheduler pressure such as runnable wait or context switches. Interpret these signals together with execution-time variation and active work by class. LLC occupancy describes cache use. A change in occupancy alone cannot establish harmful eviction or explain a timing shift. Use host capabilities to choose the available counters and evaluate interference by LLC or NUMA domain where placement and attribution are supported. [Linux resctrl](https://docs.kernel.org/filesystems/resctrl.html), [Linux scheduler statistics](https://docs.kernel.org/scheduler/sched-stats.html)

The controller starts with a conservative, benchmarked cap. It reduces new admissions when pressure persists and increases concurrency gradually after sustained recovery, up to a cap validated for the node and workload mix. If required metrics are stale, unavailable, or unsupported, fall back to a validated fixed cap. Establish safe capacity before admitting measured work on a new node class. Choose the collectors, sampling interval, thresholds, and recovery windows through measurement, including the collectors' own overhead.

Scale the number of active judge workers within Iris using goroutines. Gate entry to the judge phase before launching the measured subprocess and count the slot until that process has exited, including on error or cancellation. Reducing the target lets running work drain while pausing new starts. The current submission-level request and sequential testcase loop remain the unit of dispatch. Track queue and admission delays separately from the timing reported by the sandbox.

### RabbitMQ backpressure and delivery

Keep per-queue prefetch and the total number of locally staged deliveries finite. Size intake for the compilation and execution phases so a full downstream stage limits further intake and pending work stays primarily in RabbitMQ. Prefetch limits unacknowledged messages. The node controller limits running subprocess work, including work whose request may have timed out. [RabbitMQ acknowledgements and prefetch](https://www.rabbitmq.com/docs/confirms)

Review acknowledgement and recovery before allowing several deliveries in flight. The current connector attempts to acknowledge after the result loop, including when it exits on timeout or logs a publish error. Define the terminal outcome that permits acknowledgement and the retry behavior for infrastructure failures. Verify that result publishing under concurrent handlers, redelivery after shutdown, and partial results cannot silently lose a submission or corrupt its recorded results. [Current RabbitMQ connector](https://github.com/skkuding/codedang/blob/2528d9cc1/apps/iris/src/connector/rabbitmq/connector.go)

## Consequences

- Under saturation, submissions can spend longer waiting in RabbitMQ. Provisioning for peak demand must consider queue age alongside execution accuracy.
- Dedicated nodes reduce interference from general backend workloads. Compilers, tests, and necessary node services can still share hardware with judge jobs and must be included in mixed-load validation.
- A single Iris process provides one owner for each node's execution budget. Its restart temporarily removes that node's capacity, so rollout and recovery need explicit drain and delivery tests.

## Future work

- Follow-up work will split submission execution into testcase-level jobs. It must define build artifact reuse, result aggregation, retries, and `StopOnNotAccepted` semantics.
- Follow-up work will introduce a Longhorn-backed shared filesystem. Its design must specify which artifacts are shared, preserve immutable testcase version identity, and measure the effect of shared I/O on judge timing. Production testcase cache selection remains open pending comparison of the node-local PV and Silo proposals. Evaluate how the shared filesystem would coexist with the selected cache and its ownership model. [ADR 0001](./0001-versioned-local-testcase-replication.md), [ADR 0003](./0003-node-local-testcase-pv-coordination.md), [PV PoC](./0005-node-local-pv-testcase-cache-poc.md), [Silo PoC](./0006-cache-versioned-testcases-in-node-local-silo.md), [Longhorn RWX volumes](https://longhorn.io/docs/1.13.0/nodes-and-volumes/volumes/rwx-volumes/)

### Xen-based isolation

Evaluate Xen on a dedicated judge host with separate guests for measured judge execution and for compilation and tests. Xen exposes VM-level resource controls, so separating these guests lets us observe their hardware resource use independently where the host supports it. Test CPU pools and vCPU pinning alongside LLC and NUMA placement. CPU placement alone can leave shared cache and memory bandwidth contention. Check the target host for LLC occupancy and memory bandwidth monitoring, cache allocation (CAT), and memory bandwidth allocation (MBA). Guest separation also requires an explicit handoff for compiled artifacts and their lifetimes. [Xen CPU pools and affinity](https://xenbits.xen.org/docs/4.16-testing/man/xl.1.html), [Xen resource monitoring and allocation](https://xenbits.xenproject.org/docs/4.17-testing/misc/xl-psr.html)

Keep one Go Iris process in charge of admission per physical judge host. For the Xen PoC, have Iris obtain host metrics and request approved placement or allocation changes through a small service in Xen's management domain (Dom0), backed by `xl` or `libxl`. Iris adjusts the number of jobs it starts as pressure changes. Apply changes to the measured guest's CPU placement or cache and bandwidth allocations between measurement windows so each run sees a fixed configuration.

Compare bare-metal Iris with pinned Xen guests on the same host using the same fixtures and limits. Test judge-only traffic and mixed compilation and test bursts. Compare near-limit verdict agreement, both tails of CPU and elapsed-time drift, throughput at comparable accuracy, and the cost of handing artifacts between guests. Use the results to decide whether the added VM boundary is worthwhile.

## Verification

- Compare isolated runs, fixed caps, and dynamic admission on each target node class. Repeat CPU-, cache-, and bandwidth-heavy fixtures alongside submission, rejudge, compilation, and test bursts. Measure CPU time, elapsed time, memory, both tails of timing drift, and near-limit verdict agreement against a same-node isolated baseline.
- Measure queue age, end-to-end latency, throughput, in-flight work by class, and collector overhead. Confirm that growing the backlog increases wait time without materially shifting sandbox measurements or verdicts. Agree on acceptance thresholds before rollout.
- Exercise metrics loss and recovery, limits shrinking below active counts, sandbox cancellation, broker reconnects, result publish failures, and node drain. Verify that effective concurrency stays bounded, slots are released only after exit, and legacy queues and message types still follow their intended policies.
- Confirm one active Iris process per judge node throughout deployment and rollback. Check that normal backend workloads are scheduled on separate nodes.

## Links and change history

- [Host-direct CAT experiment and resource measurements](https://github.com/skkuding/iris-load-test-toolset/blob/5ed7488/docs/CAT-DIRECT-AB.md)
- [Full Iris and RabbitMQ benchmark](https://github.com/skkuding/iris-load-test-toolset/blob/dcff9a9/docs/FULL-IRIS-EXTERNAL.md)
- 2026-11-14 — Lee Haesung — Proposed node-local adaptive concurrency for Iris.
