# Serialize host summary lifecycle operations

Only one host summary lifecycle operation may be active for a host room at a time. Conflicting actions are ignored or disabled, and operations become invalid when their room or round is no longer current, so older asynchronous work cannot overwrite newer state or reorder persistence writes.
