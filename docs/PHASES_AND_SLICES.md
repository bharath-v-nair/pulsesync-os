# Master Roadmap: Phases & Vertical Slices

* **Methodology:** Thin Vertical Slices (Tracer Bullets)
* **Rule:** Every slice spans UI, State, and Storage. No horizontal "UI only" or "DB only" tasks. Every slice must compile cleanly, pass tests, and produce a clean Git commit.

---

## Roadmap Overview

```
Phase 1: 🏋️ MOVE (Workout Engine MVP)         ◄── CURRENT FOCUS
Phase 2: 🧠 FOCUS (Interview Prep & Timer)    ◄── NEXT (Tomorrow)
Phase 3: 🛡️ HABITS (Discipline & Peer Sync)   ◄── Day 3
Phase 4: 📊 INSIGHTS & AZURE CLOUD (Charts)   ◄── Day 4
```

---

## 🏋️ Phase 1: MOVE Engine (Workout MVP)

### Slice 1.1: Project Scaffold & Pull-up Stepper
* **Objective:** Establish repo shell and working pull-up stepper with persistent storage.
* **Deliverables:**
  * Vite + React 19 + TypeScript + Tailwind CSS structure.
  * Local-first storage utility with JSON serialization.
  * `[ − ] 4 reps [ + ] [ LOG ]` stepper component with sticky default memory.
* **Acceptance Criteria:**
  - [x] Tapping `+` or `−` modifies rep count without delay.
  - [x] Tapping `LOG` writes entry to `localStorage` in <10ms.
  - [x] Page reload retains the last selected rep count (sticky memory).
* **Git Commit:** `feat(move): add quick-stepper row with sticky memory`

### Slice 1.2: Complete Exercise Suite (Push-ups, 30kg Barbell, 5k Walks)
* **Objective:** Expand logger to support full daily exercise repertoire.
* **Deliverables:**
  * Push-ups stepper (default 10 reps).
  * 30 kg Barbell module with quick pill tabs (Squat, OHP, Curls, Rows, RDLs, Deadlifts).
  * Automatic tonnage calculation (`reps × 30 kg`).
  * 5k Morning and Evening Walk 1-tap buttons.
* **Acceptance Criteria:**
  - [x] Switching barbell exercise updates active label and remembers rep count.
  - [x] Tonnage displays dynamically on the LOG button (e.g. `LOG (300kg)`).
  - [x] Walking buttons indicate completion state for today.
* **Git Commit:** `feat(move): add pushups, 30kg barbell lifts, and 5k walks`

### Slice 1.3: Tactile Haptics, 5-Second Undo Toast & 24-Hour Timeline
* **Objective:** Deliver safety against mis-taps and chronological telemetry view.
* **Deliverables:**
  * 15ms Web Vibration wrapper on all actions.
  * Floating 5-second Undo Toast with cancellation handler.
  * Chronological list of today's completed sets with exact time (`10:14 AM`) and relative time (`3m ago`).
  * Individual delete button per set.
  * Metric scorecards: Total Pull-ups, Push-ups, Barbell Tonnage (kg), Walk km.
* **Acceptance Criteria:**
  - [x] Tapping `LOG` triggers 15ms vibration and shows 5s toast.
  - [x] Tapping `Undo` in toast removes log entry and rolls back daily totals.
  - [x] Timeline accurately reflects sets in reverse chronological order.
* **Git Commit:** `feat(move): add haptics, undo toast, and 24h timeline`

### Slice 1.4: PWA Manifest & Service Worker Offline Caching
* **Objective:** Enable 1-tap installation on Motorola Edge 50 Pro with offline functionality.
* **Deliverables:**
  * `manifest.json` with standalone display and theme color `#090d16`.
  * Android App Shortcuts: `Log 4 Pull-ups`, `Log 10 Push-ups`, `Log 5k Walk`.
  * `sw.js` with stale-while-revalidate caching.
* **Acceptance Criteria:**
  - [x] App is installable via Chrome "Add to Home screen".
  - [x] App opens in full-screen standalone mode without URL bar.
  - [x] App functions 100% offline with Wi-Fi/data disabled.
* **Git Commit:** `feat(pwa): add service worker and app shortcuts`

---

