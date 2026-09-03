---
description: "Matt Pocock TDD & Tracer Bullet Engineering Rules (derived from github.com/mattpocock/skills)"
globs: "**/*"
---

# Matt Pocock TDD & Engineering Rules

1. **Tracer Bullets Over Piles of Isolated Pieces:**
   - Always build thin, verifiable vertical slices that span UI, State, and Storage.
   - Never build horizontal layers in isolation.

2. **Types & Contracts First (TDD):**
   - Write data contracts, interfaces, and expected assertions BEFORE generating business logic.
   - The TypeScript compiler (`tsc --noEmit`) and automated assertion runners are the non-negotiable gates.

3. **Surgical Modifications:**
   - Modify only the lines and functions required for the current slice.
   - Do NOT rewrite entire files.

4. **Discriminated Unions for State Machines:**
   - Do not use boolean soup (`isPending`, `isBreak`, `isPaused`).
   - Use explicit discriminated unions with exhaustive type narrowing.
