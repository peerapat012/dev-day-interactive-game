# Preserve the last known good active summary

The host summary lifecycle will replace an active summary only after generation and persistence succeed. Failed generation or round-transition work preserves the last known good active summary and active entries, because losing usable host output is worse than showing a recoverable error state.
