---
title: "ADR 0002: Select testcase I/O only when requested"
description: "Use GraphQL field selection to avoid reading testcase input and output columns for metadata-only requests."
status: accepted
date: "2026-10-27"
owner: "Lee Haesung"
decision_makers:
  - "Lee Haesung"
  - "lukekeum"
supersedes: []
superseded_by: null
---

# ADR 0002: Select testcase I/O only when requested

## Context

The admin GraphQL `Problem.testcase` resolver previously selected `input` and `output` from PostgreSQL for every testcase request, including requests for only IDs, ordering, visibility, or scoring metadata. Large values may be stored out of line with PostgreSQL TOAST, making an unnecessary read and serialization costly.

The [implementation PR](https://github.com/skkuding/codedang/pull/3834) measured one problem with 51 active testcases, including 40 out-of-line inputs and 30 out-of-line outputs. In one PostgreSQL 18.4 `EXPLAIN (ANALYZE, BUFFERS, SERIALIZE TEXT)` comparison, the metadata-only query took 0.152 ms to execute and returned 2 kB, while the query including I/O took 123.564 ms and returned 35,877 kB. These are single-query observations and exclude network transfer; they do not establish a general latency improvement for every query.

## Decision drivers

- Avoid fetching and serializing large testcase bodies when the GraphQL caller asks only for metadata.
- Preserve the existing `Problem.testcase` schema and responses for callers that request I/O.
- Respect aliases, fragments, and conditional directives when determining the selected fields.
- Preserve the existing rule that ZIP-uploaded testcase I/O is not read from database columns.

## Considered options

| Option | Benefit | Cost or limitation |
| --- | --- | --- |
| Always select `input` and `output` | Simple and preserves current query behavior | Metadata-only requests still read large values. |
| Add a separate metadata resolver or schema field | Makes the cheaper access path explicit | Adds another API path and requires callers to migrate. |
| Inspect the current GraphQL selection and conditionally select I/O | Keeps the API stable and avoids the columns when unused | Adds selection parsing and requires tests for GraphQL selection semantics. **Selected.** |

## Decision

The admin `Problem.testcase` resolver checks whether either `input` or `output` is selected as an immediate child field. It uses `graphql-parse-resolve-info` through the shared `hasSelectedField` helper, which handles aliases, named and inline fragments, repeated fields, and `@skip`/`@include` directives. If selection parsing fails, the helper conservatively includes I/O to preserve the requested response.

The resolver passes that result to `TestcaseService.getProblemTestcases`. The service omits both columns from its Prisma `select` for metadata-only requests. When either field is requested, it selects both columns for testcases whose I/O is stored in the database. The existing sample and hidden ZIP flags continue to suppress database I/O selection for their respective testcase groups. The service defaults to including I/O for callers that do not pass the new argument.

## Consequences

- Metadata-only callers avoid unnecessary PostgreSQL I/O column reads and serialization.
- Callers requesting either `input` or `output` still fetch both columns; the query is not optimized per individual I/O field.
- Selection parsing adds a backend dependency and a small amount of resolver work.

## Verification

The implementation includes tests for direct fields, aliases, fragments, conditional directives, repeated fields, abstract return types, resolver forwarding, and Prisma selection under all sample and hidden ZIP flag combinations. The PR reported passing backend typecheck and ESLint. Its unit tests could not run locally because native modules failed to load, so the test suite's runtime result was not established in that PR.

## Links and change history

- [Codedang PR #3834: Skip unrequested testcase I/O columns](https://github.com/skkuding/codedang/pull/3834)
- [Implementation commit `e4bf6c7`](https://github.com/skkuding/codedang/commit/e4bf6c76622b70a13eda03cbb5249d0eb60b7a8c)
- 2026-10-27 — Lee Haesung — Implementation approved by lukekeum and merged.
- 2026-10-29 — Lee Haesung — Recorded the implemented decision in this ADR.
