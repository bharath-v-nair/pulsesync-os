// PulseSync Life OS - Week 1 Foundation Bootcamp & Move Engine
(function () {
  'use strict';

  // --- Storage Keys ---
  const STORAGE_KEY_LOGS = 'pulsesync_logs_v3';
  const STORAGE_KEY_DEFAULTS = 'pulsesync_defaults_v3';
  const STORAGE_KEY_FOCUS = 'pulsesync_focus_v6';

  const TARGETS = {
    pullups: 20,
    pushups: 50,
    tonnage: 900,
    steps: 8000
  };

  const BARBELL_EXERCISES = [
    'Squats', 'Overhead Press', 'Bicep Curls', 'Bent Rows', 'RDLs', 'Deadlifts'
  ];

  const CURRICULUM_DAYS = [
    {
      day: 1,
      title: 'Day 1: Frontend 1 — Angular Forms & Interceptors',
      subtitle: '3 Deep Anchors · 5 Spaced Checks · 1 Live Coding · 1 C# DSA',
      category: 'Angular'
    },
    {
      day: 2,
      title: 'Day 2: Backend 1 — C# Fundamentals & Memory',
      subtitle: '3 Deep Anchors · 5 Spaced Checks · 1 Live Coding · 1 C# DSA',
      category: '.NET'
    },
    {
      day: 3,
      title: 'Day 3: Frontend 2 — RxJS Basics & Observables',
      subtitle: '3 Deep Anchors · 5 Spaced Checks · 1 Live Coding · 1 C# DSA',
      category: 'Angular'
    },
    {
      day: 4,
      title: 'Day 4: Backend 2 — ASP.NET Core Web API Basics 🚀',
      subtitle: '3 Deep Anchors · 5 Spaced · 1 Live · 1 DSA · [10 Job Applications]',
      category: '.NET'
    },
    {
      day: 5,
      title: 'Day 5: Frontend 3 — Components & State Basics',
      subtitle: '3 Deep Anchors · 5 Spaced · 1 Live · 1 DSA · [10 Job Applications]',
      category: 'Angular'
    },
    {
      day: 6,
      title: 'Day 6: Backend 3 — EF Core & SQL Basics',
      subtitle: '3 Deep Anchors · 5 Spaced · 1 Live · 1 DSA · [10 Job Applications]',
      category: '.NET'
    },
    {
      day: 7,
      title: 'Day 7: Cloud & Behavioral Basics (Cap & Review)',
      subtitle: '3 Deep Anchors · 5 Spaced · Live Recap · Review DSA · Audit Applications',
      category: 'Azure & STAR'
    }
  ];

  const DEFAULT_BOOTCAMP_TASKS = [
    // --- DAY 1 ---
    { id: 'd1_deep_1', code: 'NG-09', title: '[NG-09] Reactive Forms vs Template-Driven Forms (FormGroup, FormControl, basic Validators)', category: 'Angular', bucket: 'deep', curriculumDay: 1, dateStr: getTodayDateStr(), completed: false, completedAt: null },
    { id: 'd1_deep_2', code: 'NG-08', title: '[NG-08] Route Guards (CanActivate basics) vs Resolvers (trade-offs & failure modes)', category: 'Angular', bucket: 'deep', curriculumDay: 1, dateStr: getTodayDateStr(), completed: false, completedAt: null },
    { id: 'd1_deep_3', code: 'NG-11', title: '[NG-11] HTTP Interceptors (injecting Bearer token, basic 401 redirect handling)', category: 'Angular', bucket: 'deep', curriculumDay: 1, dateStr: getTodayDateStr(), completed: false, completedAt: null },
    { id: 'd1_spd_1', code: 'NG-01', title: '[NG-01] Component vs Directive in 60 seconds', category: 'Angular', bucket: 'spaced', curriculumDay: 1, dateStr: getTodayDateStr(), completed: false, completedAt: null },
    { id: 'd1_spd_2', code: 'NG-02', title: '[NG-02] Data Binding types (Interpolation vs Property vs Event)', category: 'Angular', bucket: 'spaced', curriculumDay: 1, dateStr: getTodayDateStr(), completed: false, completedAt: null },
    { id: 'd1_spd_3', code: 'NG-06', title: '[NG-06] Constructor vs ngOnInit (when to initialize subscriptions)', category: 'Angular', bucket: 'spaced', curriculumDay: 1, dateStr: getTodayDateStr(), completed: false, completedAt: null },
    { id: 'd1_spd_4', code: 'NG-03', title: '[NG-03] What does providedIn: root mean in Angular DI?', category: 'Angular', bucket: 'spaced', curriculumDay: 1, dateStr: getTodayDateStr(), completed: false, completedAt: null },
    { id: 'd1_spd_5', code: 'NG-15', title: '[NG-15] Smart vs Dumb Components (@Input, @Output communication)', category: 'Angular', bucket: 'spaced', curriculumDay: 1, dateStr: getTodayDateStr(), completed: false, completedAt: null },
    { id: 'd1_live_1', code: 'LIVE-01', title: 'Live Coding: Build an Angular Reactive Form with 2 fields (Email, Amount) & basic validation', category: 'Angular', bucket: 'live', curriculumDay: 1, dateStr: getTodayDateStr(), completed: false, completedAt: null },
    { id: 'd1_dsa_1', code: 'DSA-01', title: 'C# NeetCode DSA: LeetCode Easy — Two Sum (Hash Map O(N) time, O(N) space)', category: 'LeetCode', bucket: 'dsa', curriculumDay: 1, dateStr: getTodayDateStr(), completed: false, completedAt: null },

    // --- DAY 2 ---
    { id: 'd2_deep_1', code: 'CS-01', title: '[CS-01] Value Types vs Reference Types (Stack vs Heap memory allocation)', category: '.NET', bucket: 'deep', curriculumDay: 2, dateStr: getTodayDateStr(), completed: false, completedAt: null },
    { id: 'd2_deep_2', code: 'CS-02', title: '[CS-02, CS-03] class vs struct vs record (immutability and value equality)', category: '.NET', bucket: 'deep', curriculumDay: 2, dateStr: getTodayDateStr(), completed: false, completedAt: null },
    { id: 'd2_deep_3', code: 'WA-04', title: '[WA-04] Dependency Injection in .NET Core (Transient, Scoped, Singleton lifetimes)', category: '.NET', bucket: 'deep', curriculumDay: 2, dateStr: getTodayDateStr(), completed: false, completedAt: null },
    { id: 'd2_spd_1', code: 'CS-04', title: '[CS-04] Why are strings immutable in C#? What does StringBuilder do?', category: '.NET', bucket: 'spaced', curriculumDay: 2, dateStr: getTodayDateStr(), completed: false, completedAt: null },
    { id: 'd2_spd_2', code: 'CS-09', title: '[CS-09] Nullable reference types (string?) and null operators (??, ?.)', category: '.NET', bucket: 'spaced', curriculumDay: 2, dateStr: getTodayDateStr(), completed: false, completedAt: null },
    { id: 'd2_spd_3', code: 'WA-07', title: '[WA-07] Basic REST verbs and status codes (200, 201, 204, 400, 404, 500)', category: '.NET', bucket: 'spaced', curriculumDay: 2, dateStr: getTodayDateStr(), completed: false, completedAt: null },
    { id: 'd2_spd_4', code: 'NG-09', title: '[NG-09] Reactive Forms key classes (Day 1 recall)', category: 'Angular', bucket: 'spaced', curriculumDay: 2, dateStr: getTodayDateStr(), completed: false, completedAt: null },
    { id: 'd2_spd_5', code: 'NG-11', title: '[NG-11] Interceptor flow & Bearer tokens (Day 1 recall)', category: 'Angular', bucket: 'spaced', curriculumDay: 2, dateStr: getTodayDateStr(), completed: false, completedAt: null },
    { id: 'd2_live_1', code: 'LIVE-02', title: 'Live Coding: Build an ASP.NET Core Controller with constructor injection of a service', category: '.NET', bucket: 'live', curriculumDay: 2, dateStr: getTodayDateStr(), completed: false, completedAt: null },
    { id: 'd2_dsa_1', code: 'DSA-02', title: 'C# NeetCode DSA: LeetCode Easy — Valid Palindrome (Two Pointers O(N) time, O(1) space)', category: 'LeetCode', bucket: 'dsa', curriculumDay: 2, dateStr: getTodayDateStr(), completed: false, completedAt: null },

    // --- DAY 3 ---
    { id: 'd3_deep_1', code: 'NG-04', title: '[NG-04] Observable vs Promise (lazy vs eager, stream vs single value)', category: 'Angular', bucket: 'deep', curriculumDay: 3, dateStr: getTodayDateStr(), completed: false, completedAt: null },
    { id: 'd3_deep_2', code: 'NG-07', title: '[NG-07] Subscription Memory Leaks (why they happen, using async pipe & takeUntilDestroyed)', category: 'Angular', bucket: 'deep', curriculumDay: 3, dateStr: getTodayDateStr(), completed: false, completedAt: null },
    { id: 'd3_deep_3', code: 'NG-19', title: '[NG-19] Core RxJS Operators (map, filter, and switchMap basics for search)', category: 'Angular', bucket: 'deep', curriculumDay: 3, dateStr: getTodayDateStr(), completed: false, completedAt: null },
    { id: 'd3_spd_1', code: 'NG-09', title: '[NG-09] Reactive Forms key classes (Day 1 recall)', category: 'Angular', bucket: 'spaced', curriculumDay: 3, dateStr: getTodayDateStr(), completed: false, completedAt: null },
    { id: 'd3_spd_2', code: 'NG-11', title: '[NG-11] Interceptor flow (Day 1 recall)', category: 'Angular', bucket: 'spaced', curriculumDay: 3, dateStr: getTodayDateStr(), completed: false, completedAt: null },
    { id: 'd3_spd_3', code: 'NG-03', title: '[NG-03] What does providedIn: root mean in Angular DI?', category: 'Angular', bucket: 'spaced', curriculumDay: 3, dateStr: getTodayDateStr(), completed: false, completedAt: null },
    { id: 'd3_spd_4', code: 'CS-01', title: '[CS-01] Value vs Reference Types Stack/Heap (Day 2 recall)', category: '.NET', bucket: 'spaced', curriculumDay: 3, dateStr: getTodayDateStr(), completed: false, completedAt: null },
    { id: 'd3_spd_5', code: 'WA-04', title: '[WA-04] DI Lifetimes: Transient vs Scoped vs Singleton (Day 2 recall)', category: '.NET', bucket: 'spaced', curriculumDay: 3, dateStr: getTodayDateStr(), completed: false, completedAt: null },
    { id: 'd3_live_1', code: 'LIVE-03', title: 'Live Coding: Build an Angular service with an HttpClient GET call returning an Observable stream', category: 'Angular', bucket: 'live', curriculumDay: 3, dateStr: getTodayDateStr(), completed: false, completedAt: null },
    { id: 'd3_dsa_1', code: 'DSA-03', title: 'C# NeetCode DSA: LeetCode Easy/Medium — Best Time to Buy and Sell Stock (Sliding Window O(N))', category: 'LeetCode', bucket: 'dsa', curriculumDay: 3, dateStr: getTodayDateStr(), completed: false, completedAt: null },

    // --- DAY 4 ---
    { id: 'd4_deep_1', code: 'WA-01', title: '[WA-01, AR-03] Program.cs basics: builder vs app phases; Controller vs Minimal API', category: '.NET', bucket: 'deep', curriculumDay: 4, dateStr: getTodayDateStr(), completed: false, completedAt: null },
    { id: 'd4_deep_2', code: 'WA-02', title: '[WA-02] Middleware Pipeline: what is middleware, the pipeline concept, why order matters', category: '.NET', bucket: 'deep', curriculumDay: 4, dateStr: getTodayDateStr(), completed: false, completedAt: null },
    { id: 'd4_deep_3', code: 'WA-06', title: '[WA-06] Model Binding & Validation ([ApiController] behavior, ModelState)', category: '.NET', bucket: 'deep', curriculumDay: 4, dateStr: getTodayDateStr(), completed: false, completedAt: null },
    { id: 'd4_spd_1', code: 'CS-01', title: '[CS-01] Value vs Reference Types (Day 2 recall)', category: '.NET', bucket: 'spaced', curriculumDay: 4, dateStr: getTodayDateStr(), completed: false, completedAt: null },
    { id: 'd4_spd_2', code: 'WA-04', title: '[WA-04] DI Lifetimes: Transient vs Scoped vs Singleton (Day 2 recall)', category: '.NET', bucket: 'spaced', curriculumDay: 4, dateStr: getTodayDateStr(), completed: false, completedAt: null },
    { id: 'd4_spd_3', code: 'CS-03', title: '[CS-03] When to use record vs class (Day 2 recall)', category: '.NET', bucket: 'spaced', curriculumDay: 4, dateStr: getTodayDateStr(), completed: false, completedAt: null },
    { id: 'd4_spd_4', code: 'NG-04', title: '[NG-04] Observable vs Promise (Day 3 recall)', category: 'Angular', bucket: 'spaced', curriculumDay: 4, dateStr: getTodayDateStr(), completed: false, completedAt: null },
    { id: 'd4_spd_5', code: 'NG-07', title: '[NG-07] Preventing subscription memory leaks (Day 3 recall)', category: 'Angular', bucket: 'spaced', curriculumDay: 4, dateStr: getTodayDateStr(), completed: false, completedAt: null },
    { id: 'd4_live_1', code: 'LIVE-04', title: 'Live Coding: Build an API endpoint validating an incoming DTO and returning BadRequest or Ok', category: '.NET', bucket: 'live', curriculumDay: 4, dateStr: getTodayDateStr(), completed: false, completedAt: null },
    { id: 'd4_dsa_1', code: 'DSA-04', title: 'C# NeetCode DSA: LeetCode Easy — Valid Parentheses (Stack O(N) time, O(N) space)', category: 'LeetCode', bucket: 'dsa', curriculumDay: 4, dateStr: getTodayDateStr(), completed: false, completedAt: null },
    { id: 'd4_apps_1', code: 'APP-01', title: 'Job Hunt: Submit 10 job applications on LinkedIn / Naukri (Golden Hour: 8:30–9:15 AM)', category: 'Career', bucket: 'apps', curriculumDay: 4, dateStr: getTodayDateStr(), completed: false, completedAt: null }
  ];

  // --- State: Move Engine ---
  let logs = [];
  let stickyDefaults = {
    pullupReps: 4,
    pushupReps: 10,
    barbellReps: 10,
    selectedLift: 'Squats',
    stepIncrement: 2500,
    ellipticalMins: 15
  };
  let selectedDateStr = getTodayDateStr();
  let isBarbellDrawerOpen = false;
  let undoTimeout = null;

  // --- State: Focus Engine ---
  let focusData = {
    currentCurriculumDay: 1,
    tasks: [...DEFAULT_BOOTCAMP_TASKS],
    timerState: {
      isRunning: false,
      phase: 'study',
      preset: '50m',
      totalSeconds: 50 * 60,
      remainingSeconds: 50 * 60,
      startTimestamp: null,
      endTimestamp: null,
      lastTickTimestamp: null,
      boundTaskId: null,
      warningTriggered: false
    },
    stats: {
      totalStudySeconds: 0
    }
  };

  let activeBucketFilter = 'all';
  let modalSelectedBucket = 'deep';
  let timerInterval = null;

  // --- DOM Elements ---
  const syncIndicator = document.getElementById('syncIndicator');
  const serverSyncStatus = document.getElementById('serverSyncStatus');
  const btnWakeUp = document.getElementById('btnWakeUp');
  const wakeUpLabel = document.getElementById('wakeUpLabel');

  const btnNavMove = document.getElementById('btnNavMove');
  const btnNavFocus = document.getElementById('btnNavFocus');
  const btnNavHabits = document.getElementById('btnNavHabits');
  const viewMove = document.getElementById('viewMove');
  const viewFocus = document.getElementById('viewFocus');

  // Date Navigation
  const btnPrevDay = document.getElementById('btnPrevDay');
  const btnNextDay = document.getElementById('btnNextDay');
  const btnDateContainer = document.getElementById('btnDateContainer');
  const selectedDateTitle = document.getElementById('selectedDateTitle');
  const btnJumpToday = document.getElementById('btnJumpToday');
  const datePickerInput = document.getElementById('datePickerInput');
  const dateContextSubtitle = document.getElementById('dateContextSubtitle');

  // Move Elements
  const subViewToday = document.getElementById('subViewToday');
  const subViewProgress = document.getElementById('subViewProgress');
  const sectionTodayView = document.getElementById('sectionTodayView');
  const sectionProgressView = document.getElementById('sectionProgressView');

  const metricPullups = document.getElementById('metricPullups');
  const barPullup = document.getElementById('barPullup');
  const metricPushups = document.getElementById('metricPushups');
  const barPushup = document.getElementById('barPushup');
  const metricTonnage = document.getElementById('metricTonnage');
  const barTonnage = document.getElementById('barTonnage');
  const btnToggleBarbellDrawer = document.getElementById('btnToggleBarbellDrawer');
  const arrowBarbellDrawer = document.getElementById('arrowBarbellDrawer');
  const barbellBreakdownDrawer = document.getElementById('barbellBreakdownDrawer');
  const barbellExerciseGrid = document.getElementById('barbellExerciseGrid');
  const metricSteps = document.getElementById('metricSteps');
  const barSteps = document.getElementById('barSteps');

  const valPullup = document.getElementById('valPullup');
  const btnPullupDec = document.getElementById('btnPullupDec');
  const btnPullupInc = document.getElementById('btnPullupInc');
  const btnPullupLog = document.getElementById('btnPullupLog');
  const valPushup = document.getElementById('valPushup');
  const btnPushupDec = document.getElementById('btnPushupDec');
  const btnPushupInc = document.getElementById('btnPushupInc');
  const btnPushupLog = document.getElementById('btnPushupLog');
  const barbellPills = document.getElementById('barbellPills');
  const selectedLiftName = document.getElementById('selectedLiftName');
  const valBarbell = document.getElementById('valBarbell');
  const btnBarbellDec = document.getElementById('btnBarbellDec');
  const btnBarbellInc = document.getElementById('btnBarbellInc');
  const btnBarbellLog = document.getElementById('btnBarbellLog');
  const valSteps = document.getElementById('valSteps');
  const btnStepDec = document.getElementById('btnStepDec');
  const btnStepInc = document.getElementById('btnStepInc');
  const btnStepLog = document.getElementById('btnStepLog');
  const valElliptical = document.getElementById('valElliptical');
  const btnEllipticalDec = document.getElementById('btnEllipticalDec');
  const btnEllipticalInc = document.getElementById('btnEllipticalInc');
  const btnEllipticalLog = document.getElementById('btnEllipticalLog');

  const timelineContainer = document.getElementById('timelineContainer');
  const timelineList = document.getElementById('timelineList');
  const emptyTimeline = document.getElementById('emptyTimeline');
  const logCount = document.getElementById('logCount');

  const adherenceHeaderRow = document.getElementById('adherenceHeaderRow');
  const adherenceBodyRows = document.getElementById('adherenceBodyRows');
  const exerciseProgressionList = document.getElementById('exerciseProgressionList');

  // Focus Elements
  const btnPrevCurriculumDay = document.getElementById('btnPrevCurriculumDay');
  const btnNextCurriculumDay = document.getElementById('btnNextCurriculumDay');
  const curriculumDayBadge = document.getElementById('curriculumDayBadge');
  const curriculumDaySub = document.getElementById('curriculumDaySub');

  const labelTomorrowTitle = document.getElementById('labelTomorrowTitle');
  const btnPlanTomorrow = document.getElementById('btnPlanTomorrow');

  const valDeepCount = document.getElementById('valDeepCount');
  const barDeep = document.getElementById('barDeep');
  const valSpacedCount = document.getElementById('valSpacedCount');
  const barSpaced = document.getElementById('barSpaced');
  const valLiveCount = document.getElementById('valLiveCount');
  const barLive = document.getElementById('barLive');
  const valDsaCount = document.getElementById('valDsaCount');
  const barDsa = document.getElementById('barDsa');

  const valAppsStatus = document.getElementById('valAppsStatus');
  const valAzureStatus = document.getElementById('valAzureStatus');
  const valTotalStudyTime = document.getElementById('valTotalStudyTime');

  const timerPhaseBadge = document.getElementById('timerPhaseBadge');
  const preset50m = document.getElementById('preset50m');
  const preset30m = document.getElementById('preset30m');
  const preset60m = document.getElementById('preset60m');
  const timerDisplay = document.getElementById('timerDisplay');
  const timerSubLabel = document.getElementById('timerSubLabel');
  const boundTaskTitle = document.getElementById('boundTaskTitle');
  const btnUnbindTask = document.getElementById('btnUnbindTask');
  const btnTimerStart = document.getElementById('btnTimerStart');
  const btnTimerPause = document.getElementById('btnTimerPause');
  const btnTimerReset = document.getElementById('btnTimerReset');
  const btnTimerCompleteTask = document.getElementById('btnTimerCompleteTask');

  const btnOpenAddTaskModal = document.getElementById('btnOpenAddTaskModal');
  const focusBucketFilters = document.getElementById('focusBucketFilters');
  const taskListContainer = document.getElementById('taskListContainer');
  const completedTaskCount = document.getElementById('completedTaskCount');
  const completedTasksList = document.getElementById('completedTasksList');
  const emptyCompletedTasks = document.getElementById('emptyCompletedTasks');

  const screenFlashOverlay = document.getElementById('screenFlashOverlay');
  const feynmanAlarmModal = document.getElementById('feynmanAlarmModal');
  const feynmanAlarmTitle = document.getElementById('feynmanAlarmTitle');
  const feynmanAlarmBody = document.getElementById('feynmanAlarmBody');
  const btnDismissAlarm = document.getElementById('btnDismissAlarm');

  const modalAddTask = document.getElementById('modalAddTask');
  const btnCloseAddTaskModal = document.getElementById('btnCloseAddTaskModal');
  const btnCancelAddTask = document.getElementById('btnCancelAddTask');
  const btnSaveTask = document.getElementById('btnSaveTask');
  const inputTaskTitle = document.getElementById('inputTaskTitle');
  const modalBucketPills = document.getElementById('modalBucketPills');

  // Utilities
  const undoToast = document.getElementById('undoToast');
  const undoMessage = document.getElementById('undoMessage');
  const btnUndoAction = document.getElementById('btnUndoAction');
  const toastProgressBar = document.getElementById('toastProgressBar');
  const btnExportCSV = document.getElementById('btnExportCSV');
  const btnExportJSON = document.getElementById('btnExportJSON');
  const btnClearToday = document.getElementById('btnClearToday');
  const previewModal = document.getElementById('previewModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalBody = document.getElementById('modalBody');
  const btnCloseModal = document.getElementById('btnCloseModal');

  // --- Audio / Alerts ---
  function playClickAudio(freq = 550, duration = 0.035) {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + duration);

      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {}
  }

  function playWarningAlert() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const notes = [440.00, 880.00];

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + (idx * 0.15));

        gain.gain.setValueAtTime(0.08, ctx.currentTime + (idx * 0.15));
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (idx * 0.15) + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + (idx * 0.15));
        osc.stop(ctx.currentTime + (idx * 0.15) + 0.4);
      });
    } catch (e) {}
  }

  function playFeynmanChime() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const notes = [523.25, 659.25, 783.99, 1046.50];

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + (idx * 0.1));

        gain.gain.setValueAtTime(0.09, ctx.currentTime + (idx * 0.1));
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (idx * 0.1) + 0.8);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + (idx * 0.1));
        osc.stop(ctx.currentTime + (idx * 0.1) + 0.8);
      });
    } catch (e) {}
  }

  function triggerHaptic(duration = 15, audioFreq = 550) {
    playClickAudio(audioFreq);
    if ('vibrate' in navigator) {
      try { navigator.vibrate(duration); } catch (e) {}
    }
  }

  function triggerTripleAlarm() {
    playFeynmanChime();

    if ('vibrate' in navigator) {
      try {
        navigator.vibrate([250, 150, 250, 150, 500]);
      } catch (e) {}
    }

    screenFlashOverlay.classList.remove('flash-active');
    void screenFlashOverlay.offsetWidth;
    screenFlashOverlay.classList.add('flash-active');

    if (focusData.timerState.phase === 'study') {
      feynmanAlarmTitle.textContent = 'Feynman Time Ceiling Reached!';
      feynmanAlarmBody.textContent = 'Hard stop! Close all tabs. Explain this concept out loud in plain English before taking your 10m break.';
      btnDismissAlarm.textContent = 'Start 10m Verbal Recall';
    } else {
      feynmanAlarmTitle.textContent = 'Break Finished!';
      feynmanAlarmBody.textContent = 'Time for your next question. Clear your mind and dive in.';
      btnDismissAlarm.textContent = 'Ready for Next Question';
    }
    feynmanAlarmModal.classList.remove('hidden');
  }

  // --- Date Helpers ---
  function getTodayDateStr() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function formatTime(date) {
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${minutes} ${ampm}`;
  }

  function getRelativeTime(timestamp) {
    const diffMs = Date.now() - timestamp;
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 45) return 'just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return `${Math.floor(diffHr / 24)}d ago`;
  }

  function offsetDate(dateStr, days) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + days);
    const ny = date.getFullYear();
    const nm = String(date.getMonth() + 1).padStart(2, '0');
    const nd = String(date.getDate()).padStart(2, '0');
    return `${ny}-${nm}-${nd}`;
  }

  function formatDisplayDate(dateStr) {
    const todayStr = getTodayDateStr();
    if (dateStr === todayStr) return 'Today';
    if (dateStr === offsetDate(todayStr, -1)) return 'Yesterday';
    if (dateStr === offsetDate(todayStr, 1)) return 'Tomorrow';
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  }

  // --- Storage & Sync Engine ---
  function loadLocalData() {
    try {
      const storedLogs = localStorage.getItem(STORAGE_KEY_LOGS);
      if (storedLogs) logs = JSON.parse(storedLogs);

      const storedDefaults = localStorage.getItem(STORAGE_KEY_DEFAULTS);
      if (storedDefaults) stickyDefaults = { ...stickyDefaults, ...JSON.parse(storedDefaults) };

      const storedFocus = localStorage.getItem(STORAGE_KEY_FOCUS);
      if (storedFocus) {
        const parsed = JSON.parse(storedFocus);
        focusData = { ...focusData, ...parsed };
      }
    } catch (err) {
      console.error('Error reading local storage:', err);
    }
  }

  function saveLocalData() {
    try {
      localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logs));
      localStorage.setItem(STORAGE_KEY_DEFAULTS, JSON.stringify(stickyDefaults));
      localStorage.setItem(STORAGE_KEY_FOCUS, JSON.stringify(focusData));
    } catch (err) {
      console.error('Error saving local storage:', err);
    }
  }

  async function syncWithServer() {
    try {
      // 1. Sync Move Logs
      const resLogs = await fetch('/api/logs');
      if (resLogs.ok) {
        const serverLogs = await resLogs.json();
        if (Array.isArray(serverLogs)) {
          const mergedMap = new Map();
          logs.forEach(l => mergedMap.set(l.id, l));
          serverLogs.forEach(l => mergedMap.set(l.id, l));
          logs = Array.from(mergedMap.values());
          saveLocalData();
        }
      }

      // 2. Sync Focus Tasks & Timer State
      const resFocus = await fetch('/api/focus');
      if (resFocus.ok) {
        const serverFocus = await resFocus.json();
        if (serverFocus) {
          if (serverFocus.currentCurriculumDay) {
            focusData.currentCurriculumDay = serverFocus.currentCurriculumDay;
          }

          if (Array.isArray(serverFocus.tasks) && serverFocus.tasks.length > 0) {
            const taskMap = new Map();
            focusData.tasks.forEach(t => taskMap.set(t.id, t));
            serverFocus.tasks.forEach(t => taskMap.set(t.id, t));
            focusData.tasks = Array.from(taskMap.values());
          }

          if (serverFocus.stats) {
            focusData.stats.totalStudySeconds = Math.max(focusData.stats.totalStudySeconds || 0, serverFocus.stats.totalStudySeconds || 0);
          }

          if (serverFocus.timerState && serverFocus.timerState.isRunning) {
            const now = Date.now();
            if (now < serverFocus.timerState.endTimestamp) {
              focusData.timerState = serverFocus.timerState;
              focusData.timerState.remainingSeconds = Math.max(0, Math.round((serverFocus.timerState.endTimestamp - now) / 1000));
              if (!timerInterval) {
                resumeTimerFromAnchor();
              }
            } else {
              focusData.timerState = serverFocus.timerState;
              focusData.timerState.isRunning = false;
              focusData.timerState.remainingSeconds = 0;
            }
          }

          saveLocalData();
        }
      }

      syncIndicator.className = 'w-1.5 h-1.5 rounded-full bg-emerald-400';
      serverSyncStatus.textContent = 'Wi-Fi Synced (Live)';
    } catch (err) {
      syncIndicator.className = 'w-1.5 h-1.5 rounded-full bg-slate-500';
      serverSyncStatus.textContent = 'Offline (Local Cache)';
    }

    renderDateDisplay();
    renderMetrics();
    renderTimeline();
    renderFocusDashboard();
  }

  async function postFocusToServer() {
    try {
      await fetch('/api/focus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(focusData)
      });
    } catch (e) {}
  }

  // --- Domain Switching ---
  function switchDomain(domain) {
    if (domain === 'move') {
      viewMove.classList.remove('hidden');
      viewFocus.classList.add('hidden');
      btnNavMove.className = 'spring-btn flex-1 py-2 rounded-lg bg-white text-slate-950 font-bold shadow-sm';
      btnNavFocus.className = 'spring-btn flex-1 py-2 rounded-lg text-slate-400 hover:text-white transition';
    } else if (domain === 'focus') {
      viewMove.classList.add('hidden');
      viewFocus.classList.remove('hidden');
      btnNavFocus.className = 'spring-btn flex-1 py-2 rounded-lg bg-white text-slate-950 font-bold shadow-sm';
      btnNavMove.className = 'spring-btn flex-1 py-2 rounded-lg text-slate-400 hover:text-white transition';
      renderFocusDashboard();
    }
    triggerHaptic(10, 520);
  }

  // --- Move Rendering Functions ---
  function renderDateDisplay() {
    const todayStr = getTodayDateStr();
    selectedDateTitle.textContent = formatDisplayDate(selectedDateStr);

    if (selectedDateStr === todayStr) {
      btnJumpToday.classList.add('hidden');
      dateContextSubtitle.textContent = 'Today';
    } else {
      btnJumpToday.classList.remove('hidden');
      dateContextSubtitle.textContent = selectedDateStr;
    }
  }

  function renderMetrics() {
    const dayLogs = logs.filter(item => item.dateStr === selectedDateStr);

    let totalPullups = 0;
    let totalPushups = 0;
    let totalTonnage = 0;
    let totalSteps = 0;
    let wokeUpTime = null;

    const barbellStats = {};
    BARBELL_EXERCISES.forEach(name => {
      barbellStats[name] = { reps: 0, sets: 0 };
    });

    dayLogs.forEach(item => {
      if (item.category === 'pullup') totalPullups += (item.reps || 0);
      if (item.category === 'pushup') totalPushups += (item.reps || 0);
      if (item.category === 'barbell') {
        const reps = item.reps || 0;
        totalTonnage += (reps * (item.weightKg || 30));
        const lift = item.liftName || item.name.replace('Barbell ', '');
        if (barbellStats[lift]) {
          barbellStats[lift].reps += reps;
          barbellStats[lift].sets += 1;
        }
      }
      if (item.category === 'walk') totalSteps += (item.steps || 0);
      if (item.category === 'elliptical') totalSteps += ((item.minutes || 0) * 120);
      if (item.category === 'wake_up') wokeUpTime = item.timeFormatted;
    });

    metricPullups.textContent = totalPullups;
    metricPushups.textContent = totalPushups;
    metricTonnage.textContent = totalTonnage;
    metricSteps.textContent = totalSteps >= 1000 ? `${(totalSteps / 1000).toFixed(1)}k` : totalSteps;

    barPullup.style.width = `${Math.min(100, Math.round((totalPullups / TARGETS.pullups) * 100))}%`;
    barPushup.style.width = `${Math.min(100, Math.round((totalPushups / TARGETS.pushups) * 100))}%`;
    barTonnage.style.width = `${Math.min(100, Math.round((totalTonnage / TARGETS.tonnage) * 100))}%`;
    barSteps.style.width = `${Math.min(100, Math.round((totalSteps / TARGETS.steps) * 100))}%`;

    barbellExerciseGrid.innerHTML = BARBELL_EXERCISES.map(name => {
      const stat = barbellStats[name];
      const isDone = stat.reps > 0;
      const textClass = isDone ? 'text-amber-300 font-bold' : 'text-slate-500';
      return `
        <div class="p-2 rounded-lg bg-[#0d131f] border border-white/[0.04] flex items-center justify-between">
          <span class="text-slate-300 font-medium truncate">${name}</span>
          <span class="${textClass} font-mono">${stat.reps} <span class="text-[10px] text-slate-500">(${stat.sets}s)</span></span>
        </div>
      `;
    }).join('');

    if (wokeUpTime) {
      wakeUpLabel.textContent = `Woke ${wokeUpTime}`;
      btnWakeUp.classList.add('border-amber-500/40', 'bg-amber-950/20');
    } else {
      wakeUpLabel.textContent = 'Woke Up';
      btnWakeUp.classList.remove('border-amber-500/40', 'bg-amber-950/20');
    }
  }

  function renderTimeline() {
    const dayLogs = logs
      .filter(item => item.dateStr === selectedDateStr)
      .sort((a, b) => b.timestamp - a.timestamp);

    logCount.textContent = `${dayLogs.length} set${dayLogs.length === 1 ? '' : 's'}`;

    if (dayLogs.length === 0) {
      emptyTimeline.classList.remove('hidden');
      timelineList.classList.add('hidden');
      timelineList.innerHTML = '';
      return;
    }

    emptyTimeline.classList.add('hidden');
    timelineList.classList.remove('hidden');

    timelineList.innerHTML = dayLogs.map(item => {
      let badgeStyle = 'text-sky-400 bg-sky-950/30 border-sky-800/40';
      let details = `${item.reps} reps`;

      if (item.category === 'pushup') {
        badgeStyle = 'text-emerald-400 bg-emerald-950/30 border-emerald-800/40';
      } else if (item.category === 'barbell') {
        badgeStyle = 'text-amber-400 bg-amber-950/30 border-amber-800/40';
        details = `${item.reps} reps @ 30kg (${item.reps * 30}kg vol)`;
      } else if (item.category === 'walk') {
        badgeStyle = 'text-purple-400 bg-purple-950/30 border-purple-800/40';
        details = `${item.steps.toLocaleString()} steps logged`;
      } else if (item.category === 'elliptical') {
        badgeStyle = 'text-indigo-400 bg-indigo-950/30 border-indigo-800/40';
        details = `${item.minutes} mins elliptical session`;
      } else if (item.category === 'wake_up') {
        badgeStyle = 'text-amber-300 bg-amber-950/30 border-amber-800/40';
        details = 'Day start recorded';
      }

      return `
        <div class="timeline-item flex items-center justify-between p-2.5 rounded-xl bg-[#111622] border border-white/[0.06] hover:border-white/15 transition">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-slate-100">${item.name}</span>
              <span class="text-[9px] px-1.5 py-0.5 rounded border ${badgeStyle} font-mono">${item.timeFormatted}</span>
            </div>
            <p class="text-[11px] text-slate-400 font-mono mt-0.5">${details}</p>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-[10px] text-slate-500 font-mono">${getRelativeTime(item.timestamp)}</span>
            <button data-id="${item.id}" class="btn-delete-log text-slate-500 hover:text-rose-400 p-1 rounded tap-target text-xs transition" title="Delete Log">
              ✕
            </button>
          </div>
        </div>
      `;
    }).join('');

    document.querySelectorAll('.btn-delete-log').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        deleteLog(id);
      });
    });
  }

  function updateStepperDisplays() {
    valPullup.textContent = stickyDefaults.pullupReps;
    btnPullupLog.textContent = `LOG (+${stickyDefaults.pullupReps})`;
    valPushup.textContent = stickyDefaults.pushupReps;
    btnPushupLog.textContent = `LOG (+${stickyDefaults.pushupReps})`;
    selectedLiftName.textContent = `${stickyDefaults.selectedLift}:`;
    valBarbell.textContent = stickyDefaults.barbellReps;
    btnBarbellLog.textContent = `LOG (${stickyDefaults.barbellReps * 30}kg)`;
    valSteps.textContent = stickyDefaults.stepIncrement.toLocaleString();
    valElliptical.textContent = `${stickyDefaults.ellipticalMins}m`;
  }

  function addLog(entry) {
    const now = new Date();
    const newLog = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      timestamp: now.getTime(),
      dateStr: selectedDateStr,
      timeFormatted: formatTime(now),
      ...entry
    };

    logs.push(newLog);
    saveLocalData();
    fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newLog)
    }).catch(() => {});

    triggerHaptic(15, 680);
    renderMetrics();
    renderTimeline();
    showUndoToast(`Logged ${newLog.name}`, newLog.id);
  }

  function deleteLog(id) {
    logs = logs.filter(item => item.id !== id);
    saveLocalData();
    fetch(`/api/logs/${id}`, { method: 'DELETE' }).catch(() => {});
    triggerHaptic(10, 240);
    renderMetrics();
    renderTimeline();
  }

  // --- Focus Engine Functions (Bootcamp 3 + 5 + 1 + 1 Protocol) ---
  function renderFocusDashboard() {
    const currentDayConfig = CURRICULUM_DAYS.find(d => d.day === focusData.currentCurriculumDay) || CURRICULUM_DAYS[0];

    // 1. Header
    curriculumDayBadge.textContent = currentDayConfig.title;
    curriculumDaySub.textContent = currentDayConfig.subtitle;

    // 2. Tomorrow's Plan Reminder
    const tomorrowDayIndex = (focusData.currentCurriculumDay % 7) + 1;
    const tomorrowConfig = CURRICULUM_DAYS.find(d => d.day === tomorrowDayIndex);
    if (tomorrowConfig) {
      labelTomorrowTitle.textContent = `Tomorrow: ${tomorrowConfig.title.split('—')[1] || tomorrowConfig.title}`;
    }

    // Filter tasks for this day
    const dayTasks = focusData.tasks.filter(t => t.curriculumDay === focusData.currentCurriculumDay);
    const completedTasks = dayTasks.filter(t => t.completed);
    const pendingTasks = dayTasks.filter(t => !t.completed);

    // 3. The 4 Finish Lines Calculation
    const deepTasks = dayTasks.filter(t => t.bucket === 'deep');
    const deepCompleted = deepTasks.filter(t => t.completed).length;
    valDeepCount.textContent = `${deepCompleted}/3`;
    barDeep.style.width = `${Math.min(100, Math.round((deepCompleted / 3) * 100))}%`;

    const spacedTasks = dayTasks.filter(t => t.bucket === 'spaced');
    const spacedCompleted = spacedTasks.filter(t => t.completed).length;
    valSpacedCount.textContent = `${spacedCompleted}/5`;
    barSpaced.style.width = `${Math.min(100, Math.round((spacedCompleted / 5) * 100))}%`;

    const liveTasks = dayTasks.filter(t => t.bucket === 'live');
    const liveCompleted = liveTasks.filter(t => t.completed).length;
    valLiveCount.textContent = `${liveCompleted}/1`;
    barLive.style.width = `${Math.min(100, Math.round((liveCompleted / 1) * 100))}%`;

    const dsaTasks = dayTasks.filter(t => t.bucket === 'dsa');
    const dsaCompleted = dsaTasks.filter(t => t.completed).length;
    valDsaCount.textContent = `${dsaCompleted}/1`;
    barDsa.style.width = `${Math.min(100, Math.round((dsaCompleted / 1) * 100))}%`;

    // Job Apps & Azure
    if (focusData.currentCurriculumDay >= 4) {
      const appTasks = dayTasks.filter(t => t.bucket === 'apps');
      const appsDone = appTasks.filter(t => t.completed).length;
      valAppsStatus.textContent = `Active (${appsDone}/10)`;
      valAppsStatus.className = appsDone >= 10 ? 'text-xs font-bold text-emerald-400' : 'text-xs font-bold text-sky-400';
    } else {
      valAppsStatus.textContent = 'Day 4 Launch (0/10)';
      valAppsStatus.className = 'text-xs font-bold text-slate-400';
    }

    const azureTasks = dayTasks.filter(t => t.bucket === 'azure');
    const azureDone = azureTasks.filter(t => t.completed).length;
    valAzureStatus.textContent = azureDone > 0 ? `${azureDone} Drills Done` : 'Optional Track';

    // Total Study Time Today
    const totalSec = focusData.stats.totalStudySeconds || 0;
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    valTotalStudyTime.textContent = `${hrs}h ${String(mins).padStart(2, '0')}m / 5.5h Target`;

    // 4. Timer UI Update
    updateTimerDisplay();
    if (focusData.timerState.isRunning) {
      btnTimerStart.className = 'spring-btn py-2.5 rounded-xl bg-sky-500 text-slate-950 text-xs font-bold tracking-wider';
    } else {
      btnTimerStart.className = 'spring-btn py-2.5 rounded-xl btn-action-primary text-xs font-bold tracking-wider';
    }

    if (focusData.timerState.boundTaskId) {
      const bTask = focusData.tasks.find(t => t.id === focusData.timerState.boundTaskId);
      if (bTask) {
        boundTaskTitle.textContent = bTask.title;
        btnUnbindTask.classList.remove('hidden');
        btnTimerCompleteTask.classList.remove('hidden');
      } else {
        boundTaskTitle.textContent = 'Select a question below to focus';
        btnUnbindTask.classList.add('hidden');
        btnTimerCompleteTask.classList.add('hidden');
      }
    } else {
      boundTaskTitle.textContent = 'Select a question below to focus';
      btnUnbindTask.classList.add('hidden');
      btnTimerCompleteTask.classList.add('hidden');
    }

    // 5. Filter & Render Tasks
    const filteredTasks = pendingTasks.filter(t => {
      if (activeBucketFilter === 'all') return true;
      return t.bucket === activeBucketFilter;
    });

    if (filteredTasks.length === 0) {
      taskListContainer.innerHTML = `
        <div class="text-center py-6 text-slate-500 text-xs font-mono matte-card p-4">
          No pending tasks in this filter.<br>Tap <span class="text-white font-bold">+ Add Task</span> to add your next question!
        </div>
      `;
    } else {
      taskListContainer.innerHTML = filteredTasks.map(t => {
        const isBound = focusData.timerState.boundTaskId === t.id;

        let badgeLabel = 'Deep Anchor';
        let badgeStyle = 'text-sky-300 bg-sky-950/50 border-sky-800/40';

        if (t.bucket === 'deep') {
          badgeLabel = 'Deep Anchor (50m)';
          badgeStyle = 'text-sky-300 bg-sky-950/50 border-sky-800/40';
        } else if (t.bucket === 'spaced') {
          badgeLabel = 'Spaced Check (6m)';
          badgeStyle = 'text-purple-300 bg-purple-950/50 border-purple-800/40';
        } else if (t.bucket === 'live') {
          badgeLabel = 'Live Coding (1h)';
          badgeStyle = 'text-amber-300 bg-amber-950/50 border-amber-800/40';
        } else if (t.bucket === 'dsa') {
          badgeLabel = 'C# NeetCode DSA (1h)';
          badgeStyle = 'text-emerald-300 bg-emerald-950/50 border-emerald-800/40';
        } else if (t.bucket === 'apps') {
          badgeLabel = '10 Job Apps';
          badgeStyle = 'text-blue-300 bg-blue-950/50 border-blue-800/40';
        } else if (t.bucket === 'azure') {
          badgeLabel = 'Azure AI Bonus';
          badgeStyle = 'text-teal-300 bg-teal-950/50 border-teal-800/40';
        }

        return `
          <div class="p-3 rounded-xl bg-[#111622] border ${isBound ? 'border-sky-400/80 shadow-lg shadow-sky-500/10' : 'border-white/[0.06]'} flex items-center justify-between gap-3 transition">
            <div class="flex items-start gap-2.5 truncate">
              <button data-id="${t.id}" class="btn-check-task w-5 h-5 rounded-md border border-white/20 hover:border-emerald-400 flex items-center justify-center text-transparent hover:text-emerald-400 text-xs transition mt-0.5">
                ✓
              </button>
              <div class="truncate">
                <div class="text-xs font-bold text-slate-100 truncate">${t.title}</div>
                <div class="flex items-center gap-1.5 mt-1 font-mono text-[9px]">
                  <span class="px-1.5 py-0.5 rounded border ${badgeStyle} font-semibold">${badgeLabel}</span>
                  <span class="text-slate-400">${t.category}</span>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
              <button data-id="${t.id}" class="btn-focus-task spring-btn px-2.5 py-1 rounded-lg text-xs font-bold ${isBound ? 'bg-sky-500 text-slate-950' : 'bg-[#1a2233] text-slate-300 hover:text-white'}">
                ${isBound ? 'Active' : 'Focus'}
              </button>
              <button data-id="${t.id}" class="btn-delete-task text-slate-500 hover:text-rose-400 p-1.5 rounded tap-target text-xs">
                ✕
              </button>
            </div>
          </div>
        `;
      }).join('');
    }

    document.querySelectorAll('.btn-check-task').forEach(btn => {
      btn.addEventListener('click', () => completeTask(btn.getAttribute('data-id')));
    });
    document.querySelectorAll('.btn-focus-task').forEach(btn => {
      btn.addEventListener('click', () => bindTaskToTimer(btn.getAttribute('data-id')));
    });
    document.querySelectorAll('.btn-delete-task').forEach(btn => {
      btn.addEventListener('click', () => deleteTask(btn.getAttribute('data-id')));
    });

    // 6. Completed Tasks Feed
    completedTaskCount.textContent = `${completedTasks.length} completed`;
    if (completedTasks.length === 0) {
      emptyCompletedTasks.classList.remove('hidden');
      completedTasksList.classList.add('hidden');
      completedTasksList.innerHTML = '';
    } else {
      emptyCompletedTasks.classList.add('hidden');
      completedTasksList.classList.remove('hidden');
      completedTasksList.innerHTML = completedTasks.map(t => {
        return `
          <div class="p-2.5 rounded-lg bg-[#0d131f] border border-white/[0.04] flex items-center justify-between text-xs font-mono">
            <div class="flex items-center gap-2 truncate pr-2">
              <span class="text-emerald-400 font-bold">✓</span>
              <span class="text-slate-300 truncate">${t.title}</span>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <span class="text-[10px] text-slate-500 whitespace-nowrap">${t.completedAt || ''}</span>
              <button data-id="${t.id}" class="btn-revert-task px-2 py-0.5 rounded bg-[#1a2233] hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] font-mono transition">
                Revert
              </button>
            </div>
          </div>
        `;
      }).join('');
    }

    document.querySelectorAll('.btn-revert-task').forEach(btn => {
      btn.addEventListener('click', () => {
        revertCompletedTask(btn.getAttribute('data-id'));
      });
    });
  }

  function bindTaskToTimer(taskId) {
    focusData.timerState.boundTaskId = taskId;
    const task = focusData.tasks.find(t => t.id === taskId);
    if (task) {
      if (task.bucket === 'deep') setTimerPreset('50m');
      else if (task.bucket === 'spaced') setTimerPreset('30m');
      else if (task.bucket === 'live' || task.bucket === 'dsa') setTimerPreset('60m');
    }
    saveLocalData();
    postFocusToServer();
    renderFocusDashboard();
    triggerHaptic(12, 600);
  }

  function unbindTask() {
    focusData.timerState.boundTaskId = null;
    saveLocalData();
    postFocusToServer();
    renderFocusDashboard();
    triggerHaptic(8, 400);
  }

  function completeTask(taskId) {
    const task = focusData.tasks.find(t => t.id === taskId);
    if (!task) return;

    task.completed = true;
    task.completedAt = formatTime(new Date());

    if (focusData.timerState.boundTaskId === taskId) {
      focusData.timerState.boundTaskId = null;
    }

    saveLocalData();
    postFocusToServer();
    triggerHaptic(20, 750);
    renderFocusDashboard();
    showUndoToast(`Completed: ${task.title}`, task.id, () => {
      task.completed = false;
      task.completedAt = null;
      saveLocalData();
      postFocusToServer();
      renderFocusDashboard();
    });
  }

  function revertCompletedTask(taskId) {
    const task = focusData.tasks.find(t => t.id === taskId);
    if (!task) return;

    task.completed = false;
    task.completedAt = null;
    saveLocalData();
    postFocusToServer();
    triggerHaptic(15, 500);
    renderFocusDashboard();
    showUndoToast(`Reverted: ${task.title}`, task.id);
  }

  function deleteTask(taskId) {
    focusData.tasks = focusData.tasks.filter(t => t.id !== taskId);
    if (focusData.timerState.boundTaskId === taskId) {
      focusData.timerState.boundTaskId = null;
    }
    saveLocalData();
    postFocusToServer();
    triggerHaptic(10, 250);
    renderFocusDashboard();
  }

  // --- Wall-Clock Timer with 15m Early Answer Alert ---
  function updateTimerDisplay() {
    const remaining = focusData.timerState.remainingSeconds;
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    timerDisplay.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function setTimerPreset(preset) {
    focusData.timerState.preset = preset;
    focusData.timerState.warningTriggered = false;

    if (preset === '50m') {
      preset50m.className = 'px-2 py-0.5 rounded bg-white/10 text-white font-bold hover:bg-white/20';
      preset30m.className = 'px-2 py-0.5 rounded text-slate-400 hover:text-white';
      preset60m.className = 'px-2 py-0.5 rounded text-slate-400 hover:text-white';
      focusData.timerState.totalSeconds = 50 * 60;
      focusData.timerState.remainingSeconds = 50 * 60;
      timerPhaseBadge.textContent = 'Deep Anchor (50m)';
      timerSubLabel.textContent = '50m Hard Stop · 15m Early Answer Warning';
    } else if (preset === '30m') {
      preset30m.className = 'px-2 py-0.5 rounded bg-white/10 text-white font-bold hover:bg-white/20';
      preset50m.className = 'px-2 py-0.5 rounded text-slate-400 hover:text-white';
      preset60m.className = 'px-2 py-0.5 rounded text-slate-400 hover:text-white';
      focusData.timerState.totalSeconds = 30 * 60;
      focusData.timerState.remainingSeconds = 30 * 60;
      timerPhaseBadge.textContent = 'Spaced Checks (30m)';
      timerSubLabel.textContent = '5 Rapid Verbal Checks · 6m per topic';
    } else {
      preset60m.className = 'px-2 py-0.5 rounded bg-white/10 text-white font-bold hover:bg-white/20';
      preset50m.className = 'px-2 py-0.5 rounded text-slate-400 hover:text-white';
      preset30m.className = 'px-2 py-0.5 rounded text-slate-400 hover:text-white';
      focusData.timerState.totalSeconds = 60 * 60;
      focusData.timerState.remainingSeconds = 60 * 60;
      timerPhaseBadge.textContent = 'Live Code / DSA (60m)';
      timerSubLabel.textContent = '60m Hands-on Ceiling · 25m Lookup Rule';
    }
    resetTimer();
    triggerHaptic(8, 450);
  }

  function tickTimer() {
    if (!focusData.timerState.isRunning) return;

    const now = Date.now();
    const lastTick = focusData.timerState.lastTickTimestamp || now;
    const elapsedSeconds = Math.max(0, Math.floor((now - lastTick) / 1000));

    if (elapsedSeconds > 0) {
      focusData.stats.totalStudySeconds = (focusData.stats.totalStudySeconds || 0) + elapsedSeconds;
      focusData.timerState.lastTickTimestamp = now;
    }

    const remaining = Math.max(0, Math.round((focusData.timerState.endTimestamp - now) / 1000));
    focusData.timerState.remainingSeconds = remaining;
    updateTimerDisplay();

    // 15-Minute Remaining Warning Alert (User Directive)
    if (focusData.timerState.totalSeconds >= 45 * 60 && remaining <= 15 * 60 && !focusData.timerState.warningTriggered) {
      focusData.timerState.warningTriggered = true;
      playWarningAlert();
      showUndoToast('⚠️ 15 Mins Left! Close notes & start explaining out loud now.', 'warning_15m');
      screenFlashOverlay.classList.remove('flash-active');
      void screenFlashOverlay.offsetWidth;
      screenFlashOverlay.classList.add('flash-active');
    }

    if (remaining <= 0) {
      pauseTimer();
      triggerTripleAlarm();
    }
  }

  function startTimer() {
    if (!focusData.timerState.boundTaskId) {
      const pendingTasks = focusData.tasks.filter(t => t.curriculumDay === focusData.currentCurriculumDay && !t.completed);
      if (pendingTasks.length > 0) {
        bindTaskToTimer(pendingTasks[0].id);
        showUndoToast(`Auto-selected: ${pendingTasks[0].title}`, pendingTasks[0].id);
      } else {
        alert('Please select a question from today\'s roster to focus!');
        inputTaskTitle.value = '';
        modalAddTask.classList.remove('hidden');
        return;
      }
    }

    const now = Date.now();
    focusData.timerState.isRunning = true;
    focusData.timerState.startTimestamp = now;
    focusData.timerState.endTimestamp = now + (focusData.timerState.remainingSeconds * 1000);
    focusData.timerState.lastTickTimestamp = now;

    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(tickTimer, 1000);

    saveLocalData();
    postFocusToServer();
    renderFocusDashboard();
    triggerHaptic(15, 600);
  }

  function resumeTimerFromAnchor() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(tickTimer, 1000);
    renderFocusDashboard();
  }

  function pauseTimer() {
    if (!focusData.timerState.isRunning) return;

    tickTimer();
    focusData.timerState.isRunning = false;
    focusData.timerState.startTimestamp = null;
    focusData.timerState.endTimestamp = null;
    focusData.timerState.lastTickTimestamp = null;

    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }

    saveLocalData();
    postFocusToServer();
    renderFocusDashboard();
    triggerHaptic(10, 400);
  }

  function resetTimer() {
    pauseTimer();
    focusData.timerState.remainingSeconds = focusData.timerState.totalSeconds;
    focusData.timerState.warningTriggered = false;
    updateTimerDisplay();
    saveLocalData();
    postFocusToServer();
    triggerHaptic(10, 300);
  }

  function transitionToPhase(newPhase, seconds) {
    pauseTimer();
    focusData.timerState.phase = newPhase;
    focusData.timerState.totalSeconds = seconds;
    focusData.timerState.remainingSeconds = seconds;
    focusData.timerState.warningTriggered = false;
    updateTimerDisplay();
    startTimer();
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && focusData.timerState.isRunning) {
      tickTimer();
      renderFocusDashboard();
    }
  });

  window.addEventListener('focus', () => {
    if (focusData.timerState.isRunning) {
      tickTimer();
      renderFocusDashboard();
    }
  });

  // --- Undo Toast ---
  function showUndoToast(msg, id, onUndoCallback) {
    if (undoTimeout) clearTimeout(undoTimeout);

    undoMessage.textContent = msg;
    undoToast.classList.remove('hidden');

    toastProgressBar.classList.remove('toast-bar');
    void toastProgressBar.offsetWidth;
    toastProgressBar.classList.add('toast-bar');

    btnUndoAction.onclick = () => {
      if (onUndoCallback) {
        onUndoCallback();
      } else {
        deleteLog(id);
      }
      undoToast.classList.add('hidden');
      triggerHaptic(20, 220);
    };

    undoTimeout = setTimeout(() => {
      undoToast.classList.add('hidden');
    }, 5000);
  }

  // --- Export Utilities ---
  function exportCSV() {
    if (logs.length === 0 && focusData.tasks.length === 0) {
      alert('No logs or tasks to export yet.');
      return;
    }

    const headers = ['Type', 'ID', 'Date', 'Time', 'Title/Category', 'Reps/Status', 'Weight/Duration'];
    const moveRows = logs.map(item => [
      'MOVE', item.id, item.dateStr, item.timeFormatted, `"${item.name}"`, item.reps || 0, item.weightKg || item.steps || 0
    ]);
    const focusRows = focusData.tasks.map(t => [
      'FOCUS', t.id, t.dateStr, t.completedAt || 'Pending', `"${t.title}"`, t.completed ? 'Completed' : 'Pending', t.category
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...moveRows.map(r => r.join(',')), ...focusRows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `pulsesync_full_backup_${getTodayDateStr()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerHaptic(15, 500);
  }

  function exportJSON() {
    const fullBackup = {
      workouts: logs,
      focus: focusData,
      defaults: stickyDefaults,
      exportedAt: new Date().toISOString()
    };
    const jsonStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(fullBackup, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', jsonStr);
    link.setAttribute('download', `pulsesync_backup_${getTodayDateStr()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerHaptic(15, 500);
  }

  function clearSelectedDay() {
    if (confirm(`Reset all workouts and tasks for ${selectedDateStr}?`)) {
      logs = logs.filter(i => i.dateStr !== selectedDateStr);
      focusData.tasks = focusData.tasks.filter(i => i.dateStr !== selectedDateStr);
      saveLocalData();
      renderMetrics();
      renderTimeline();
      renderFocusDashboard();
      triggerHaptic(30, 200);
    }
  }

  // --- Event Listeners Setup ---
  function setupListeners() {
    btnNavMove.addEventListener('click', () => switchDomain('move'));
    btnNavFocus.addEventListener('click', () => switchDomain('focus'));
    btnNavHabits.addEventListener('click', () => {
      modalTitle.textContent = 'Phase 3: Habits & Peer Sync';
      modalBody.textContent = 'Coming in Phase 3: Sleep tracking, 20m book reading, private dopamine detox clean streaks, and peer pair code.';
      previewModal.classList.remove('hidden');
      triggerHaptic(10, 500);
    });

    // Date Navigation
    btnPrevDay.addEventListener('click', () => {
      selectedDateStr = offsetDate(selectedDateStr, -1);
      renderDateDisplay();
      renderMetrics();
      renderTimeline();
      renderFocusDashboard();
      triggerHaptic(8, 480);
    });

    btnNextDay.addEventListener('click', () => {
      selectedDateStr = offsetDate(selectedDateStr, 1);
      renderDateDisplay();
      renderMetrics();
      renderTimeline();
      renderFocusDashboard();
      triggerHaptic(8, 480);
    });

    btnJumpToday.addEventListener('click', () => {
      selectedDateStr = getTodayDateStr();
      renderDateDisplay();
      renderMetrics();
      renderTimeline();
      renderFocusDashboard();
      triggerHaptic(8, 480);
    });

    btnDateContainer.addEventListener('click', () => {
      try { datePickerInput.showPicker(); } catch (e) { datePickerInput.click(); }
    });

    datePickerInput.addEventListener('change', (e) => {
      if (e.target.value) {
        selectedDateStr = e.target.value;
        renderDateDisplay();
        renderMetrics();
        renderTimeline();
        renderFocusDashboard();
      }
    });

    // Move Sub-Views
    subViewToday.addEventListener('click', () => {
      subViewToday.className = 'spring-btn px-4 py-1.5 rounded-lg text-xs font-bold bg-[#1a2233] text-white border border-white/15';
      subViewProgress.className = 'spring-btn px-4 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white';
      sectionTodayView.classList.remove('hidden');
      sectionProgressView.classList.add('hidden');
      triggerHaptic(8, 500);
    });

    subViewProgress.addEventListener('click', () => {
      subViewProgress.className = 'spring-btn px-4 py-1.5 rounded-lg text-xs font-bold bg-[#1a2233] text-white border border-white/15';
      subViewToday.className = 'spring-btn px-4 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white';
      sectionTodayView.classList.add('hidden');
      sectionProgressView.classList.remove('hidden');
      renderProgressView();
      triggerHaptic(8, 500);
    });

    btnToggleBarbellDrawer.addEventListener('click', () => {
      isBarbellDrawerOpen = !isBarbellDrawerOpen;
      if (isBarbellDrawerOpen) {
        barbellBreakdownDrawer.classList.remove('max-h-0', 'opacity-0');
        barbellBreakdownDrawer.classList.add('max-h-96', 'opacity-100');
        arrowBarbellDrawer.style.transform = 'rotate(180deg)';
      } else {
        barbellBreakdownDrawer.classList.remove('max-h-96', 'opacity-100');
        barbellBreakdownDrawer.classList.add('max-h-0', 'opacity-0');
        arrowBarbellDrawer.style.transform = 'rotate(0deg)';
      }
      triggerHaptic(8, 450);
    });

    // Move Steppers
    btnPullupDec.addEventListener('click', () => {
      if (stickyDefaults.pullupReps > 1) {
        stickyDefaults.pullupReps--;
        saveLocalData();
        updateStepperDisplays();
        triggerHaptic(8, 450);
      }
    });
    btnPullupInc.addEventListener('click', () => {
      stickyDefaults.pullupReps++;
      saveLocalData();
      updateStepperDisplays();
      triggerHaptic(8, 650);
    });
    btnPullupLog.addEventListener('click', () => {
      addLog({ category: 'pullup', name: 'Half Pull-ups', reps: stickyDefaults.pullupReps, weightKg: 0 });
    });

    btnPushupDec.addEventListener('click', () => {
      if (stickyDefaults.pushupReps > 1) {
        stickyDefaults.pushupReps = Math.max(1, stickyDefaults.pushupReps - 2);
        saveLocalData();
        updateStepperDisplays();
        triggerHaptic(8, 450);
      }
    });
    btnPushupInc.addEventListener('click', () => {
      stickyDefaults.pushupReps += 2;
      saveLocalData();
      updateStepperDisplays();
      triggerHaptic(8, 650);
    });
    btnPushupLog.addEventListener('click', () => {
      addLog({ category: 'pushup', name: 'Push-ups', reps: stickyDefaults.pushupReps, weightKg: 0 });
    });

    barbellPills.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        barbellPills.querySelectorAll('button').forEach(b => {
          b.className = 'spring-btn px-3 py-1.5 rounded-lg text-xs font-medium bg-[#1a2233] text-slate-300 hover:text-white whitespace-nowrap';
        });
        btn.className = 'spring-btn px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-slate-950 shadow-sm whitespace-nowrap';
        stickyDefaults.selectedLift = btn.getAttribute('data-lift');
        saveLocalData();
        updateStepperDisplays();
        triggerHaptic(10, 550);
      });
    });

    btnBarbellDec.addEventListener('click', () => {
      if (stickyDefaults.barbellReps > 1) {
        stickyDefaults.barbellReps = Math.max(1, stickyDefaults.barbellReps - 2);
        saveLocalData();
        updateStepperDisplays();
        triggerHaptic(8, 450);
      }
    });
    btnBarbellInc.addEventListener('click', () => {
      stickyDefaults.barbellReps += 2;
      saveLocalData();
      updateStepperDisplays();
      triggerHaptic(8, 650);
    });
    btnBarbellLog.addEventListener('click', () => {
      addLog({ category: 'barbell', name: `Barbell ${stickyDefaults.selectedLift}`, liftName: stickyDefaults.selectedLift, reps: stickyDefaults.barbellReps, weightKg: 30 });
    });

    btnStepDec.addEventListener('click', () => {
      if (stickyDefaults.stepIncrement > 500) {
        stickyDefaults.stepIncrement = Math.max(500, stickyDefaults.stepIncrement - 500);
        saveLocalData();
        updateStepperDisplays();
        triggerHaptic(8, 450);
      }
    });
    btnStepInc.addEventListener('click', () => {
      stickyDefaults.stepIncrement += 500;
      saveLocalData();
      updateStepperDisplays();
      triggerHaptic(8, 650);
    });
    btnStepLog.addEventListener('click', () => {
      addLog({ category: 'walk', name: 'Outdoor Walk', steps: stickyDefaults.stepIncrement });
    });

    btnEllipticalDec.addEventListener('click', () => {
      if (stickyDefaults.ellipticalMins > 5) {
        stickyDefaults.ellipticalMins = Math.max(5, stickyDefaults.ellipticalMins - 5);
        saveLocalData();
        updateStepperDisplays();
        triggerHaptic(8, 450);
      }
    });
    btnEllipticalInc.addEventListener('click', () => {
      stickyDefaults.ellipticalMins += 5;
      saveLocalData();
      updateStepperDisplays();
      triggerHaptic(8, 650);
    });
    btnEllipticalLog.addEventListener('click', () => {
      addLog({ category: 'elliptical', name: 'Elliptical / Cycle', minutes: stickyDefaults.ellipticalMins });
    });

    btnWakeUp.addEventListener('click', () => {
      const existing = logs.find(i => i.dateStr === selectedDateStr && i.category === 'wake_up');
      if (existing) {
        alert(`Wake-up already logged for ${selectedDateStr} at ${existing.timeFormatted}`);
        return;
      }
      addLog({ category: 'wake_up', name: 'Woke Up' });
    });

    // Curriculum Day Navigation
    btnPrevCurriculumDay.addEventListener('click', () => {
      focusData.currentCurriculumDay = focusData.currentCurriculumDay > 1 ? focusData.currentCurriculumDay - 1 : 7;
      saveLocalData();
      postFocusToServer();
      renderFocusDashboard();
      triggerHaptic(8, 480);
    });

    btnNextCurriculumDay.addEventListener('click', () => {
      focusData.currentCurriculumDay = focusData.currentCurriculumDay < 7 ? focusData.currentCurriculumDay + 1 : 1;
      saveLocalData();
      postFocusToServer();
      renderFocusDashboard();
      triggerHaptic(8, 480);
    });

    btnPlanTomorrow.addEventListener('click', () => {
      focusData.currentCurriculumDay = (focusData.currentCurriculumDay % 7) + 1;
      saveLocalData();
      postFocusToServer();
      renderFocusDashboard();
      triggerHaptic(12, 600);
      showUndoToast(`Switched to ${CURRICULUM_DAYS[focusData.currentCurriculumDay - 1].title}`, 'plan_tomorrow');
    });

    // Timer Preset Buttons
    preset50m.addEventListener('click', () => setTimerPreset('50m'));
    preset30m.addEventListener('click', () => setTimerPreset('30m'));
    preset60m.addEventListener('click', () => setTimerPreset('60m'));

    // Focus Timer Controls
    btnTimerStart.addEventListener('click', startTimer);
    btnTimerPause.addEventListener('click', pauseTimer);
    btnTimerReset.addEventListener('click', resetTimer);

    btnUnbindTask.addEventListener('click', unbindTask);
    btnTimerCompleteTask.addEventListener('click', () => {
      if (focusData.timerState.boundTaskId) completeTask(focusData.timerState.boundTaskId);
    });

    // Feynman Alarm Dismissal
    btnDismissAlarm.addEventListener('click', () => {
      feynmanAlarmModal.classList.add('hidden');
      screenFlashOverlay.classList.remove('flash-active');
      if (focusData.timerState.phase === 'study') {
        transitionToPhase('recall', 10 * 60);
      } else {
        transitionToPhase('study', 50 * 60);
      }
    });

    // Bucket Filter Pills
    focusBucketFilters.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        focusBucketFilters.querySelectorAll('button').forEach(b => {
          b.className = 'spring-btn px-3 py-1 rounded-lg text-xs font-medium bg-[#1a2233] text-slate-300 hover:text-white whitespace-nowrap';
        });
        btn.className = 'spring-btn px-3 py-1 rounded-lg text-xs font-bold bg-white text-slate-950 whitespace-nowrap';
        activeBucketFilter = btn.getAttribute('data-bucket');
        renderFocusDashboard();
        triggerHaptic(8, 480);
      });
    });

    // Add Task Modal Controls
    btnOpenAddTaskModal.addEventListener('click', () => {
      inputTaskTitle.value = '';
      modalAddTask.classList.remove('hidden');
      inputTaskTitle.focus();
      triggerHaptic(8, 500);
    });

    btnCloseAddTaskModal.addEventListener('click', () => modalAddTask.classList.add('hidden'));
    btnCancelAddTask.addEventListener('click', () => modalAddTask.classList.add('hidden'));

    modalBucketPills.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        modalBucketPills.querySelectorAll('button').forEach(b => {
          b.className = 'p-2 rounded-lg bg-[#1a2233] text-slate-300 text-[10px] text-left';
        });
        btn.className = 'p-2 rounded-lg bg-sky-500 text-slate-950 font-bold text-[10px] text-left';
        modalSelectedBucket = btn.getAttribute('data-bucket');
        triggerHaptic(6, 450);
      });
    });

    btnSaveTask.addEventListener('click', () => {
      const title = inputTaskTitle.value.trim();
      if (!title) {
        alert('Please enter a question or task title.');
        return;
      }

      const currentDayConfig = CURRICULUM_DAYS.find(d => d.day === focusData.currentCurriculumDay) || CURRICULUM_DAYS[0];
      let category = currentDayConfig.category;
      if (modalSelectedBucket === 'dsa') category = 'LeetCode';
      if (modalSelectedBucket === 'apps') category = 'Career';
      if (modalSelectedBucket === 'azure') category = 'Azure';

      const newTask = {
        id: 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        title,
        category,
        bucket: modalSelectedBucket,
        curriculumDay: focusData.currentCurriculumDay,
        dateStr: selectedDateStr,
        completed: false,
        completedAt: null
      };

      focusData.tasks.unshift(newTask);
      if (!focusData.timerState.boundTaskId) {
        focusData.timerState.boundTaskId = newTask.id;
      }

      saveLocalData();
      postFocusToServer();
      modalAddTask.classList.add('hidden');
      triggerHaptic(15, 650);
      renderFocusDashboard();
    });

    // Global Utilities
    btnExportCSV.addEventListener('click', exportCSV);
    btnExportJSON.addEventListener('click', exportJSON);
    btnClearToday.addEventListener('click', clearSelectedDay);
    btnCloseModal.addEventListener('click', () => previewModal.classList.add('hidden'));
  }

  // --- Adherence View ---
  function renderProgressView() {
    const todayStr = getTodayDateStr();
    const days = [];
    for (let i = 6; i >= 0; i--) days.push(offsetDate(todayStr, -i));

    adherenceHeaderRow.innerHTML = `
      <th class="text-left py-2 px-1 font-semibold text-slate-400">Target</th>
      ${days.map(d => {
        const [, , dayNum] = d.split('-');
        return `<th class="text-center py-2 px-1 font-semibold">${dayNum}</th>`;
      }).join('')}
    `;

    const categories = [
      { id: 'pullups', label: 'Pull-ups', target: TARGETS.pullups },
      { id: 'pushups', label: 'Push-ups', target: TARGETS.pushups },
      { id: 'tonnage', label: 'Barbell', target: TARGETS.tonnage },
      { id: 'steps', label: 'Cardio', target: TARGETS.steps },
      { id: 'tasks', label: 'Bootcamp Tasks', target: 5 }
    ];

    adherenceBodyRows.innerHTML = categories.map(cat => {
      return `
        <tr>
          <td class="py-2 px-1 font-medium text-slate-300">${cat.label}</td>
          ${days.map(d => {
            let val = 0;
            if (cat.id === 'tasks') {
              val = focusData.tasks.filter(t => t.dateStr === d && t.completed).length;
            } else {
              const dayLogs = logs.filter(l => l.dateStr === d);
              dayLogs.forEach(l => {
                if (cat.id === 'pullups' && l.category === 'pullup') val += (l.reps || 0);
                if (cat.id === 'pushups' && l.category === 'pushup') val += (l.reps || 0);
                if (cat.id === 'tonnage' && l.category === 'barbell') val += ((l.reps || 0) * (l.weightKg || 30));
                if (cat.id === 'steps') {
                  if (l.category === 'walk') val += (l.steps || 0);
                  if (l.category === 'elliptical') val += ((l.minutes || 0) * 120);
                }
              });
            }

            let mark = '✕';
            let cellClass = 'adherence-none';
            if (val >= cat.target) {
              mark = '✓'; cellClass = 'adherence-full';
            } else if (val > 0) {
              mark = '~'; cellClass = 'adherence-partial';
            }
            return `<td class="text-center py-2 px-1"><div class="adherence-cell mx-auto ${cellClass}">${mark}</div></td>`;
          }).join('')}
        </tr>
      `;
    }).join('');

    const exerciseList = ['Half Pull-ups', 'Push-ups', ...BARBELL_EXERCISES.map(b => `Barbell ${b}`)];
    exerciseProgressionList.innerHTML = exerciseList.map(name => {
      const relevantLogs = logs.filter(l => (l.name === name || l.name === name.replace('Barbell ', '')) && days.includes(l.dateStr));
      let totalReps = 0;
      let totalSets = 0;
      let bestSet = 0;
      const activeDaysSet = new Set();

      relevantLogs.forEach(l => {
        const reps = l.reps || 0;
        totalReps += reps;
        totalSets += 1;
        bestSet = Math.max(bestSet, reps);
        activeDaysSet.add(l.dateStr);
      });

      if (totalReps === 0) return '';
      return `
        <div class="p-2.5 rounded-xl bg-[#111622] border border-white/[0.06] flex items-center justify-between">
          <div>
            <div class="font-bold text-white text-xs">${name}</div>
            <div class="text-[10px] text-slate-400 mt-0.5">${activeDaysSet.size}/7 active days · Best set: ${bestSet} reps</div>
          </div>
          <div class="text-right font-mono">
            <div class="text-xs font-bold text-sky-400">${totalReps} <span class="text-[10px] text-slate-400 font-normal">reps</span></div>
            <div class="text-[10px] text-slate-500">${totalSets} sets</div>
          </div>
        </div>
      `;
    }).filter(Boolean).join('') || '<div class="text-slate-500 py-4 text-center">No exercise history in last 7 days.</div>';
  }

  // --- Service Worker ---
  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
          .then(reg => console.log('PulseSync SW active:', reg.scope))
          .catch(err => console.log('SW note:', err));
      });
    }
  }

  // --- Init ---
  function init() {
    loadLocalData();
    updateStepperDisplays();
    updateTimerDisplay();
    setupListeners();
    registerServiceWorker();

    syncWithServer();
    setInterval(syncWithServer, 5000);
  }

  init();
})();