## 🧠 Phase 2: FOCUS Engine (Interview Readiness)

### Slice 2.1: 7-Day Curriculum Rotator & 20-Question Daily Queue
* **Objective:** Structure daily technical interview questions without cognitive paralysis.
* **Deliverables:**
  * 7-day schedule logic (Angular $\rightarrow$ .NET/C# $\rightarrow$ Full Stack $\rightarrow$ System Design/DSA).
  * 20-Question queue partitioned into: 8–10 Deep Questions + 10 Repetition Flash Questions.
  * Dedicated counters for 2 Live Coding Mocks + 2 C# LeetCode Problems.
* **Acceptance Criteria:**
  - [ ] Automatically detects current day in 7-day rotation.
  - [ ] Allows batch import of 20 daily questions.
  - [ ] Visual progress ring tracking daily completion.
* **Git Commit:** `feat(focus): 7-day curriculum rotator and 20q daily queue`

### Slice 2.2: Active Study vs. Break Split State Machine
* **Objective:** Expose hidden break leakage and stop the 3-hour per question rabbit hole.
* **Deliverables:**
  * Dual-clock timer: Active Study Time vs. Idle/Break Time.
  * Automatic pause on browser tab blur or 60-second mouse/touch inactivity.
  * Break duration warning sound when break exceeds 5 minutes.
* **Acceptance Criteria:**
  - [ ] Switching away from tab immediately switches timer from Active to Break.
  - [ ] Daily dashboard displays actual focus efficiency ratio (`Active / (Active + Break)`).
* **Git Commit:** `feat(focus): dual-clock active vs break split state machine`

### Slice 2.3: 45-15 Feynman Timebox Protocol & Parking Lot
* **Objective:** Force active retrieval and kill passive reading.
* **Deliverables:**
  * 35-minute research timer $\rightarrow$ audible chime $\rightarrow$ 15-minute forced verbal synthesis $\rightarrow$ hard stop.
  * Hypothesis-First input modal: user must type a 2-sentence guess before viewing answers.
  * Quick-capture "Parking Lot" button to defer tangents.
* **Acceptance Criteria:**
  - [ ] User cannot view answer field until hypothesis string is submitted.
  - [ ] Parking lot items stored in dedicated list without disrupting active question.
* **Git Commit:** `feat(focus): feynman timebox protocol and parking lot capture`

---

## 🛡️ Phase 3: HABITS & Lean Peer Sync

### Slice 3.1: Day Bookends & Reading Tracker
* **Deliverables:**
  * 1-tap `☀️ Woke Up` and `🌙 Bed Time` logging.
  * 20-minute daily reading checkbox.
  * Clean UI bookends at the top and bottom of the daily timeline.
* **Git Commit:** `feat(habits): day bookends and reading tracker`

### Slice 3.2: Private Dopamine Detox & Clean Streaks
* **Deliverables:**
  * Anti-Porn and Media/Binge detox streak counters.
  * Relapse reset flow with 3-question private root-cause prompt (Trigger, State, Next Action).
  * Stored in encrypted local storage; zero exposure to external links.
* **Git Commit:** `feat(habits): private clean streaks with relapse reflection`

### Slice 3.3: Lean Peer Link (Pair Code Sync)
* **Deliverables:**
  * Firebase Anonymous Auth + 6-character Pair Code generation.
  * Read-only partner view URL (`/view?pair=XXXXXX`).
  * Displays high-level habit checkmarks and workout volume only.
* **Git Commit:** `feat(sync): lean peer accountability link via pair code`

---

## 📊 Phase 4: Insights & Azure Cloud Deployment

### Slice 4.1: Desktop Analytics & Progression Charts
* **Deliverables:**
  * Lazy-loaded SVG/Canvas volume progression charts for desktop view.
  * Weekly tonnage trends, pull-up volume velocity, and study focus ratio.
* **Git Commit:** `feat(analytics): desktop volume progression charts`

### Slice 4.2: Production CI/CD Pipeline to Azure Static Web Apps
* **Deliverables:**
  * Finalized `.github/workflows/azure-static-web-apps.yml`.
  * Production bundle optimization and Lighthouse performance audit.
* **Git Commit:** `ci: configure azure static web apps deployment pipeline`
