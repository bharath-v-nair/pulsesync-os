// ==========================================
// 1. Move (Workout) Domain Types
// ==========================================
export type WorkoutCategory = 'pullup' | 'pushup' | 'dips' | 'barbell' | 'walk' | 'machine_cardio' | 'wake_up' | 'bodyweight';

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
  dips?: number;
  pushups: number;
  tonnage: number;
  cardioSteps: number;
}

export const DEFAULT_TARGETS: DailyTargets = {
  pullups: 20,
  dips: 30,
  pushups: 50,
  tonnage: 900,
  cardioSteps: 8000,
};

export interface StickyDefaults {
  pullupReps: number;
  dipsReps?: number;
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
  lastActiveDate?: string;
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

export interface SleepSession {
  id: string;
  bedtimeRaw: string;            // 24h format e.g. '23:00' or '11:00'
  wakeupRaw: string;             // 24h format e.g. '03:00' or '16:00'
  durationHours: number;         // Decimal hours e.g. 4.0 or 5.0
  durationFormatted: string;     // Formatted string e.g. '4h 00m' or '5h 00m'
  label?: string;                // e.g. 'Primary Sleep', 'Second Sleep / Nap'
}

export interface SleepRecord {
  bedtimeRaw: string;            // 24h format e.g. '23:15'
  wakeupRaw: string;             // 24h format e.g. '07:15'
  sleepDuration: string;         // Combined formatted duration string e.g. '8h 00m' or '9h 00m'
  sleepDurationHours: number;    // Combined numeric decimal hours e.g. 8.0 or 9.0
  isOptimal: boolean;            // Matthew Walker optimal window (7.5h <= duration <= 8.5h)
  sunlightDone: boolean;         // Huberman morning sunlight anchor (10m within 30m of waking)
  sleepDebtHours?: number;       // Acute daily/accumulated sleep debt vs 8.0h baseline
  targetHours: number;           // Calibrated baseline target hours (default 8.0)
  sessions?: SleepSession[];     // Optional segmented/biphasic sleep sessions
}

export interface KeystonesState {
  cleanDiet?: boolean;           // Whole foods nutrition, zero processed sugar
  zeroDoomscroll?: boolean;      // Zero short-form algorithmic reels/shorts/tiktok
  dailySupplements?: boolean;    // Daily micronutrient & electrolyte stack (backward compatibility)
  multivitaminLunch?: boolean;   // Multivitamin after lunch
  magnesiumSleep?: boolean;      // Magnesium Glycinate before sleep
  proteinShake?: boolean;        // Daily protein shake
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
  sleepSessions?: SleepSession[]; // Optional segmented/biphasic sleep sessions

  // Fluid Dynamics Pillar
  hydrationMl?: number;          // Total ml logged for date e.g. 3500
  hydrationCurrentMl?: number;   // Compatibility alias for hydrationMl
  hydrationTargetMl?: number;    // Daily target ml e.g. 3500

