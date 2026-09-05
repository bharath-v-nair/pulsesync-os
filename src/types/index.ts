// ==========================================
// 1. Move (Workout) Domain Types
// ==========================================
export type WorkoutCategory = 'pullup' | 'pushup' | 'barbell' | 'walk' | 'machine_cardio' | 'wake_up';

export type BarbellExercise = 
  | 'Squats'
  | 'Overhead Press'
  | 'Bicep Curls'
  | 'Bent Rows'
  | 'RDLs'
  | 'Deadlifts';

export interface WorkoutLog {
  id: string;
  timestamp: number;
  dateStr: string;        // 'YYYY-MM-DD'
  timeFormatted: string;  // '10:14 AM'
  category: WorkoutCategory;
  name: string;
  reps?: number;
  weightKg?: number;
  distanceKm?: number;
  minutes?: number;
  steps?: number;
  tensionLevel?: number;
  startTime?: string;
  endTime?: string;
  machineType?: 'elliptical' | 'cycle';
}

export interface DailyTargets {
  pullups: number;
  pushups: number;
  tonnage: number;
  cardioSteps: number;
}

export const DEFAULT_TARGETS: DailyTargets = {
  pullups: 20,
  pushups: 50,
  tonnage: 900,
  cardioSteps: 8000,
};

export interface StickyDefaults {
  pullupReps: number;
  pushupReps: number;
  barbellReps: number;
  selectedLift: BarbellExercise;
  stepIncrement: number;
  machineMins: number;
  machineType: 'elliptical' | 'cycle';
  ellipticalMins?: number;
}

// ==========================================
// 2. Focus (Interview & Study) Domain Types
// ==========================================
export type SubjectArea = 'Angular' | 'DotNet' | 'FullStack' | 'SystemDesignDSA';
export type FocusCategory = 'Angular' | '.NET' | 'LeetCode' | 'SystemDesign' | 'Azure' | 'Behavioral' | 'General';
export type FocusBucket = 'deep' | 'spaced' | 'live' | 'dsa' | 'shallow' | 'azure' | 'apps';

export interface FocusTask {
  id: string;
  code?: string;
  title: string;
  category: string;
  bucket: FocusBucket;
  curriculumDay: number;
  dateStr?: string;
  completed: boolean;
  completedAt?: string | null;
  startedAt?: string | null;
  durationMinutes?: number;
  notes?: string;
  userHypothesis?: string;
  activeSeconds?: number;
  breakSeconds?: number;
}

export type InterviewQuestion = FocusTask;

export interface FocusSession {
  id: string;
  splitGroupId?: string;
  taskId?: string | null;
  taskTitle: string;
  subject?: string; // backwards compatibility alias for taskTitle
  category: string;
  bucket: FocusBucket;
  dateStr: string;
  startTimestamp: number;
  startTimeFormatted: string;
  endTimestamp: number;
  endTimeFormatted: string;
  durationSeconds: number;
  durationMinutes?: number; // backwards compatibility alias
  timestamp?: number; // backwards compatibility alias for startTimestamp
  notes?: string;
  description?: string;
}

export interface FocusTimerState {
  isRunning: boolean;
  phase: 'study' | 'break';
  preset: '50m' | '30m' | '60m' | '10m';
  totalSeconds: number;
  remainingSeconds: number;
  startTimestamp: number | null;
  endTimestamp: number | null;
  lastTickTimestamp?: number | null;
  boundTaskId: string | null;
  warningTriggered: boolean;
}

export interface CurriculumDayConfig {
  day: number;
  title: string;
  tomorrow: string;
  category: string;
}

export interface FocusData {
  currentCurriculumDay: number;
  jobAppsCount: number;
  azureMinutes: number;
  azureAiHours?: number;
  totalStudyMinutes?: number;
  todayStudyMinutes?: number;
  tasks: FocusTask[];
  sessions: FocusSession[];
  currentSession?: FocusSession | null;
  timerState?: FocusTimerState;
  dailyHistory?: Record<string, {
    studySeconds?: number;
    studyHours?: number;
    jobApps?: number;
    azureMinutes?: number;
    completedTasks?: number;
  }>;
  stats: {
    totalStudySeconds: number;
    completedQuestions: number;
    dsaSolvedToday: number;
  };
}

// ==========================================
// 3. Habits & Discipline Domain Types
// ==========================================
export interface HydrationRecord {
  currentMl: number;        // Total volume consumed today in ml (clamped >= 0)
  targetMl: number;         // Calibrated baseline goal in ml (default 3500)
  quickAdds: number[];      // 1-tap micro-log quick adds (default [250, 500])
  quickAddUnits?: number[]; // Backwards compatibility alias for quickAdds
  lastLoggedAt?: string;    // ISO timestamp of most recent fluid entry
}

