# Project Overview

This project is an interactive AI-powered Word Cloud Categorization Game.

Users submit short text/sentences.
Frontend sends text to an API endpoint.
LLM classifies the semantic group/category.
Data is stored in Appwrite.
Frontend visualizes:
- raw inputs
- grouped categories
- summarized top categories

IMPORTANT:
The actual LLM implementation is NOT part of this project.
LLM APIs are abstracted behind services and mock endpoints.

Tech stack:
- Next.js App Router
- TypeScript
- TailwindCSS
- Zustand
- Appwrite
- Framer Motion

---

# Main Architecture Rules

## 1. Use Feature-Based Architecture

Organize code by feature/domain.

Correct:
```txt
src/features/cloud
src/features/group
src/features/summary
````

Avoid:

```txt
src/components
src/utils
src/pages
```

Global shared items belong only in:

```txt
src/shared
src/lib
src/services
```

---

# 2. Colocation Rule

Keep related files together.

Correct:

```txt
features/cloud/
  components/
  hooks/
  services/
  types/
  store/
```

Avoid massive global folders.

---

# 3. Server vs Client Components

Default to Server Components.

Only use:

```tsx
"use client"
```

when needed for:

* animation
* state
* event handlers
* realtime subscriptions
* browser APIs

Do NOT overuse client components.

---

# 4. State Management

Use Zustand only for:

* live cloud state
* realtime synced data
* UI state
* selected group
* animation state

Do NOT use Zustand for:

* static config
* server fetched page data

---

# 5. API Layer Rules

Never call Appwrite directly inside UI components.

Always go through:

```txt
services/
```

Example:

```ts
submitEntry()
fetchGroups()
subscribeRealtime()
```

---

# 6. LLM Rules

DO NOT implement actual AI logic.

Only create:

* placeholders
* interfaces
* mock responses
* abstraction layers

Example:

```ts
classifyInput()
summarizeGroups()
```

Return mock data only.

---

# 7. Category Normalization Rules

LLM responses may vary:

* "Tech"
* "technology"
* "Technology"

Always normalize categories before saving.

Create:

```ts
normalizeGroupName()
```

Rules:

* lowercase
* trim
* remove punctuation
* singularize if needed
* alias mapping

Example:

```ts
tech -> technology
ai -> technology
dogs -> animal
```

---

# 8. Realtime Strategy

Use Appwrite realtime subscriptions.

Realtime updates should:

* append new entries
* avoid full reloads
* update bubble counts incrementally

Never refetch the entire database after each insert.

---

# 9. Performance Rules

Avoid rerendering all bubbles.

Use:

* memoization
* stable keys
* derived selectors
* animation throttling

Bubble rendering must support:

* 100+
* 500+
* future scalability

Avoid expensive recalculations on every render.

---

# 10. Bubble Visualization Rules

Bubble size should be based on:

* frequency
* grouped count
* weighted score

Use:

* random positioning
* collision avoidance
* smooth motion

Animations should feel alive but not chaotic.

---

# 11. Summary Rules

Summary page:

* compute top 3 groups
* collect all related inputs
* send combined content into summarize service
* show AI summary cards

Do NOT summarize client-side manually.

---

# 12. Appwrite Rules

Use only ONE collection.

Schema:

```ts
{
  name: string;
  input: string;
  group: string;
  createdAt: datetime;
}
```

Initialize guest session automatically.

Never require auth UI.

---

# 13. Folder Structure Rules

Preferred structure:

```txt
src/
  app/
  features/
    cloud/
    groups/
    summary/
  shared/
    components/
    hooks/
    ui/
  services/
    appwrite/
    ai/
  lib/
  store/
  types/
```

---

# 14. Styling Rules

Design style:

* dark mode
* minimal
* floating glassmorphism
* smooth motion
* responsive
* modern SaaS aesthetic

Avoid:

* heavy gradients everywhere
* cluttered UI
* large borders
* outdated card designs

---

# 15. Code Quality Rules

Always:

* use TypeScript strictly
* avoid any
* create reusable types
* use async/await
* separate business logic from UI
* keep components small

Prefer:

* composition
* hooks
* reusable utilities

Avoid:

* giant components
* deeply nested props
* duplicated fetch logic

---

# 16. Future Scalability Notes

Architecture should support future:

* vector DB
* semantic search
* embeddings
* multiplayer rooms
* websocket scaling
* analytics
* AI memory
* moderation

Do NOT tightly couple UI to current mock APIs.

---

# 17. Semantic Grouping Philosophy

This app uses semantic grouping instead of predefined categories.

Why:

* categories emerge dynamically
* users are not constrained
* AI adapts naturally
* cloud evolves organically

Avoid hardcoded category enums.

Groups should be AI-generated dynamically.

---

# 18. Vector DB Guidance

Vector DB is NOT required for MVP.

Current flow:

```txt
input -> LLM classify -> group string
```

Future vector DB can enable:

* semantic similarity search
* clustering
* duplicate detection
* recommendation systems
* embedding visualization

Possible future providers:

* Pinecone
* Qdrant
* Weaviate
* pgvector

Keep architecture ready but optional.

---

# 19. Duplicate Group Prevention

Implement lightweight normalization first.

Example:

```txt
technology
tech
coding
programming
```

can map into:

```txt
technology
```

Future:

* embedding similarity
* cosine similarity threshold
* semantic clustering

But MVP should stay lightweight.

---

# 20. Important Development Philosophy

This project is:

* interaction-first
* visualization-first
* frontend-first

NOT:

* backend-heavy
* auth-heavy
* enterprise-overengineered

Prioritize:

* UX
* smooth realtime feeling
* simple architecture
* maintainability

```
```
