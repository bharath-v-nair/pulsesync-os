---
description: "Core engineering invariants for PulseSync Life OS"
globs: "**/*"
---

# PulseSync Life OS: Engineering Invariants

Any AI agent operating within this repository MUST follow these rules:

1. **Source of Truth:** Always read `docs/PRD.md` and `docs/ARCHITECTURE.md` before proposing code changes.
2. **Strict Typing:** No `any`. Use discriminated unions for state management. Run `tsc --noEmit` before finishing any task.
3. **Hardware Constraints:** 
   - Primary device: Motorola Edge 50 Pro (144Hz pOLED).
   - Global `touch-action: manipulation` must be preserved.
   - Minimum tap target size: 48 × 48 px.
   - No Framer Motion. Use GPU-composited CSS transforms (`transform: translate3d`).
4. **Offline First:** All data writes must succeed immediately in `localStorage` or `IndexedDB`.
5. **Atomic Commits:** One Git commit per verified vertical slice using Conventional Commits.
