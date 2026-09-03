// PulseSync Life OS - Unified Move, Focus & Habits Operating System
(function () {
  'use strict';

  // --- Storage Keys ---
  const STORAGE_KEY_LOGS = 'pulsesync_logs_v3';
  const STORAGE_KEY_DEFAULTS = 'pulsesync_defaults_v3';
  const STORAGE_KEY_FOCUS = 'pulsesync_focus_v8';
  const STORAGE_KEY_HABITS = 'pulsesync_habits_v2';

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
      title: 'Day 1: Angular Forms & Interceptors',
      tomorrow: 'Day 2: Backend 1 (.NET & Memory)',
      category: 'Angular'
    },
    {
      day: 2,
      title: 'Day 2: Backend 1 (.NET & Memory)',
      tomorrow: 'Day 3: Frontend 2 (RxJS Basics)',
      category: '.NET'
    },
    {
      day: 3,
      title: 'Day 3: Frontend 2 (RxJS Basics)',
      tomorrow: 'Day 4: Backend 2 (Web API Basics)',
      category: 'Angular'
    },
    {
      day: 4,
      title: 'Day 4: Backend 2 (Web API Basics)',
      tomorrow: 'Day 5: Frontend 3 (State & Components)',
      category: '.NET'
    },
    {
      day: 5,
      title: 'Day 5: Frontend 3 (State & Components)',
      tomorrow: 'Day 6: Backend 3 (EF Core & SQL)',
      category: 'Angular'
    },
    {
      day: 6,
      title: 'Day 6: Backend 3 (EF Core & SQL)',
      tomorrow: 'Day 7: Cloud & Behavioral Review',
      category: '.NET'
    },
    {
      day: 7,
      title: 'Day 7: Cloud & Behavioral Review',
      tomorrow: 'Week 2 Launch',
      category: 'Azure & STAR'
    }
  ];

  const DEFAULT_BOOTCAMP_TASKS = [
    // --- DAY 1 ---
    { id: 'd1_deep_1', code: 'NG-09', title: '[NG-09] Reactive Forms vs Template-Driven Forms (FormGroup, FormControl, Validators)', category: 'Angular', bucket: 'deep', curriculumDay: 1, dateStr: getTodayDateStr(), completed: false, completedAt: null },
    { id: 'd1_deep_2', code: 'NG-08', title: '[NG-08] Route Guards (CanActivate basics) vs Resolvers (trade-offs & failure modes)', category: 'Angular', bucket: 'deep', curriculumDay: 1, dateStr: getTodayDateStr(), completed: false, completedAt: null },
    { id: 'd1_deep_3', code: 'NG-11', title: '[NG-11] HTTP Interceptors (injecting Bearer token, basic 401 redirect handling)', category: 'Angular', bucket: 'deep', curriculumDay: 1, dateStr: getTodayDateStr(), completed: false, completedAt: null },
    { id: 'd1_spd_1', code: 'NG-01', title: '[NG-01] Component vs Directive in 60 seconds', category: 'Angular', bucket: 'spaced', curriculumDay: 1, dateStr: getTodayDateStr(), completed: false, completedAt: null },
    { id: 'd1_spd_2', code: 'NG-02', title: '[NG-02] Data Binding types (Interpolation vs Property vs Event)', category: 'Angular', bucket: 'spaced', curriculumDay: 1, dateStr: getTodayDateStr(), completed: false, completedAt: null },
    { id: 'd1_spd_3', code: 'NG-06', title: '[NG-06] Constructor vs ngOnInit (when to initialize subscriptions)', category: 'Angular', bucket: 'spaced', curriculumDay: 1, dateStr: getTodayDateStr(), completed: false, completedAt: null },
    { id: 'd1_spd_4', code: 'NG-03', title: '[NG-03] What does providedIn: root mean in Angular DI?', category: 'Angular', bucket: 'spaced', curriculumDay: 1, dateStr: getTodayDateStr(), completed: false, completedAt: null },
    { id: 'd1_spd_5', code: 'NG-15', title: '[NG-15] Smart vs Dumb Components (@Input, @Output communication)', category: 'Angular', bucket: 'spaced', curriculumDay: 1, dateStr: getTodayDateStr(), completed: false, completedAt: null },
    { id: 'd1_live_1', code: 'LIVE-01', title: 'Live Coding: Build an Angular Reactive Form with 2 fields (Email, Amount) & basic validation', category: 'Angular', bucket: 'live', curriculumDay: 1, dateStr: getTodayDateStr(), completed: false, completedAt: null },
    { id: 'd1_dsa_1', code: 'DSA-01', title: 'C# NeetCode DSA: LeetCode Easy — Two Sum (Hash Map O(N) time, O(N) space)', category: 'LeetCode', bucket: 'dsa', curriculumDay: 1, dateStr: getTodayDateStr(), completed: false, completedAt: null }
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
    jobAppsCount: 0,
    azureMinutes: 0,
    dailyHistory: {},
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

  let modalSelectedBucket = 'deep';
  let timerInterval = null;
  let isSpacedDrawerOpen = false;

  // --- State: Habits Engine ---
  let habitsData = {
    sleep: {
      bedtimeRaw: '23:15',
      wakeupRaw: '07:15',
      sleepDuration: '8h 00m',
      isOptimal: true,
      sunlightDone: false
    },
    detox: {
      cleanDays: 3,
      tierName: 'Calibrated',
      morningPhoneFree: false,
      zeroReels: false,
      noPhoneInBed: false,
      relapseHistory: []
    },
    reading: {
      currentBook: 'Designing Data-Intensive Applications',
      startPage: 42,
      endPage: 64,
      pagesReadToday: 22,
      timerSeconds: 20 * 60,
      isTimerRunning: false,
      history: []
    },
    keystones: {
      bedMade: false,
      roomReset: false
    },
    dailyRecords: {}
  };

  let readingTimerInterval = null;

  // --- DOM Elements ---
  const syncIndicator = document.getElementById('syncIndicator');
  const serverSyncStatus = document.getElementById('serverSyncStatus');
  const btnWakeUp = document.getElementById('btnWakeUp');
  const wakeUpLabel = document.getElementById('wakeUpLabel');
  const btnOpenProtocolsModal = document.getElementById('btnOpenProtocolsModal');

  const btnNavMove = document.getElementById('btnNavMove');
  const btnNavFocus = document.getElementById('btnNavFocus');
  const btnNavHabits = document.getElementById('btnNavHabits');
  const viewMove = document.getElementById('viewMove');
  const viewFocus = document.getElementById('viewFocus');
  const viewHabits = document.getElementById('viewHabits');

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
  const subViewFocusToday = document.getElementById('subViewFocusToday');
  const subViewFocusProgress = document.getElementById('subViewFocusProgress');
  const sectionFocusTodayView = document.getElementById('sectionFocusTodayView');
  const sectionFocusProgressView = document.getElementById('sectionFocusProgressView');

  const btnPrevCurriculumDay = document.getElementById('btnPrevCurriculumDay');
  const btnNextCurriculumDay = document.getElementById('btnNextCurriculumDay');
  const curriculumDayBadge = document.getElementById('curriculumDayBadge');
  const labelTomorrowTitle = document.getElementById('labelTomorrowTitle');
  const btnPlanTomorrow = document.getElementById('btnPlanTomorrow');

  const timerDisplay = document.getElementById('timerDisplay');
  const timerSubLabel = document.getElementById('timerSubLabel');
  const preset50m = document.getElementById('preset50m');
  const preset30m = document.getElementById('preset30m');
  const preset60m = document.getElementById('preset60m');
  const boundTaskTitle = document.getElementById('boundTaskTitle');
  const btnUnbindTask = document.getElementById('btnUnbindTask');
  const btnTimerStart = document.getElementById('btnTimerStart');
  const btnTimerPause = document.getElementById('btnTimerPause');
  const btnTimerReset = document.getElementById('btnTimerReset');
  const btnTimerCompleteTask = document.getElementById('btnTimerCompleteTask');

  const valOverallProgress = document.getElementById('valOverallProgress');
  const barOverall = document.getElementById('barOverall');
  const valDeepCount = document.getElementById('valDeepCount');
  const valSpacedCount = document.getElementById('valSpacedCount');
  const valLiveCount = document.getElementById('valLiveCount');
  const valDsaCount = document.getElementById('valDsaCount');
  const valTotalStudyTime = document.getElementById('valTotalStudyTime');

  const btnOpenAddTaskModal = document.getElementById('btnOpenAddTaskModal');
  const taskListContainer = document.getElementById('taskListContainer');

  const btnToggleSpacedDrawer = document.getElementById('btnToggleSpacedDrawer');
  const arrowSpacedDrawer = document.getElementById('arrowSpacedDrawer');
  const valSpacedDrawerStatus = document.getElementById('valSpacedDrawerStatus');
  const spacedDrawerContent = document.getElementById('spacedDrawerContent');
  const spacedTasksContainer = document.getElementById('spacedTasksContainer');

  const btnDecJobApp = document.getElementById('btnDecJobApp');
  const valJobAppsCount = document.getElementById('valJobAppsCount');
  const btnIncJobApp = document.getElementById('btnIncJobApp');
  const btnAdd5JobApps = document.getElementById('btnAdd5JobApps');

  const valAzureTimeText = document.getElementById('valAzureTimeText');
  const btnLogAzure30m = document.getElementById('btnLogAzure30m');
  const btnLogAzure60m = document.getElementById('btnLogAzure60m');
  const btnFocusAzureTimer = document.getElementById('btnFocusAzureTimer');

  const completedTaskCount = document.getElementById('completedTaskCount');
  const completedTasksList = document.getElementById('completedTasksList');
  const emptyCompletedTasks = document.getElementById('emptyCompletedTasks');

  // Analytics Elements
  const analyticsSprintCard = document.getElementById('analyticsSprintCard');
  const analyticsStreakVal = document.getElementById('analyticsStreakVal');
  const analyticsAdherenceVal = document.getElementById('analyticsAdherenceVal');
  const analyticsTotalStudyVal = document.getElementById('analyticsTotalStudyVal');
  const analyticsTotalAppsVal = document.getElementById('analyticsTotalAppsVal');
  const analyticsMatrixContainer = document.getElementById('analyticsMatrixContainer');
  const analyticsMatrixHeaderRow = document.getElementById('analyticsMatrixHeaderRow');
  const analyticsMatrixBodyRows = document.getElementById('analyticsMatrixBodyRows');
  const analyticsStudyHoursChart = document.getElementById('analyticsStudyHoursChart');
  const analyticsAvgStudyVal = document.getElementById('analyticsAvgStudyVal');
  const analyticsBarsContainer = document.getElementById('analyticsBarsContainer');
  const analyticsBarsDaysRow = document.getElementById('analyticsBarsDaysRow');
  const analyticsJobFunnel = document.getElementById('analyticsJobFunnel');
  const analyticsJobFunnelCount = document.getElementById('analyticsJobFunnelCount');
  const barJobFunnel = document.getElementById('barJobFunnel');
  const analyticsCurriculumCoverage = document.getElementById('analyticsCurriculumCoverage');
  const analyticsCoverageRows = document.getElementById('analyticsCoverageRows');

  // Habits Elements (Zones 1 to 6)
  const valMasterTierTitle = document.getElementById('valMasterTierTitle');
  const valOverallScoreBadge = document.getElementById('valOverallScoreBadge');
  const valMoveTier = document.getElementById('valMoveTier');
  const valFocusTier = document.getElementById('valFocusTier');
  const valHabitsTier = document.getElementById('valHabitsTier');

  const badgeSleepQuality = document.getElementById('badgeSleepQuality');
  const inputBedtime = document.getElementById('inputBedtime');
  const inputWakeup = document.getElementById('inputWakeup');
  const btnLogBedtimeNow = document.getElementById('btnLogBedtimeNow');
  const btnToggleSunlight = document.getElementById('btnToggleSunlight');
  const sunlightIcon = document.getElementById('sunlightIcon');
  const sunlightLabel = document.getElementById('sunlightLabel');

  const badgeDetoxTier = document.getElementById('badgeDetoxTier');
  const valCleanStreakDays = document.getElementById('valCleanStreakDays');
  const chkMorningPhone = document.getElementById('chkMorningPhone');
  const chkZeroReels = document.getElementById('chkZeroReels');
  const chkNoPhoneInBed = document.getElementById('chkNoPhoneInBed');
  const btnOpenRelapseModal = document.getElementById('btnOpenRelapseModal');

  const valReadingTodayTotal = document.getElementById('valReadingTodayTotal');
  const inputBookTitle = document.getElementById('inputBookTitle');
  const inputStartPage = document.getElementById('inputStartPage');
  const inputEndPage = document.getElementById('inputEndPage');
  const valReadingTimerDisplay = document.getElementById('valReadingTimerDisplay');
  const btnStartReadingTimer = document.getElementById('btnStartReadingTimer');
  const btnPauseReadingTimer = document.getElementById('btnPauseReadingTimer');
  const btnSaveReadingSession = document.getElementById('btnSaveReadingSession');

  const chkBedMade = document.getElementById('chkBedMade');
  const chkRoomReset = document.getElementById('chkRoomReset');

  const btnCopyPeerDispatch = document.getElementById('btnCopyPeerDispatch');
  const btnPreviewPublicLedger = document.getElementById('btnPreviewPublicLedger');

  // Protocols & Modals
  const modalScienceProtocols = document.getElementById('modalScienceProtocols');
  const btnCloseProtocolsModal = document.getElementById('btnCloseProtocolsModal');
  const btnDismissProtocols = document.getElementById('btnDismissProtocols');

  const modalRelapse = document.getElementById('modalRelapse');
  const btnCloseRelapseModal = document.getElementById('btnCloseRelapseModal');
  const relapseTriggerOptions = document.getElementById('relapseTriggerOptions');

  const modalPublicLedger = document.getElementById('modalPublicLedger');
  const publicLedgerContent = document.getElementById('publicLedgerContent');
  const btnClosePublicLedger = document.getElementById('btnClosePublicLedger');
  const btnClosePublicLedgerBtn = document.getElementById('btnClosePublicLedgerBtn');
  const btnCopyPublicLedgerText = document.getElementById('btnCopyPublicLedgerText');

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
      try { navigator.vibrate([250, 150, 250, 150, 500]); } catch (e) {}
    }

    screenFlashOverlay.classList.remove('flash-active');
    void screenFlashOverlay.offsetWidth;
    screenFlashOverlay.classList.add('flash-active');

    feynmanAlarmTitle.textContent = 'Time Ceiling Reached!';
    feynmanAlarmBody.textContent = 'Session finished. Close your materials and step away for a recovery break.';
    btnDismissAlarm.textContent = 'Session Complete';
    feynmanAlarmModal.classList.remove('hidden');
  }

  // --- Date & Time Calculations ---
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

  function calculateSleep(bedRaw, wakeRaw) {
    if (!bedRaw || !wakeRaw) return { durationText: '7h 45m', isOptimal: true, totalMins: 465 };
    const [bH, bM] = bedRaw.split(':').map(Number);
    const [wH, wM] = wakeRaw.split(':').map(Number);

    let bedMin = bH * 60 + bM;
    let wakeMin = wH * 60 + wM;

    // If wake is earlier in day than bed (e.g. 23:15 to 07:15)
    if (wakeMin <= bedMin) {
      wakeMin += 24 * 60;
    }

    const diff = wakeMin - bedMin;
    const hrs = Math.floor(diff / 60);
    const mins = diff % 60;

    return {
      durationText: `${hrs}h ${String(mins).padStart(2, '0')}m`,
      isOptimal: diff >= (7 * 60) && diff <= (9 * 60),
      totalMins: diff
    };
  }

  // --- Storage & Sync Engine ---
  function loadLocalData() {
    try {
      const storedLogs = localStorage.getItem(STORAGE_KEY_LOGS);
      if (storedLogs) logs = JSON.parse(storedLogs);

      const storedDefaults = localStorage.getItem(STORAGE_KEY_DEFAULTS);
      if (storedDefaults) stickyDefaults = { ...stickyDefaults, ...JSON.parse(storedDefaults) };

      const storedFocus = localStorage.getItem(STORAGE_KEY_FOCUS);
      if (storedFocus) focusData = { ...focusData, ...JSON.parse(storedFocus) };

      const storedHabits = localStorage.getItem(STORAGE_KEY_HABITS);
      if (storedHabits) habitsData = { ...habitsData, ...JSON.parse(storedHabits) };
    } catch (err) {
      console.error('Error reading local storage:', err);
    }
  }

  function saveLocalData() {
    try {
      localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logs));
      localStorage.setItem(STORAGE_KEY_DEFAULTS, JSON.stringify(stickyDefaults));
      localStorage.setItem(STORAGE_KEY_FOCUS, JSON.stringify(focusData));
      localStorage.setItem(STORAGE_KEY_HABITS, JSON.stringify(habitsData));
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

      // 2. Sync Focus Tasks & Timer
      const resFocus = await fetch('/api/focus');
      if (resFocus.ok) {
        const serverFocus = await resFocus.json();
        if (serverFocus) {
          if (serverFocus.currentCurriculumDay) focusData.currentCurriculumDay = serverFocus.currentCurriculumDay;
          if (serverFocus.jobAppsCount !== undefined) focusData.jobAppsCount = serverFocus.jobAppsCount;
          if (serverFocus.azureMinutes !== undefined) focusData.azureMinutes = serverFocus.azureMinutes;
          if (serverFocus.dailyHistory) focusData.dailyHistory = { ...focusData.dailyHistory, ...serverFocus.dailyHistory };

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
              if (!timerInterval) resumeTimerFromAnchor();
            } else {
              focusData.timerState = serverFocus.timerState;
              focusData.timerState.isRunning = false;
              focusData.timerState.remainingSeconds = 0;
            }
          }

          saveLocalData();
        }
      }

      // 3. Sync Habits
      const resHabits = await fetch('/api/habits');
      if (resHabits.ok) {
        const serverHabits = await resHabits.json();
        if (serverHabits && serverHabits.sleep) {
          habitsData = { ...habitsData, ...serverHabits };
          saveLocalData();
        }
      }

      syncIndicator.className = 'w-2 h-2 rounded-full bg-emerald-400';
      serverSyncStatus.textContent = 'Wi-Fi Synced (Live)';
    } catch (err) {
      syncIndicator.className = 'w-2 h-2 rounded-full bg-slate-500';
      serverSyncStatus.textContent = 'Offline (Local Cache)';
    }

    renderDateDisplay();
    renderMetrics();
    renderTimeline();
    renderFocusDashboard();
    renderFocusAnalytics();
    renderHabitsDashboard();
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

  async function postHabitsToServer() {
    try {
      await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(habitsData)
      });
    } catch (e) {}
  }

  // --- Domain Switching ---
  function switchDomain(domain) {
    viewMove.classList.add('hidden');
    viewFocus.classList.add('hidden');
    viewHabits.classList.add('hidden');

    btnNavMove.className = 'spring-btn flex-1 py-2.5 rounded-lg text-slate-400 hover:text-white transition';
    btnNavFocus.className = 'spring-btn flex-1 py-2.5 rounded-lg text-slate-400 hover:text-white transition';
    btnNavHabits.className = 'spring-btn flex-1 py-2.5 rounded-lg text-slate-400 hover:text-white transition';

    if (domain === 'move') {
      viewMove.classList.remove('hidden');
      btnNavMove.className = 'spring-btn flex-1 py-2.5 rounded-lg bg-white text-slate-950 font-bold shadow-sm';
    } else if (domain === 'focus') {
      viewFocus.classList.remove('hidden');
      btnNavFocus.className = 'spring-btn flex-1 py-2.5 rounded-lg bg-white text-slate-950 font-bold shadow-sm';
      renderFocusDashboard();
      renderFocusAnalytics();
    } else if (domain === 'habits') {
      viewHabits.classList.remove('hidden');
      btnNavHabits.className = 'spring-btn flex-1 py-2.5 rounded-lg bg-white text-slate-950 font-bold shadow-sm';
      renderHabitsDashboard();
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
          <span class="${textClass} font-mono">${stat.reps} <span class="text-xs text-slate-500">(${stat.sets}s)</span></span>
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
        <div class="timeline-item flex items-center justify-between p-3 rounded-xl bg-[#111622] border border-white/[0.06] hover:border-white/15 transition">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-sm font-bold text-slate-100">${item.name}</span>
              <span class="text-xs px-2 py-0.5 rounded border ${badgeStyle} font-mono">${item.timeFormatted}</span>
            </div>
            <p class="text-xs text-slate-400 font-mono mt-0.5">${details}</p>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs text-slate-500 font-mono">${getRelativeTime(item.timestamp)}</span>
            <button data-id="${item.id}" class="btn-delete-log text-slate-500 hover:text-rose-400 p-1.5 rounded tap-target text-xs transition" title="Delete Log">
              ✕
            </button>
          </div>
        </div>
      `;
    }).join('');

    document.querySelectorAll('.btn-delete-log').forEach(btn => {
      btn.addEventListener('click', () => deleteLog(btn.getAttribute('data-id')));
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

  // --- Focus Engine Functions ---
  function renderFocusDashboard() {
    const currentDayConfig = CURRICULUM_DAYS.find(d => d.day === focusData.currentCurriculumDay) || CURRICULUM_DAYS[0];

    curriculumDayBadge.textContent = currentDayConfig.title;
    labelTomorrowTitle.textContent = `Tomorrow: ${currentDayConfig.tomorrow}`;

    const dayTasks = focusData.tasks.filter(t => t.curriculumDay === focusData.currentCurriculumDay);
    const completedTasks = dayTasks.filter(t => t.completed);

    const deepTasks = dayTasks.filter(t => t.bucket === 'deep');
    const deepCompleted = deepTasks.filter(t => t.completed).length;
    valDeepCount.textContent = `${deepCompleted}/3`;

    const spacedTasks = dayTasks.filter(t => t.bucket === 'spaced');
    const spacedCompleted = spacedTasks.filter(t => t.completed).length;
    valSpacedCount.textContent = `${spacedCompleted}/5`;
    valSpacedDrawerStatus.textContent = `${spacedCompleted}/5 Done`;

    const liveTasks = dayTasks.filter(t => t.bucket === 'live');
    const liveCompleted = liveTasks.filter(t => t.completed).length;
    valLiveCount.textContent = `${liveCompleted}/1`;

    const dsaTasks = dayTasks.filter(t => t.bucket === 'dsa');
    const dsaCompleted = dsaTasks.filter(t => t.completed).length;
    valDsaCount.textContent = `${dsaCompleted}/1`;

    const totalCoreCompleted = deepCompleted + spacedCompleted + liveCompleted + dsaCompleted;
    const totalCoreTarget = 10;
    const progressPct = Math.min(100, Math.round((totalCoreCompleted / totalCoreTarget) * 100));
    valOverallProgress.textContent = `${totalCoreCompleted} / ${totalCoreTarget} Completed (${progressPct}%)`;
    barOverall.style.width = `${progressPct}%`;

    const totalSec = focusData.stats.totalStudySeconds || 0;
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    valTotalStudyTime.textContent = `${hrs}h ${String(mins).padStart(2, '0')}m / 5.5h Target`;

    valJobAppsCount.textContent = focusData.jobAppsCount || 0;
    valAzureTimeText.textContent = `${focusData.azureMinutes || 0} mins logged`;

    updateTimerDisplay();
    if (focusData.timerState.isRunning) {
      btnTimerStart.className = 'spring-btn py-3 rounded-xl bg-sky-500 text-slate-950 text-xs font-bold tracking-wider';
    } else {
      btnTimerStart.className = 'spring-btn py-3 rounded-xl btn-action-primary text-xs font-bold tracking-wider';
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

    const coreTasks = dayTasks.filter(t => !t.completed && (t.bucket === 'deep' || t.bucket === 'live' || t.bucket === 'dsa'));
    if (coreTasks.length === 0) {
      taskListContainer.innerHTML = `
        <div class="text-center py-5 text-slate-400 text-xs font-mono matte-card p-4">
          All core tasks completed! Tap <span class="text-white font-bold">+ Add Task</span> to add more.
        </div>
      `;
    } else {
      taskListContainer.innerHTML = coreTasks.map(t => {
        const isBound = focusData.timerState.boundTaskId === t.id;

        let badgeLabel = 'Deep Anchor';
        let badgeStyle = 'text-sky-300 bg-sky-950/60 border-sky-800/50';

        if (t.bucket === 'deep') {
          badgeLabel = 'Deep Anchor (50m)';
          badgeStyle = 'text-sky-300 bg-sky-950/60 border-sky-800/50';
        } else if (t.bucket === 'live') {
          badgeLabel = 'Live Coding (1h)';
          badgeStyle = 'text-amber-300 bg-amber-950/60 border-amber-800/50';
        } else if (t.bucket === 'dsa') {
          badgeLabel = 'C# DSA (1h)';
          badgeStyle = 'text-emerald-300 bg-emerald-950/60 border-emerald-800/50';
        }

        return `
          <div class="p-3.5 rounded-xl bg-[#111622] border ${isBound ? 'border-sky-400/80 shadow-lg shadow-sky-500/10' : 'border-white/[0.06]'} flex items-center justify-between gap-3 transition">
            <div class="flex items-start gap-3 truncate">
              <button data-id="${t.id}" class="btn-check-task w-5 h-5 rounded-md border border-white/20 hover:border-emerald-400 flex items-center justify-center text-transparent hover:text-emerald-400 text-xs transition mt-0.5 shrink-0">
                ✓
              </button>
              <div class="truncate">
                <div class="text-sm font-bold text-slate-100 truncate">${t.title}</div>
                <div class="flex items-center gap-2 mt-1 font-mono text-xs">
                  <span class="px-2 py-0.5 rounded border ${badgeStyle} font-semibold">${badgeLabel}</span>
                  <span class="text-slate-400">${t.category}</span>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
              <button data-id="${t.id}" class="btn-focus-task spring-btn px-3 py-1.5 rounded-lg text-xs font-bold ${isBound ? 'bg-sky-500 text-slate-950' : 'bg-[#1a2233] text-slate-200 hover:text-white border border-white/10'}">
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

    const spacedPending = dayTasks.filter(t => !t.completed && t.bucket === 'spaced');
    if (spacedPending.length === 0) {
      spacedTasksContainer.innerHTML = `<div class="text-xs text-slate-500 font-mono py-2 text-center">All spaced checks completed!</div>`;
    } else {
      spacedTasksContainer.innerHTML = spacedPending.map(t => {
        const isBound = focusData.timerState.boundTaskId === t.id;
        return `
          <div class="p-2.5 rounded-lg bg-[#0d131f] border ${isBound ? 'border-purple-400' : 'border-white/[0.04]'} flex items-center justify-between gap-2 text-xs">
            <div class="flex items-center gap-2 truncate">
              <button data-id="${t.id}" class="btn-check-task w-4 h-4 rounded border border-white/20 hover:border-emerald-400 flex items-center justify-center text-transparent hover:text-emerald-400 text-xs shrink-0">✓</button>
              <span class="text-slate-200 font-medium truncate">${t.title}</span>
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
              <button data-id="${t.id}" class="btn-focus-task px-2 py-1 rounded bg-[#1a2233] hover:bg-slate-700 text-purple-300 font-mono font-bold text-xs">
                ${isBound ? 'Active' : 'Focus'}
              </button>
              <button data-id="${t.id}" class="btn-delete-task text-slate-500 hover:text-rose-400 p-1 text-xs">✕</button>
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
              <span class="text-xs text-slate-500">${t.completedAt || ''}</span>
              <button data-id="${t.id}" class="btn-revert-task px-2.5 py-1 rounded bg-[#1a2233] hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-mono transition">
                Revert
              </button>
            </div>
          </div>
        `;
      }).join('');
    }

    document.querySelectorAll('.btn-revert-task').forEach(btn => {
      btn.addEventListener('click', () => revertCompletedTask(btn.getAttribute('data-id')));
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
    renderFocusAnalytics();
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
    renderFocusAnalytics();
    showUndoToast(`Completed: ${task.title}`, task.id, () => {
      task.completed = false;
      task.completedAt = null;
      saveLocalData();
      postFocusToServer();
      renderFocusDashboard();
      renderFocusAnalytics();
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
    renderFocusAnalytics();
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
    renderFocusAnalytics();
  }

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
      preset50m.className = 'px-3 py-1 rounded-lg bg-white/10 text-white font-bold hover:bg-white/20';
      preset30m.className = 'px-3 py-1 rounded-lg text-slate-400 hover:text-white';
      preset60m.className = 'px-3 py-1 rounded-lg text-slate-400 hover:text-white';
      focusData.timerState.totalSeconds = 50 * 60;
      focusData.timerState.remainingSeconds = 50 * 60;
      timerSubLabel.textContent = '50m Hard Stop · 15m Early Answer Warning';
    } else if (preset === '30m') {
      preset30m.className = 'px-3 py-1 rounded-lg bg-white/10 text-white font-bold hover:bg-white/20';
      preset50m.className = 'px-3 py-1 rounded-lg text-slate-400 hover:text-white';
      preset60m.className = 'px-3 py-1 rounded-lg text-slate-400 hover:text-white';
      focusData.timerState.totalSeconds = 30 * 60;
      focusData.timerState.remainingSeconds = 30 * 60;
      timerSubLabel.textContent = '30m Rapid Verbal Checks · 6m each';
    } else {
      preset60m.className = 'px-3 py-1 rounded-lg bg-white/10 text-white font-bold hover:bg-white/20';
      preset50m.className = 'px-3 py-1 rounded-lg text-slate-400 hover:text-white';
      preset30m.className = 'px-3 py-1 rounded-lg text-slate-400 hover:text-white';
      focusData.timerState.totalSeconds = 60 * 60;
      focusData.timerState.remainingSeconds = 60 * 60;
      timerSubLabel.textContent = '60m Hands-on Build · 25m Lookup Rule';
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

      const todayStr = getTodayDateStr();
      if (!focusData.dailyHistory) focusData.dailyHistory = {};
      if (!focusData.dailyHistory[todayStr]) {
        focusData.dailyHistory[todayStr] = { studySeconds: 0, jobApps: focusData.jobAppsCount || 0, azureMinutes: focusData.azureMinutes || 0 };
      }
      focusData.dailyHistory[todayStr].studySeconds = (focusData.dailyHistory[todayStr].studySeconds || 0) + elapsedSeconds;
    }

    const remaining = Math.max(0, Math.round((focusData.timerState.endTimestamp - now) / 1000));
    focusData.timerState.remainingSeconds = remaining;
    updateTimerDisplay();

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
    renderFocusAnalytics();
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

  // --- Focus Engine Analytics Dashboard ---
  function renderFocusAnalytics() {
    const todayStr = getTodayDateStr();
    const days = [];
    for (let i = 6; i >= 0; i--) days.push(offsetDate(todayStr, -i));

    if (!focusData.dailyHistory) focusData.dailyHistory = {};
    if (!focusData.dailyHistory[todayStr]) {
      focusData.dailyHistory[todayStr] = {
        studySeconds: focusData.stats.totalStudySeconds || 0,
        jobApps: focusData.jobAppsCount || 0,
        azureMinutes: focusData.azureMinutes || 0
      };
    } else {
      focusData.dailyHistory[todayStr].studySeconds = Math.max(focusData.dailyHistory[todayStr].studySeconds || 0, focusData.stats.totalStudySeconds || 0);
      focusData.dailyHistory[todayStr].jobApps = Math.max(focusData.dailyHistory[todayStr].jobApps || 0, focusData.jobAppsCount || 0);
      focusData.dailyHistory[todayStr].azureMinutes = Math.max(focusData.dailyHistory[todayStr].azureMinutes || 0, focusData.azureMinutes || 0);
    }

    let activeStreak = 0;
    for (let i = days.length - 1; i >= 0; i--) {
      const d = days[i];
      const hasCompleted = focusData.tasks.some(t => t.dateStr === d && t.completed);
      const studied = (focusData.dailyHistory[d]?.studySeconds || 0) > 0;
      if (hasCompleted || studied) {
        activeStreak++;
      } else if (d !== todayStr) {
        break;
      }
    }
    analyticsStreakVal.textContent = `${Math.max(1, activeStreak)} Day${activeStreak === 1 ? '' : 's'}`;

    let totalTargetsHit = 0;
    let totalPossibleTargets = days.length * 4;
    let totalSprintStudySec = 0;
    let totalSprintJobApps = 0;

    days.forEach(d => {
      const dTasks = focusData.tasks.filter(t => t.dateStr === d && t.completed);
      const dSec = focusData.dailyHistory[d]?.studySeconds || (d === todayStr ? focusData.stats.totalStudySeconds || 0 : 0);
      const dApps = focusData.dailyHistory[d]?.jobApps || (d === todayStr ? focusData.jobAppsCount || 0 : 0);

      totalSprintStudySec += dSec;
      totalSprintJobApps += dApps;

      const deepHit = dTasks.filter(t => t.bucket === 'deep').length >= 3;
      const spacedHit = dTasks.filter(t => t.bucket === 'spaced').length >= 5;
      const liveHit = dTasks.filter(t => t.bucket === 'live').length >= 1;
      const dsaHit = dTasks.filter(t => t.bucket === 'dsa').length >= 1;

      if (deepHit) totalTargetsHit++;
      if (spacedHit) totalTargetsHit++;
      if (liveHit) totalTargetsHit++;
      if (dsaHit) totalTargetsHit++;
    });

    const sprintAdherence = Math.min(100, Math.round((totalTargetsHit / totalPossibleTargets) * 100));
    analyticsAdherenceVal.textContent = `${sprintAdherence > 0 ? sprintAdherence : 100}%`;

    const sprintHrs = Math.floor(totalSprintStudySec / 3600);
    const sprintMins = Math.floor((totalSprintStudySec % 3600) / 60);
    analyticsTotalStudyVal.textContent = `${sprintHrs}h ${String(sprintMins).padStart(2, '0')}m`;
    analyticsTotalAppsVal.textContent = `${totalSprintJobApps} / 40`;

    analyticsMatrixHeaderRow.innerHTML = `
      <th class="text-left py-2 px-1 font-semibold text-slate-400">Constant Track</th>
      ${days.map(d => {
        const [, , dayNum] = d.split('-');
        return `<th class="text-center py-2 px-1 font-semibold">${dayNum}</th>`;
      }).join('')}
    `;

    const matrixTracks = [
      { id: 'deep', label: '3 Deep Anchors (50m)', target: 3 },
      { id: 'spaced', label: '5 Spaced Checks (6m)', target: 5 },
      { id: 'live', label: '1 Live Coding (1h)', target: 1 },
      { id: 'dsa', label: '1 C# DSA (1h)', target: 1 },
      { id: 'apps', label: 'Job Applications (10)', target: 10 }
    ];

    analyticsMatrixBodyRows.innerHTML = matrixTracks.map(trk => {
      return `
        <tr>
          <td class="py-2.5 px-1 font-medium text-slate-300 truncate">${trk.label}</td>
          ${days.map(d => {
            let val = 0;
            if (trk.id === 'apps') {
              val = focusData.dailyHistory[d]?.jobApps || (d === todayStr ? focusData.jobAppsCount || 0 : 0);
            } else {
              val = focusData.tasks.filter(t => t.dateStr === d && t.bucket === trk.id && t.completed).length;
            }

            let mark = '✕';
            let cellClass = 'adherence-none';
            if (val >= trk.target) {
              mark = '✓'; cellClass = 'adherence-full';
            } else if (val > 0) {
              mark = '~'; cellClass = 'adherence-partial';
            }
            return `<td class="text-center py-2 px-1"><div class="adherence-cell mx-auto ${cellClass}">${mark}</div></td>`;
          }).join('')}
        </tr>
      `;
    }).join('');

    const MAX_CHART_HOURS = 6.0;
    const TARGET_HOURS = 5.5;
    let avgHours = (totalSprintStudySec / 3600) / 7;
    analyticsAvgStudyVal.textContent = `Avg: ${avgHours.toFixed(1)}h / day`;

    analyticsBarsContainer.innerHTML = `
      <div class="absolute left-0 right-0 border-b border-dashed border-sky-400/40 z-0 pointer-events-none" style="bottom: ${(TARGET_HOURS / MAX_CHART_HOURS) * 100}%">
        <span class="text-[10px] text-sky-400 font-mono absolute -top-4 right-1">5.5h Goal</span>
      </div>
      ${days.map(d => {
        const dSec = focusData.dailyHistory[d]?.studySeconds || (d === todayStr ? focusData.stats.totalStudySeconds || 0 : 0);
        const dHours = dSec / 3600;
        const barHeightPct = Math.min(100, Math.max(6, Math.round((dHours / MAX_CHART_HOURS) * 100)));
        const isMet = dHours >= TARGET_HOURS;
        const barColor = isMet ? 'bg-sky-400 shadow-sm shadow-sky-400/30' : (dHours > 0 ? 'bg-sky-600' : 'bg-white/10');

        return `
          <div class="flex-1 flex flex-col items-center justify-end h-full relative z-10 group">
            <span class="text-[10px] font-mono text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity mb-1">${dHours.toFixed(1)}h</span>
            <div class="w-full max-w-[28px] ${barColor} rounded-t-lg transition-all" style="height: ${barHeightPct}%"></div>
          </div>
        `;
      }).join('')}
    `;

    analyticsBarsDaysRow.innerHTML = days.map(d => {
      const [y, m, dayNum] = d.split('-').map(Number);
      const dt = new Date(y, m - 1, dayNum);
      const dayName = dt.toLocaleDateString(undefined, { weekday: 'narrow' });
      const isToday = d === todayStr;
      return `<div class="flex-1 text-center font-bold ${isToday ? 'text-sky-400 underline underline-offset-4' : 'text-slate-400'}">${dayName} ${dayNum}</div>`;
    }).join('');

    const funnelTarget = 40;
    const funnelPct = Math.min(100, Math.round((totalSprintJobApps / funnelTarget) * 100));
    analyticsJobFunnelCount.textContent = `${totalSprintJobApps} / ${funnelTarget} (${funnelPct}%)`;
    barJobFunnel.style.width = `${funnelPct}%`;

    const angularCompleted = focusData.tasks.filter(t => t.category === 'Angular' && t.completed).length;
    const netCompleted = focusData.tasks.filter(t => t.category === '.NET' && t.completed).length;
    const dsaCompleted = focusData.tasks.filter(t => t.category === 'LeetCode' && t.completed).length;
    const azureMins = focusData.azureMinutes || 0;
    const azureHrs = (azureMins / 60).toFixed(1);

    const coverageData = [
      { name: 'Angular (Forms, RxJS, Components)', count: `${angularCompleted}/10 Qs`, pct: Math.min(100, Math.round((angularCompleted / 10) * 100)), barColor: 'bg-rose-500' },
      { name: '.NET Core (Memory, Web API, EF Core)', count: `${netCompleted}/10 Qs`, pct: Math.min(100, Math.round((netCompleted / 10) * 100)), barColor: 'bg-purple-500' },
      { name: 'LeetCode DSA in C#', count: `${dsaCompleted}/7 Problems`, pct: Math.min(100, Math.round((dsaCompleted / 7) * 100)), barColor: 'bg-emerald-400' },
      { name: 'Azure AI & STAR Behavioral', count: `${azureHrs} hrs logged`, pct: Math.min(100, Math.round((azureMins / 180) * 100)), barColor: 'bg-sky-400' }
    ];

    analyticsCoverageRows.innerHTML = coverageData.map(c => `
      <div class="space-y-1.5">
        <div class="flex justify-between items-center text-xs">
          <span class="text-slate-300 font-medium">${c.name}</span>
          <span class="text-white font-bold font-mono">${c.count} (${c.pct}%)</span>
        </div>
        <div class="progress-track h-2 bg-white/10 rounded-full overflow-hidden">
          <div class="progress-fill ${c.barColor}" style="width: ${c.pct}%"></div>
        </div>
      </div>
    `).join('');
  }

  // --- Habits Engine Functions ---
  function renderHabitsDashboard() {
    // 1. Master Tier Computation across Move, Focus, Habits
    let totalPullupsAll = 0;
    let totalTonnageAll = 0;
    logs.forEach(l => {
      if (l.category === 'pullup') totalPullupsAll += (l.reps || 0);
      if (l.category === 'barbell') totalTonnageAll += ((l.reps || 0) * (l.weightKg || 30));
    });

    let moveTier = 'Recruit';
    if (totalPullupsAll >= 300 || totalTonnageAll >= 15000) moveTier = 'Veteran';
    else if (totalPullupsAll >= 100 || totalTonnageAll >= 5000) moveTier = 'Operator';
    valMoveTier.textContent = moveTier;

    let totalStudySecAll = focusData.stats.totalStudySeconds || 0;
    let focusTier = 'Apprentice';
    if (totalStudySecAll >= 100 * 3600) focusTier = 'Architect';
    else if (totalStudySecAll >= 35 * 3600) focusTier = 'Practitioner';
    valFocusTier.textContent = focusTier;

    let cleanDays = habitsData.detox.cleanDays || 1;
    let habitsTier = 'Reset';
    if (cleanDays >= 14) habitsTier = 'Fortified';
    else if (cleanDays >= 7) habitsTier = 'Calibrated';
    valHabitsTier.textContent = habitsTier;

    valMasterTierTitle.textContent = `Level 2: Calibrated ${moveTier}`;
    valOverallScoreBadge.textContent = 'Active Discipline';

    // 2. Sleep Rendering
    inputBedtime.value = habitsData.sleep.bedtimeRaw || '23:15';
    inputWakeup.value = habitsData.sleep.wakeupRaw || '07:15';
    const sleepRes = calculateSleep(inputBedtime.value, inputWakeup.value);
    badgeSleepQuality.textContent = `${sleepRes.durationText} (${sleepRes.isOptimal ? 'Optimal' : 'Short'})`;
    badgeSleepQuality.className = sleepRes.isOptimal
      ? 'text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-sky-950/60 border border-sky-800/40 text-sky-400'
      : 'text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-amber-950/60 border border-amber-800/40 text-amber-400';

    if (habitsData.sleep.sunlightDone) {
      sunlightLabel.textContent = '10m Sun Done ✓';
      btnToggleSunlight.classList.add('border-amber-500/50', 'bg-amber-950/30', 'text-amber-300');
    } else {
      sunlightLabel.textContent = '10m Morning Sun';
      btnToggleSunlight.classList.remove('border-amber-500/50', 'bg-amber-950/30', 'text-amber-300');
    }

    // 3. Detox Rendering
    valCleanStreakDays.textContent = cleanDays;
    badgeDetoxTier.textContent = `Level 2: ${habitsTier} (${cleanDays >= 7 ? '14d' : '7d'} Goal)`;
    chkMorningPhone.checked = !!habitsData.detox.morningPhoneFree;
    chkZeroReels.checked = !!habitsData.detox.zeroReels;
    chkNoPhoneInBed.checked = !!habitsData.detox.noPhoneInBed;

    // 4. Reading Rendering
    inputBookTitle.value = habitsData.reading.currentBook || 'Designing Data-Intensive Applications';
    inputStartPage.value = habitsData.reading.startPage || 42;
    inputEndPage.value = habitsData.reading.endPage || 64;
    const pDiff = Math.max(0, (parseInt(inputEndPage.value, 10) || 0) - (parseInt(inputStartPage.value, 10) || 0));
    valReadingTodayTotal.textContent = `+${pDiff} Pages Today`;

    const rSec = habitsData.reading.timerSeconds || 1200;
    const rM = Math.floor(rSec / 60);
    const rS = rSec % 60;
    valReadingTimerDisplay.textContent = `${String(rM).padStart(2, '0')}:${String(rS).padStart(2, '0')}`;

    // 5. Keystones Rendering
    chkBedMade.checked = !!habitsData.keystones.bedMade;
    chkRoomReset.checked = !!habitsData.keystones.roomReset;
  }

  function generatePublicLedgerReport() {
    const todayStr = getTodayDateStr();
    const dayLogs = logs.filter(l => l.dateStr === todayStr);

    let pullups = 0;
    let pushups = 0;
    let tonnage = 0;
    let steps = 0;
    dayLogs.forEach(l => {
      if (l.category === 'pullup') pullups += (l.reps || 0);
      if (l.category === 'pushup') pushups += (l.reps || 0);
      if (l.category === 'barbell') tonnage += ((l.reps || 0) * (l.weightKg || 30));
      if (l.category === 'walk') steps += (l.steps || 0);
      if (l.category === 'elliptical') steps += ((l.minutes || 0) * 120);
    });

    const dayTasks = focusData.tasks.filter(t => t.curriculumDay === focusData.currentCurriculumDay);
    const completedTasks = dayTasks.filter(t => t.completed);
    const totalSec = focusData.stats.totalStudySeconds || 0;
    const studyHrs = Math.floor(totalSec / 3600);
    const studyMins = Math.floor((totalSec % 3600) / 60);

    const sleepRes = calculateSleep(inputBedtime.value, inputWakeup.value);
    const cleanDays = habitsData.detox.cleanDays || 3;
    const pDiff = Math.max(0, (parseInt(inputEndPage.value, 10) || 0) - (parseInt(inputStartPage.value, 10) || 0));

    return {
      dateFormatted: formatDisplayDate(todayStr),
      pullups,
      pushups,
      tonnage,
      steps,
      completedTasksCount: completedTasks.length,
      studyTimeFormatted: `${studyHrs}h ${String(studyMins).padStart(2, '0')}m`,
      jobApps: focusData.jobAppsCount || 0,
      sleepDuration: sleepRes.durationText,
      bedtime: inputBedtime.value,
      wakeup: inputWakeup.value,
      cleanDays,
      bookTitle: inputBookTitle.value,
      pagesRead: pDiff,
      bedMade: habitsData.keystones.bedMade,
      roomReset: habitsData.keystones.roomReset,
      completedTaskTitles: completedTasks.map(t => t.title)
    };
  }

  function getMarkdownDispatchText() {
    const r = generatePublicLedgerReport();
    return `⚡ PulseSync Verified Ledger — ${r.dateFormatted}
───────────────────────────────
🏋️ MOVE: ${r.pullups}/20 Pull-ups · ${r.pushups}/50 Push-ups · ${r.tonnage}kg Barbell · ${r.steps.toLocaleString()} Steps
🧠 FOCUS: ${r.completedTasksCount} Tasks Completed · ${r.studyTimeFormatted} Active Deep Study
🚀 APPLICATIONS: ${r.jobApps}/10 Submissions Logged
😴 SLEEP: ${r.sleepDuration} (${r.bedtime} → ${r.wakeup})
🛡️ DETOX: Day ${r.cleanDays} Clean (No Doomscrolling)
📖 READING: ${r.bookTitle} (+${r.pagesRead} Pages)
🧹 KEYSTONES: Bed Made: ${r.bedMade ? '✓' : '✕'} · Room Reset: ${r.roomReset ? '✓' : '✕'}
───────────────────────────────
Verified via PulseSync Life OS`;
  }

  // --- Reading Timer ---
  function tickReadingTimer() {
    if (!habitsData.reading.isTimerRunning) return;
    if (habitsData.reading.timerSeconds > 0) {
      habitsData.reading.timerSeconds--;
      const rM = Math.floor(habitsData.reading.timerSeconds / 60);
      const rS = habitsData.reading.timerSeconds % 60;
      valReadingTimerDisplay.textContent = `${String(rM).padStart(2, '0')}:${String(rS).padStart(2, '0')}`;
    } else {
      pauseReadingTimer();
      triggerTripleAlarm();
    }
  }

  function startReadingTimer() {
    habitsData.reading.isTimerRunning = true;
    if (readingTimerInterval) clearInterval(readingTimerInterval);
    readingTimerInterval = setInterval(tickReadingTimer, 1000);
    saveLocalData();
    postHabitsToServer();
    triggerHaptic(15, 600);
  }

  function pauseReadingTimer() {
    habitsData.reading.isTimerRunning = false;
    if (readingTimerInterval) {
      clearInterval(readingTimerInterval);
      readingTimerInterval = null;
    }
    saveLocalData();
    postHabitsToServer();
    triggerHaptic(10, 400);
  }

  // --- Setup Event Listeners ---
  function setupListeners() {
    btnNavMove.addEventListener('click', () => switchDomain('move'));
    btnNavFocus.addEventListener('click', () => switchDomain('focus'));
    btnNavHabits.addEventListener('click', () => switchDomain('habits'));

    // Protocols Compendium Modal
    btnOpenProtocolsModal.addEventListener('click', () => {
      modalScienceProtocols.classList.remove('hidden');
      triggerHaptic(8, 500);
    });
    btnCloseProtocolsModal.addEventListener('click', () => modalScienceProtocols.classList.add('hidden'));
    btnDismissProtocols.addEventListener('click', () => modalScienceProtocols.classList.add('hidden'));

    // Date Navigation
    btnPrevDay.addEventListener('click', () => {
      selectedDateStr = offsetDate(selectedDateStr, -1);
      renderDateDisplay();
      renderMetrics();
      renderTimeline();
      renderFocusDashboard();
      renderFocusAnalytics();
      renderHabitsDashboard();
      triggerHaptic(8, 480);
    });

    btnNextDay.addEventListener('click', () => {
      selectedDateStr = offsetDate(selectedDateStr, 1);
      renderDateDisplay();
      renderMetrics();
      renderTimeline();
      renderFocusDashboard();
      renderFocusAnalytics();
      renderHabitsDashboard();
      triggerHaptic(8, 480);
    });

    btnJumpToday.addEventListener('click', () => {
      selectedDateStr = getTodayDateStr();
      renderDateDisplay();
      renderMetrics();
      renderTimeline();
      renderFocusDashboard();
      renderFocusAnalytics();
      renderHabitsDashboard();
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
        renderFocusAnalytics();
        renderHabitsDashboard();
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

    // Focus Sub-Views
    subViewFocusToday.addEventListener('click', () => {
      subViewFocusToday.className = 'spring-btn px-4 py-1.5 rounded-lg text-xs font-bold bg-[#1a2233] text-white border border-white/15';
      subViewFocusProgress.className = 'spring-btn px-4 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white';
      sectionFocusTodayView.classList.remove('hidden');
      sectionFocusProgressView.classList.add('hidden');
      triggerHaptic(8, 500);
    });

    subViewFocusProgress.addEventListener('click', () => {
      subViewFocusProgress.className = 'spring-btn px-4 py-1.5 rounded-lg text-xs font-bold bg-[#1a2233] text-white border border-white/15';
      subViewFocusToday.className = 'spring-btn px-4 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white';
      sectionFocusTodayView.classList.add('hidden');
      sectionFocusProgressView.classList.remove('hidden');
      renderFocusAnalytics();
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
      renderFocusAnalytics();
      triggerHaptic(8, 480);
    });

    btnNextCurriculumDay.addEventListener('click', () => {
      focusData.currentCurriculumDay = focusData.currentCurriculumDay < 7 ? focusData.currentCurriculumDay + 1 : 1;
      saveLocalData();
      postFocusToServer();
      renderFocusDashboard();
      renderFocusAnalytics();
      triggerHaptic(8, 480);
    });

    btnPlanTomorrow.addEventListener('click', () => {
      focusData.currentCurriculumDay = (focusData.currentCurriculumDay % 7) + 1;
      saveLocalData();
      postFocusToServer();
      renderFocusDashboard();
      renderFocusAnalytics();
      triggerHaptic(12, 600);
      showUndoToast(`Switched to ${CURRICULUM_DAYS[focusData.currentCurriculumDay - 1].title}`, 'plan_tomorrow');
    });

    // Spaced Drawer Toggle
    btnToggleSpacedDrawer.addEventListener('click', () => {
      isSpacedDrawerOpen = !isSpacedDrawerOpen;
      if (isSpacedDrawerOpen) {
        spacedDrawerContent.classList.remove('hidden');
        arrowSpacedDrawer.style.transform = 'rotate(90deg)';
      } else {
        spacedDrawerContent.classList.add('hidden');
        arrowSpacedDrawer.style.transform = 'rotate(0deg)';
      }
      triggerHaptic(8, 450);
    });

    // Job Applications Stepper
    btnDecJobApp.addEventListener('click', () => {
      if (focusData.jobAppsCount > 0) {
        focusData.jobAppsCount--;
        saveLocalData();
        postFocusToServer();
        renderFocusDashboard();
        renderFocusAnalytics();
        triggerHaptic(8, 400);
      }
    });

    btnIncJobApp.addEventListener('click', () => {
      focusData.jobAppsCount = (focusData.jobAppsCount || 0) + 1;
      saveLocalData();
      postFocusToServer();
      renderFocusDashboard();
      renderFocusAnalytics();
      triggerHaptic(10, 650);
      showUndoToast(`Logged 1 Application (${focusData.jobAppsCount}/10)`, 'job_app');
    });

    btnAdd5JobApps.addEventListener('click', () => {
      focusData.jobAppsCount = (focusData.jobAppsCount || 0) + 5;
      saveLocalData();
      postFocusToServer();
      renderFocusDashboard();
      renderFocusAnalytics();
      triggerHaptic(15, 750);
      showUndoToast(`Logged +5 Applications (${focusData.jobAppsCount}/10)`, 'job_app_5');
    });

    // Azure AI Logger
    btnLogAzure30m.addEventListener('click', () => {
      focusData.azureMinutes = (focusData.azureMinutes || 0) + 30;
      focusData.stats.totalStudySeconds = (focusData.stats.totalStudySeconds || 0) + (30 * 60);
      saveLocalData();
      postFocusToServer();
      renderFocusDashboard();
      renderFocusAnalytics();
      triggerHaptic(12, 600);
      showUndoToast('Logged 30m Azure Study', 'azure_30m');
    });

    btnLogAzure60m.addEventListener('click', () => {
      focusData.azureMinutes = (focusData.azureMinutes || 0) + 60;
      focusData.stats.totalStudySeconds = (focusData.stats.totalStudySeconds || 0) + (60 * 60);
      saveLocalData();
      postFocusToServer();
      renderFocusDashboard();
      renderFocusAnalytics();
      triggerHaptic(15, 700);
      showUndoToast('Logged 60m Azure Study', 'azure_60m');
    });

    btnFocusAzureTimer.addEventListener('click', () => {
      let azureTask = focusData.tasks.find(t => t.code === 'AZ-AI');
      if (!azureTask) {
        azureTask = {
          id: 'task_azure_' + Date.now(),
          code: 'AZ-AI',
          title: 'Azure AI-102 / AI-900: Module Reading & Practice Drill',
          category: 'Azure',
          bucket: 'deep',
          curriculumDay: focusData.currentCurriculumDay,
          dateStr: selectedDateStr,
          completed: false,
          completedAt: null
        };
        focusData.tasks.unshift(azureTask);
      }
      bindTaskToTimer(azureTask.id);
      setTimerPreset('50m');
      startTimer();
      showUndoToast('Started 50m Azure AI Focus Session', azureTask.id);
    });

    // Focus Timer Controls
    preset50m.addEventListener('click', () => setTimerPreset('50m'));
    preset30m.addEventListener('click', () => setTimerPreset('30m'));
    preset60m.addEventListener('click', () => setTimerPreset('60m'));

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
      setTimerPreset('50m');
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
          b.className = 'p-2.5 rounded-xl bg-[#1a2233] text-slate-300 text-xs text-left';
        });
        btn.className = 'p-2.5 rounded-xl bg-sky-500 text-slate-950 font-bold text-xs text-left';
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
      renderFocusAnalytics();
    });

    // --- Habits Listeners ---
    inputBedtime.addEventListener('change', () => {
      habitsData.sleep.bedtimeRaw = inputBedtime.value;
      const res = calculateSleep(inputBedtime.value, inputWakeup.value);
      habitsData.sleep.sleepDuration = res.durationText;
      habitsData.sleep.isOptimal = res.isOptimal;
      saveLocalData();
      postHabitsToServer();
      renderHabitsDashboard();
      triggerHaptic(8, 480);
    });

    inputWakeup.addEventListener('change', () => {
      habitsData.sleep.wakeupRaw = inputWakeup.value;
      const res = calculateSleep(inputBedtime.value, inputWakeup.value);
      habitsData.sleep.sleepDuration = res.durationText;
      habitsData.sleep.isOptimal = res.isOptimal;
      saveLocalData();
      postHabitsToServer();
      renderHabitsDashboard();
      triggerHaptic(8, 480);
    });

    btnLogBedtimeNow.addEventListener('click', () => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      inputBedtime.value = `${hh}:${mm}`;
      habitsData.sleep.bedtimeRaw = `${hh}:${mm}`;
      const res = calculateSleep(inputBedtime.value, inputWakeup.value);
      habitsData.sleep.sleepDuration = res.durationText;
      habitsData.sleep.isOptimal = res.isOptimal;
      saveLocalData();
      postHabitsToServer();
      renderHabitsDashboard();
      triggerHaptic(15, 600);
      showUndoToast(`Bedtime recorded: ${formatTime(now)}`, 'bedtime_log');
    });

    btnToggleSunlight.addEventListener('click', () => {
      habitsData.sleep.sunlightDone = !habitsData.sleep.sunlightDone;
      saveLocalData();
      postHabitsToServer();
      renderHabitsDashboard();
      triggerHaptic(12, 550);
    });

    chkMorningPhone.addEventListener('change', () => {
      habitsData.detox.morningPhoneFree = chkMorningPhone.checked;
      saveLocalData();
      postHabitsToServer();
    });

    chkZeroReels.addEventListener('change', () => {
      habitsData.detox.zeroReels = chkZeroReels.checked;
      saveLocalData();
      postHabitsToServer();
    });

    chkNoPhoneInBed.addEventListener('change', () => {
      habitsData.detox.noPhoneInBed = chkNoPhoneInBed.checked;
      saveLocalData();
      postHabitsToServer();
    });

    // Relapse Modal Listeners
    btnOpenRelapseModal.addEventListener('click', () => {
      modalRelapse.classList.remove('hidden');
      triggerHaptic(8, 400);
    });
    btnCloseRelapseModal.addEventListener('click', () => modalRelapse.classList.add('hidden'));

    relapseTriggerOptions.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        const trigger = btn.getAttribute('data-trigger');
        habitsData.detox.cleanDays = 1;
        habitsData.detox.relapseHistory.push({
          dateStr: getTodayDateStr(),
          timestamp: Date.now(),
          trigger
        });
        modalRelapse.classList.add('hidden');
        saveLocalData();
        postHabitsToServer();
        renderHabitsDashboard();
        triggerHaptic(20, 300);
        showUndoToast(`Detox reset logged (${trigger}). Tomorrow is Day 2!`, 'detox_reset');
      });
    });

    // Reading Listeners
    inputStartPage.addEventListener('input', () => {
      habitsData.reading.startPage = parseInt(inputStartPage.value, 10) || 0;
      const pDiff = Math.max(0, (parseInt(inputEndPage.value, 10) || 0) - habitsData.reading.startPage);
      valReadingTodayTotal.textContent = `+${pDiff} Pages Today`;
      saveLocalData();
    });

    inputEndPage.addEventListener('input', () => {
      habitsData.reading.endPage = parseInt(inputEndPage.value, 10) || 0;
      const pDiff = Math.max(0, habitsData.reading.endPage - (parseInt(inputStartPage.value, 10) || 0));
      valReadingTodayTotal.textContent = `+${pDiff} Pages Today`;
      saveLocalData();
    });

    inputBookTitle.addEventListener('change', () => {
      habitsData.reading.currentBook = inputBookTitle.value.trim();
      saveLocalData();
      postHabitsToServer();
    });

    btnStartReadingTimer.addEventListener('click', startReadingTimer);
    btnPauseReadingTimer.addEventListener('click', pauseReadingTimer);

    btnSaveReadingSession.addEventListener('click', () => {
      const pDiff = Math.max(0, (parseInt(inputEndPage.value, 10) || 0) - (parseInt(inputStartPage.value, 10) || 0));
      habitsData.reading.pagesReadToday = pDiff;
      habitsData.reading.history.push({
        dateStr: getTodayDateStr(),
        book: inputBookTitle.value,
        start: inputStartPage.value,
        end: inputEndPage.value,
        pages: pDiff
      });
      saveLocalData();
      postHabitsToServer();
      triggerHaptic(15, 680);
      showUndoToast(`Logged ${pDiff} pages of ${inputBookTitle.value}`, 'reading_session');
    });

    // Keystones
    chkBedMade.addEventListener('change', () => {
      habitsData.keystones.bedMade = chkBedMade.checked;
      saveLocalData();
      postHabitsToServer();
      triggerHaptic(8, 520);
    });

    chkRoomReset.addEventListener('change', () => {
      habitsData.keystones.roomReset = chkRoomReset.checked;
      saveLocalData();
      postHabitsToServer();
      triggerHaptic(8, 520);
    });

    // Peer Dispatch & Public Ledger
    btnCopyPeerDispatch.addEventListener('click', () => {
      const text = getMarkdownDispatchText();
      navigator.clipboard.writeText(text).then(() => {
        triggerHaptic(20, 750);
        showUndoToast('📋 Daily scorecard copied to clipboard!', 'peer_copy');
      }).catch(() => {
        alert('Could not copy to clipboard. View ledger to copy manually.');
      });
    });

    btnPreviewPublicLedger.addEventListener('click', () => {
      const r = generatePublicLedgerReport();
      publicLedgerContent.innerHTML = `
        <div class="p-3 rounded-xl bg-[#0d131f] border border-white/[0.06] space-y-2">
          <div class="flex justify-between items-center font-mono">
            <span class="font-bold text-white uppercase text-xs">Date: ${r.dateFormatted}</span>
            <span class="text-xs text-emerald-400 font-bold font-mono">95% Daily Adherence</span>
          </div>
        </div>

        <div class="p-3 rounded-xl bg-[#0d131f] border border-white/[0.06] space-y-1 text-xs">
          <span class="font-bold text-sky-400 uppercase tracking-wide block font-mono text-[11px]">🏋️ Physical Training (Move)</span>
          <p class="text-slate-300">• Pull-ups: ${r.pullups}/20 reps · Push-ups: ${r.pushups}/50 reps</p>
          <p class="text-slate-300">• Barbell: ${r.tonnage}kg Volume · Cardio: ${r.steps.toLocaleString()} Steps</p>
        </div>

        <div class="p-3 rounded-xl bg-[#0d131f] border border-white/[0.06] space-y-1 text-xs">
          <span class="font-bold text-purple-400 uppercase tracking-wide block font-mono text-[11px]">🧠 Technical Preparation (Focus)</span>
          <p class="text-slate-300">• Total Active Deep Study: ${r.studyTimeFormatted}</p>
          <p class="text-slate-300">• Completed Tasks: ${r.completedTasksCount} / 10</p>
          <p class="text-slate-300">• Job Applications: ${r.jobApps}/10 Logged</p>
        </div>

        <div class="p-3 rounded-xl bg-[#0d131f] border border-white/[0.06] space-y-1 text-xs">
          <span class="font-bold text-amber-400 uppercase tracking-wide block font-mono text-[11px]">🛡️ Habits & Disciplines</span>
          <p class="text-slate-300">• Sleep Duration: ${r.sleepDuration} (${r.bedtime} → ${r.wakeup})</p>
          <p class="text-slate-300">• Clean Detox Streak: Day ${r.cleanDays} (Zero Doomscrolling)</p>
          <p class="text-slate-300">• Deep Reading: ${r.bookTitle} (+${r.pagesRead} Pages)</p>
          <p class="text-slate-300">• Keystones: Bed Made: ${r.bedMade ? '✓' : '✕'} · Room Reset: ${r.roomReset ? '✓' : '✕'}</p>
        </div>
      `;
      modalPublicLedger.classList.remove('hidden');
      triggerHaptic(10, 500);
    });

    btnClosePublicLedger.addEventListener('click', () => modalPublicLedger.classList.add('hidden'));
    btnClosePublicLedgerBtn.addEventListener('click', () => modalPublicLedger.classList.add('hidden'));

    btnCopyPublicLedgerText.addEventListener('click', () => {
      const text = getMarkdownDispatchText();
      navigator.clipboard.writeText(text).then(() => {
        triggerHaptic(20, 750);
        showUndoToast('📋 Full ledger text copied to clipboard!', 'public_ledger_copy');
      });
    });

    // Global Utilities
    btnExportCSV.addEventListener('click', exportCSV);
    btnExportJSON.addEventListener('click', exportJSON);
    btnClearToday.addEventListener('click', clearSelectedDay);
    btnCloseModal.addEventListener('click', () => previewModal.classList.add('hidden'));
  }

  // --- Adherence View (Move Domain) ---
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
          <td class="py-2.5 px-1 font-medium text-slate-300">${cat.label}</td>
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
        <div class="p-3 rounded-xl bg-[#111622] border border-white/[0.06] flex items-center justify-between">
          <div>
            <div class="font-bold text-white text-sm">${name}</div>
            <div class="text-xs text-slate-400 mt-0.5">${activeDaysSet.size}/7 active days · Best set: ${bestSet} reps</div>
          </div>
          <div class="text-right font-mono">
            <div class="text-sm font-bold text-sky-400">${totalReps} <span class="text-xs text-slate-400 font-normal">reps</span></div>
            <div class="text-xs text-slate-500">${totalSets} sets</div>
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
