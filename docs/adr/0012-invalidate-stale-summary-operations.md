# Invalidate stale summary operations at the workflow seam

When the host room or round changes, an in-flight summary operation becomes obsolete and its result must not update state, persistence, or history for the current room. Transport cancellation is optional; correctness comes from rejecting stale completions at the workflow seam.
