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

// ==========================================
// 5. Dynamic User Profile & Settings Types
// ==========================================
export interface UserMoveConfig {
  equipmentMode: 'barbell_home' | 'dumbbells' | 'bodyweight_only';
  barbellWeightKg: number;
  enabledExercises: string[];
  stepper1: {
    title: string;
    category: WorkoutCategory;
    defaultReps: number;
  };
  stepper2: {
    title: string;
    category: WorkoutCategory;
    defaultReps: number;
  };
  cardio: {
    defaultWalkSteps: number;
    dailyCardioStepsTarget: number;
  };
  targets: DailyTargets;
}

export interface FocusPresetConfig {
  id: string;
  label: string;
  studyMinutes: number;
  breakMinutes: number;
  warningMinutes: number;
  description: string;
}

export interface CurriculumTrackConfig {
  id: string;
  title: string;
  description?: string;
  days: CurriculumDayConfig[];
}

export interface UserFocusConfig {
  timerPresets: FocusPresetConfig[];
  activePresetId: string;
  dailyStudyTargetHours: number;
  dailyDsaTargetProblems: number;
  curriculumTrackId: string;
  curriculumTracks: CurriculumTrackConfig[];
}

export interface KeystoneConfig {
  id: string;
  label: string;
  isCore: boolean;
  iconName?: string;
}

export interface UserHabitsConfig {
  sleepTargetHours: number;
  sleepOptimalWindowDelta: number;
  hydrationTargetMl: number;
  containerMl: number;
  quickAddAmounts: number[];
  readingTargetPages: number;
  keystones: KeystoneConfig[];
}

export interface UserProfile {
  id: string;
  name: string;
  createdAt: number;
  avatarColor: string;
  moveConfig: UserMoveConfig;
  focusConfig: UserFocusConfig;
  habitsConfig: UserHabitsConfig;
}

export const DEFAULT_MOVE_CONFIG: UserMoveConfig = {
  equipmentMode: 'barbell_home',
  barbellWeightKg: 30,
  enabledExercises: [
    'Squats',
    'Overhead Press',
    'Bicep Curls',
    'Bent Rows',
    'RDLs',
    'Deadlifts',
  ],
  stepper1: {
    title: 'Half Pull-ups',
    category: 'pullup',
    defaultReps: 4,
  },
  stepper2: {
    title: 'Push-ups',
    category: 'pushup',
    defaultReps: 10,
  },
  cardio: {
    defaultWalkSteps: 5000,
    dailyCardioStepsTarget: 8000,
  },
  targets: DEFAULT_TARGETS,
};

