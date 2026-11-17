---
title: "ADR 0008: Adopt Polygon-style Mandeuldang for problem authoring"
description: "Keep the existing problem authoring flow and add Mandeuldang, where authors upload a Generator, Validator, and Solution, Iris generates and validates testcases, and Owner, Editor, and Reviewer roles collaborate on one problem."
status: proposed
date: "2026-11-17"
owner: "Cho Yunsang"
decision_makers: []
supersedes: []
superseded_by: null
---

# ADR 0008: Adopt Polygon-style Mandeuldang for problem authoring

We keep the existing problem authoring flow and add Mandeuldang. Authors upload a Generator, Validator, and Solution, and Iris generates and validates the testcases. Several people build one problem together with Owner, Editor, and Reviewer roles.

## Context

### Existing problem authoring

Until now, only administrators with permission could create problems in the admin app. A single author writes the statement and uploads testcases one by one or as a zip file (`createTestcases`, `uploadTestcaseZip`). [Testcase resolver](https://github.com/skkuding/codedang/blob/17e4b7eb6/apps/backend/apps/admin/src/problem/resolvers/testcase.resolver.ts)

This approach has the following limits:

- Authors produce inputs and outputs outside the system, and the code used to produce them is not kept.
- Nothing checks that inputs satisfy the problem constraints.
- There are no roles for splitting work on a problem or reviewing it.

### Goals

Mandeuldang moves away from a single author registering a problem alone. It aims to provide an authoring environment where several people write and review a problem together.

- Statement writing, testcase generation and validation, solutions, and collaborator invitations and reviews happen in one flow.
- It targets people who want to try setting problems, people who want to add their own story to a problem they solved, and people who want to keep examples for their classes.

### Benchmarking Polygon

Codeforces [Polygon](https://polygon.codeforces.com/) is a problem authoring tool that builds and validates testcases with tools such as a Generator, Validator, and Solution. Mandeuldang is a reworked version modeled on Polygon.

- Strengths: testcases are easy to produce, authors can check that they cover the constraints and boundary values, and the main solution can be verified.
- Weaknesses: the UI is hard to use and there are too many features.
- Conclusion: we adopt the core Generator → Validator → Solution flow and make the UI much simpler.

This ADR records, after the fact, a decision that is already in progress. It stays `proposed`.

## Decision drivers

- Non-administrators must be able to create problems, and several people must be able to split writing and reviewing by role.
- The code that produces testcases must be kept, and quality must be checkable through input validation and solution runs.
- It must be easier to use than Polygon.
- It must not affect the existing authoring flow or judging used by instructors and administrators.

## Considered options

### Authoring approach

| Option | Benefit | Cost or limitation | Result |
| --- | --- | --- | --- |
| Keep only the existing flow | No additional development | Only administrators can set problems, and there is no collaboration or tool-based generation | Rejected |
| Use external Polygon as is | Uses a proven tool | The UI is hard to use and it has many features | Rejected |
| Merge Mandeuldang into the existing authoring screens and APIs | One screen and one API are more efficient | Problems used by instructors and problems students create casually are very different features, and keeping them apart is safer | Rejected |
| Keep the existing flow and Mandeuldang separate, switching between them with a toggle | No effect on existing users, and authors can choose a flow | Two sets of screens and APIs to maintain | **Accepted** |

### Out of scope

| Item | Decision |
| --- | --- |
| Manual testcase upload | Excluded from Mandeuldang and kept only in the existing flow. Managing `.in`/`.out` files directly is planned for the next phase |
| Checker (special judge) and the problem type modal | Excluded from this phase and planned for the next phase |
| Separate publish approval and review workflow | The approval request model was removed and the Owner publishes directly. Review comments and re-review are planned for the next phase |

## Decision

We keep the existing authoring flow used by instructors and administrators, and **add Polygon-style Mandeuldang separately, switching between the two with a toggle.** Screens and features are separate, but storage reuses the existing `Problem` table with `creationMode = Mandeuldang`.

### Data model: reuse the existing Problem table

A Mandeuldang problem is managed from draft to publication as a single `Problem` record without a separate table. Publishing does not create a new record; only `status` moves through `Draft` → `Ready` → `Published`. [Schema](https://github.com/skkuding/codedang/blob/28b041117/apps/backend/prisma/schema.prisma)

The Mandeuldang-related part of [`schema.prisma`](https://github.com/skkuding/codedang/blob/4afd725fa/apps/backend/prisma/schema.prisma) in [#3715](https://github.com/skkuding/codedang/pull/3715) is shown below. Other fields are omitted as `// ...`.

```prisma
enum ProblemCreationMode {
  Legacy
  Mandeuldang
}

enum ProblemStatus {
  Draft
  Ready
  Published
}

enum ProblemType {
  General
  SpecialJudge
}

model Problem {
  id          Int   @id @default(autoincrement())
  createdBy   User? @relation(fields: [createdById], references: [id], onDelete: SetNull)
  createdById Int?  @map("created_by_id")

  // Creation mode and publication status
  creationMode ProblemCreationMode @default(Legacy) @map("creation_mode")
  status       ProblemStatus       @default(Published)
  lastRunPass  Boolean             @default(false) @map("last_run_pass")
  problemType  ProblemType         @default(General) @map("problem_type")

  title             String
  description       String?
  inputDescription  String? @map("input_description")
  outputDescription String? @map("output_description")
  hint              String?
  // ...
  languages   Language[] @default([])
  timeLimit   Int?       @map("time_limit") // unit: MilliSeconds
  memoryLimit Int?       @map("memory_limit") // unit: MegaBytes
  difficulty  Level?
  source      String?
  // ...
  visibleLockTime DateTime @map("visible_lock_time")
  // ...

  // Mandeuldang relations
  mandeuldangTestFiles     MandeuldangTestFile[]
  mandeuldangSolution      MandeuldangSolution?
  mandeuldangTools         MandeuldangTool[]
  mandeuldangCollaborators MandeuldangCollaborator[]
  mandeuldangRunRequests   MandeuldangRunRequest[]

  @@index([createdById, creationMode, status])
  @@map("problem")
}
```

- **New fields**: `creationMode` (default `Legacy`), `status` (default `Published`), `problemType` (default `General`), `lastRunPass`, and the index `(createdById, creationMode, status)`. Because of the defaults, existing problems remain `Legacy` and `Published` after the migration.
- **Nullable fields**: statement fields (description, input and output descriptions, hint, time and memory limits, difficulty, source) became nullable so they can be empty while a problem is being written. The existing frontend assumes non-null values, so existing APIs use `ProblemWithIsVisible` and Mandeuldang APIs use `MandeuldangProblemOutput` as separate output types.
- **Mandeuldang-only data**: tools, the Solution, test files, collaborators, and run requests live in separate tables linked to `Problem` (cascade on delete). Test files are S3 files, so they were not merged with the existing `ProblemTestcase`, which stores input/output string pairs.
- **Visibility**: a problem being written is created with `visibleLockTime` set to the maximum value to hide it from the client's public list.
- **Edits after publication**: the same record stays `Published`, and only edits that break the publication conditions are rejected.

### Execution pipeline: dedicated RabbitMQ topology and run request tracking

Generators and Validators run asynchronously, and each request's state is tracked with `MandeuldangRunRequest`.

1. The backend creates a run request in `Pending`.
2. The pub service reads the tool and Solution code from S3 and sends it to the request queue of the dedicated exchange `iris.e.direct.mandeuldang`. The messageId is the run request ID.
3. Iris runs the tool and stores generated testcases directly in S3.
4. Iris sends the result to the result queue `iris.q.mandeuldang.result` on the same exchange. The tool kind is identified by the message type.
5. The admin sub service finds the run request by messageId, records its state and result, and saves generated files as `MandeuldangTestFile`. `lastRunPass` is `true` only when the latest run of every registered tool succeeded.

- **Topology**: one dedicated direct exchange `iris.e.direct.mandeuldang` with one request queue (routing key `mandeuldang.request`) and one result queue (`iris.q.mandeuldang.result`, routing key `mandeuldang.result`). Generators and Validators share the queues and are distinguished by message type (`generate`, `validate`). [RabbitMQ constants](https://github.com/skkuding/codedang/blob/28b041117/apps/backend/libs/constants/src/rabbitmq.constants.ts)
- **Separation from judging**: judge results are handled by the client app and Mandeuldang results by the admin app. Sharing the judge queues could send Mandeuldang results to the client app, which has no handler for them, and lose them, so Mandeuldang has its own exchange and queues.

### File storage and delivery to Iris

- Tools, the Solution, and generated test files are stored in the dedicated `mandeuldang` S3 bucket, and the database stores only their path (`filePath`).
- We added a bucket dedicated to Mandeuldang and replaced the buckets hardcoded in each storage method with a parameter.
- Iris receives the source code itself. When the backend sends a request, it reads the code from S3 and puts it in the message. [Pub service](https://github.com/skkuding/codedang/blob/28b041117/apps/backend/apps/admin/src/mandeuldang/mandeuldang-pub.service.ts)
- In the other direction, Iris writes the testcases it generates directly to S3, and the backend records only their keys and sizes.

### Access and the mode toggle

- Mandeuldang is available only in Management > Problem. By design, Client Problem shows only `Published` problems and has no authoring or collaboration screens. However, the current code changes only `status` on publication and leaves `visibleLockTime` as is, so exposing published problems in the client's public list needs separate handling.
- Management > Problem has a toggle to switch between the existing flow and Mandeuldang. The toggle is for general users who prefer the existing flow.
- The list has two tabs: "Problems in progress" (`Draft`, `Ready`) and "My problems" (owned or participating).

### Authoring flow and tools

The authoring order is statement → testcase management → solution → collaborator invitation.

| Tool | Role | Current state |
| --- | --- | --- |
| Generator | Generates testcase inputs (one file, runs asynchronously) | Merged in Iris, backend under review |
| Validator | Checks that inputs satisfy the problem constraints | Merged in Iris, backend under review |
| Solution | Reference solution. Runs to generate testcase outputs and is required for publication | Upload in progress |
| Checker | Special judge | Next phase (Iris already has an execution path) |

Tools are written with testlib.

### Problem state and publication

- `Draft` and `Ready` switch automatically on save depending on whether the publication conditions are met.
- Publishing a `Ready` problem makes it `Published`. Edits to a published problem that break the publication conditions are rejected.
- The publication conditions are a complete statement (title, description, input and output descriptions, time and memory limits, difficulty, at least one language), an existing Solution, and at least one test file. [Publication conditions](https://github.com/skkuding/codedang/blob/28b041117/apps/backend/apps/admin/src/mandeuldang/problem/services/publish-check.service.ts)

### Permissions

- **Owner**: the user who created the problem (`createdById`). An `Approved` Owner collaborator record is also created with the problem, but permissions are decided by `createdById`.
- **Editor**: an approved co-author.
- **Reviewer**: an approved reviewer. Read-only; inputs and run buttons are disabled.
- An invitation from the Owner is `Approved` immediately. An invitation from an Editor is `Pending` until the Owner approves or rejects it.

| Action | Owner | Editor | Reviewer |
| --- | --- | --- | --- |
| View the problem | O | O | O |
| Edit the statement; upload and run tools and solutions | O | O | X |
| Invite collaborators | O | O (Owner approval required) | X |
| Publish, delete | O | X | X |
| Approve or reject invitations, change roles, remove collaborators | O | X | X |

Each API declares its roles with `@UseMandeuldangRoles`, and a single `MandeuldangRolesGuard` checks them. [Role guard](https://github.com/skkuding/codedang/blob/28b041117/apps/backend/apps/admin/src/mandeuldang/auth/mandeuldang-roles.guard.ts), [#3823](https://github.com/skkuding/codedang/pull/3823)

## Consequences

- Positive: non-administrators can create and review problems with separate roles.
- Positive: the tools that produced the testcases stay with the problem, and input validation and an existing solution can be enforced before publication.
- Positive: existing problem data and the existing authoring flow stay as they are.
- Negative: there are two sets of authoring screens and APIs, so there is more code to maintain.
- Negative: user-uploaded code is executed, so run counts and resource limits must be managed.
- Negative: the work spans Iris, S3, and RabbitMQ, so duplicate result messages and failure and retry boundaries must be defined separately.
- Negative: ownership cannot be transferred, and if the Owner's account is deleted, nobody can publish, delete, or approve invitations for the problem.
- Negative: `Problem` statement fields became nullable, so code that handles existing problems must also consider `creationMode` and `status`, and two output types must be maintained.

## Future work

### Remaining work in this phase

1. **Merge the backend stacked PRs**: tool pipeline (#3741) → run requests and S3 (#3742) → result queue (#3743) → schema and queries (#3715) → creation and deletion (#3748) → update and publication (#3752) → collaborators (#3522) → role guard (#3823).
2. **More tests**: add more specs for Mandeuldang.
3. **E2E and operations**: GraphQL → RabbitMQ → Iris → S3 E2E tests, admin bootstrap CI, `schema.gql` drift checks, and review of the Mandeuldang bucket, queue, and IAM settings.
4. **Frontend integration**: replace the mock APIs with the real APIs and reflect the requester's role, received from the backend, on screen.

### Next phase

- Checker (special judge) and the problem type modal
- Reviewer uploads of review solutions and error reproduction code
- Review comments, review state, and re-review request workflow
- A public collaboration page where general users can request to collaborate

## Verification

- Confirm that a Mandeuldang problem cannot be published unless it meets the publication conditions (statement, Solution, test files).
- In review, confirm that every API in the Mandeuldang resolvers declares `@UseMandeuldangRoles`. The guard tests check the allowed roles for each API and the allow and deny behavior for each collaboration state. [Guard tests](https://github.com/skkuding/codedang/blob/28b041117/apps/backend/apps/admin/src/mandeuldang/auth/mandeuldang-roles.guard.spec.ts)
- Confirm that Generator and Validator results are recorded in `MandeuldangRunRequest`, and that the cause is kept on failure.

## Links and change history

- Related PRs
  - [#3425](https://github.com/skkuding/codedang/pull/3425) Initial backend Polygon setup
  - [#3495](https://github.com/skkuding/codedang/pull/3495) Iris Generator and Validator execution paths
  - [#3522](https://github.com/skkuding/codedang/pull/3522) Collaborator API
  - [#3715](https://github.com/skkuding/codedang/pull/3715) Mandeuldang problem schema and queries
  - [#3741](https://github.com/skkuding/codedang/pull/3741) Tool pipeline and renaming
  - [#3742](https://github.com/skkuding/codedang/pull/3742) Run requests and S3
  - [#3743](https://github.com/skkuding/codedang/pull/3743) Result queue
  - [#3748](https://github.com/skkuding/codedang/pull/3748) Problem creation and deletion
  - [#3752](https://github.com/skkuding/codedang/pull/3752) Problem update and publication
  - [#3823](https://github.com/skkuding/codedang/pull/3823) Role-based authorization guard
  - [#3840](https://github.com/skkuding/codedang/pull/3840) Frontend Mandeuldang problem list tabs
  - [#3865](https://github.com/skkuding/codedang/pull/3865) Frontend Input tab
- Team Notion (internal)
  - [Mandeuldang planning document](https://app.notion.com/p/37eef9cff54580fb92fecbe8eb060f76)
  - [Feature and policy specification](https://app.notion.com/p/37eef9cff54580a0bb5cc7d41fc0bb76)
  - [Backend architecture v2](https://app.notion.com/p/3e4ef9cff545806da8c6f688b8a3ece7)
  - Meeting notes: [2026-01-14 Polygon review](https://app.notion.com/p/2ebef9cff54580c18110df8a9337853d), [2026-01-21 UI draft comparison](https://app.notion.com/p/2ebef9cff54580eaa631d6024fa43d50), [2026-06-30 Separation from the existing flow](https://app.notion.com/p/384ef9cff5458082936acb0393620658), [2026-08-21 Mode toggle](https://app.notion.com/p/3c2ef9cff545802382d2fb81e4cc9ab6)
- External references
  - [Codeforces Polygon](https://polygon.codeforces.com/): Codeforces's problem authoring platform.
  - [testlib](https://github.com/MikeMirzayanov/testlib): the C++ library used to write Polygon tools.
- 2026-11-17 — Cho Yunsang — Proposed this ADR to record the in-progress Mandeuldang adoption decision.
