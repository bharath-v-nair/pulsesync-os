# Product Requirements Document (PRD): PulseSync Life OS

* **Document Version:** 1.0.0
* **Author:** System Architecture & Delphi Council
* **Status:** Approved
* **Target Audience:** Autonomous Agents, Engineering Reviewers, and System Builders

---

## 1. Executive Summary & Mission
PulseSync Life OS is a specialized, zero-cost, local-first Progressive Web App (PWA) designed to solve three high-friction life tracking domains without cognitive overload:

1. **Grease the Groove (GTG) Fitness:** Micro-dosed half pull-ups and push-ups scattered 8–10 times throughout the day, fixed 30 kg barbell lifts, and daily 5k walks.
2. **Intensive Technical Interview Preparation:** A strict **20-Question Daily Queue** (8–10 Deep, 10 Repetition), **2 Live Coding Challenges**, and **2 C# DSA LeetCode Problems** under a hard **4-day interview readiness deadline**, governed by active/break split telemetry and Feynman timeboxing.
3. **Life Discipline & Habit Accountability:** Day anchors (wake/sleep), 20m book reading, and private clean streaks (anti-porn, anti-media bingeing) with encrypted root-cause journaling and a lean peer accountability link.

---

## 2. User Profile & Constraints

| Parameter | Specification | Impact on System Design |
| :--- | :--- | :--- |
| **Physical Profile** | 90 kg, ~5'8" (~173 cm). Can perform **half pull-ups** only. | Steppers must default to half pull-ups with sticky memory (default 4 reps). |
| **Barbell Setup** | Single fixed 30 kg barbell (no weight plates to change). | Tonnage calculations are strictly `reps × 30 kg`. Exercises: Squats, OHP, Curls, Rows, RDLs, Deadlifts. |
| **Primary Device** | Motorola Edge 50 Pro (Android 14, 144Hz pOLED). | UI must be dark-mode first (`#090d16`), zero frame drops on 144Hz, 15ms Web Vibration haptics, 48px+ tap targets. |
| **Desktop Device** | MacBook M4 Air (16 GB RAM, macOS, Chrome). | Full desktop responsiveness, rich analytics, and keyboard shortcuts. |
| **Timeframe** | **4 Days to Technical Interview Readiness.** | Daily target of 20 questions + 2 coding mocks + 2 DSA problems is non-negotiable. |
| **Budget** | **$0.00 (Zero Cost Forever).** | No paid APIs, no paid hosting. Runs on free-tier infrastructure (Azure Static Web Apps / Firebase Spark). |

---

## 3. Operational Domains & Telemetry Cadence

The system deliberately isolates three conflicting cadences to prevent cognitive pollution:

| Domain | Daily Frequency | Session Duration | Interaction Goal | UI Treatment |
| :--- | :--- | :--- | :--- | :--- |
| **🏋️ MOVE** | High (8–12× / day) | 2–8 seconds | Record micro-set instantly and return to life. | Single-row steppers, sticky memory, 15ms vibration, 5s undo toast. |
| **🧠 FOCUS** | Medium (3–4× / day) | 45–60 minutes | Deep cognitive absorption; kill 3-hour rabbit holes. | Fullscreen timer, active vs. break split, Feynman chime, 20Q queue. |
| **🛡️ HABITS** | Low (1–2× / day) | 1–2 minutes | Day bookends and private accountability. | Clean checkboxes, wake/sleep timestamps, private pair code. |

---

## 4. Functional Requirements

### 🏋️ Domain 1: MOVE (Workout Engine)
* **FR-1.1 (Quick-Stepper Rows):**
  * Half pull-up stepper: `[ − ]` `4 reps` `[ + ]` `[ LOG (+4) ]`
  * Push-up stepper: `[ − ]` `10 reps` `[ + ]` `[ LOG (+10) ]`
  * Barbell stepper: `[ − ]` `10 reps (30kg)` `[ + ]` `[ LOG (300kg) ]`
