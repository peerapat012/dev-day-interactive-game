# Cap saved-round history per room

Each host room retains the newest 20 saved rounds for the MVP. History is currently stored with the room snapshot, so a fixed cap prevents unbounded growth while preserving enough recent context for host review; longer retention should use a separate persistence shape.
