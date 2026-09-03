# Autonomous Agent Runbook & Operational Protocol

* **Purpose:** Defines how autonomous AI agents operate within this repository with **fresh context windows**, zero memory poisoning, and deterministic verification gates.
* **Core Principle:** **"Disk is the Source of Truth."** Never assume context from previous chat turns. Always inspect the filesystem, documentation, and Git tree.

---

## 1. The Autonomous 4-Stage Agent Loop

Whenever an agent boots to execute a ticket or slice, it must follow this exact loop:

```
┌────────────────────────────────────────────────────────┐
│ 1. PERCEIVE                                            │
│    - Read docs/PRD.md & docs/ARCHITECTURE.md           │
│    - Inspect git status and git log -n 3               │
│    - Read target slice in docs/PHASES_AND_SLICES.md    │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│ 2. REASON                                              │
│    - Identify target files and TypeScript contracts    │
│    - Check constraints (no Framer Motion, 48px targets)│
│    - Formulate surgical modification plan              │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│ 3. ACT                                                 │
│    - Write code adhering to Matt Pocock typing rules   │
│    - Apply changes in thin vertical slices             │
│    - Keep edits surgical; NEVER rewrite entire files   │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│ 4. VERIFY (Deterministic Gates)                        │
│    - Run TypeScript compiler: tsc --noEmit             │
│    - Run automated unit / integration assertions       │
│    - Test in headless browser (Chrome MCP / DOM)       │
│    - IF FAIL ──► Feed error trace back to ACT (Loop)   │
│    - IF PASS ──► Commit to Git & mark slice complete   │
└────────────────────────────────────────────────────────┘
```

---

## 2. Bug Resolution & Self-Correction Escalation Matrix

When an error or test failure occurs during execution, follow this routing protocol:

| Error Type | Trigger / Symptom | Assigned Agent / Action | Does it touch Planning? |
| :--- | :--- | :--- | :--- |
| **Compiler / Type Error** | `tsc --noEmit` fails, syntax error, missing import. | **Builder Agent Self-Correction:** Builder reads compiler error line number and fixes code directly. | ❌ NO. Never waste planner tokens on syntax errors. |
| **Test Assertion Failure** | Unit test fails (e.g. rep calculation mismatch). | **Builder Agent:** Inspects assertion diff, fixes business logic, re-runs test. | ❌ NO. |
| **Spec Violation** | Code passes tests, but missed a requirement (e.g. forgot 15ms haptics). | **Reviewer Agent $\rightarrow$ Builder:** Reviewer cites missing PRD requirement. Builder adds feature. | ❌ NO. |
| **Architectural Blocker** | Chosen library is fundamentally incompatible or exceeds mobile performance budget. | **Orchestrator Escalation:** Update `docs/ARCHITECTURE.md` and `implementation_plan.md` before proceeding. | ✅ YES. Requires architectural alignment. |

---

## 3. Git Commit & Slicing Standards

* **One Commit per Slice:** Every completed vertical slice must be accompanied by an atomic Git commit.
* **Format:** Conventional Commits format:
  * `feat(move): add sticky stepper row with haptics`
  * `feat(focus): dual-clock active vs break timer`
  * `fix(storage): resolve localStorage serialization race condition`
  * `ci: add azure static web apps workflow`
* **Clean Working Tree:** Before finishing an autonomous run, verify `git status` is clean.

---

## 4. Context Window Safety & Anti-Drift Guidelines

1. **Do Not Trust Chat Memory:** Always execute `git status` and read the relevant files before making modifications.
2. **Never Propose Full File Rewrites:** When updating existing components, make targeted line-level replacements.
3. **Verify Against the Non-Negotiables:**
   * $0.00 zero-cost constraint.
   * Full 20 Questions + 2 Live Coding + 2 DSA daily target preserved.
   * 48px+ minimum touch targets for Motorola Edge 50 Pro.
   * Sub-2-second logging transaction speed.
