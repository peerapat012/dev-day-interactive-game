# Use Email + Password auth for the authenticated host variant

Deck persistence is tied to an authenticated host account, so Appwrite Email + Password auth is enabled and used to scope `question_decks` rows by ownerId. This is the first auth UI in the app; guests remain anonymous. Guest sessions still use the existing anonymous session flow, which is unchanged.