  // Keystone Discipline & Clean Day Matrix Pillar
  cleanDay?: boolean;            // Immutable clean day flag (cleanDiet && zeroDoomscroll && dailySupplements && bedMade)
  cleanDiet?: boolean;           // Whole foods nutrition
  zeroDoomscroll?: boolean;      // Zero short-form feeds
  dailySupplements?: boolean;    // Micronutrient & electrolyte stack
  multivitaminLunch?: boolean;   // Multivitamin after lunch
  magnesiumSleep?: boolean;      // Magnesium Glycinate before sleep
  proteinShake?: boolean;        // Daily protein shake
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
  lastActiveDate?: string;
}

// ==========================================
// 4. UI View Navigation State
// ==========================================
export type AppTab = 'move' | 'focus' | 'habits';
export type ActiveView = AppTab | 'overview' | 'library';

// ==========================================
// 5. Dynamic User Profile & Settings Types
// ==========================================
export interface WorkoutLocation {
  id: string;
  name: string;
  equipmentMode: 'barbell_home' | 'dumbbells' | 'bodyweight_only';
  barbellWeightKg?: number;
  dumbbellWeightKg?: number;
  hasBarbell?: boolean;
  hasPullupBar?: boolean;
  hasDipsBar?: boolean;
  hasDumbbells?: boolean;
  notes?: string;
}

export interface PhysicalProfile {
  heightCm: number;
  weightKg: number;
  targetWeightKg?: number;
  primaryGoal: string;
}

export interface FocusQuestionTargets {
  deepAnchors: number;
  spacedChecks: number;
  liveCoding: number;
  dsaProblems: number;
}

export interface UserMoveConfig {
  equipmentMode: 'barbell_home' | 'dumbbells' | 'bodyweight_only';
  barbellWeightKg: number;
  dumbbellWeightKg?: number;
  locations?: WorkoutLocation[];
  activeLocationId?: string;
  enabledExercises: string[];
  enabledDumbbellExercises?: string[];
  enabledBodyweightExercises?: string[];
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
  stepper3?: {
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
  questionTargets?: FocusQuestionTargets;
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
  physicalProfile?: PhysicalProfile;
  moveConfig: UserMoveConfig;
  focusConfig: UserFocusConfig;
  habitsConfig: UserHabitsConfig;
}

export const DEFAULT_WORKOUT_LOCATIONS: WorkoutLocation[] = [
  {
    id: 'loc_mothers',
    name: "Mother's Home",
    equipmentMode: 'barbell_home',
    barbellWeightKg: 30,
    hasBarbell: true,
    hasPullupBar: true,
    hasDipsBar: true,
    hasDumbbells: false,
    notes: '30kg Barbell, Pull-up Bar, Dips Bar & Push-ups',
  },
  {
    id: 'loc_gym',
    name: 'Commercial Gym',
    equipmentMode: 'barbell_home',
    barbellWeightKg: 60,
    hasBarbell: false,
    hasPullupBar: false,
    hasDipsBar: false,
    hasDumbbells: false,
    notes: 'Commercial gym facility (custom routine configured when gym visits begin)',
  },
];

export const DEFAULT_DUMBBELL_EXERCISES = [
  'DB Overhead Press',
  'Incline DB Bench',
  'Goblet Squats',
  'Bent-Over DB Rows',
  'Lateral Raises',
  'Incline Hammer Curls',
  'Romanian DB Deadlift',
];

export const DEFAULT_BODYWEIGHT_EXERCISES = [
  'Half Pull-ups',
  'Parallel Dips',
  'Push-ups',
  'Pike Push-ups',
  'Bodyweight Squats',
  'Walking Lunges',
  'Plank Hold',
];

export const DEFAULT_MOVE_CONFIG: UserMoveConfig = {
  equipmentMode: 'barbell_home',
  barbellWeightKg: 30,
  dumbbellWeightKg: 15,
  locations: DEFAULT_WORKOUT_LOCATIONS,
  activeLocationId: 'loc_mothers',
  enabledExercises: [
    'Squats',
    'Overhead Press',
    'Bicep Curls',
    'Bent Rows',
    'RDLs',
    'Deadlifts',
  ],
  enabledDumbbellExercises: DEFAULT_DUMBBELL_EXERCISES,
  enabledBodyweightExercises: DEFAULT_BODYWEIGHT_EXERCISES,
  stepper1: {
    title: 'Half Pull-ups',
    category: 'pullup',
    defaultReps: 4,
  },
  stepper2: {
    title: 'Parallel Dips',
    category: 'dips',
    defaultReps: 8,
  },
  stepper3: {
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
  dailyDsaTargetProblems: 1,
  questionTargets: {
    deepAnchors: 3,
    spacedChecks: 5,
    liveCoding: 1,
    dsaProblems: 1,
  },
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
      id: 'azure_ai_cert',
      title: 'Azure AI Certification Track (AI-900 & AI-102)',
      description: 'AI-900 Fundamentals & AI-102 Azure AI Engineer Associate with Semantic Kernel & Vector Search',
      days: [
        { day: 1, title: 'Day 1: AI-900 Core Workloads & Azure OpenAI Service', tomorrow: 'Day 2: Computer Vision & OCR', category: 'Azure AI' },
        { day: 2, title: 'Day 2: Azure AI Vision & Document Intelligence', tomorrow: 'Day 3: Language & Sentiment Analysis', category: 'Azure AI' },
        { day: 3, title: 'Day 3: Azure AI Language & Conversational QA', tomorrow: 'Day 4: Azure AI Search & Vector RAG', category: 'Azure AI' },
        { day: 4, title: 'Day 4: AI-102 Azure AI Search, Embeddings & RAG', tomorrow: 'Day 5: Generative AI & Semantic Kernel', category: 'Azure AI' },
        { day: 5, title: 'Day 5: Semantic Kernel & Multi-Agent Orchestration', tomorrow: 'Day 6: Responsible AI & Content Safety', category: 'Azure AI' },
        { day: 6, title: 'Day 6: Responsible AI, Prompt Flow & Evaluation', tomorrow: 'Day 7: Full Practice Exam & Certification Drill', category: 'Azure AI' },
        { day: 7, title: 'Day 7: Full AI-102 Exam Simulation & Scenario Drill', tomorrow: 'Certification Completion', category: 'Certification' },
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
    { id: 'cleanDiet', label: 'Clean Nutrition (Zero Junk)', isCore: true, iconName: 'Apple' },
    { id: 'zeroDoomscroll', label: 'Zero Doomscrolling (Morning & Bed)', isCore: true, iconName: 'Smartphone' },
    { id: 'multivitaminLunch', label: 'Multivitamin (After Lunch)', isCore: true, iconName: 'Pill' },
    { id: 'magnesiumSleep', label: 'Magnesium Glycinate (Before Sleep)', isCore: true, iconName: 'Moon' },
    { id: 'proteinShake', label: 'Daily Protein Shake', isCore: true, iconName: 'Zap' },
    { id: 'bedMade', label: 'Bed Made Upon Waking', isCore: true, iconName: 'CheckCheck' },
    { id: 'roomReset', label: 'Evening Desk Reset', isCore: false, iconName: 'Sparkles' },
  ],
};

export const DEFAULT_PHYSICAL_PROFILE: PhysicalProfile = {
  heightCm: 175,
  weightKg: 90,
  targetWeightKg: 78,
  primaryGoal: 'Lose love handles & man boobs, build lean muscle, athletic aesthetics',
};

export const DEFAULT_USER_PROFILE: UserProfile = {
  id: 'profile_default',
  name: 'Bharath Nair',
  createdAt: 1725400000000,
  avatarColor: 'sky',
  physicalProfile: DEFAULT_PHYSICAL_PROFILE,
  moveConfig: DEFAULT_MOVE_CONFIG,
  focusConfig: DEFAULT_FOCUS_CONFIG,
  habitsConfig: DEFAULT_HABITS_CONFIG,
};


