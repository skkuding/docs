---
title: "ADR 0011: Separate judge request queues by workload"
description: "Route submission judging, test runs, and rejudges to their own RabbitMQ request queues, each consumed by a separate Iris worker pool, while keeping one shared result queue and a fallback to the former single queue."
status: proposed
date: "2026-11-24"
owner: "Jo Hanjun"
decision_makers: []
supersedes: []
superseded_by: null
---

# ADR 0011: Separate judge request queues by workload

We route judge requests to three request queues by workload (submission, test, and rejudge) and run a separate Iris worker pool for each queue. Results still go to one shared result queue. Deployments that do not configure the new routing keys keep the former single-queue behavior.

This ADR records, after the fact, a decision that was implemented in [#3724](https://github.com/skkuding/codedang/pull/3724) and [#3723](https://github.com/skkuding/codedang/pull/3723) (merged 2026-09-13). Those pull requests describe the change but not the problem that led to it. Statements marked **Unconfirmed** are inferred from the code and manifests and need confirmation in review, especially from the authors of #3723 and #3724. It stays `proposed` until then.

## Context

### Before the split

The client API published every judge request to one queue through one routing key, and Iris consumed that queue.

| Request | Routing key | Queue | Consumer |
| --- | --- | --- | --- |
| Submission judging, test runs (run, user testcase), and rejudges | `judge.submission` | `client.q.judge.submission` | `iris` (20 replicas in production) |

- **Message priority**: since [#2305](https://github.com/skkuding/codedang/pull/2305) (TAS-1165), the backend sets a priority on each message: 3 for submission judging, 2 for test runs, and 1 for rejudges. [Priority calculation](https://github.com/skkuding/codedang/blob/463722f215c0589fcbcc065558906f4ed366be70/apps/backend/libs/amqp/src/amqp.service.ts#L149-L169)
- **Priority is not enabled on the deployed queue**: RabbitMQ applies message priority only to a queue declared with `x-max-priority`. The local setup script declares the submission queue with `x-max-priority: 3`, but the Kubernetes `Queue` resource for `client.q.judge.submission` declares no arguments. Based on the manifests, priority has no effect in stage and production. The live broker was not inspected. [Local script](https://github.com/skkuding/codedang/blob/f0a8c056511aad5ce7f894435d6f4d13ad11ff76/scripts/init-rabbitmq.ts#L39-L73), [Queue resource](https://github.com/skkuding/codedang/blob/f0a8c056511aad5ce7f894435d6f4d13ad11ff76/infra/k8s/rabbitmq/topology/base/topology-judging.yaml#L18-L32)
- **Each worker handles one message at a time**: the Iris consumer uses a prefetch count of 1 and acks a message only after it is handled. [Consumer](https://github.com/skkuding/codedang/blob/f0a8c056511aad5ce7f894435d6f4d13ad11ff76/apps/iris/src/connector/rabbitmq/consumer.go#L55-L70)

As a result, every request waited in the same first-in, first-out queue for the same workers. A burst of test runs, or a rejudge of many submissions, sat ahead of submissions that arrived after it.

### Problem being solved (Unconfirmed)

Submission judging, which students wait on during contests and assignments, could be delayed by test runs and rejudges that share its queue and workers. Message priority was meant to prevent this, but it was not enabled on the deployed queue. Even when enabled, priority only reorders waiting messages; it does not keep workers free for submissions once they have taken other work.

## Decision drivers

- (Unconfirmed) Test runs and rejudges must not delay submission judging.
- The capacity for each workload can be changed on its own.
- Deployments and local setups that have not set the new configuration keep working unchanged. (#3724)
- Iris stays one image; the queue a worker consumes is chosen by configuration. (#3723)

## Considered options

The pull requests do not record which alternatives were evaluated. The table lists the credible options; the results of the options other than the accepted one are not recorded.

| Option | Benefit | Cost or limitation | Result |
| --- | --- | --- | --- |
| Keep one queue and rely on message priority | No new queues or deployments | Needs `x-max-priority` on the queue, and RabbitMQ does not allow changing queue arguments on an existing queue, so the queue must be deleted and declared again. Priority only reorders waiting messages, so long test or rejudge runs still occupy workers | Not chosen (reason not recorded) |
| Keep one queue and add more Iris replicas | No routing change | All workloads still share one backlog, so a burst of tests or rejudges still delays submissions | Not chosen (reason not recorded) |
| One queue per workload, each with its own Iris worker pool | Workloads are isolated, and each pool is sized on its own | More queues, bindings, and deployments to maintain. Small pools can become the bottleneck for their workload | **Accepted** |

### Out of scope

| Item | Decision |
| --- | --- |
| Sandbox hardening | The new deployments keep the existing privileged, cgroup-mounted Iris sandbox. Removing that capability needs a separately validated design. (#3723) |
| Separate result queues | All workloads keep publishing to the shared result queue. |
| Removing message priority | The backend still sets priority on every message. |

## Decision

We route judge requests to **three durable request queues on the existing direct exchange `iris.e.direct.judge`, one per workload, and run a separate Iris deployment for each queue.** Results go to the shared result queue as before.

### Routing

The backend chooses the routing key from the request. [Routing key selection](https://github.com/skkuding/codedang/blob/463722f215c0589fcbcc065558906f4ed366be70/apps/backend/libs/amqp/src/amqp.service.ts)

| Workload | Requests | Routing key | Queue | Iris deployment | Replicas (production) |
| --- | --- | --- | --- | --- | --- |
| Submission | Submission judging | `judge.submission` | `client.q.judge.submission` | `iris` | 20 |
| Test | Test runs and user testcase runs | `judge.test` | `client.q.judge.test` | `iris-test` | 1 |
| Rejudge | Rejudges | `judge.rejudge` | `client.q.judge.rejudge` | `iris-rejudge` | 1 |

The stage overlay reduces `iris` to 2 replicas. Each Iris pod requests and is limited to 1 CPU and 1.5 GiB of memory. [Queues and bindings](https://github.com/skkuding/codedang/blob/00776000fcf112981b9c5622533cc4b97600edb9/infra/k8s/rabbitmq/topology/base/topology-judging.yaml), [Test deployment](https://github.com/skkuding/codedang/blob/00776000fcf112981b9c5622533cc4b97600edb9/infra/k8s/iris/base/deployment-test.yaml), [Rejudge deployment](https://github.com/skkuding/codedang/blob/00776000fcf112981b9c5622533cc4b97600edb9/infra/k8s/iris/base/deployment-rejudge.yaml)

### Configuration contract

- **Backend**: `SUBMISSION_KEY`, `TEST_KEY`, and `REJUDGE_KEY` set the routing key for each workload. Each key falls back to `JUDGE_SUBMISSION_ROUTING_KEY`, then to `judge.submission`.
- **Iris**: `JUDGE_REQUEST_CONSUMER_CONNECTION_NAME`, `JUDGE_REQUEST_QUEUE_NAME`, and `JUDGE_REQUEST_CONSUMER_TAG` choose the queue a worker consumes. `JUDGE_RESULT_*` sets where it publishes results. These replaced the former submission-specific names such as `JUDGE_SUBMISSION_QUEUE_NAME`.

### Single-queue fallback

If a deployment leaves the new keys unset, or sets them equal to the submission key, every request goes to the submission queue as before, and only the submission worker is needed. Local setup for both modes is documented in [`apps/iris/README.md`](https://github.com/skkuding/codedang/blob/f0a8c056511aad5ce7f894435d6f4d13ad11ff76/apps/iris/README.md).

## Consequences

- **Positive**: Test runs and rejudges no longer wait ahead of submissions in the submission queue. The capacity for each workload is set by the replica count of its deployment.
- **Negative**: The test and rejudge pools have one replica each, and each worker handles one message at a time. A large rejudge is processed one submission at a time, and if that pod stops, its workload waits until the pod is back.
- **Negative**: There are three deployments, three queues, and three bindings to keep consistent across the backend configuration, the RabbitMQ topology, and the Iris manifests.
- **Negative**: The backend still sets message priority, but no deployed queue enables it. The code suggests an ordering that does not happen.
- **Negative**: Iris does not resume consuming when its queue is deleted and declared again, which can happen when a `Queue` resource is recreated. Its consumers stay idle without restarting (reproduced locally on 2026-11-23). This is tracked separately.
- **Follow-up**: Decide whether to remove message priority or enable it on the queues. Size the test and rejudge pools from measured load. Alert on the depth and consumer count of each request queue.

## Verification

- Backend routing is covered by `amqp.service.spec.ts` for configured keys, legacy-only configuration, and unset configuration. [Tests](https://github.com/skkuding/codedang/blob/463722f215c0589fcbcc065558906f4ed366be70/apps/backend/libs/amqp/src/amqp.service.spec.ts)
- `topology-judging.yaml` declares the three request queues and their bindings, and `infra/k8s/iris/base` has one deployment for each queue.
- In the RabbitMQ management UI, each request queue has consumers from its own pool only.
- A change that adds a judge workload or moves one to another queue updates the routing table in this ADR.

## Links and change history

- Related pull requests: [#2305](https://github.com/skkuding/codedang/pull/2305) (message priority), [#3724](https://github.com/skkuding/codedang/pull/3724) (routing keys), [#3723](https://github.com/skkuding/codedang/pull/3723) (queues and worker pools)
- Related ADRs: [ADR 0007](./0007-adapt-iris-judge-concurrency.md) evaluates running submission judging and rejudges apart from compilation and tests in separate VMs.
- 2026-09-13 — lshtar13 — Implemented the queue separation in #3724 and #3723.
- 2026-11-24 — Jo Hanjun — Proposed this ADR as an after-the-fact record.
