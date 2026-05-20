# Word Cloud Categorization Game

Interactive web app where users submit short phrases, a placeholder API classifies them into semantic groups, and the UI visualizes raw inputs and grouped categories as animated bubbles. Built with Next.js App Router, TypeScript, Tailwind CSS, Zustand, Appwrite (guest access), and Framer Motion.

**Note:** Classification uses FastAPI `POST /clarify`. Summarization uses FastAPI `POST /summarize` (triggered by button on `/summary`).

## Tech stack

- Next.js App Router (Server + Client Components)
- TypeScript
- Tailwind CSS v4
- Zustand (live state)
- Appwrite SDK (guest / anonymous sessions)
- Framer Motion (animations)
- No authentication UI

## Quick start

### 1. Install and run

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 2. Environment variables

Copy `.env.example` to `.env.local`:

```env
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=
NEXT_PUBLIC_APPWRITE_DATABASE_ID=
NEXT_PUBLIC_APPWRITE_COLLECTION_ID=
```

### 3. Appwrite setup

1. **Auth** — Enable **Anonymous** sessions (Auth → Settings).
2. **Database** — Use database `word-cloud-wall` (or your own; free tier allows one DB).
3. **Table** — Table `entries` with columns:

   | Attribute   | Type     |
   |-------------|----------|
   | `name`      | string   |
   | `input`     | string   |
   | `group`     | string   |
   | `createdAt` | datetime |

4. **Permissions** — `read("any")`, `create("users")` (anonymous users count as users).

5. Copy IDs into `.env.local`:

   ```env
   NEXT_PUBLIC_APPWRITE_DATABASE_ID=word-cloud-wall
   NEXT_PUBLIC_APPWRITE_COLLECTION_ID=entries
   ```

   (`COLLECTION_ID` is the table ID for TablesDB.)

6. **`guests` and `rooms` tables** — Required for `/host` and `/guest` flows as in your deployed schema. Host **Close room** deletes the room row (no extra columns).

### Wipe all database rows (fresh start)

From `frontend/` with `APPWRITE_API_KEY` set in `.env.local` (API key must allow **Tables DB** read/delete on your tables):

```bash
CONFIRM_WIPE=yes npm run db:wipe
```

This deletes **every row** in the configured **entries**, **guests**, and **rooms** tables (same IDs as `.env.local`). Hosts/guests may still show old room codes in the browser until you clear site data or refresh after rejoin.

## Pages

| Route      | Description |
|------------|-------------|
| `/lobby`   | Kahoot-style nickname entry, then join the game |
| `/`        | Input form + live raw-input bubble cloud (size = frequency) |
| `/groups`  | Group category bubbles (size = count); click to open side panel with inputs |
| `/summary` | Top 3 groups → `/api/summarize` → summary cards |

## Folder structure

```txt
src/
├── app/
│   ├── api/classify/route.ts      # Mock LLM classify
│   ├── api/summarize/route.ts     # Mock LLM summarize
│   ├── globals.css
│   ├── layout.tsx                 # Server — metadata + providers
│   ├── page.tsx                   # Server — live raw cloud
│   ├── groups/page.tsx            # Server — grouped bubbles
│   └── summary/page.tsx           # Server — top 3 cards
├── features/
│   ├── cloud/
│   │   ├── components/CloudInput.tsx, RawWordCloud.tsx, CloudPageClient.tsx
│   │   └── hooks/useSubmitEntry.ts, useRealtimeEntries.ts
│   ├── groups/
│   │   ├── components/GroupWordCloud.tsx, GroupDetailPanel.tsx
│   │   └── hooks/useGroupStats.ts
│   └── summary/
│       ├── components/SummaryCards.tsx
│       └── hooks/useTopGroupsSummary.ts
├── shared/
│   ├── components/AppNav.tsx, PageShell.tsx
│   ├── components/bubble/Bubble.tsx, BubbleField.tsx
│   ├── components/providers/AppProviders.tsx
│   ├── hooks/useBubbleLayout.ts
│   └── ui/Button.tsx, Input.tsx, Modal.tsx
├── services/
│   ├── appwrite/client.ts, auth.ts, entries.ts, realtime.ts
│   └── ai/classify.ts, summarize.ts, mock.ts
├── lib/constants.ts, normalizeGroupName.ts, bubbleScale.ts, aggregateEntries.ts
├── store/entriesStore.ts
└── types/entry.ts, api.ts
```

## Architecture

| Layer        | Responsibility |
|--------------|----------------|
| `app/`       | Routes only — mostly Server Components; thin page shells |
| `features/`  | Domain UI + hooks (cloud, groups, summary) |
| `shared/`    | Reusable bubbles, layout shell, primitives |
| `services/`  | Appwrite + AI — **never called from JSX directly** |
| `store/`     | Zustand live state (entries, selection, UI flags) |
| `lib/`       | Pure helpers (normalize, aggregate, scale) |

### Data flow

```txt
User input
  → POST /api/classify → FastAPI /clarify
  → normalizeGroupName()
  → createEntry() → Appwrite
  → realtime subscription → Zustand store
  → RawWordCloud / GroupWordCloud / SummaryCards

Summary page:
  → top 3 groups from store
  → POST /api/summarize (mock) per group
  → SummaryCards
```

- **Server Components** for pages (metadata, minimal client JS on shells).
- **Client Components** only where needed: input, motion, Zustand, realtime, resize observers.

### State management (Zustand)

Used for:

- Live cloud entries (synced with Appwrite realtime)
- Selected group (modal)
- Submit / hydration / error UI

Not used for: static config, one-off server-fetched page data.

