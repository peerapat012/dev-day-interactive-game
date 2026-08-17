# Recover partial summary persistence idempotently

If some entry group assignments persist but the active room snapshot does not, the previous active summary remains visible and the generated result is retried as the same persistence attempt. The workflow does not archive the previous summary or generate a different result until the pending persistence completes.
