# Quiz Game Mode

## Problem Statement

The app currently supports a single host-led word cloud flow. Hosts want a Kahoot-style multiple-choice quiz to run with the same guests, room codes, and realtime plumbing. Quiz timing, scoring, per-question answer enforcement, and leaderboard accumulation need clear rules so host and guest agree on points without server-authoritative timing in v1.

## Solution

Add a quiz mode to the same app. The home screen offers a mode picker (Word Cloud / Quiz). A quiz host builds a question deck at runtime, starts each question with a countdown, and drives all phase transitions (lobby → live → reveal → top-5 leaderboard → final podium). Guests join with the existing room code flow and answer each live question once; they see live timing, immediate feedback on reveal, and standings.

A framework-independent `quizWorkflow` core owns phases, timing, scoring, one-answer enforcement, leaderboard computation, and clear-session behavior, behind thin React adapters, mirroring the host-summary-workflow pattern.

## User Stories

1. As a host, I want to choose the quiz mode from the home screen, so that I can run either a word cloud or a quiz from the same app.
2. As a host, I want to build a question deck at runtime with a prompt, options, the correct option, and a per-question time limit, so that I can author content without a separate tool.
3. As an authenticated host, I want to save my deck to the `question_decks` table for reuse, so that I do not re-type decks across sessions.
4. As an unauthenticated host, I want my deck kept in localStorage and wiped by Clear session, so that stale quiz content does not persist.
5. As a host, I want a lobby phase where guests can join before the first question, so that late joiners are still included.
6. As a host, I want to start each question with a countdown that guests see live, so that pacing is clear.
7. As a host, I want to see live answer counts on a bar chart while the question is open, so that I know how many guests have answered.
8. As a host, I want to reveal the correct answer and per-guest points after the question, so that guests learn the outcome.
9. As a host, I want a top-5 leaderboard between questions and a final podium at the end, so that standings are legible.
10. As a host, I want the full leaderboard for my own view, so that I can address tiebreakers or issues.
11. As a guest, I want to see the question and answer pad with a live timer, so that I know the time budget.
12. As a guest, I want to submit exactly one answer per question, so that the result is not gamed by repeated answers.
13. As a guest, I want feedback on whether my answer was correct and how many points I earned, so that I understand my score.
14. As a guest, I want my score computed from the host-anchored question start time and my answeredAt, so that host and guest agree on points.

## Implementation Decisions

- Quiz is a mode of the same app; the home screen gains a mode picker.
- Hosts author question decks at runtime; authenticated hosts persist decks to `question_decks`, unauthenticated hosts use localStorage.
- Appwrite Email + Password auth scopes deck ownership (ownerId = account userId); guest sessions remain anonymous.
- Flow is host-driven: lobby → live → reveal → leaderboard → podium.
- Per-question time limit; the host starts the countdown.
- Scoring: `round(1000 × (1 − elapsedMs / timeLimitMs))`, correct answers only, wrong or late = 0, no streaks in v1.
- Scoring uses host-anchored question start time plus client `answeredAt`, computed identically on host and guest. Server-authoritative timing is deferred.
- The `answers` table is the source of truth: one row per guest per question per room.
- Realtime uses existing Appwrite TablesDB channels on `rooms` and `answers`, with the polling fallback preserved.
- One answer per question is enforced via a persisted check mirroring `guestHasSubmitted`; answers to an ended question are rejected.
- The framework-independent `quizWorkflow` core owns phases, timing, scoring, leaderboard, one-answer enforcement, and clear-session; React adapters stay thin.
- The host game state is persisted as `gameStateJson` on the room row so phase/current question survive reload.
- A live question auto-reveals when its time limit elapses, then auto-advances to the top-5 leaderboard after a 4s dwell; the host still manually starts each next question. Timers are scheduled through a `schedule` port and cancelled on any manual transition, room open, podium reset, or clear-session.
- "Done" on the final podium resets the quiz to a fresh lobby in the same room so the host can run another quiz: the reset lobby is persisted back to `gameStateJson` (so a reload lands on a fresh lobby, not the podium) and the room's `answers` rows are cleared so a second quiz does not inherit the previous one's answers.
- Reopening a persisted room mid-game restores the in-flight timer: a live question reschedules its auto-reveal for the remaining time (clamped at 0) and a reveal reschedules the auto-advance to the leaderboard after the 4s dwell, so a host reload does not stall the flow.

## Host identity and room lifecycle

- Entering quiz host as a signed-out user shows an auth gate: **Continue as guest** or **Log in / register** (reusing the same form as "My saved decks"). Anonymous sessions are not treated as signed-in; only an Email + Password session counts.
- Appwrite forbids creating a session while another is active, so login/register end the current session first, and guest sessions are re-created after logout instead of being cached forever.
- The quiz host can **Close room & end session** (deletes the room row, releasing guests) — works for anonymous hosts. **Clear session** also deletes the old room row before creating a fresh room, so guests are kicked from the abandoned room instead of staying on the complete page.
- Guests detect a closed room by polling the room row (same as word cloud); room-existence reads disable list caching so a deleted room is seen promptly.

## Testing Decisions

- Tests cross the framework-independent `quizWorkflow` seam and assert external behavior.
- Cover phase transitions, countdown/timing, scoring formula, live answer counts, top-5 and full leaderboards, podium, one-answer enforcement, rejection of answers to ended questions, and clear-session behavior.
- Use in-memory adapters for answer persistence and game state.
- Done means the workflow tests pass, the existing test suite passes, lint passes, TypeScript type checking passes, and the production build succeeds.

## Out of Scope

- Server-authoritative timing.
- Answer streaks, power-ups, or bonuses.
- A deck marketplace, import, or shared deck libraries.
- Guest-vs-guest chat or audience reactions.
- Redesigning unrelated guest, host, room, or bubble UI.
- Replacing Appwrite or changing the guest authentication provider.

## Further Notes

The domain vocabulary and durable decisions are recorded in `CONTEXT.md` and ADRs 0021–0030. The implementation mirrors the host-summary-workflow pattern: a framework-independent core, thin React adapters, and focused vitest tests. Status is tracked in `.scratch/quiz-game/status.md`; deployment requirements (Appwrite schema, auth methods, env vars) are in `frontend/README.md`.