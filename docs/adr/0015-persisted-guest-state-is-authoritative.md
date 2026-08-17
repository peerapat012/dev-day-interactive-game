# Use persisted guest state as submission authority

The persisted guest record is authoritative for whether a guest has submitted in the current round. Client state may disable the input optimistically, but every submission checks persisted state and the host’s new-round transition resets it for the next round.
