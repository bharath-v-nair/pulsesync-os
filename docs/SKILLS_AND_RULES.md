# Skills & Rules Reference: Antigravity & Matt Pocock

* **Purpose:** Evaluates all available Antigravity slash commands and built-in skills, and defines the integrated Matt Pocock TypeScript & AI engineering rules for this repository.

---

## Part 1: Antigravity Skills & Slash Commands Evaluation

### 1. User-Queried Slash Commands

| Command / Tool | Category | Operational Mechanism | Application to PulseSync Life OS |
| :--- | :--- | :--- | :--- |
| **/goal** | Autonomous Execution | Activates a system stop-hook that enforces continuous agent self-auditing until all requirements are proven complete with real evidence (`<!-- GOAL_COMPLETE -->`). | **Primary Build Driver:** Use `/goal` when delegating autonomous implementation of a complete vertical slice without user interruptions. |
| **/boost** | Orchestration & Auditing | Routes tasks between Solo and Delegation modes (`DeepCoder` and `DeepInvestigator`), enforcing repeated adversarial review rounds until zero defects remain. | **Quality Gatekeeper:** Used to stress-test architecture and investigate root causes of elusive bugs. |
| **/browser** | Live UI Verification | Launches headless/headed browser sessions via Chrome DevTools MCP to click buttons, inspect localStorage, test 144Hz fluidity, and check console errors. | **Automated Acceptance Testing:** Verifies mobile touch targets, stepper increments, and undo toast in real browser environments. |
| **/teamwork-preview** | Multi-Agent Teamwork | Scaffolds structured requirements (R1, R2), establishes programmatic acceptance criteria, and runs an automated team (Planner, Implementer, Adversarial Reviewer). | **Multi-Domain Orchestration:** Coordinates hand-offs when building complex multi-domain features like the Firebase Cloud Sync layer. |
| **/learn** | Meta-Learning & Memory | Intercepts runtime corrections or complex setups, extracting the underlying lesson into a permanent skill or rule file. | **Zero Regression:** Ensures once a device-specific quirk (like Motorola 144Hz touch-action) is resolved, the system never makes the same mistake again. |

---

### 2. Other Highly Relevant Built-in Antigravity Skills

| Skill Name | Path | Why It Is Critical for PulseSync |
| :--- | :--- | :--- |
| **`modern-web-guidance`** | `/Users/bharathnair/.gemini/config/plugins/modern-web-guidance-plugin/skills/modern-web-guidance/SKILL.md` | **Mandatory Frontend Standards:** Search and implementation guide for cutting-edge HTML/CSS/JS (View Transitions, touch-action, popover API, sub-2s CWV LCP optimization). |
| **`chrome-devtools`** | `/Users/bharathnair/.gemini/config/plugins/chrome-devtools-plugin/skills/chrome-devtools/SKILL.md` | Browser automation via MCP: Inspects network requests, console errors, heapsnapshots, and performance traces. |
| **`a11y-debugging`** | `/Users/bharathnair/.gemini/config/plugins/chrome-devtools-plugin/skills/a11y-debugging/SKILL.md` | Audits tap targets (48×48px minimum), ARIA live regions for the 5-second undo toast, and color contrast on deep dark themes (`#090d16`). |
| **`debug-optimize-lcp`** | `/Users/bharathnair/.gemini/config/plugins/chrome-devtools-plugin/skills/debug-optimize-lcp/SKILL.md` | Largest Contentful Paint debugging: Ensures the mobile app shell loads in under 300ms on mobile devices. |
| **`agy-customizations`** | `/Users/bharathnair/.gemini/antigravity/builtin/skills/agy-customizations/SKILL.md` | Authoritative reference for authoring custom workspace skills and persistent rules. |

---

## Part 2: Matt Pocock TypeScript & AI Engineering Rules

The following 5 rules, popularized by Matt Pocock (creator of *Total TypeScript*), are permanently adopted in this repository:

### Rule 1: "Types & Contracts Before Implementation" (Test-Driven AI)
* **Principle:** Never ask an AI to write business logic without first defining the exact TypeScript types or test assertions.
* **Standard:**
  ```typescript
  // ✅ GOOD: Discriminated union defines all valid states upfront
  export type SessionState = 
    | { status: 'idle' }
    | { status: 'active'; activeSeconds: number; questionId: string }
    | { status: 'break'; breakSeconds: number; returnToQuestionId: string };

  // ❌ BAD: Ambiguous boolean flags lead to invalid states
  export interface BadSessionState {
    isStudying: boolean;
    isPaused: boolean;
    isBreak: boolean;
  }
  ```

### Rule 2: "The TypeScript Compiler is the Non-Negotiable Gate"
* Every agent must run `tsc --noEmit` after modifying code.
* Zero TypeScript errors allowed. If red squigglies exist, the code is considered broken regardless of how good it looks.

### Rule 3: "Surgical Diffs, Never Full Rewrites"
* When modifying existing files, agents must make pinpoint line-level edits.
* Full-file rewrites are forbidden because they lead to regression bugs, lost edge-case handlers, and context window bloat.

### Rule 4: "Zero `any`, Exact Optional Property Types"
* `any` is strictly prohibited. Use `unknown` with type narrowing guards if the type is truly dynamic.
* All object parameters must have explicit interfaces or type aliases.

### Rule 5: "Context is King, Bloat is Death"
* Agents should only load the relevant domain specifications.
* Working on Move? Load `docs/PRD.md#move`. Working on Focus? Load `docs/PRD.md#focus`. Never flood context with unrelated code.