export const DEFAULT_FOCUS_CONFIG: UserFocusConfig = {
  timerPresets: [
    {
      id: '50m',
      label: '50m',
      studyMinutes: 50,
      breakMinutes: 10,
      warningMinutes: 15,
      description: '50m Hard Stop · 15m Early Answer Warning',
    },
    {
      id: '30m',
      label: '30m',
      studyMinutes: 30,
      breakMinutes: 5,
      warningMinutes: 6,
      description: '30m Rapid Verbal Checks · 6m each',
    },
    {
      id: '60m',
      label: '60m',
      studyMinutes: 60,
      breakMinutes: 10,
      warningMinutes: 25,
      description: '60m Hands-on Build · 25m Lookup Rule',
    },
    {
      id: '25m',
      label: '25m',
      studyMinutes: 25,
      breakMinutes: 5,
      warningMinutes: 5,
      description: '25m Pomodoro · 5m Restoration Break',
    },
  ],
  activePresetId: '50m',
  dailyStudyTargetHours: 5.5,
  dailyDsaTargetProblems: 2,
  curriculumTrackId: 'dotnet_angular',
  curriculumTracks: [
    {
      id: 'dotnet_angular',
      title: '.NET & Angular Senior Bootcamp',
      description: 'Structured 7-day technical interview acceleration track',
      days: [
        { day: 1, title: 'Day 1: Angular Forms & Interceptors', tomorrow: 'Day 2: Backend 1 (.NET & Memory)', category: 'Angular' },
        { day: 2, title: 'Day 2: Backend 1 (.NET & Memory)', tomorrow: 'Day 3: Frontend 2 (RxJS Basics)', category: '.NET' },
        { day: 3, title: 'Day 3: Frontend 2 (RxJS Basics)', tomorrow: 'Day 4: Backend 2 (Web API Basics)', category: 'Angular' },
        { day: 4, title: 'Day 4: Backend 2 (Web API Basics)', tomorrow: 'Day 5: Frontend 3 (State & Components)', category: '.NET' },
        { day: 5, title: 'Day 5: Frontend 3 (State & Components)', tomorrow: 'Day 6: Backend 3 (EF Core & SQL)', category: 'Angular' },
        { day: 6, title: 'Day 6: Backend 3 (EF Core & SQL)', tomorrow: 'Day 7: Cloud & Behavioral Review', category: '.NET' },
        { day: 7, title: 'Day 7: Cloud & Behavioral Review', tomorrow: 'Week 2 Launch', category: 'Azure & STAR' },
      ],
    },
    {
      id: 'fullstack_ts',
      title: 'Fullstack TypeScript & Systems',
      description: 'React, Node.js, Distributed Systems & Cloud Architecture',
      days: [
        { day: 1, title: 'Day 1: React 19 Compiler & Server Actions', tomorrow: 'Day 2: Node.js Streams & Concurrency', category: 'Frontend' },
        { day: 2, title: 'Day 2: Node.js Streams & Event Loop', tomorrow: 'Day 3: PostgreSQL Indexing & Query Plans', category: 'Backend' },
        { day: 3, title: 'Day 3: PostgreSQL Indexing & ACID', tomorrow: 'Day 4: Redis Caching & Distributed Locks', category: 'Database' },
        { day: 4, title: 'Day 4: Redis & Message Queues (Kafka/RabbitMQ)', tomorrow: 'Day 5: Microservices & gRPC', category: 'Systems' },
        { day: 5, title: 'Day 5: System Design (Rate Limiters & URL Shortener)', tomorrow: 'Day 6: Cloud Native Deployment', category: 'Design' },
        { day: 6, title: 'Day 6: Docker, Kubernetes & Observability', tomorrow: 'Day 7: Live Mock Architecture', category: 'Cloud' },
        { day: 7, title: 'Day 7: Comprehensive Live Coding & Behavioral STAR', tomorrow: 'Track Review', category: 'STAR' },
      ],
    },
  ],
};

export const DEFAULT_HABITS_CONFIG: UserHabitsConfig = {
  sleepTargetHours: 8.0,
  sleepOptimalWindowDelta: 0.5,
  hydrationTargetMl: 3500,
  containerMl: 700,
  quickAddAmounts: [700, 350],
  readingTargetPages: 20,
  keystones: [
    { id: 'cleanDiet', label: 'Clean Nutrition', isCore: true, iconName: 'Apple' },
    { id: 'zeroDoomscroll', label: 'Zero Doomscrolling', isCore: true, iconName: 'Smartphone' },
    { id: 'dailySupplements', label: 'Daily Supplements', isCore: true, iconName: 'Pill' },
    { id: 'bedMade', label: 'Bed Made Upon Waking', isCore: true, iconName: 'CheckCheck' },
    { id: 'roomReset', label: 'Evening Desk Reset', isCore: false, iconName: 'Sparkles' },
  ],
};

export const DEFAULT_USER_PROFILE: UserProfile = {
  id: 'profile_default',
  name: 'Solo Athlete',
  createdAt: 1725400000000,
  avatarColor: 'sky',
  moveConfig: DEFAULT_MOVE_CONFIG,
  focusConfig: DEFAULT_FOCUS_CONFIG,
  habitsConfig: DEFAULT_HABITS_CONFIG,
};

