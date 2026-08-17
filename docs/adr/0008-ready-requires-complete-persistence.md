# Ready requires complete summary persistence

An active summary is ready only after both canonical group assignments for its entries and the room’s active snapshot have been persisted. The workflow must keep the previous ready summary visible when either persistence step fails, even though the underlying adapters may not offer one physical transaction.
