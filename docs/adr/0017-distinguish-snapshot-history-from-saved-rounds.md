# Distinguish summary snapshot history from saved rounds

Summary history uses `summary snapshot` as its umbrella concept. A snapshot records its origin as either an explicit refresh replacement or completion of a round; `saved round` is reserved for the latter, so refresh history does not falsely imply that the round ended.