Store: `src/store/entriesStore.ts`

### API layer

| Endpoint           | Request | Response |
|--------------------|---------|----------|
| `POST /api/classify`  | `{ input: string }` | `{ input, group }` — proxies FastAPI |
| `POST /api/summarize` | `{ groups: [{ group, inputs: string }] }` | `{ summaries: [{ group, summary }] }` |

**FastAPI `/clarify`** — `{ "message": "<input>" }` → `{ "message": "<group>" }`

**FastAPI `/summarize`** — top 3 groups only; `inputs` is one plain-text string (phrases comma-separated):

```json
// Request
{
  "groups": [
    { "group": "technology", "inputs": "ai agent, coding, cloud" }
  ]
}

// Response
{
  "summarize": [
    { "group": "technology", "summarize": "Summary text..." }
  ]
}
```

Env: `LLM_CLARIFY_URL`, `LLM_SUMMARIZE_URL`, `LLM_USE_MOCK=false`

## Appwrite integration

### Guest session

`src/services/appwrite/auth.ts` calls `createAnonymousSession()` when no session exists. No auth pages required.

### CRUD

`src/services/appwrite/entries.ts`:

- `createEntry(data)` — insert classified row
- `listEntries()` — initial hydrate
- `listEntriesByGroup(group)` — filter example
- `deleteEntry(id)` — delete example

### Realtime

`src/services/appwrite/realtime.ts` subscribes to collection document events. On create/update → `upsertEntry`; on delete → `removeEntry`. **No full refetch** after each insert.

Bootstrap: `src/features/cloud/hooks/useRealtimeEntries.ts`

## Classify flow

1. User submits text in `CloudInput`.
2. `classifyInput()` → `POST /api/classify`.
3. API calls FastAPI `clarifyWithLlm()` (or mock if `LLM_USE_MOCK=true`) + `normalizeGroupName()`.
4. `createEntry()` saves to Appwrite.
5. Store updates via optimistic `upsertEntry` + realtime.

## Bubble rendering

- **Aggregation:** `buildRawBubbles` (frequency by input text), `buildGroupBubbles` (count per group) in `src/lib/aggregateEntries.ts`.
- **Sizing:** `scaleBubbleSize` / `scaleFontSize` in `src/lib/bubbleScale.ts` (√ scaling).
- **Layout:** `useBubbleLayout` — deterministic positions from id hash + collision avoidance.
- **Components:** memoized `Bubble`, `BubbleField` with `ResizeObserver`.

## Performance tips

- `Bubble` is wrapped in `memo()`.
- Aggregations use `useMemo`.
- Layout positions are stable across re-renders (hash-based).
- Realtime merges incrementally — avoid `listEntries()` after every insert.
- Use Zustand selectors (`s => s.entries`) not the whole store.
- **Future:** virtualize at 500+ bubbles; paginate Appwrite with `Query.cursorAfter`.

## Semantic grouping vs predefined categories

**Predefined categories** force users into fixed buckets (e.g. only Sports / Food / Tech). That breaks with niche, mixed, or multilingual input.

**Semantic grouping** (LLM-generated labels) lets categories **emerge from data**. The cloud evolves as participants add text without maintaining category enums.

## Vector DB for MVP?

**Not required for MVP.** Current path is enough:

```txt
input → classify API → normalized group string → Appwrite → aggregate UI
```

**Later**, a vector DB can help with:

- Near-duplicate group detection ("tech" vs "software engineering")
- Clustering without LLM per token
- Semantic search and recommendations
- Embedding-based visualization

Possible providers: Pinecone, Qdrant, Weaviate, pgvector. Add behind `services/ai/` without changing UI.

## Avoiding duplicate / similar LLM groups

### MVP (implemented)

`src/lib/normalizeGroupName.ts`:

- lowercase, trim, remove punctuation
- alias map (`tech` → `technology`, `dogs` → `animal`)
- light singularization

### Suggested next steps

1. **Canonical registry** — fuzzy-match new labels against existing groups (Levenshtein / stemmer).
2. **Embeddings** — merge if cosine similarity > threshold to an existing centroid.
3. **Prompt constraint** — ask LLM to prefer existing groups when similar.
4. **Post-process merge** — periodic job to collapse overlapping groups.

### Normalization pipeline

```txt
raw LLM label
  → trim / lowercase / remove punctuation
  → alias dictionary
  → singularize tokens
  → optional: match existing groups (fuzzy or embedding)
  → store canonical `group` only (never raw LLM string in DB)
```

Always normalize **before** `createEntry()`.

## Future scalability

- **`services/ai/`** — single swap point for LangChain classify + summarize.
- **Vector DB** — optional; store embeddings beside `group`.
- **Rooms** — add `roomId` to collection + filter queries/subscriptions.
- **SSR admin** — `node-appwrite` + API key for moderation.

## Scripts

```bash
npm run dev      # development
npm run build    # production build
npm run start    # production server
npm run lint     # ESLint
```

## Key files reference

| File | Role |
|------|------|
| `src/store/entriesStore.ts` | Zustand live state |
| `src/services/appwrite/entries.ts` | Appwrite CRUD |
| `src/services/appwrite/realtime.ts` | Realtime subscription |
| `src/services/ai/clarify.ts` | FastAPI /clarify client (server-only) |
| `src/services/ai/mock.ts` | Fallback mock classify + summarize |
| `src/lib/normalizeGroupName.ts` | Category normalization |
| `src/features/cloud/hooks/useSubmitEntry.ts` | Submit → classify → save |
| `src/shared/components/bubble/BubbleField.tsx` | Shared bubble canvas |
