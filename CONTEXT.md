# Word Cloud Game

This context defines the language for a host-led word cloud game where guests submit entries, those entries are grouped, and the host reviews summaries across rounds.

## Room and round

**Host room**:
A live game session owned by a host and joined by guests. It is the scope in which entries, summaries, and round history are kept together.
_Avoid_: session, lobby

**Round**:
One active collection of guest entries in a host room, ending when the host accepts or replaces its summary and begins collecting a new collection.
_Avoid_: run, cycle

**Saved round**:
A completed round retained as historical output, including its groups and summaries, after the host moves on to a new round. A round is not saved until it has an active summary; earlier versions created by Refresh summary are summary snapshots, not saved rounds.
_Avoid_: history item, archive

## Summary

**Active summary**:
The current host-facing interpretation of the entries in a round, including its groups and summary text. It may be loading, generating, empty, ready, or in error.
_Avoid_: result, report

**Summary snapshot**:
The stable interpretation produced from the round's entries at an explicit host refresh point. New entries do not replace it until the host requests a refresh.
_Avoid_: live summary, auto-updating summary

**Summary snapshot origin**:
The reason a summary snapshot entered history: either an explicit refresh replaced it, or the host completed the round and moved to a new one.
_Avoid_: save type, history reason

**Summary lifecycle**:
The progression of an active summary from loading or generation through ready, retry, regeneration, and transition to a new round. First generation begins when the host opens Summary with entries available; guest submissions alone do not start generation.
_Avoid_: summary flow

## Guest participation

**Guest submission allowance**:
A guest may submit one entry during a round. The allowance resets only when the host begins a new round; a ready summary does not close the round to guests who have not submitted.
_Avoid_: one-time session submission

## Quiz game

**Quiz mode**:
A game mode of a host room where guests answer host-driven multiple-choice questions instead of submitting word-cloud entries. The home screen offers a mode picker; the room keeps its room code, guests, and realtime plumbing.
_Avoid_: quiz app, separate room

**Question deck**:
A host-authored, ordered collection of questions built at runtime on the host screen. An authenticated host saves a deck to the `question_decks` table for reuse; an unauthenticated host's deck lives in localStorage and is wiped by Clear session.
_Avoid_: question set, quiz library

**Question**:
One quiz item with a prompt, an ordered list of options, the correct option, and a per-question time limit. The host starts the question's countdown.
_Avoid_: trivia item, quiz item

**Option**:
A selectable answer choice within a question. All guests see options in the same order; the correct option is withheld from guests until reveal.
_Avoid_: choice, answer

**Question phase**:
The host-driven stage of the quiz flow: lobby (before or between questions), live (a question is open and its countdown is running), reveal (correct answer and awarded points are shown), leaderboard (top-5 ranking between questions), and podium (final ranking at the end).
_Avoid_: step, stage, game state

**Answer**:
A guest's response to a live question: the selected option and the client timestamp when it was answered. Each guest submits at most one answer per question.
_Avoid_: response, quiz submission

**Score**:
Points awarded for a correct answer, computed as `round(1000 × (1 − elapsedMs / timeLimitMs))` from the question start time and the guest's answeredAt. Wrong or late answers score 0; streaks are out of scope.
_Avoid_: points, reward

**Leaderboard**:
The ranking of guests by accumulated score. The top 5 are shown between questions; the host sees the full list; the final podium closes the game.
_Avoid_: scoreboard, standings

**Quiz reset**:
The transition from a finished quiz's podium back to a fresh lobby in the same room, clearing the room's answers, so the host can build and run another quiz.
_Avoid_: restart, replay
