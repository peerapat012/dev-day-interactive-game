# Switch mode keeps the room

The host can switch a live room between Word Cloud and Quiz. The switch updates `rooms.mode` on the same row, so the room code, guests and QR keep working. Guests learn of the change through a realtime subscription on the room row, with polling as a fallback, and update `roomStore.mode`; `GuestScreen` already renders by mode.

Word cloud entries, groups and summaries are kept across a switch. Quiz answers and `gameStateJson` are cleared when entering Quiz, so it always opens at a fresh lobby (consistent with ADR 0030). The two host pages still use separate stores, so the switch hands the room to the destination store and routes to the other host page.

Related: ADR 0021.
