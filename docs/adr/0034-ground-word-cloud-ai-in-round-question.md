# Ground Word Cloud AI in an optional round question

Word Cloud classification and summaries previously received only guest text, so the model guessed the intent of each round. Its prompts also favoured tech categories and required at least three groups, which pushed it to invent distinctions.

The host may now set an optional **round question** on the host room (`rooms.roundQuestion`). Guests see it, and it is sent to both the classify and summarize steps. The prompts group and summarize entries as answers to that question, merge answers that share a meaning (one group is valid), put unrelated answers in a single "นอกประเด็น" group, and may use only ideas present in the group's own entries.

The question is read when a generation attempt starts, so it follows ADR 0010's captured-snapshot rule. It is saved with the saved round and summary history. Starting a new round sets the next question, or clears it, in the same transition as clearing entries (ADR 0016). Clearing the room also clears it.

The column is optional in the deployed schema, as with `isSummary`. If it is missing, generic writes drop it and still succeed. Setting a question reports an error that names the missing column. Without a question the app behaves as before, using the new non-tech-biased prompts.
