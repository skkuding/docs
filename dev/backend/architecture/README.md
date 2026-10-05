---
title: Backend Architecture Decision Records
description: How the Codedang backend team records and reviews significant architecture decisions.
---

# Backend Architecture Decision Records

This directory is the Codedang backend team's decision log. An architecture decision record (ADR) captures a significant backend choice, the circumstances that led to it, the alternatives considered, and its expected consequences. Read the ADRs to understand **why** the backend took a direction; use the relevant ADRs during backend design and code review. These records apply to the backend team and its owned systems, not to frontend or infrastructure decisions outside backend ownership.

## When to write an ADR

Write one when a decision has a lasting effect on the backend or the way the backend team builds it. Examples include:

- Backend structure and boundaries, such as service ownership or data flow.
- Quality requirements, such as security, availability, performance, or recovery.
- Backend dependencies and interfaces, including APIs and published contracts.
- Backend construction choices, such as major libraries, frameworks, deployment methods, and development processes.

Start with the next meaningful change. An ADR need not describe every implementation detail, and an existing decision need not be reconstructed without useful evidence. For a small local change with no lasting architectural impact, ordinary code and pull request documentation is enough.

## Create a record

1. Copy [template.md](./template.md) to `NNNN-short-decision-title.md` in this directory. Use the next unused four-digit number; keep the filename stable after publication. For example, `0002-example-decision.md` illustrates the filename format, not an actual decision.
2. Fill in the YAML properties and replace every placeholder. Give the ADR a concise, action-oriented title. Set `status: proposed`, and identify an owner. Use an ISO 8601 date (`YYYY-MM-DD`).
3. Describe the problem and constraints, list credible options, and explain why the chosen option best meets the decision drivers. State the decision directly (for example, “We use …”). Record both benefits and costs, including any known risks or migration work.
4. Open a pull request for backend team review before the decision is implemented or treated as settled. Ask affected stakeholders, including other teams when an interface crosses a team boundary, to review it. Revise the proposal until the backend team accepts or rejects it, and record the reason if rejected.
5. Add the proposal to the [decision log](#decision-log). When the review concludes, set `status: accepted` or `status: rejected`, record the decision date and reviewers or decision makers, and update the log entry. Keep the rejection reason in a rejected ADR. Link accepted ADRs from relevant implementation or review discussions.

Any backend team member can propose an ADR. The owner coordinates feedback and keeps a proposed record current. A useful ADR is short enough to review but detailed enough for a future backend contributor to understand the tradeoffs without replaying the discussion.

## Status and changes

| Status | Meaning |
| --- | --- |
| `proposed` | Open for review; its content may change. |
| `accepted` | The backend team adopted the decision. |
| `rejected` | The backend team considered and declined the proposal; retain the reason. |
| `superseded` | A later accepted ADR replaces this decision. |

Preserve accepted and rejected records as a history of the backend team's reasoning. If a decision changes, write a new ADR, link both records, and mark the old one `superseded` after the new one is accepted. Updating the old record's status and `superseded_by` property is a bookkeeping exception; do not rewrite its original rationale. Keep a dated change history with the responsible person in the new ADR.

During backend code review, cite the relevant accepted ADR when checking whether a change follows the agreed direction. If existing backend code differs, describe the gap and resolve it through an appropriate implementation change or tracked follow-up work.

## Decision log

Add each new ADR here in number order. Keep rejected and superseded records visible so earlier reasoning remains discoverable.

| ADR | Decision | Status |
| --- | --- | --- |
| [0001](./0001-versioned-local-testcase-replication.md) | Versioned local testcase replication for judging | `proposed` |

## References

This process and template draw on these references:

- [Architectural Decision Records](https://adr.github.io/) — definitions, motivation, and further reading.
- [AWS Prescriptive Guidance: Introduction](https://docs.aws.amazon.com/prescriptive-guidance/latest/architectural-decision-records/introduction.html) — why teams use ADRs; see also the [process](https://docs.aws.amazon.com/prescriptive-guidance/latest/architectural-decision-records/adr-process.html), [best practices](https://docs.aws.amazon.com/prescriptive-guidance/latest/architectural-decision-records/best-practices.html), [FAQ](https://docs.aws.amazon.com/prescriptive-guidance/latest/architectural-decision-records/faq.html), [example ADR](https://docs.aws.amazon.com/prescriptive-guidance/latest/architectural-decision-records/appendix.html), and [further resources](https://docs.aws.amazon.com/prescriptive-guidance/latest/architectural-decision-records/resources.html).
- [ADR template catalog](https://adr.github.io/adr-templates/) and [MADR's full template](https://github.com/adr/madr/blob/4.0.0/template/adr-template.md) — approaches to documenting options and tradeoffs.
- [Documenting Architecture Decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions) — Michael Nygard's original ADR format.
