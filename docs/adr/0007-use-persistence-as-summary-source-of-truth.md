# Use persistence as the active-summary source of truth

The durable room snapshot and saved-round records are authoritative for active summaries and history. Browser state is a temporary view of that data, so remounting or reloading rehydrates from persistence instead of reconciling a second durable copy.