export interface SleepRecord {
  bedtimeRaw: string;            // 24h format e.g. '23:15'
  wakeupRaw: string;             // 24h format e.g. '07:15'
  sleepDuration: string;         // Formatted duration string e.g. '8h 00m'
  sleepDurationHours: number;    // Numeric decimal hours e.g. 8.0
  isOptimal: boolean;            // Matthew Walker optimal window (7.5h <= duration <= 8.5h)
  sunlightDone: boolean;         // Huberman morning sunlight anchor (10m within 30m of waking)
  sleepDebtHours?: number;       // Acute daily/accumulated sleep debt vs 8.0h baseline
  targetHours: number;           // Calibrated baseline target hours (default 8.0)
}

export interface KeystonesState {
  cleanDiet?: boolean;           // Whole foods nutrition, zero processed sugar
  zeroDoomscroll?: boolean;      // Zero short-form algorithmic reels/shorts/tiktok
  dailySupplements?: boolean;    // Daily micronutrient & electrolyte stack
  bedMade: boolean;              // Immediate post-waking environmental reset
  roomReset: boolean;            // Evening workspace & room order reset
}

export interface DetoxState {
  cleanDays: number;             // Unbroken consecutive clean day streak
  tierName: string;              // Calibrated | Disciplined | Fortified | Unbreakable | Sovereign
  cleanDiet?: boolean;           // Keystone discipline marker
  zeroDoomscroll?: boolean;      // Keystone discipline marker
  dailySupplements?: boolean;    // Keystone discipline marker
  bedMade?: boolean;             // Keystone discipline marker
  // Legacy fields preserved for backward compatibility with existing components
  morningPhoneFree?: boolean;
  zeroReels?: boolean;
  noPhoneInBed?: boolean;
  relapseHistory?: string[];
}

export interface Book {
  id: string;
  title: string;
  author: string;
  totalPages: number;
  currentPage: number;
  completed: boolean;
  category?: string;
  coverColor?: string;
}

export interface ReadingState {
  activeBookId: string;
  books: Book[];
  startPage: number;
  endPage: number;
  pagesReadToday: number;
  timerSeconds: number;          // Countdown timer seconds (default 1200 / 20m)
  isTimerRunning: boolean;
  targetPagesPerDay: number;     // Daily reading target (default 20)
  currentBook?: string;          // Legacy compatibility
  history?: any[];               // Legacy compatibility
}

export interface DailyHabitRecord {
  // Circadian Sleep Pillar
  sleepDurationHours?: number;   // Decimal sleep hours e.g. 8.0
  sleepDuration?: string;        // Formatted duration e.g. '8h 00m'
  bedtimeRaw?: string;           // Bedtime timestamp e.g. '23:15'
  wakeupRaw?: string;            // Wakeup timestamp e.g. '07:15'
  sunlightDone?: boolean;        // Morning sunlight anchor
  isOptimal?: boolean;           // Within optimal window
  sleepDebtHours?: number;       // Debt against 8.0h baseline
  sleepMinutes?: number;         // Legacy seed compatibility e.g. 380

  // Fluid Dynamics Pillar
  hydrationMl?: number;          // Total ml logged for date e.g. 3500
  hydrationCurrentMl?: number;   // Compatibility alias for hydrationMl
  hydrationTargetMl?: number;    // Daily target ml e.g. 3500

  // Keystone Discipline & Clean Day Matrix Pillar
  cleanDay?: boolean;            // Immutable clean day flag (cleanDiet && zeroDoomscroll && dailySupplements && bedMade)
  cleanDiet?: boolean;           // Whole foods nutrition
  zeroDoomscroll?: boolean;      // Zero short-form feeds
  dailySupplements?: boolean;    // Micronutrient & electrolyte stack
  bedMade?: boolean;             // Morning environmental reset
  roomReset?: boolean;           // Evening workspace reset

  // Deep Reading Pillar
  pagesRead?: number;            // Pages read on this date e.g. 22
  readingMinutes?: number;       // Minutes spent reading e.g. 20
  activeBookId?: string;         // ID of book read

  // Metadata
  loggedAt?: string;             // ISO timestamp
}

export type DailyRecord = DailyHabitRecord;

export interface HabitsData {
  hydration: HydrationRecord;
  sleep: SleepRecord;
  detox: DetoxState;
  reading: ReadingState;
  keystones: KeystonesState;
  dailyRecords: Record<string, DailyHabitRecord>;
}

// ==========================================
// 4. UI View Navigation State
// ==========================================
export type AppTab = 'move' | 'focus' | 'habits';
export type ActiveView = AppTab | 'overview' | 'library';
