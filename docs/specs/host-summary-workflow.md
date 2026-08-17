# Host Summary Workflow

Suggested issue title: Deepen the host summary workflow

Suggested label: `ready-for-agent`

## Problem Statement

The host summary experience currently spreads the active summary lifecycle across a large React hook, browser stores, persistence operations, summary generation, and presentation helpers. This makes race conditions, partial persistence, refresh behavior, and new-round transitions difficult to reason about and test. It also allows timing-dependent behavior, such as a summary being generated from only the first guest entry while more entries are arriving.

## Solution

Create a framework-independent host summary workflow as the deep module behind a thin React adapter. The workflow owns the active summary lifecycle for a host room: loading, first generation, retry, refresh, pending entries, history writes, and beginning a new round. It uses a captured entry snapshot for each generation, preserves the last known good active summary on failure, serializes operations, and rejects stale completions.

Keep persistence, summary generation, and current-room entry access behind adapters. The host UI receives a small render-ready view with lifecycle status, summary cards, counts, pending entries, errors, action availability, and user intents.

The same implementation slice includes the tightly coupled guest behavior: one submission per guest per round, persisted guest state as authority, clear disabled-input messaging, and reset only after a completed new-round transition.

## User Stories

1. As a host, I want the first summary to generate when I open Summary with entries available, so that guest submissions do not trigger unexpected generation.
2. As a host, I want the first summary to include all entries available when Summary opens, so that it does not summarize only the first arriving entry.
3. As a host, I want a ready active summary to remain stable, so that it does not change while I am reviewing it.
4. As a host, I want to refresh the summary explicitly, so that I control when late entries are incorporated.
5. As a host, I want entries submitted during refresh to remain pending, so that the UI does not imply they were included.
6. As a host, I want to see how many entries are pending since the active summary snapshot, so that I can decide whether to refresh again.
7. As a host, I want refresh to use a captured entry snapshot, so that the summary has a clear and reproducible input set.
8. As a host, I want a failed generation to preserve the last known good summary, so that an error does not erase usable output.
9. As a host, I want a failed refresh not to create a history entry, so that history contains completed snapshots rather than attempts.
10. As a host, I want a successful refresh to archive the replaced snapshot exactly once, so that retry behavior cannot duplicate history.
11. As a host, I want partial persistence failures to be retryable, so that an incomplete write does not require a different generation.
12. As a host, I want a summary to become ready only after entry group assignments and the active snapshot are persisted, so that the visible result is coherent.
13. As a host, I want only one summary lifecycle operation active at a time, so that refresh, retry, and new-round actions cannot reorder writes.
14. As a host, I want operations from a previous room or round ignored, so that stale asynchronous work cannot update the current room.
15. As a host, I want to load the active summary from durable persistence after a remount or reload, so that browser state is not a second source of truth.
16. As a host, I want to start a new round only after a ready active summary exists, so that an unsummarized round is not silently discarded.
17. As a host, I want starting a new round to archive the current summary, clear active entries, and reset guest allowances together, so that the new round starts coherently.
18. As a host, I want a failed new-round transition to preserve the old state, so that guests are not released into a partially reset round.
19. As a host, I want summary history to distinguish snapshots created by refresh from snapshots created by completing a round, so that history has precise meaning.
20. As a host, I want each room to retain only the newest 20 summary snapshots, so that history does not grow without limit in the room record.
21. As a host, I want a small render-ready view, so that the UI does not know about stores, room identifiers, operation tokens, or persistence details.
22. As a guest, I want to submit one entry per round, so that my contribution is not duplicated.
23. As a guest, I want the input disabled with clear copy after submitting, so that I understand why I cannot submit again.
24. As a guest, I want my submission allowance reset only when the host starts a new round, so that a ready summary does not unexpectedly reopen or close my allowance.
25. As a guest, I want persisted guest state to decide whether I have submitted, so that multiple tabs and stale clients cannot bypass the rule.

## Implementation Decisions

- The host summary lifecycle is a framework-independent module behind a single primary seam.
- A thin React adapter observes room and entry state, invokes lifecycle actions, and exposes the render-ready view.
- The workflow owns loading, first generation, retry, refresh, pending-entry calculation, history writes, and new-round transition.
- Summary history browsing remains a separate read module; the lifecycle owns archival writes but not the history modal’s read interaction.
- The workflow exposes status, render-ready groups and summary cards, current entry count, pending-entry count, errors, action availability, and user intents.
- Room identifiers, store setters, persistence details, operation tokens, and adapters remain behind the seam.
- First generation begins when the host opens Summary with entries available. Guest submissions do not start generation directly.
- A ready active summary is stable until the host explicitly selects Refresh summary.
- Each generation captures the current round’s entries at operation start. Entries submitted during generation remain pending.
- Only one lifecycle operation may be active for a host room at a time.
- When room or round identity changes, stale operations become invalid and cannot update state, persistence, or history. Active transport cancellation is optional.
- Durable room and guest persistence is authoritative; browser state is a temporary view.
- A ready summary requires both canonical entry group assignments and the active room snapshot to persist successfully.
- Partial persistence failures preserve the previous ready summary and retry the same generated result idempotently.
- Refresh archives the previous snapshot only after replacement generation and persistence succeed.
- A new round requires a ready active summary and completes only after archiving the summary, clearing entries, and resetting guest allowances.
- Summary history retains the newest 20 snapshots per host room.
- History snapshots record whether they came from an explicit refresh or completion of a round.
- Guests may submit once per round. Persisted guest state is authoritative, while client state provides immediate UX feedback.

## Testing Decisions

- Tests should cross the framework-independent workflow seam and assert external behavior, not implementation details such as React hooks, refs, or operation counters.
- Use in-memory adapters for current-room entries, durable room state, guest state, summary history, and summary generation.
- Cover first generation only when Summary opens with entries, stable ready snapshots, captured inputs, pending entries, serialized operations, stale-room invalidation, failed generation, failed refresh, successful history writes, partial persistence retry, and complete new-round transitions.
- Cover the 20-snapshot retention rule and snapshot origins.
- Cover persisted guest submission authority, one submission per round, and reset after a completed new round.
- Add a thin React adapter test for status rendering, pending-entry messaging, action availability, and guest submission copy/reset behavior.
- Preserve and extend prior art in the existing host summary state, orchestration, and summary-generation tests.
- Done means the workflow tests pass, the existing test suite passes, lint passes, TypeScript type checking passes, and the production build succeeds.

## Out of Scope

- Redesigning unrelated guest, host, room, or bubble UI.
- Replacing Appwrite or changing the authentication provider.
- Introducing a vector database or changing semantic grouping policy.
- Automatic summary generation on every guest submission.
- Unlimited summary history or a separate history database for this MVP.
- Cross-room summary aggregation.
- Implementing active network cancellation as a prerequisite for correctness.
- Changing the summary-generation model or prompt beyond the lifecycle contract.

## Further Notes

The domain vocabulary and durable decisions are recorded in `CONTEXT.md` and ADRs 0001–0019. The implementation should preserve the current user-visible concepts—host room, round, active summary, summary snapshot, saved round, and guest submission allowance—while concentrating lifecycle complexity behind the new seam.
