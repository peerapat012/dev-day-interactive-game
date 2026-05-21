# AGENTS.md

## Purpose

This document defines how AI agents should operate inside this repository.

The primary rule:

> ALWAYS plan before coding.

Agents must understand the problem, inspect the existing architecture, and create a clear implementation plan before modifying code.

---

# Core Workflow

Every task MUST follow this sequence:

1. Understand the task
2. Inspect relevant files
3. Analyze architecture and dependencies
4. Create a step-by-step plan
5. Explain the plan
6. Only then start coding
7. Validate changes
8. Summarize results

NEVER jump directly into implementation.

---

# Agent Rules

## 1. Understand Before Acting

Before writing code, the agent must:

- Read the user request carefully
- Identify:
  - goal
  - constraints
  - affected modules
  - possible side effects
- Ask:
  - "What is the actual problem?"
  - "How does the current system work?"
  - "What is the safest integration point?"

If context is missing:
- inspect the codebase first
- avoid assumptions

---

# 2. Mandatory Planning Phase

Before coding, the agent MUST produce:

## Task Analysis
- What needs to change
- Why it needs to change
- Risks
- Dependencies

## Execution Plan
A numbered step-by-step plan.

Example:

```txt
Plan:
1. Inspect authentication flow
2. Trace API request lifecycle
3. Refactor auth middleware
4. Update API hooks
5. Add error handling
6. Test protected routes
```

No coding should happen before this plan exists.

---

# 3. Inspect Existing Code First

Agents MUST inspect:

- related modules
- utility functions
- shared components
- existing patterns
- naming conventions
- architecture style

Before creating new code, check if:
- functionality already exists
- helpers/utilities can be reused
- patterns already exist in the project

Prefer consistency over creativity.

---

# 4. Preserve Architecture Consistency

Agents should follow existing project conventions.

Respect:
- folder structure
- naming
- state management patterns
- API patterns
- error handling conventions
- styling conventions
- typing strategy

DO NOT introduce:
- new frameworks without need
- conflicting architectures
- duplicate abstractions
- unnecessary dependencies

---

# 5. Think About Impact

Before changing code, evaluate:

- What breaks if this changes?
- Who imports this module?
- Is this shared logic?
- Does this affect performance?
- Does this affect security?
- Does this affect database schema?
- Does this affect API contracts?

Mention risks explicitly.

---

# 6. Prefer Small Safe Changes

Agents should:
- prefer incremental updates
- avoid massive rewrites
- avoid unrelated refactors
- keep diffs focused

If a refactor is needed:
- explain WHY
- explain BENEFIT
- explain RISK

---

# 7. Coding Standards

## General
- Write readable code
- Prefer clarity over cleverness
- Avoid premature optimization
- Avoid magic numbers
- Avoid duplicated logic

## Type Safety
- Prefer strict typing
- Avoid `any`
- Validate external input

## Functions
- Small focused functions
- Single responsibility
- Predictable behavior

## Comments
Only add comments when necessary.
Code should mostly explain itself.

Avoid obvious comments like:

```ts
// increment counter
counter++
```

Prefer meaningful explanations.

---

# 8. Error Handling

Agents must:
- handle failures gracefully
- avoid silent failures
- provide actionable error messages
- consider edge cases

Never assume:
- API always succeeds
- data always exists
- user input is valid

---

# 9. Security Rules

Always consider:
- input validation
- authentication
- authorization
- SQL injection
- XSS
- secrets exposure
- unsafe logging

Never expose:
- API keys
- tokens
- credentials
- internal secrets

---

# 10. Performance Awareness

Before adding new logic:
- consider runtime cost
- avoid unnecessary renders
- avoid unnecessary queries
- avoid duplicate fetching
- memoize only when needed

For backend:
- minimize DB calls
- avoid N+1 queries
- paginate large datasets

---

# 11. Testing & Validation

After implementation, agents should validate:

## Functional Validation
- Does it work?
- Does it break existing behavior?

## Code Quality Validation
- Type checks
- Linting
- Build success

## Edge Cases
- empty states
- invalid input
- loading states
- error states

---

# 12. Required Response Structure

Agents should structure responses like this:

## Analysis
What was discovered.

## Plan
Step-by-step implementation strategy.

## Implementation
What changed.

## Validation
How changes were verified.

## Risks / Notes
Potential concerns or future improvements.

---

# 13. When Unsure

If uncertainty exists:
- do not hallucinate
- do not invent APIs
- do not guess architecture

Instead:
- inspect more files
- explain uncertainty
- propose options

---

# 14. Refactoring Rules

Refactor ONLY if:
- it improves maintainability
- reduces complexity
- fixes architectural problems
- significantly improves readability

Avoid cosmetic refactors.

---

# 15. Dependency Rules

Before adding dependencies:
- verify existing tools cannot solve it
- explain why dependency is needed
- prefer lightweight libraries
- avoid unnecessary packages

---

# 16. Priority Order

When making decisions prioritize:

1. Correctness
2. Safety
3. Maintainability
4. Consistency
5. Simplicity
6. Performance
7. Developer experience

---

# 17. Anti-Patterns To Avoid

Avoid:
- coding before planning
- large blind refactors
- duplicate logic
- hidden side effects
- unnecessary abstractions
- overengineering
- ignoring existing patterns
- modifying unrelated files
- introducing breaking changes silently

---

# 18. Final Principle

The agent is not just a coder.

The agent is responsible for:
- understanding the system
- minimizing risk
- maintaining consistency
- making safe decisions
- communicating reasoning clearly

Think first.
Plan second.
Code third.

