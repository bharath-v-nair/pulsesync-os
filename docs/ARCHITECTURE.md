# Technical Architecture: PulseSync Life OS

* **Status:** Approved
* **Authors:** Senior Frontend Architect & Delphi Council
* **Target Environment:** Mobile Chromium (Motorola Edge 50 Pro, Android 14) & Desktop Chromium (MacBook M4 Air)

---

## 1. High-Level System Architecture

PulseSync Life OS is built as a **Local-First Progressive Web Application (PWA)**. 

```
┌────────────────────────────────────────────────────────┐
│               Client Presentation Layer                │
│     React 19 + TypeScript + Tailwind CSS v4 + Lucide   │
├───────────────────┬──────────────────┬─────────────────┤
│     🏋️ MOVE       │     🧠 FOCUS     │    🛡️ HABITS    │
│  (Sub-2s Logging) │ (Active Split)   │ (Private Streaks)
├───────────────────┴──────────────────┴─────────────────┤
│               Application State Machine                │
│           Zustand / Redux-free Vanilla Hook            │
├────────────────────────────────────────────────────────┤
│                 Storage & Sync Layer                   │
│   Primary: LocalStorage / IndexedDB (100% Offline)     │
│   Cloud: Firebase Firestore Spark Plan (Phase 3 Sync)  │
├────────────────────────────────────────────────────────┤
│              Deployment & CI/CD Pipeline               │
│        GitHub Actions ──► Azure Static Web Apps        │
└────────────────────────────────────────────────────────┘
```

---

## 2. Technology Stack Evaluation & Decisions

| Layer | Selection | Reason for Decision | Discarded Alternatives |
| :--- | :--- | :--- | :--- |
| **Framework** | **React 19 + TypeScript + Vite** | Industry standard, instant HMR, superior TypeScript ecosystem, zero boilerplate. | Svelte 5 / Preact (rejected to keep ecosystem standard for AI and user's career). |
| **Styling** | **Tailwind CSS v4** | Zero-runtime CSS, lightning-fast compiler, dark-mode first design tokens. | CSS Modules, Styled Components (extra runtime overhead). |
| **Animation** | **Compositor CSS (`transform: translate3d`)** | 0KB bundle weight, executed on GPU thread. Guarantees 144Hz fluidity on Motorola pOLED. | Framer Motion (rejected: 50KB+ bundle bloat, main thread contention). |
| **Persistence** | **Local-First (IndexedDB / LocalStorage)** | 0ms startup time, 100% offline functionality, zero setup friction. | Cloud-first (causes network spinner delay on mobile). |
| **Cloud Sync** | **Firebase Firestore (Spark Tier)** | 100% free forever, no auto-pausing (unlike Supabase 7-day inactivity pause), offline SDK. | Supabase (auto-pauses after 7 days, fatal for habit tracker). |
| **CI/CD** | **GitHub Actions $\rightarrow$ Azure Static Web Apps** | Generous free tier, automatic SSL, global CDN, native GitHub integration. | AWS Amplify (higher complexity), paid Vercel plans. |

---

## 3. Data Models & TypeScript Contracts

```typescript
// ==========================================
// 1. Move (Workout) Domain
// ==========================================
export type WorkoutCategory = 'pullup' | 'pushup' | 'barbell' | 'walk' | 'wake_up';

export type BarbellExercise = 
  | 'Squats'
  | 'Overhead Press'
  | 'Bicep Curls'
  | 'Bent Rows'
  | 'RDLs'
  | 'Deadlifts';

export interface WorkoutLog {
  id: string;                    // UUID
  timestamp: number;             // Epoch milliseconds
  dateStr: string;               // YYYY-MM-DD
  timeFormatted: string;         // '10:14 AM'
  category: WorkoutCategory;
  name: string;                  // 'Half Pull-ups', 'Barbell Squats', etc.
  reps?: number;
  weightKg?: number;             // Fixed 30kg for barbell
  distanceKm?: number;           // 5.0 for walks
}

export interface StickyDefaults {
  pullupReps: number;            // Default 4
  pushupReps: number;            // Default 10
  barbellReps: number;           // Default 10
  selectedLift: BarbellExercise; // Default 'Squats'
}

// ==========================================
// 2. Focus (Interview Prep) Domain
// ==========================================
export type SubjectArea = 'Angular' | 'DotNet' | 'FullStack' | 'SystemDesignDSA';

export interface InterviewQuestion {
  id: string;
  topic: SubjectArea;
  questionText: string;
  type: 'deep' | 'flash' | 'mock_coding' | 'leetcode_dsa';
  completed: boolean;
  userHypothesis?: string;
  activeSeconds: number;
  breakSeconds: number;
}

// ==========================================
// 3. Habits & Peer Sync Domain
// ==========================================
export interface HabitDayLog {
  dateStr: string;
  wokeUpTime?: string;
  bedTime?: string;
  reading20m: boolean;
  cleanMindStreak: number;
  mediaDetoxStreak: number;
  privateRelapseNote?: string;   // NEVER shared across peer link
}

export interface PeerSharePayload {
  pairCode: string;              // e.g. 'PAIR-4X8K2Q'
  displayName: string;
  dateStr: string;
  totalPullups: number;
  totalPushups: number;
  totalBarbellTonnage: number;
  totalWalkKm: number;
  studyQuestionsCompleted: number;
  habitsChecked: boolean;
}
```

---

## 4. Mobile Ergonomics & 144Hz pOLED Performance Budget

1. **Touch Target Sizing (Fitts's Law):**
   * Every clickable element has a minimum physical size of **48 × 48 px**.
   * Stepper buttons (`[ − ]` and `[ + ]`) have generous padding and distinct coordinates from the `[ LOG ]` button to prevent accidental mis-taps.
2. **Touch Delay Elimination:**
   * Global `touch-action: manipulation` applied to eliminate the 300ms double-tap gesture delay on mobile browsers.
3. **Tactile Haptic Feedback:**
   * Uses `navigator.vibrate([15])` defensive wrapper:
     ```javascript
     function triggerHaptic(duration = 15) {
       if ('vibrate' in navigator) {
         try { navigator.vibrate(duration); } catch (e) {}
       }
     }
     ```
4. **Instantaneous Visual Feedback:**
   * Active CSS scaling (`active:scale-95`) provides sub-16ms visual feedback even if device battery saver disables physical vibration.
5. **Compositor Isolation:**
   * All dynamic elements utilize `transform: translate3d(0, 0, 0)` and `will-change: transform` to run animations on the GPU compositor thread, guaranteeing 144Hz fluid motion without frame stutter.

---

## 5. Deployment Architecture (Azure Static Web Apps)

```
[Local Git Repo]
       │
       │ (git push origin main)
       ▼
[GitHub Repository]
       │
       ▼ (GitHub Actions Runner: ubuntu-latest)
[Workflow: .github/workflows/azure-static-web-apps.yml]
   ├── Step 1: Checkout repository
   ├── Step 2: Validate TypeScript (tsc --noEmit)
   ├── Step 3: Run unit & assertion tests
   ├── Step 4: Build production bundle (Vite)
   └── Step 5: Azure Static Web Apps Deploy Action
       │
       ▼
[Azure Global CDN + Free SSL] ──► Live on Motorola Edge 50 Pro & MacBook
```
