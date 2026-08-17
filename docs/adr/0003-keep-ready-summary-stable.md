# Keep a ready summary stable until host refresh

A ready active summary is a summary snapshot: late guest entries do not silently replace it. The host explicitly chooses Refresh summary to produce a new snapshot, preserving a coherent result for the current round and avoiding unexpected changes while it is being reviewed.