* **FR-1.2 (Sticky Memory):** The app must remember the user's last logged reps for each exercise and persist them across sessions.
* **FR-1.3 (30kg Barbell Exercises):** Quick-selector pills for Squats, Overhead Press, Bicep Curls, Bent Rows, Romanian Deadlifts (RDLs), and Deadlifts.
* **FR-1.4 (Cardio Walks):** 1-tap logging for Morning 5k Walk and Evening 5k Walk.
* **FR-1.5 (Tactile Haptic Feedback):** Web Vibration API (`navigator.vibrate([15])`) on all log/stepper actions.
* **FR-1.6 (5-Second Undo Toast):** Non-blocking floating bottom toast allowing immediate rollback of accidental taps.
* **FR-1.7 (24-Hour Timeline):** Chronological log of today's completed sets with exact timestamps and relative times (`4m ago`).
* **FR-1.8 (Running Daily Totals):** Live metric scorecards showing Total Pull-ups, Push-ups, Barbell Tonnage (kg), and Walk (km).

### 🧠 Domain 2: FOCUS (Interview Preparation Engine)
* **FR-2.1 (20-Question Daily Queue):** Supports 8–10 Deep Conceptual Questions + 10 Repetition Flash Questions.
* **FR-2.2 (Coding & DSA Tracker):** Dedicated counters for 2 Live Coding Mock Challenges + 2 C# LeetCode DSA Problems.
* **FR-2.3 (7-Day Rotating Curriculum):**
  * Days 1 & 4: Angular Frontend
  * Days 2 & 5: .NET / C# Backend
  * Days 3 & 6: Full Stack Integration
  * Day 7: System Design, Behavioral & AI Projects
* **FR-2.4 (Active vs. Break Split State Machine):**
  * Measures pure productive study time vs. distraction leakage.
  * Auto-pauses and switches to "Break" mode on tab blur or after 60 seconds of inactivity.
* **FR-2.5 (45-15 Feynman Timebox):** 35 minutes study $\rightarrow$ chime $\rightarrow$ 15 minutes forced active recall / aloud explanation $\rightarrow$ hard stop.
* **FR-2.6 (Hypothesis-First Prompt):** Before accessing answers or notes, user must type a 1-to-2 sentence guess.
* **FR-2.7 (Parking Lot):** Single-click capture for tangents to prevent rabbit holes during active sessions.

### 🛡️ Domain 3: HABITS (Accountability Engine)
* **FR-3.1 (Day Bookends):** 1-tap logging for `☀️ Woke Up` and `🌙 Going to Bed`.
* **FR-3.2 (Daily Reading):** Checkbox for 20-minute book reading.
* **FR-3.3 (Private Clean Streaks):** Discrete counters for Anti-Porn and Media/Binge Detox.
* **FR-3.4 (Encrypted Relapse Log):** If a relapse occurs, forces a 3-question introspective root-cause check (Trigger, State, Mitigation) kept 100% private.
* **FR-3.5 (Lean Peer Accountability Link):** Rotatable 6-character Pair Code (`PAIR-XXXXXX`) allowing partner to view high-level workout and habit checkmarks without exposing sensitive notes or relapse details.

---

## 5. Non-Functional Requirements (NFRs)

* **NFR-1 (Sub-2-Second Interaction):** Total time from opening app to logging a workout set must be under 2.0 seconds.
* **NFR-2 (Zero-Cost Constraint):** Must run indefinitely on 100% free tiers (Azure Static Web Apps free tier + Firebase Spark plan).
* **NFR-3 (Offline-First Resilience):** App shell and local database must load and operate with zero network connection via Service Worker caching.
* **NFR-4 (Hardware Optimization):** Zero dropped frames on 144Hz pOLED displays. `touch-action: manipulation` globally to eliminate 300ms mobile touch lag. Minimum 48×48px tap targets.
* **NFR-5 (Data Portability):** 1-click export of all telemetry to standard CSV and JSON formats.

---

## 6. Strict Anti-Goals (What We Will NOT Build)

1. **NO Heavy Animation Bundles:** Framer Motion is strictly banned (adds 50KB+ and causes GPU contention on 144Hz displays).
2. **NO Heavy Charting Libraries on Mobile:** Recharts is banned from the mobile critical path. Lightweight Canvas/SVG or lazy loading on desktop only.
3. **NO Complicated Login Walls:** No mandatory email/password or OAuth login on Day 1. Starts with zero login (local-first) and uses Anonymous Auth + Pair Codes for syncing.
4. **NO Real-Time Chat/Squad Rooms:** No websockets or social feeds. Peer tracking is strictly read-only checkmarks.
