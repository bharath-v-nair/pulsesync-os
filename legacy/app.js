// PulseSync Life OS - Complete Unified Engine (Move, Focus, Habits & Analytics)
(function () {
  'use strict';

  // --- Storage Keys ---
  const STORAGE_KEY_LOGS = 'pulsesync_logs_v3';
  const STORAGE_KEY_DEFAULTS = 'pulsesync_defaults_v3';
  const STORAGE_KEY_FOCUS = 'pulsesync_focus_v8';
  const STORAGE_KEY_HABITS = 'pulsesync_habits_v3';

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
    sessions: [],
    currentSession: null,
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
  let dailyTimelineChartInstance = null;

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
      activeBookId: 'book_1',
      books: [
        { id: 'book_1', title: 'Designing Data-Intensive Applications', author: 'Martin Kleppmann', totalPages: 560, currentPage: 64, completed: false },
        { id: 'book_2', title: 'Atomic Habits', author: 'James Clear', totalPages: 320, currentPage: 120, completed: false }
      ],
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

  let habitsAnalyticsPeriod = '7d';
  let isSleepTableExpanded = false;
  let readingTimerInterval = null;

  // --- DOM Elements ---
  const syncIndicator = document.getElementById('syncIndicator');
  const serverSyncStatus = document.getElementById('serverSyncStatus');
  const btnWakeUp = document.getElementById('btnWakeUp');
  const wakeUpLabel = document.getElementById('wakeUpLabel');
  const btnEditWakeup = document.getElementById('btnEditWakeup');
  // Sidebar Elements
  const btnOpenSidebar = document.getElementById('btnOpenSidebar');
  const btnCloseSidebar = document.getElementById('btnCloseSidebar');
  const appSidebar = document.getElementById('appSidebar');
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  const sidebarStreakStatus = document.getElementById('sidebarStreakStatus');
  const sidebarNavOverview = document.getElementById('sidebarNavOverview');
  const sidebarNavLibrary = document.getElementById('sidebarNavLibrary');
  const sidebarLibraryBadge = document.getElementById('sidebarLibraryBadge');
  const sidebarBtnProtocols = document.getElementById('sidebarBtnProtocols');

  // Domains & Navigation
  const btnHeaderOverview = document.getElementById('btnHeaderOverview');
  const btnNavMove = document.getElementById('btnNavMove');
  const btnNavFocus = document.getElementById('btnNavFocus');
  const btnNavHabits = document.getElementById('btnNavHabits');
  const viewOverview = document.getElementById('viewOverview');
  const viewMove = document.getElementById('viewMove');
  const viewFocus = document.getElementById('viewFocus');
  const viewHabits = document.getElementById('viewHabits');
  const viewLibrary = document.getElementById('viewLibrary');

  // Dedicated Library Page Elements
  const btnBackFromLibrary = document.getElementById('btnBackFromLibrary');
  const btnBackFromLibraryLabel = document.getElementById('btnBackFromLibraryLabel');
  const btnOpenAddBookModalFromLibrary = document.getElementById('btnOpenAddBookModalFromLibrary');
  const valLibraryTotalBooks = document.getElementById('valLibraryTotalBooks');
  const valLibraryReadingCount = document.getElementById('valLibraryReadingCount');
  const valLibraryCompletedCount = document.getElementById('valLibraryCompletedCount');
  const valLibraryPagesLogged = document.getElementById('valLibraryPagesLogged');
  const btnLibraryFilterAll = document.getElementById('btnLibraryFilterAll');
  const btnLibraryFilterReading = document.getElementById('btnLibraryFilterReading');
  const btnLibraryFilterCompleted = document.getElementById('btnLibraryFilterCompleted');
  const countFilterAll = document.getElementById('countFilterAll');
  const countFilterReading = document.getElementById('countFilterReading');
  const countFilterCompleted = document.getElementById('countFilterCompleted');
  const libraryBooksGrid = document.getElementById('libraryBooksGrid');
  const emptyLibraryState = document.getElementById('emptyLibraryState');

  // Quick Book Progress Update Modal
  const modalUpdateBookProgress = document.getElementById('modalUpdateBookProgress');
  const btnCloseUpdateProgressModal = document.getElementById('btnCloseUpdateProgressModal');
  const valModalUpdateBookTitle = document.getElementById('valModalUpdateBookTitle');
  const valModalUpdateTotalPages = document.getElementById('valModalUpdateTotalPages');
  const inputModalUpdateCurrentPage = document.getElementById('inputModalUpdateCurrentPage');
  const btnCancelUpdateProgress = document.getElementById('btnCancelUpdateProgress');
  const btnSaveUpdateProgress = document.getElementById('btnSaveUpdateProgress');

  // Overview Elements
  const subViewOverviewToday = document.getElementById('subViewOverviewToday');
  const subViewOverviewWeek = document.getElementById('subViewOverviewWeek');
  const sectionOverviewTodayView = document.getElementById('sectionOverviewTodayView');
  const sectionOverviewWeekView = document.getElementById('sectionOverviewWeekView');
  const overviewSleepQualityBadge = document.getElementById('overviewSleepQualityBadge');
  const overviewSleepDurationVal = document.getElementById('overviewSleepDurationVal');
  const overviewSleepScheduleText = document.getElementById('overviewSleepScheduleText');
  const overviewFocusTargetBadge = document.getElementById('overviewFocusTargetBadge');
  const overviewFocusHoursVal = document.getElementById('overviewFocusHoursVal');
  const overviewFocusTasksText = document.getElementById('overviewFocusTasksText');
  const overviewMoveStatusBadge = document.getElementById('overviewMoveStatusBadge');
  const overviewMoveVolumeVal = document.getElementById('overviewMoveVolumeVal');
  const overviewMoveDetailsText = document.getElementById('overviewMoveDetailsText');
  const overviewHabitsTierBadge = document.getElementById('overviewHabitsTierBadge');
  const overviewHabitsStreakVal = document.getElementById('overviewHabitsStreakVal');
  const overviewHabitsDetailsText = document.getElementById('overviewHabitsDetailsText');
  const overviewRibbonBar = document.getElementById('overviewRibbonBar');
  const ribbonSleep = document.getElementById('ribbonSleep');
  const ribbonFocus = document.getElementById('ribbonFocus');
  const ribbonMove = document.getElementById('ribbonMove');
  const ribbonHabits = document.getElementById('ribbonHabits');
  const ribbonFree = document.getElementById('ribbonFree');
  const valRibbonSleepHours = document.getElementById('valRibbonSleepHours');
  const valRibbonFocusHours = document.getElementById('valRibbonFocusHours');
  const valRibbonMoveHours = document.getElementById('valRibbonMoveHours');
  const valRibbonHabitsHours = document.getElementById('valRibbonHabitsHours');
  const valRibbonFreeHours = document.getElementById('valRibbonFreeHours');
  const overviewTotalTrackedHours = document.getElementById('overviewTotalTrackedHours');
  const overviewDayFeedCount = document.getElementById('overviewDayFeedCount');
  const overviewDayFeedContainer = document.getElementById('overviewDayFeedContainer');
  const overviewWeekMatrixContainer = document.getElementById('overviewWeekMatrixContainer');


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

  // 24-Hour Timeline & Activity Heatmap Elements
  const dailyTimelineCard = document.getElementById('dailyTimelineCard');
  const valTimelineStatus = document.getElementById('valTimelineStatus');
  const chartDailyTimeline = document.getElementById('chartDailyTimeline');
  const hourlyHeatmapGrid = document.getElementById('hourlyHeatmapGrid');

  // Study Sessions Receipts Elements
  const studySessionsReceiptsCard = document.getElementById('studySessionsReceiptsCard');
  const valSessionCount = document.getElementById('valSessionCount');
  const studySessionsReceiptsList = document.getElementById('studySessionsReceiptsList');
  const btnOpenManualSessionModal = document.getElementById('btnOpenManualSessionModal');

  // Manual Study Session Modal Elements
  const modalManualSession = document.getElementById('modalManualSession');
  const btnCloseManualSessionModal = document.getElementById('btnCloseManualSessionModal');
  const btnCancelManualSession = document.getElementById('btnCancelManualSession');
  const selectManualSessionTask = document.getElementById('selectManualSessionTask');
  const manualSessionCustomTitleWrap = document.getElementById('manualSessionCustomTitleWrap');
  const inputManualSessionCustomTitle = document.getElementById('inputManualSessionCustomTitle');
  const inputManualSessionStart = document.getElementById('inputManualSessionStart');
  const inputManualSessionEnd = document.getElementById('inputManualSessionEnd');
  const valManualSessionDuration = document.getElementById('valManualSessionDuration');
  const btnSaveManualSession = document.getElementById('btnSaveManualSession');

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

  // Focus Analytics Elements
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

  // Habits Elements (Execution View)
  const subViewHabitsToday = document.getElementById('subViewHabitsToday');
  const subViewHabitsProgress = document.getElementById('subViewHabitsProgress');
  const sectionHabitsTodayView = document.getElementById('sectionHabitsTodayView');
  const sectionHabitsProgressView = document.getElementById('sectionHabitsProgressView');

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

  // Reading Elements
  const btnJumpLibraryView = document.getElementById('btnJumpLibraryView');
  const valBooksCount = document.getElementById('valBooksCount');
  const valActiveBookTitle = document.getElementById('valActiveBookTitle');
  const valActiveBookAuthor = document.getElementById('valActiveBookAuthor');
  const selectActiveBook = document.getElementById('selectActiveBook');
  const valActiveBookProgress = document.getElementById('valActiveBookProgress');
  const barActiveBook = document.getElementById('barActiveBook');

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

  // Habits Analytics Elements
  const btnHabitsPeriod7d = document.getElementById('btnHabitsPeriod7d');
  const btnHabitsPeriod30d = document.getElementById('btnHabitsPeriod30d');
  const valAvgSleepDuration = document.getElementById('valAvgSleepDuration');
  const valAvgSleepTimes = document.getElementById('valAvgSleepTimes');
  const valBestCleanStreak = document.getElementById('valBestCleanStreak');
  const valTotalPagesReadRange = document.getElementById('valTotalPagesReadRange');

  const habitsSleepChartCard = document.getElementById('habitsSleepChartCard');
  const habitsSleepScrollWrap = document.getElementById('habitsSleepScrollWrap');
  const valSleepTargetAdherence = document.getElementById('valSleepTargetAdherence');
  const habitsSleepBarsContainer = document.getElementById('habitsSleepBarsContainer');
  const habitsSleepDaysRow = document.getElementById('habitsSleepDaysRow');

  const valSleepSchedulePeriodLabel = document.getElementById('valSleepSchedulePeriodLabel');
  const habitsSleepScheduleHeader = document.getElementById('habitsSleepScheduleHeader');
  const habitsSleepScheduleBody = document.getElementById('habitsSleepScheduleBody');
  const wrapSleepTableExpand = document.getElementById('wrapSleepTableExpand');
  const btnToggleSleepTableExpand = document.getElementById('btnToggleSleepTableExpand');

  const valAvgPagesPerDay = document.getElementById('valAvgPagesPerDay');
  const habitsReadingScrollWrap = document.getElementById('habitsReadingScrollWrap');
  const habitsReadingBarsContainer = document.getElementById('habitsReadingBarsContainer');
  const habitsReadingDaysRow = document.getElementById('habitsReadingDaysRow');
  const habitsAnalyticsBooksList = document.getElementById('habitsAnalyticsBooksList');

  const habitsKeystoneHeaderRow = document.getElementById('habitsKeystoneHeaderRow');
  const habitsKeystoneBodyRows = document.getElementById('habitsKeystoneBodyRows');

  // Modals
  const modalEditWakeup = document.getElementById('modalEditWakeup');
  const btnCloseEditWakeupModal = document.getElementById('btnCloseEditWakeupModal');
  const modalWakeupDateLabel = document.getElementById('modalWakeupDateLabel');
  const inputModalWakeupTime = document.getElementById('inputModalWakeupTime');
  const btnSaveModalWakeup = document.getElementById('btnSaveModalWakeup');
  const btnClearModalWakeup = document.getElementById('btnClearModalWakeup');

  const modalAddBook = document.getElementById('modalAddBook');
  const btnCloseAddBookModal = document.getElementById('btnCloseAddBookModal');
  const inputNewBookTitle = document.getElementById('inputNewBookTitle');
  const inputNewBookAuthor = document.getElementById('inputNewBookAuthor');
  const inputNewBookTotalPages = document.getElementById('inputNewBookTotalPages');
  const inputNewBookCurrentPage = document.getElementById('inputNewBookCurrentPage');
  const btnCancelAddBook = document.getElementById('btnCancelAddBook');
  const btnSaveNewBook = document.getElementById('btnSaveNewBook');

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

  function formatTime12h(time24) {
    if (!time24) return '--:--';
    const [hStr, mStr] = time24.split(':');
    let h = parseInt(hStr, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${mStr} ${ampm}`;
  }

  function formatTimestamp12h(timestamp) {
    if (!timestamp) return '--:--';
    return formatTime(new Date(timestamp));
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
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
    if (!bedRaw || !wakeRaw) return { durationText: '7h 45m', isOptimal: true, totalMins: 465, hoursFloat: 7.75 };
    const [bH, bM] = bedRaw.split(':').map(Number);
    const [wH, wM] = wakeRaw.split(':').map(Number);

    let bedMin = bH * 60 + bM;
    let wakeMin = wH * 60 + wM;

    if (wakeMin <= bedMin) {
      wakeMin += 24 * 60;
    }

    const diff = wakeMin - bedMin;
    const hrs = Math.floor(diff / 60);
    const mins = diff % 60;

    return {
      durationText: `${hrs}h ${String(mins).padStart(2, '0')}m`,
      isOptimal: diff >= (7 * 60) && diff <= (9 * 60),
      totalMins: diff,
      hoursFloat: parseFloat((diff / 60).toFixed(1))
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
      if (storedFocus) {
        focusData = { ...focusData, ...JSON.parse(storedFocus) };
        if (!focusData.sessions) focusData.sessions = [];
      }

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

          if (Array.isArray(serverFocus.sessions)) {
            const sessionMap = new Map();
            (focusData.sessions || []).forEach(s => sessionMap.set(s.id, s));
            serverFocus.sessions.forEach(s => sessionMap.set(s.id, s));
            focusData.sessions = Array.from(sessionMap.values());
          }

          if (serverFocus.currentSession !== undefined) {
            focusData.currentSession = serverFocus.currentSession;
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
    renderHabitsAnalytics();
    renderOverviewDashboard();
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

  let currentDomain = 'move';
  let lastActionDomain = 'move';
  let overviewSubView = 'today'; // 'today' | 'week'
  let libraryFilter = 'all'; // 'all' | 'reading' | 'completed'
  let editingBookId = null;

  function exportLocalDataAsJson() {
    const exportData = {
      version: '2.2',
      exportedAt: new Date().toISOString(),
      logs,
      focusData,
      habitsData
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pulsesync_backup_${getTodayDateStr()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showUndoToast('Local database backup exported');
  }

  // --- Domain Switching ---
  function switchDomain(domain) {
    if (domain !== 'overview' && domain !== 'library') {
      lastActionDomain = domain;
    }
    currentDomain = domain;
    if (viewOverview) viewOverview.classList.add('hidden');
    if (viewMove) viewMove.classList.add('hidden');
    if (viewFocus) viewFocus.classList.add('hidden');
    if (viewHabits) viewHabits.classList.add('hidden');
    if (viewLibrary) viewLibrary.classList.add('hidden');

    const inactiveTabCls = 'spring-btn py-2.5 rounded-lg text-slate-400 hover:text-white transition text-center truncate';
    const activeTabCls = 'spring-btn py-2.5 rounded-lg bg-white text-slate-950 font-bold shadow-sm transition text-center truncate';

    if (btnNavMove) btnNavMove.className = inactiveTabCls;
    if (btnNavFocus) btnNavFocus.className = inactiveTabCls;
    if (btnNavHabits) btnNavHabits.className = inactiveTabCls;

    if (btnHeaderOverview) {
      if (domain === 'overview') {
        btnHeaderOverview.className = 'spring-btn tap-target px-2.5 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-300 flex items-center gap-1.5 shadow-sm text-xs font-semibold';
      } else {
        btnHeaderOverview.className = 'spring-btn tap-target px-2.5 py-1.5 rounded-xl bg-[#141b29] border border-white/10 text-slate-300 hover:text-white flex items-center gap-1.5 shadow-sm text-xs font-semibold';
      }
    }

    if (domain === 'overview') {
      if (viewOverview) viewOverview.classList.remove('hidden');
      renderOverviewDashboard();
    } else if (domain === 'move') {
      if (viewMove) viewMove.classList.remove('hidden');
      if (btnNavMove) btnNavMove.className = activeTabCls;
      renderMetrics();
      renderTimeline();
    } else if (domain === 'focus') {
      if (viewFocus) viewFocus.classList.remove('hidden');
      if (btnNavFocus) btnNavFocus.className = activeTabCls;
      renderFocusDashboard();
      renderFocusAnalytics();
    } else if (domain === 'habits') {
      if (viewHabits) viewHabits.classList.remove('hidden');
      if (btnNavHabits) btnNavHabits.className = activeTabCls;
      renderHabitsDashboard();
      renderHabitsAnalytics();
    } else if (domain === 'library') {
      if (viewLibrary) viewLibrary.classList.remove('hidden');
      if (btnBackFromLibraryLabel) {
        const domainLabels = { move: 'Move', focus: 'Focus', habits: 'Habits' };
        btnBackFromLibraryLabel.textContent = `Back to ${domainLabels[lastActionDomain] || 'Habits'}`;
      }
      renderLibraryPage();
    }
    triggerHaptic(10, 520);
  }

  function switchOverviewSubView(subView) {
    overviewSubView = subView;
    if (subView === 'today') {
      if (sectionOverviewTodayView) sectionOverviewTodayView.classList.remove('hidden');
      if (sectionOverviewWeekView) sectionOverviewWeekView.classList.add('hidden');
      if (subViewOverviewToday) subViewOverviewToday.className = 'spring-btn px-4 py-1.5 rounded-lg text-xs font-bold bg-[#1a2233] text-white border border-white/15';
      if (subViewOverviewWeek) subViewOverviewWeek.className = 'spring-btn px-4 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white';
      renderOverviewDashboard();
    } else {
      if (sectionOverviewTodayView) sectionOverviewTodayView.classList.add('hidden');
      if (sectionOverviewWeekView) sectionOverviewWeekView.classList.remove('hidden');
      if (subViewOverviewToday) subViewOverviewToday.className = 'spring-btn px-4 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white';
      if (subViewOverviewWeek) subViewOverviewWeek.className = 'spring-btn px-4 py-1.5 rounded-lg text-xs font-bold bg-[#1a2233] text-white border border-white/15';
      renderOverviewWeekMatrix();
    }
    triggerHaptic(8, 480);
  }

  // --- Whole-Day Overview Dashboard Rendering ---
  function renderOverviewDashboard() {
    if (!viewOverview || viewOverview.classList.contains('hidden')) return;

    // --- 1. SLEEP & RECOVERY MACRO ---
    let bedtime = '23:15';
    let wakeup = '07:15';
    if (habitsData.dailyRecords && habitsData.dailyRecords[selectedDateStr] && habitsData.dailyRecords[selectedDateStr].sleep) {
      bedtime = habitsData.dailyRecords[selectedDateStr].sleep.bedtimeRaw || bedtime;
      wakeup = habitsData.dailyRecords[selectedDateStr].sleep.wakeupRaw || wakeup;
    } else if (habitsData.sleep) {
      bedtime = habitsData.sleep.bedtimeRaw || bedtime;
      wakeup = habitsData.sleep.wakeupRaw || wakeup;
    }

    const wakeLog = logs.find(i => i.dateStr === selectedDateStr && i.category === 'wake_up');
    const sleepRes = calculateSleep(bedtime, wakeup);
    const sleepDurationHours = sleepRes.durationHours || 8;
    const sleepDurationMins = Math.round(sleepDurationHours * 60);

    if (overviewSleepDurationVal) {
      const sH = Math.floor(sleepDurationMins / 60);
      const sM = sleepDurationMins % 60;
      overviewSleepDurationVal.textContent = `${sH}h ${String(sM).padStart(2, '0')}m`;
    }
    if (overviewSleepScheduleText) {
      const displayWake = wakeLog ? wakeLog.timeFormatted : formatTime12h(wakeup);
      overviewSleepScheduleText.textContent = `Bed: ${formatTime12h(bedtime)} · Wake: ${displayWake}`;
    }
    if (overviewSleepQualityBadge) {
      if (sleepDurationHours >= 7.5) {
        overviewSleepQualityBadge.textContent = 'Restorative';
        overviewSleepQualityBadge.className = 'text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-950/70 border border-indigo-800/50 text-indigo-300';
      } else if (sleepDurationHours >= 6.5) {
        overviewSleepQualityBadge.textContent = 'Optimal';
        overviewSleepQualityBadge.className = 'text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-950/70 border border-sky-800/50 text-sky-300';
      } else {
        overviewSleepQualityBadge.textContent = 'Deficit';
        overviewSleepQualityBadge.className = 'text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950/70 border border-amber-800/50 text-amber-300';
      }
    }

    // --- 2. FOCUS & INTERVIEW PREP MACRO ---
    if (!focusData.sessions) focusData.sessions = [];
    const daySessions = focusData.sessions.filter(s => s.dateStr === selectedDateStr);
    const hasActiveSession = (selectedDateStr === getTodayDateStr() && focusData.currentSession);
    let totalFocusSec = daySessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0);
    if (hasActiveSession) {
      totalFocusSec += Math.floor((Date.now() - focusData.currentSession.startTimestamp) / 1000);
    }
    const focusMins = Math.round(totalFocusSec / 60);
    const fH = Math.floor(focusMins / 60);
    const fM = focusMins % 60;

    if (overviewFocusHoursVal) {
      overviewFocusHoursVal.textContent = `${fH}h ${String(fM).padStart(2, '0')}m`;
    }
    if (overviewFocusTasksText) {
      const sessionCount = daySessions.length + (hasActiveSession ? 1 : 0);
      const sessionWord = sessionCount === 1 ? 'Session' : 'Sessions';
      const jobApps = focusData.jobAppsCount || 0;
      overviewFocusTasksText.textContent = `${sessionCount} ${sessionWord} · ${jobApps}/10 Job Apps`;
    }
    if (overviewFocusTargetBadge) {
      const fHours = totalFocusSec / 3600;
      if (fHours >= 5.5) {
        overviewFocusTargetBadge.textContent = 'Target Hit';
        overviewFocusTargetBadge.className = 'text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/70 border border-emerald-800/50 text-emerald-300';
      } else if (fHours >= 2.5) {
        overviewFocusTargetBadge.textContent = 'In Progress';
        overviewFocusTargetBadge.className = 'text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-950/70 border border-sky-800/50 text-sky-300';
      } else {
        overviewFocusTargetBadge.textContent = '5.5h Target';
        overviewFocusTargetBadge.className = 'text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-950/70 border border-sky-800/50 text-sky-300';
      }
    }

    // --- 3. MOVEMENT MACRO ---
    const dayMoveLogs = logs.filter(item => item.dateStr === selectedDateStr);
    let totalPullups = 0;
    let totalPushups = 0;
    let totalTonnage = 0;
    let totalSteps = 0;
    dayMoveLogs.forEach(item => {
      if (item.category === 'pullup') totalPullups += (item.reps || 0);
      if (item.category === 'pushup') totalPushups += (item.reps || 0);
      if (item.category === 'barbell') totalTonnage += ((item.reps || 0) * (item.weightKg || 30));
      if (item.category === 'walk') totalSteps += (item.steps || 0);
      if (item.category === 'elliptical') totalSteps += ((item.minutes || 0) * 120);
    });
    const totalReps = totalPullups + totalPushups;

    if (overviewMoveVolumeVal) {
      overviewMoveVolumeVal.textContent = `${totalReps} Reps`;
    }
    if (overviewMoveDetailsText) {
      overviewMoveDetailsText.textContent = `${totalPullups} Pull · ${totalPushups} Push · ${totalSteps.toLocaleString()} Steps`;
    }
    if (overviewMoveStatusBadge) {
      if (totalPullups >= 20 && totalPushups >= 50) {
        overviewMoveStatusBadge.textContent = 'Target Hit';
        overviewMoveStatusBadge.className = 'text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/70 border border-emerald-800/50 text-emerald-300';
      } else if (totalReps > 0) {
        overviewMoveStatusBadge.textContent = 'Active';
        overviewMoveStatusBadge.className = 'text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/70 border border-emerald-800/50 text-emerald-300';
      } else {
        overviewMoveStatusBadge.textContent = 'Resting';
        overviewMoveStatusBadge.className = 'text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700/50 text-slate-400';
      }
    }

    // --- 4. HABITS MACRO ---
    const cleanDays = habitsData.detox?.cleanDays || 3;
    let pagesRead = 0;
    if (habitsData.dailyRecords && habitsData.dailyRecords[selectedDateStr]) {
      pagesRead = habitsData.dailyRecords[selectedDateStr].pagesRead || 0;
    } else if (selectedDateStr === getTodayDateStr()) {
      pagesRead = habitsData.reading?.pagesReadToday || 0;
    }

    if (overviewHabitsStreakVal) {
      overviewHabitsStreakVal.textContent = `Day ${cleanDays} Clean`;
    }
    if (overviewHabitsDetailsText) {
      overviewHabitsDetailsText.textContent = `${pagesRead} Pages Read · Shield Active`;
    }
    if (overviewHabitsTierBadge) {
      if (cleanDays >= 7) {
        overviewHabitsTierBadge.textContent = 'Master Tier';
        overviewHabitsTierBadge.className = 'text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950/70 border border-amber-800/50 text-amber-300';
      } else {
        overviewHabitsTierBadge.textContent = 'Calibrated';
        overviewHabitsTierBadge.className = 'text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950/70 border border-amber-800/50 text-amber-300';
      }
    }
    if (sidebarStreakStatus) {
      sidebarStreakStatus.textContent = `Level 2 Disciple · ${cleanDays}-Day Clean`;
    }

    // --- 5. 24-HOUR TIME ALLOCATION RIBBON ---
    const TOTAL_DAY_MINUTES = 1440;
    const ribbonSleepMins = Math.min(720, Math.max(0, sleepDurationMins));
    const ribbonFocusMins = Math.min(600, Math.max(0, focusMins));
    const moveExerciseSets = dayMoveLogs.filter(l => ['pullup', 'pushup', 'barbell'].includes(l.category)).length;
    const ribbonMoveMins = Math.min(180, (moveExerciseSets * 3) + (totalSteps > 0 ? Math.round(totalSteps / 110) : 0));
    const ribbonHabitsMins = Math.min(120, (pagesRead * 2) + 15);
    const trackedMins = ribbonSleepMins + ribbonFocusMins + ribbonMoveMins + ribbonHabitsMins;
    const ribbonFreeMins = Math.max(0, TOTAL_DAY_MINUTES - trackedMins);

    const pSleep = ((ribbonSleepMins / TOTAL_DAY_MINUTES) * 100).toFixed(1);
    const pFocus = ((ribbonFocusMins / TOTAL_DAY_MINUTES) * 100).toFixed(1);
    const pMove = ((ribbonMoveMins / TOTAL_DAY_MINUTES) * 100).toFixed(1);
    const pHabits = ((ribbonHabitsMins / TOTAL_DAY_MINUTES) * 100).toFixed(1);
    const pFree = (100 - (parseFloat(pSleep) + parseFloat(pFocus) + parseFloat(pMove) + parseFloat(pHabits))).toFixed(1);

    if (ribbonSleep) ribbonSleep.style.width = `${pSleep}%`;
    if (ribbonFocus) ribbonFocus.style.width = `${pFocus}%`;
    if (ribbonMove) ribbonMove.style.width = `${pMove}%`;
    if (ribbonHabits) ribbonHabits.style.width = `${pHabits}%`;
    if (ribbonFree) ribbonFree.style.width = `${Math.max(0, pFree)}%`;

    if (valRibbonSleepHours) valRibbonSleepHours.textContent = `${Math.floor(ribbonSleepMins / 60)}h ${String(ribbonSleepMins % 60).padStart(2, '0')}m`;
    if (valRibbonFocusHours) valRibbonFocusHours.textContent = `${Math.floor(ribbonFocusMins / 60)}h ${String(ribbonFocusMins % 60).padStart(2, '0')}m`;
    if (valRibbonMoveHours) valRibbonMoveHours.textContent = `${Math.floor(ribbonMoveMins / 60)}h ${String(ribbonMoveMins % 60).padStart(2, '0')}m`;
    if (valRibbonHabitsHours) valRibbonHabitsHours.textContent = `${Math.floor(ribbonHabitsMins / 60)}h ${String(ribbonHabitsMins % 60).padStart(2, '0')}m`;
    if (valRibbonFreeHours) valRibbonFreeHours.textContent = `${Math.floor(ribbonFreeMins / 60)}h ${String(ribbonFreeMins % 60).padStart(2, '0')}m`;
    if (overviewTotalTrackedHours) {
      const tH = Math.floor(trackedMins / 60);
      const tM = trackedMins % 60;
      overviewTotalTrackedHours.textContent = `${tH}h ${tM}m Tracked`;
    }

    // --- 6. VERTICAL CHRONOLOGICAL DAY JOURNEY FEED ---
    renderOverviewDayJourneyFeed();
  }

  function renderOverviewDayJourneyFeed() {
    if (!overviewDayFeedContainer) return;

    const [year, month, day] = selectedDateStr.split('-').map(Number);
    const journeyEvents = [];

    // A. Wake Up Event
    const wakeLog = logs.find(i => i.dateStr === selectedDateStr && i.category === 'wake_up');
    let wakeTimeMs = null;
    if (wakeLog) {
      wakeTimeMs = wakeLog.timestamp;
      journeyEvents.push({
        timeMs: wakeLog.timestamp,
        timeStr: wakeLog.timeFormatted,
        domain: 'Sleep',
        domainBadgeCls: 'bg-indigo-950/70 border-indigo-800/50 text-indigo-300',
        icon: '☀️',
        iconBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        title: 'Morning Awakening & Circadian Anchor',
        description: 'Circadian rhythm synchronized. Morning cortisol peak triggered.',
        metric: 'Day Started'
      });
    } else {
      const [wH, wM] = (habitsData.sleep?.wakeupRaw || '07:15').split(':').map(Number);
      wakeTimeMs = new Date(year, month - 1, day, wH, wM, 0).getTime();
      journeyEvents.push({
        timeMs: wakeTimeMs,
        timeStr: formatTime12h(habitsData.sleep?.wakeupRaw || '07:15'),
        domain: 'Sleep',
        domainBadgeCls: 'bg-indigo-950/70 border-indigo-800/50 text-indigo-300',
        icon: '☀️',
        iconBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        title: 'Scheduled Wake Target',
        description: 'Anchor wake time for consistent sleep architecture.',
        metric: 'Target'
      });
    }

    // B. Sunlight exposure (if applicable)
    if (habitsData.sleep?.sunlightDone && wakeTimeMs && selectedDateStr === getTodayDateStr()) {
      journeyEvents.push({
        timeMs: wakeTimeMs + (15 * 60 * 1000),
        timeStr: formatTimestamp12h(wakeTimeMs + (15 * 60 * 1000)),
        domain: 'Habits',
        domainBadgeCls: 'bg-amber-950/70 border-amber-800/50 text-amber-300',
        icon: '🕶️',
        iconBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        title: 'Morning Sunlight Viewing',
        description: '10–15 mins photon absorption onto retinal ganglion cells.',
        metric: '+1 Habit'
      });
    }

    // C. Focus Sessions
    const daySessions = (focusData.sessions || []).filter(s => s.dateStr === selectedDateStr);
    daySessions.forEach(sess => {
      const durMins = Math.max(1, Math.round((sess.durationSeconds || 0) / 60));
      journeyEvents.push({
        timeMs: sess.startTimestamp,
        timeStr: formatTimestamp12h(sess.startTimestamp),
        domain: 'Focus',
        domainBadgeCls: 'bg-sky-950/70 border-sky-800/50 text-sky-300',
        icon: '🧠',
        iconBg: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
        title: sess.taskTitle || 'Deep Work Study Session',
        description: `Feynman technique synthesis${sess.notes ? ` · "${escapeHtml(sess.notes)}"` : ''}`,
        metric: `${durMins}m Deep Work`
      });
    });

    // Active Live Session (if today)
    if (selectedDateStr === getTodayDateStr() && focusData.currentSession) {
      const act = focusData.currentSession;
      const actMins = Math.max(1, Math.floor((Date.now() - act.startTimestamp) / 60000));
      journeyEvents.push({
        timeMs: act.startTimestamp,
        timeStr: formatTimestamp12h(act.startTimestamp),
        domain: 'Focus',
        domainBadgeCls: 'bg-emerald-950/70 border-emerald-800/50 text-emerald-300 animate-pulse',
        icon: '⚡',
        iconBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        title: act.taskTitle || 'Active Deep Study Session',
        description: 'Live Feynman timer running right now...',
        metric: `${actMins}m Elapsed`
      });
    }

    // D. Move Logs
    const dayMoveLogs = logs.filter(l => l.dateStr === selectedDateStr && l.category !== 'wake_up');
    dayMoveLogs.forEach(l => {
      let icon = '⚡';
      let title = 'Movement Set';
      let metric = '';
      let desc = '';

      if (l.category === 'pullup') {
        icon = '💪';
        title = 'Half Pull-ups Set';
        metric = `+${l.reps || 0} Reps`;
        desc = 'Grease the Groove · Sub-maximal lat & back activation';
      } else if (l.category === 'pushup') {
        icon = '🔥';
        title = 'Push-ups Set';
        metric = `+${l.reps || 0} Reps`;
        desc = 'Grease the Groove · Chest & core motor pattern recruitment';
      } else if (l.category === 'barbell') {
        icon = '🏋️';
        title = `${l.exercise || 'Barbell'} Set`;
        metric = `${l.reps || 0}r @ ${l.weightKg || 30}kg`;
        desc = `Barbell strength work · ${((l.reps || 0) * (l.weightKg || 30))}kg tonnage`;
      } else if (l.category === 'walk' || l.category === 'steps') {
        icon = '🚶';
        title = 'Cardio & Steps Log';
        metric = `+${(l.steps || 0).toLocaleString()} Steps`;
        desc = 'Zone 2 low-intensity aerobic recovery';
      }

      journeyEvents.push({
        timeMs: l.timestamp,
        timeStr: l.timeFormatted,
        domain: 'Move',
        domainBadgeCls: 'bg-emerald-950/70 border-emerald-800/50 text-emerald-300',
        icon,
        iconBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        title,
        description: desc,
        metric
      });
    });

    // E. Reading Sessions from Habits History
    if (habitsData.reading && Array.isArray(habitsData.reading.history)) {
      const readLogs = habitsData.reading.history.filter(h => {
        const d = new Date(h.timestamp);
        const logDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        return logDateStr === selectedDateStr;
      });
      readLogs.forEach(h => {
        journeyEvents.push({
          timeMs: h.timestamp,
          timeStr: formatTimestamp12h(h.timestamp),
          domain: 'Habits',
          domainBadgeCls: 'bg-purple-950/70 border-purple-800/50 text-purple-300',
          icon: '📖',
          iconBg: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
          title: `Technical Reading: ${escapeHtml(h.bookTitle || 'Book')}`,
          description: `Read ${h.pages || 0} pages · Deliberate non-screen focus`,
          metric: `+${h.pages || 0} Pages`
        });
      });
    }

    // F. Bedtime Target (Night Anchor)
    const [bH, bM] = (habitsData.sleep?.bedtimeRaw || '23:15').split(':').map(Number);
    const bedTimeMs = new Date(year, month - 1, day, bH, bM, 0).getTime();
    journeyEvents.push({
      timeMs: bedTimeMs,
      timeStr: formatTime12h(habitsData.sleep?.bedtimeRaw || '23:15'),
      domain: 'Sleep',
      domainBadgeCls: 'bg-indigo-950/70 border-indigo-800/50 text-indigo-300',
      icon: '🌙',
      iconBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
      title: 'Circadian Sleep Target & Digital Shutdown',
      description: 'Room temperature cooled (65–68°F), screens eliminated, melatonin release.',
      metric: 'Recovery'
    });

    // Sort chronologically
    journeyEvents.sort((a, b) => a.timeMs - b.timeMs);

    if (overviewDayFeedCount) {
      overviewDayFeedCount.textContent = `${journeyEvents.length} Milestone${journeyEvents.length === 1 ? '' : 's'}`;
    }

    if (journeyEvents.length === 0) {
      overviewDayFeedContainer.innerHTML = `
        <div class="matte-card p-6 text-center space-y-3">
          <div class="text-2xl">🌱</div>
          <p class="text-xs text-slate-300 font-medium">No actions logged for this day yet.</p>
          <p class="text-[11px] text-slate-500 max-w-xs mx-auto">
            Log your wake-up time, do a set of pull-ups or push-ups, or start a Feynman study session to see your day unfold here.
          </p>
        </div>
      `;
      return;
    }

    let html = '<div class="space-y-2.5">';
    journeyEvents.forEach((ev) => {
      html += `
        <div class="flex items-start gap-3 p-3 rounded-xl bg-[#0e1422] border border-white/[0.06] hover:border-white/[0.15] transition journey-card">
          <div class="w-8 h-8 rounded-xl ${ev.iconBg} border flex items-center justify-center text-sm shrink-0 shadow-sm">
            ${ev.icon}
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-2 min-w-0">
                <span class="text-[11px] font-mono text-slate-400 font-bold">${ev.timeStr}</span>
                <span class="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border ${ev.domainBadgeCls}">${ev.domain}</span>
              </div>
              <span class="text-xs font-mono font-bold text-white shrink-0">${ev.metric}</span>
            </div>
            <h4 class="text-xs font-bold text-white mt-1 truncate">${escapeHtml(ev.title)}</h4>
            <p class="text-[11px] text-slate-400 mt-0.5 line-clamp-2">${escapeHtml(ev.description)}</p>
          </div>
        </div>
      `;
    });
    html += '</div>';

    overviewDayFeedContainer.innerHTML = html;
  }

  function renderOverviewWeekMatrix() {
    if (!overviewWeekMatrixContainer) return;

    const days = [];
    for (let i = 6; i >= 0; i--) {
      days.push(offsetDate(selectedDateStr, -i));
    }

    let html = `
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse font-mono text-xs">
          <thead>
            <tr class="border-b border-white/[0.08] text-slate-400 text-[11px]">
              <th class="py-2 pr-3 font-semibold">Engine Dimension</th>
              ${days.map(d => {
                const isSelected = d === selectedDateStr;
                const dayName = new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'narrow' });
                const dayNum = d.split('-')[2];
                return `<th class="py-2 px-2 text-center ${isSelected ? 'text-white font-bold bg-white/5 rounded-t' : ''}">${dayName}<span class="block text-[9px] text-slate-500">${dayNum}</span></th>`;
              }).join('')}
            </tr>
          </thead>
          <tbody class="divide-y divide-white/[0.04]">
    `;

    // Sleep
    html += `
      <tr>
        <td class="py-3 pr-3 text-slate-300 font-sans text-xs flex items-center gap-1.5">
          <span>🛌</span> <span class="font-medium">Sleep Adherence</span>
        </td>
        ${days.map(d => {
          const rec = habitsData.dailyRecords?.[d]?.sleep;
          const wakeLog = logs.find(i => i.dateStr === d && i.category === 'wake_up');
          const hasWake = !!wakeLog || !!rec;
          return `<td class="py-2.5 px-2 text-center">
            <span class="inline-flex items-center justify-center w-6 h-6 rounded-lg text-[11px] font-bold ${hasWake ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40' : 'bg-slate-900 text-slate-600'}">
              ${hasWake ? '✓' : '—'}
            </span>
          </td>`;
        }).join('')}
      </tr>
    `;

    // Focus
    html += `
      <tr>
        <td class="py-3 pr-3 text-slate-300 font-sans text-xs flex items-center gap-1.5">
          <span>🧠</span> <span class="font-medium">Focus Study</span>
        </td>
        ${days.map(d => {
          const daySess = (focusData.sessions || []).filter(s => s.dateStr === d);
          const sec = daySess.reduce((acc, s) => acc + (s.durationSeconds || 0), 0);
          const hrs = sec / 3600;
          const hit = hrs >= 3.0;
          const partial = hrs > 0;
          const cls = hit ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' : (partial ? 'bg-sky-950/40 text-sky-400 border border-sky-800/30' : 'bg-slate-900 text-slate-600');
          return `<td class="py-2.5 px-2 text-center">
            <span class="inline-flex items-center justify-center w-6 h-6 rounded-lg text-[11px] font-bold ${cls}">
              ${hit ? '✓' : (partial ? `${Math.round(hrs)}h` : '—')}
            </span>
          </td>`;
        }).join('')}
      </tr>
    `;

    // Move
    html += `
      <tr>
        <td class="py-3 pr-3 text-slate-300 font-sans text-xs flex items-center gap-1.5">
          <span>⚡</span> <span class="font-medium">Move Volume</span>
        </td>
        ${days.map(d => {
          const dayMove = logs.filter(l => l.dateStr === d && ['pullup', 'pushup', 'barbell'].includes(l.category));
          const totalReps = dayMove.reduce((acc, l) => acc + (l.reps || 0), 0);
          const hit = totalReps >= 30;
          const partial = totalReps > 0;
          const cls = hit ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : (partial ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/30' : 'bg-slate-900 text-slate-600');
          return `<td class="py-2.5 px-2 text-center">
            <span class="inline-flex items-center justify-center w-6 h-6 rounded-lg text-[11px] font-bold ${cls}">
              ${hit ? '✓' : (partial ? '·' : '—')}
            </span>
          </td>`;
        }).join('')}
      </tr>
    `;

    // Habits
    html += `
      <tr>
        <td class="py-3 pr-3 text-slate-300 font-sans text-xs flex items-center gap-1.5">
          <span>🧘</span> <span class="font-medium">Vice Shield</span>
        </td>
        ${days.map(d => {
          const rec = habitsData.dailyRecords?.[d];
          const hasRecord = !!rec || (d === getTodayDateStr());
          const cls = hasRecord ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-slate-900 text-slate-600';
          return `<td class="py-2.5 px-2 text-center">
            <span class="inline-flex items-center justify-center w-6 h-6 rounded-lg text-[11px] font-bold ${cls}">
              ${hasRecord ? '✓' : '—'}
            </span>
          </td>`;
        }).join('')}
      </tr>
    `;

    html += `
          </tbody>
        </table>
      </div>
    `;

    overviewWeekMatrixContainer.innerHTML = html;
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

    // Wake up check for selected date
    const wakeLog = logs.find(i => i.dateStr === selectedDateStr && i.category === 'wake_up');
    if (wakeLog) {
      wakeUpLabel.textContent = `Woke ${wakeLog.timeFormatted}`;
      btnWakeUp.classList.add('text-amber-300');
      btnEditWakeup.classList.remove('hidden');
    } else {
      wakeUpLabel.textContent = 'Woke Up';
      btnWakeUp.classList.remove('text-amber-300');
      btnEditWakeup.classList.add('hidden');
    }
  }

  function renderMetrics() {
    const dayLogs = logs.filter(item => item.dateStr === selectedDateStr);

    let totalPullups = 0;
    let totalPushups = 0;
    let totalTonnage = 0;
    let totalSteps = 0;

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
        details = `Woke up at ${item.timeFormatted}`;
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
      timeFormatted: entry.timeFormatted || formatTime(now),
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
    renderDateDisplay();
    renderMetrics();
    renderTimeline();
    renderOverviewDashboard();
    showUndoToast(`Logged ${newLog.name}`, newLog.id);
  }

  function deleteLog(id) {
    logs = logs.filter(item => item.id !== id);
    saveLocalData();
    fetch(`/api/logs/${id}`, { method: 'DELETE' }).catch(() => {});
    triggerHaptic(10, 240);
    renderDateDisplay();
    renderMetrics();
    renderTimeline();
    renderOverviewDashboard();
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

    if (!focusData.sessions) focusData.sessions = [];
    const daySessions = focusData.sessions.filter(s => s.dateStr === selectedDateStr);
    let totalSec = daySessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0);
    if (selectedDateStr === getTodayDateStr() && focusData.currentSession) {
      totalSec += Math.floor((Date.now() - focusData.currentSession.startTimestamp) / 1000);
    }
    if (totalSec === 0 && focusData.dailyHistory && focusData.dailyHistory[selectedDateStr]) {
      totalSec = focusData.dailyHistory[selectedDateStr].studySeconds || 0;
    }
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
                <div class="flex items-center gap-2 mt-1 font-mono text-xs flex-wrap">
                  <span class="px-2 py-0.5 rounded border ${badgeStyle} font-semibold">${badgeLabel}</span>
                  <span class="text-slate-400">${t.category}</span>
                  ${t.startedAt ? `<span class="text-sky-400 text-[11px] font-mono">Started: ${t.startedAt}</span>` : ''}
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
              <span class="text-xs text-slate-500">${t.startedAt ? `${t.startedAt} → ` : ''}${t.completedAt || ''}</span>
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

    renderDailyTimeline();
    renderStudySessionsReceipts();
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
      if (focusData.timerState.isRunning) {
        pauseTimer();
      } else if (focusData.currentSession) {
        const now = Date.now();
        const durationSec = Math.max(15, Math.floor((now - focusData.currentSession.startTimestamp) / 1000));
        if (durationSec >= 15) {
          focusData.currentSession.endTimestamp = now;
          focusData.currentSession.endTimeFormatted = formatTimestamp12h(now);
          focusData.currentSession.durationSeconds = durationSec;
          if (!focusData.sessions) focusData.sessions = [];
          focusData.sessions.push({ ...focusData.currentSession });
        }
        focusData.currentSession = null;
      }
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

    // Track task start time
    const boundTask = focusData.tasks.find(t => t.id === focusData.timerState.boundTaskId);
    if (boundTask && !boundTask.startedAt) {
      boundTask.startedAt = formatTimestamp12h(now);
    }

    // Initialize or continue active study session receipt
    if (!focusData.currentSession) {
      focusData.currentSession = {
        id: 'sess_' + now + '_' + Math.random().toString(36).substring(2, 7),
        taskId: focusData.timerState.boundTaskId,
        taskTitle: boundTask ? boundTask.title : 'Study Session',
        category: boundTask ? boundTask.category : 'General',
        bucket: boundTask ? boundTask.bucket : 'deep',
        dateStr: selectedDateStr || getTodayDateStr(),
        startTimestamp: now,
        startTimeFormatted: formatTimestamp12h(now),
        endTimestamp: null,
        endTimeFormatted: null,
        durationSeconds: 0
      };
    }

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
    if (!focusData.timerState.isRunning && !focusData.currentSession) return;

    tickTimer();
    focusData.timerState.isRunning = false;
    focusData.timerState.startTimestamp = null;
    focusData.timerState.endTimestamp = null;
    focusData.timerState.lastTickTimestamp = null;

    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }

    // Finalize active study session receipt
    if (focusData.currentSession) {
      const now = Date.now();
      const durationSec = Math.max(15, Math.floor((now - focusData.currentSession.startTimestamp) / 1000));
      if (durationSec >= 15) {
        focusData.currentSession.endTimestamp = now;
        focusData.currentSession.endTimeFormatted = formatTimestamp12h(now);
        focusData.currentSession.durationSeconds = durationSec;
        if (!focusData.sessions) focusData.sessions = [];
        focusData.sessions.push({ ...focusData.currentSession });
      }
      focusData.currentSession = null;
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

  // --- Study Sessions Receipts & Manual Session Management ---
  function deleteSession(sessionId) {
    if (!focusData.sessions) return;
    const sess = focusData.sessions.find(s => s.id === sessionId);
    if (!sess) return;

    focusData.sessions = focusData.sessions.filter(s => s.id !== sessionId);

    // Adjust dailyHistory studySeconds if present
    const dateStr = sess.dateStr || selectedDateStr;
    if (focusData.dailyHistory && focusData.dailyHistory[dateStr]) {
      focusData.dailyHistory[dateStr].studySeconds = Math.max(
        0,
        (focusData.dailyHistory[dateStr].studySeconds || 0) - (sess.durationSeconds || 0)
      );
    }

    saveLocalData();
    postFocusToServer();
    renderFocusDashboard();
    renderFocusAnalytics();
    triggerHaptic(10, 350);
    showUndoToast(`Session deleted: ${sess.taskTitle}`, sessionId);
  }

  function openManualSessionModal() {
    if (!modalManualSession) return;

    // Populate dropdown with today's tasks + custom option
    const dayTasks = focusData.tasks.filter(t => t.curriculumDay === focusData.currentCurriculumDay);
    selectManualSessionTask.innerHTML = dayTasks.map(t => `
      <option value="${t.id}" data-title="${escapeHtml(t.title)}" data-category="${t.category}" data-bucket="${t.bucket}">
        [${t.code || t.category}] ${escapeHtml(t.title)}
      </option>
    `).join('') + `
      <option value="custom" data-title="Custom Study Topic" data-category="Custom" data-bucket="deep">
        + Custom Topic / Off-Roster Study...
      </option>
    `;

    manualSessionCustomTitleWrap.classList.add('hidden');
    inputManualSessionCustomTitle.value = '';

    // Default times: 50 minutes ago to right now
    const now = new Date();
    const endHH = String(now.getHours()).padStart(2, '0');
    const endMM = String(now.getMinutes()).padStart(2, '0');
    inputManualSessionEnd.value = `${endHH}:${endMM}`;

    const past = new Date(now.getTime() - (50 * 60 * 1000));
    const startHH = String(past.getHours()).padStart(2, '0');
    const startMM = String(past.getMinutes()).padStart(2, '0');
    inputManualSessionStart.value = `${startHH}:${startMM}`;

    updateManualSessionDurationDisplay();
    modalManualSession.classList.remove('hidden');
    triggerHaptic(8, 450);
  }

  function updateManualSessionDurationDisplay() {
    const sVal = inputManualSessionStart.value;
    const eVal = inputManualSessionEnd.value;
    if (!sVal || !eVal) {
      valManualSessionDuration.textContent = '--';
      return;
    }

    const [sH, sM] = sVal.split(':').map(Number);
    const [eH, eM] = eVal.split(':').map(Number);
    let diffMins = (eH * 60 + eM) - (sH * 60 + sM);
    if (diffMins < 0) diffMins += 24 * 60; // Crossing midnight

    const hrs = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    valManualSessionDuration.textContent = hrs > 0 ? `${hrs}h ${mins}m (${diffMins} mins)` : `${mins} mins`;
  }

  function saveManualSession() {
    const sVal = inputManualSessionStart.value;
    const eVal = inputManualSessionEnd.value;
    if (!sVal || !eVal) {
      alert('Please provide valid start and end times');
      return;
    }

    const selectedOpt = selectManualSessionTask.options[selectManualSessionTask.selectedIndex];
    const taskId = selectManualSessionTask.value;
    let title = selectedOpt ? (selectedOpt.getAttribute('data-title') || 'Deep Study Session') : 'Deep Study Session';
    let category = selectedOpt ? (selectedOpt.getAttribute('data-category') || 'General') : 'General';
    let bucket = selectedOpt ? (selectedOpt.getAttribute('data-bucket') || 'deep') : 'deep';

    if (taskId === 'custom') {
      const customTitle = inputManualSessionCustomTitle.value.trim();
      if (!customTitle) {
        alert('Please enter a title for your custom study session');
        inputManualSessionCustomTitle.focus();
        return;
      }
      title = customTitle;
      category = 'Custom';
      bucket = 'deep';
    }

    const [year, month, day] = selectedDateStr.split('-').map(Number);
    const [sH, sM] = sVal.split(':').map(Number);
    const [eH, eM] = eVal.split(':').map(Number);

    const startTimestamp = new Date(year, month - 1, day, sH, sM, 0, 0).getTime();
    let endTimestamp = new Date(year, month - 1, day, eH, eM, 0, 0).getTime();
    if (endTimestamp <= startTimestamp) {
      // Crossing midnight to next day
      endTimestamp += 24 * 60 * 60 * 1000;
    }

    const durationSeconds = Math.max(60, Math.round((endTimestamp - startTimestamp) / 1000));

    const newSession = {
      id: 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      taskId: taskId !== 'custom' ? taskId : null,
      taskTitle: title,
      category,
      bucket,
      dateStr: selectedDateStr,
      startTimestamp,
      startTimeFormatted: formatTimestamp12h(startTimestamp),
      endTimestamp,
      endTimeFormatted: formatTimestamp12h(endTimestamp),
      durationSeconds
    };

    if (!focusData.sessions) focusData.sessions = [];
    focusData.sessions.push(newSession);

    // Update dailyHistory
    if (!focusData.dailyHistory) focusData.dailyHistory = {};
    if (!focusData.dailyHistory[selectedDateStr]) {
      focusData.dailyHistory[selectedDateStr] = { studySeconds: 0, jobApps: focusData.jobAppsCount || 0, azureMinutes: focusData.azureMinutes || 0 };
    }
    focusData.dailyHistory[selectedDateStr].studySeconds = (focusData.dailyHistory[selectedDateStr].studySeconds || 0) + durationSeconds;

    modalManualSession.classList.add('hidden');
    saveLocalData();
    postFocusToServer();
    renderFocusDashboard();
    renderFocusAnalytics();
    triggerHaptic(15, 600);
    showUndoToast(`Logged session: ${title} (${Math.round(durationSeconds / 60)}m)`, newSession.id);
  }

  function renderStudySessionsReceipts() {
    if (!studySessionsReceiptsList || !valSessionCount) return;

    if (!focusData.sessions) focusData.sessions = [];
    const daySessions = focusData.sessions.filter(s => s.dateStr === selectedDateStr);
    const hasActiveSession = (selectedDateStr === getTodayDateStr() && focusData.currentSession);
    const totalCount = daySessions.length + (hasActiveSession ? 1 : 0);

    let totalDurationSec = daySessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0);
    if (hasActiveSession) {
      totalDurationSec += Math.floor((Date.now() - focusData.currentSession.startTimestamp) / 1000);
    }
    const totHrs = Math.floor(totalDurationSec / 3600);
    const totMins = Math.floor((totalDurationSec % 3600) / 60);
    valSessionCount.textContent = `${totalCount} Session${totalCount === 1 ? '' : 's'} (${totHrs}h ${totMins}m)`;

    if (totalCount === 0) {
      studySessionsReceiptsList.innerHTML = `
        <div class="text-center py-6 text-slate-500 text-xs font-mono matte-card p-4">
          <p>No study sessions recorded for this day yet.</p>
          <p class="text-[11px] text-slate-400 mt-1">Focus on a question with the timer above, or tap <span class="text-sky-400 font-bold">+ Log Session</span> to record your focus receipt.</p>
        </div>
      `;
      return;
    }

    let html = '';

    // If there is an active session right now
    if (hasActiveSession) {
      const activeSess = focusData.currentSession;
      const activeSec = Math.floor((Date.now() - activeSess.startTimestamp) / 1000);
      const m = Math.floor(activeSec / 60);
      const s = activeSec % 60;
      html += `
        <div class="p-3 rounded-xl bg-sky-950/50 border border-sky-400/50 flex items-center justify-between gap-3 shadow-md shadow-sky-500/10">
          <div class="space-y-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span class="text-xs font-bold text-white truncate">${escapeHtml(activeSess.taskTitle)}</span>
              <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-500 text-slate-950 font-bold uppercase">LIVE</span>
            </div>
            <div class="text-[11px] font-mono text-sky-300">
              Started at ${activeSess.startTimeFormatted} · Active: <span class="font-bold text-white">${m}m ${String(s).padStart(2, '0')}s</span>
            </div>
          </div>
          <button id="btnReceiptPauseActive" class="spring-btn px-3 py-1.5 rounded-lg bg-sky-500 text-slate-950 text-xs font-bold shrink-0">
            Pause
          </button>
        </div>
      `;
    }

    // List completed sessions in reverse chronological order
    const sorted = [...daySessions].sort((a, b) => b.startTimestamp - a.startTimestamp);
    sorted.forEach((sess) => {
      const durMins = Math.floor((sess.durationSeconds || 0) / 60);
      const durSecs = (sess.durationSeconds || 0) % 60;
      const durStr = durMins > 0 ? `${durMins}m ${durSecs > 0 ? durSecs + 's' : ''}` : `${durSecs}s`;

      let bucketPill = 'Deep Anchor';
      let pillColor = 'bg-sky-950/60 text-sky-400 border-sky-800/40';
      if (sess.bucket === 'spaced') {
        bucketPill = 'Spaced Retrieval';
        pillColor = 'bg-purple-950/60 text-purple-400 border-purple-800/40';
      } else if (sess.bucket === 'live') {
        bucketPill = 'Live Coding';
        pillColor = 'bg-amber-950/60 text-amber-400 border-amber-800/40';
      } else if (sess.bucket === 'dsa') {
        bucketPill = 'C# DSA';
        pillColor = 'bg-emerald-950/60 text-emerald-400 border-emerald-800/40';
      }

      html += `
        <div class="p-3 rounded-xl bg-[#111622] border border-white/[0.06] hover:border-white/15 flex items-center justify-between gap-3 transition">
          <div class="space-y-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-xs font-bold text-white truncate">${escapeHtml(sess.taskTitle)}</span>
              <span class="text-[10px] font-mono px-1.5 py-0.5 rounded border ${pillColor}">${bucketPill}</span>
            </div>
            <div class="text-[11px] font-mono text-slate-400 flex items-center gap-2">
              <span class="text-slate-300 font-semibold">${sess.startTimeFormatted} → ${sess.endTimeFormatted || '--:--'}</span>
              <span>·</span>
              <span class="text-sky-400 font-bold">${durStr}</span>
            </div>
          </div>
          <div class="flex items-center gap-1.5 shrink-0">
            <button data-id="${sess.id}" class="btn-delete-session text-slate-500 hover:text-rose-400 p-1.5 transition text-xs" title="Delete Session">
              ✕
            </button>
          </div>
        </div>
      `;
    });

    studySessionsReceiptsList.innerHTML = html;

    const btnPauseActive = document.getElementById('btnReceiptPauseActive');
    if (btnPauseActive) {
      btnPauseActive.addEventListener('click', pauseTimer);
    }

    studySessionsReceiptsList.querySelectorAll('.btn-delete-session').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        deleteSession(id);
      });
    });
  }

  // --- 24-Hour Unified Day Timeline & Activity Heatmap ---
  function buildTimelineDataForDate(dateStr) {
    const [year, month, day] = dateStr.split('-').map(Number);
    const dayStart = new Date(year, month - 1, day, 0, 0, 0, 0).getTime();
    const dayEnd = new Date(year, month - 1, day, 23, 59, 59, 999).getTime();

    const points = [];

    // 1. SLEEP TRACK
    let bedtime = '23:15';
    let wakeup = '07:15';
    if (habitsData.dailyRecords && habitsData.dailyRecords[dateStr] && habitsData.dailyRecords[dateStr].sleep) {
      bedtime = habitsData.dailyRecords[dateStr].sleep.bedtimeRaw || bedtime;
      wakeup = habitsData.dailyRecords[dateStr].sleep.wakeupRaw || wakeup;
    } else if (dateStr === getTodayDateStr() && habitsData.sleep) {
      bedtime = habitsData.sleep.bedtimeRaw || bedtime;
      wakeup = habitsData.sleep.wakeupRaw || wakeup;
    }

    const wakeLog = logs.find(l => l.dateStr === dateStr && l.category === 'wake_up');
    let wakeMs = null;
    if (wakeLog) {
      wakeMs = wakeLog.timestamp;
    } else if (wakeup) {
      const [wH, wM] = wakeup.split(':').map(Number);
      wakeMs = new Date(year, month - 1, day, wH, wM, 0).getTime();
    }

    if (wakeMs) {
      let sleepStartMs = dayStart;
      if (bedtime) {
        const [bH, bM] = bedtime.split(':').map(Number);
        if (bH < 12) {
          sleepStartMs = new Date(year, month - 1, day, bH, bM, 0).getTime();
        }
      }
      if (wakeMs > sleepStartMs) {
        const durHours = Math.round(((wakeMs - sleepStartMs) / (1000 * 60 * 60)) * 10) / 10;
        points.push({
          x: 'Sleep',
          y: [sleepStartMs, Math.min(dayEnd, wakeMs)],
          fillColor: '#818cf8',
          taskTitle: `Sleep & Recovery (${durHours}h)`,
          category: 'Sleep'
        });
      }
    }

    // 2. FOCUS TRACK
    if (!focusData.sessions) focusData.sessions = [];
    const daySessions = focusData.sessions.filter(s => {
      return s.dateStr === dateStr || (s.startTimestamp >= dayStart && s.startTimestamp <= dayEnd);
    });

    daySessions.forEach(s => {
      const sStart = Math.max(dayStart, s.startTimestamp);
      const sEnd = Math.min(dayEnd, s.endTimestamp || (s.startTimestamp + (s.durationSeconds || 0) * 1000));
      if (sEnd > sStart) {
        points.push({
          x: 'Focus',
          y: [sStart, sEnd],
          fillColor: '#38bdf8',
          taskTitle: s.taskTitle || 'Study Session',
          category: 'Focus'
        });
      }
    });

    if (dateStr === getTodayDateStr() && focusData.currentSession) {
      const cStart = Math.max(dayStart, focusData.currentSession.startTimestamp);
      const cEnd = Math.min(dayEnd, Date.now());
      if (cEnd > cStart) {
        points.push({
          x: 'Focus',
          y: [cStart, cEnd],
          fillColor: '#0284c7',
          taskTitle: `${focusData.currentSession.taskTitle} (In Progress)`,
          category: 'Focus'
        });
      }
    }

    // 3. MOVE TRACK
    const dayLogs = logs.filter(l => {
      return (l.dateStr === dateStr || (l.timestamp >= dayStart && l.timestamp <= dayEnd)) && l.category !== 'wake_up';
    });

    dayLogs.forEach(l => {
      const mStart = Math.max(dayStart, l.timestamp);
      const durMins = l.type === 'elliptical' ? (l.ellipticalMins || 15) : 10;
      const mEnd = Math.min(dayEnd, mStart + durMins * 60 * 1000);
      const desc = l.reps ? `${l.reps} reps` : (l.steps ? `${l.steps} steps` : `${durMins}m`);
      points.push({
        x: 'Move',
        y: [mStart, mEnd],
        fillColor: '#34d399',
        taskTitle: `${l.name || l.category}: ${desc}`,
        category: 'Move'
      });
    });

    // 4. HABITS TRACK
    if (habitsData.reading && Array.isArray(habitsData.reading.history)) {
      habitsData.reading.history.filter(h => {
        return h.timestamp >= dayStart && h.timestamp <= dayEnd;
      }).forEach(h => {
        const rStart = Math.max(dayStart, h.timestamp);
        const rEnd = Math.min(dayEnd, rStart + 20 * 60 * 1000);
        points.push({
          x: 'Habits',
          y: [rStart, rEnd],
          fillColor: '#fbbf24',
          taskTitle: `Reading: ${h.pages || 20} pages`,
          category: 'Habits'
        });
      });
    }

    if (habitsData.sleep && habitsData.sleep.sunlightDone && wakeMs && dateStr === getTodayDateStr()) {
      const sunStart = wakeMs + (10 * 60 * 1000);
      const sunEnd = sunStart + (15 * 60 * 1000);
      if (sunEnd <= dayEnd) {
        points.push({
          x: 'Habits',
          y: [sunStart, sunEnd],
          fillColor: '#f59e0b',
          taskTitle: 'Morning Sunlight (Huberman Protocol)',
          category: 'Habits'
        });
      }
    }

    return points;
  }

  function renderDailyTimelineChart(points) {
    if (!chartDailyTimeline) return;

    if (typeof ApexCharts === 'undefined') {
      chartDailyTimeline.innerHTML = `
        <div class="py-6 text-center text-xs font-mono text-slate-500">
          ApexCharts engine loading...
        </div>
      `;
      return;
    }

    if (!points || points.length === 0) {
      if (dailyTimelineChartInstance) {
        dailyTimelineChartInstance.destroy();
        dailyTimelineChartInstance = null;
      }
      chartDailyTimeline.innerHTML = `
        <div class="py-8 text-center text-xs font-mono text-slate-500">
          No activity logged for this date yet. Your 24-hour timeline will populate automatically as you log Sleep, Focus sessions, and Workouts.
        </div>
      `;
      return;
    }

    const [year, month, day] = selectedDateStr.split('-').map(Number);
    const dayStart = new Date(year, month - 1, day, 0, 0, 0, 0).getTime();
    const dayEnd = new Date(year, month - 1, day, 23, 59, 59, 999).getTime();

    const chartOptions = {
      series: [
        {
          name: 'Day Timeline',
          data: points
        }
      ],
      chart: {
        type: 'rangeBar',
        height: 180,
        background: 'transparent',
        toolbar: { show: false },
        animations: { enabled: false }
      },
      plotOptions: {
        bar: {
          horizontal: true,
          barHeight: '60%',
          rangeBarGroupRows: true
        }
      },
      xaxis: {
        type: 'datetime',
        min: dayStart,
        max: dayEnd,
        labels: {
          datetimeUTC: false,
          format: 'HH:mm',
          style: { colors: '#94a3b8', fontSize: '10px', fontFamily: 'monospace' }
        },
        axisBorder: { show: false },
        axisTicks: { color: 'rgba(255, 255, 255, 0.1)' }
      },
      yaxis: {
        labels: {
          style: { colors: '#cbd5e1', fontSize: '11px', fontWeight: 600 }
        }
      },
      grid: {
        borderColor: 'rgba(255, 255, 255, 0.05)',
        xaxis: { lines: { show: true } },
        yaxis: { lines: { show: false } }
      },
      tooltip: {
        theme: 'dark',
        custom: function({ seriesIndex, dataPointIndex, w }) {
          const p = w.config.series[seriesIndex].data[dataPointIndex];
          const durMins = Math.max(1, Math.round((p.y[1] - p.y[0]) / (1000 * 60)));
          const startStr = formatTimestamp12h(p.y[0]);
          const endStr = formatTimestamp12h(p.y[1]);
          return `
            <div style="background:#101520; border:1px solid rgba(255,255,255,0.15); border-radius:8px; padding:8px 12px; font-family:sans-serif; color:#f8fafc; font-size:12px; box-shadow:0 4px 12px rgba(0,0,0,0.5);">
              <div style="font-weight:700; color:${p.fillColor || '#38bdf8'}; margin-bottom:4px;">${escapeHtml(p.taskTitle || p.x)}</div>
              <div style="color:#94a3b8; font-family:monospace; font-size:11px;">${startStr} → ${endStr} (${durMins}m)</div>
            </div>
          `;
        }
      }
    };

    try {
      if (dailyTimelineChartInstance) {
        dailyTimelineChartInstance.updateOptions(chartOptions, true, true);
      } else {
        chartDailyTimeline.innerHTML = '';
        dailyTimelineChartInstance = new ApexCharts(chartDailyTimeline, chartOptions);
        dailyTimelineChartInstance.render();
      }
    } catch (err) {
      console.warn('ApexCharts update failed, recreating:', err);
      chartDailyTimeline.innerHTML = '';
      dailyTimelineChartInstance = new ApexCharts(chartDailyTimeline, chartOptions);
      dailyTimelineChartInstance.render();
    }
  }

  function renderHourlyHeatmap(points) {
    if (!hourlyHeatmapGrid) return;

    const [year, month, day] = selectedDateStr.split('-').map(Number);
    let html = '';

    for (let h = 0; h < 24; h++) {
      const hStart = new Date(year, month - 1, day, h, 0, 0, 0).getTime();
      const hEnd = new Date(year, month - 1, day, h, 59, 59, 999).getTime();

      let activeMins = 0;
      let dominantCategory = null;
      let maxCatMins = 0;
      const catMins = { Sleep: 0, Focus: 0, Move: 0, Habits: 0 };

      if (points && points.length > 0) {
        points.forEach(p => {
          const oStart = Math.max(hStart, p.y[0]);
          const oEnd = Math.min(hEnd, p.y[1]);
          if (oEnd > oStart) {
            const m = Math.round((oEnd - oStart) / (1000 * 60));
            activeMins += m;
            const cat = p.category || p.x;
            catMins[cat] = (catMins[cat] || 0) + m;
            if (catMins[cat] > maxCatMins) {
              maxCatMins = catMins[cat];
              dominantCategory = cat;
            }
          }
        });
      }

      activeMins = Math.min(60, activeMins);
      const hLabel = String(h).padStart(2, '0');

      let cellStyle = 'bg-[#101520]/80 border-white/[0.04] text-slate-500';
      if (activeMins > 0) {
        if (dominantCategory === 'Sleep') {
          cellStyle = activeMins >= 45
            ? 'bg-indigo-900/80 border-indigo-700/60 text-indigo-200 font-bold'
            : 'bg-indigo-950/60 border-indigo-850/40 text-indigo-300';
        } else if (dominantCategory === 'Move') {
          cellStyle = 'bg-emerald-900/80 border-emerald-700/60 text-emerald-200 font-bold';
        } else if (dominantCategory === 'Habits') {
          cellStyle = 'bg-amber-900/80 border-amber-700/60 text-amber-200 font-bold';
        } else {
          // Focus (Sky)
          if (activeMins >= 40) {
            cellStyle = 'bg-sky-500 border-sky-400 text-slate-950 font-bold shadow-sm shadow-sky-500/20';
          } else if (activeMins >= 20) {
            cellStyle = 'bg-sky-800/80 border-sky-600/60 text-sky-100 font-semibold';
          } else {
            cellStyle = 'bg-sky-950/70 border-sky-800/50 text-sky-300';
          }
        }
      }

      const tooltipText = activeMins > 0
        ? `Hour ${hLabel}:00 - ${hLabel}:59: ${activeMins}m active (${dominantCategory || 'Activity'})`
        : `Hour ${hLabel}:00 - ${hLabel}:59: Inactive`;

      html += `
        <div class="h-8 rounded-lg border flex flex-col items-center justify-center text-[10px] font-mono transition cursor-pointer hover:scale-105 ${cellStyle}" title="${tooltipText}">
          <span>${hLabel}</span>
          ${activeMins > 0 ? `<span class="text-[8px] opacity-75">${activeMins}m</span>` : ''}
        </div>
      `;
    }

    hourlyHeatmapGrid.innerHTML = html;
  }

  function renderDailyTimeline() {
    if (!dailyTimelineCard) return;

    const isToday = selectedDateStr === getTodayDateStr();
    valTimelineStatus.textContent = isToday ? 'Live Day' : `History: ${selectedDateStr}`;
    valTimelineStatus.className = isToday
      ? 'text-xs font-mono px-2.5 py-1 rounded-lg bg-sky-950/60 border border-sky-800/40 text-sky-400'
      : 'text-xs font-mono px-2.5 py-1 rounded-lg bg-[#141b29] border border-white/10 text-slate-400';

    const seriesData = buildTimelineDataForDate(selectedDateStr);
    renderDailyTimelineChart(seriesData);
    renderHourlyHeatmap(seriesData);
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

  // --- Dedicated Reading Library Page Manager ---
  function renderLibraryPage() {
    if (!habitsData.reading.books) habitsData.reading.books = [];

    const totalBooks = habitsData.reading.books.length;
    const readingBooks = habitsData.reading.books.filter(b => !b.completed).length;
    const completedBooks = habitsData.reading.books.filter(b => !!b.completed).length;
    const totalPagesLogged = habitsData.reading.books.reduce((acc, b) => acc + (b.currentPage || 0), 0);

    if (valLibraryTotalBooks) valLibraryTotalBooks.textContent = totalBooks;
    if (valLibraryReadingCount) valLibraryReadingCount.textContent = readingBooks;
    if (valLibraryCompletedCount) valLibraryCompletedCount.textContent = completedBooks;
    if (valLibraryPagesLogged) valLibraryPagesLogged.textContent = totalPagesLogged;

    if (countFilterAll) countFilterAll.textContent = totalBooks;
    if (countFilterReading) countFilterReading.textContent = readingBooks;
    if (countFilterCompleted) countFilterCompleted.textContent = completedBooks;

    if (sidebarLibraryBadge) sidebarLibraryBadge.textContent = `${totalBooks} Book${totalBooks === 1 ? '' : 's'}`;
    if (valBooksCount) valBooksCount.textContent = totalBooks;

    // Filter button styling
    const activeFilterCls = 'px-3 py-1.5 rounded-lg bg-white text-slate-950 font-bold shadow-sm transition';
    const inactiveFilterCls = 'px-3 py-1.5 rounded-lg bg-[#1a2233] text-slate-400 hover:text-white border border-white/10 transition';

    if (btnLibraryFilterAll) btnLibraryFilterAll.className = libraryFilter === 'all' ? activeFilterCls : inactiveFilterCls;
    if (btnLibraryFilterReading) btnLibraryFilterReading.className = libraryFilter === 'reading' ? activeFilterCls : inactiveFilterCls;
    if (btnLibraryFilterCompleted) btnLibraryFilterCompleted.className = libraryFilter === 'completed' ? activeFilterCls : inactiveFilterCls;

    // Filtered list
    let displayBooks = habitsData.reading.books;
    if (libraryFilter === 'reading') {
      displayBooks = habitsData.reading.books.filter(b => !b.completed);
    } else if (libraryFilter === 'completed') {
      displayBooks = habitsData.reading.books.filter(b => !!b.completed);
    }

    if (!libraryBooksGrid) return;

    if (displayBooks.length === 0) {
      libraryBooksGrid.innerHTML = '';
      if (emptyLibraryState) emptyLibraryState.classList.remove('hidden');
    } else {
      if (emptyLibraryState) emptyLibraryState.classList.add('hidden');
      libraryBooksGrid.innerHTML = displayBooks.map(b => {
        const bPct = Math.min(100, Math.round(((b.currentPage || 0) / (b.totalPages || 1)) * 100));
        const isActive = b.id === habitsData.reading.activeBookId;
        const isCompleted = !!b.completed || bPct >= 100;

        let statusBadge = '';
        if (isActive) {
          statusBadge = '<span class="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/50 text-amber-300 font-bold text-[10px] tracking-wide">ACTIVE IN HABITS</span>';
        } else if (isCompleted) {
          statusBadge = '<span class="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 font-bold text-[10px] tracking-wide">COMPLETED</span>';
        } else {
          statusBadge = '<span class="px-2 py-0.5 rounded-md bg-[#182030] border border-white/10 text-slate-400 font-bold text-[10px] tracking-wide">IN PROGRESS</span>';
        }

        return `
          <div class="matte-card p-4 flex flex-col justify-between ${isActive ? 'border-amber-500/50 ring-1 ring-amber-500/30 bg-[#0f1523]' : 'border-white/[0.07] bg-[#0c101a]'} rounded-2xl space-y-3 transition">
            <div>
              <div class="flex items-start justify-between gap-2">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1.5 flex-wrap font-mono">
                    ${statusBadge}
                    <span class="text-[10px] text-slate-500 font-medium">${b.totalPages} total pages</span>
                  </div>
                  <h4 class="font-bold text-sm text-white font-mono leading-snug line-clamp-2" title="${escapeHtml(b.title)}">${escapeHtml(b.title)}</h4>
                  <p class="text-xs text-slate-400 font-mono mt-0.5 truncate">by ${escapeHtml(b.author || 'Unknown Author')}</p>
                </div>
                <button data-id="${b.id}" class="btn-lib-delete text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-white/5 transition text-xs shrink-0" title="Delete Book">✕</button>
              </div>

              <div class="mt-3.5 space-y-1.5 font-mono">
                <div class="flex justify-between text-[11px]">
                  <span class="text-slate-400">Progression</span>
                  <span class="text-white font-bold">${b.currentPage || 0} / ${b.totalPages}p <span class="${isCompleted ? 'text-emerald-400' : 'text-amber-400'}">(${bPct}%)</span></span>
                </div>
                <div class="progress-track h-2 bg-white/10 rounded-full overflow-hidden">
                  <div class="progress-fill ${isCompleted ? 'bg-emerald-400' : 'bg-amber-400'}" style="width: ${bPct}%"></div>
                </div>
              </div>
            </div>

            <div class="flex items-center gap-2 pt-2 border-t border-white/[0.06] font-mono">
              ${isActive ? `
                <div class="flex-1 text-center py-2 text-[11px] font-bold text-amber-300 bg-amber-950/40 rounded-xl border border-amber-800/40">
                  ★ Active Focus
                </div>
              ` : `
                <button data-id="${b.id}" class="btn-lib-activate flex-1 py-2 rounded-xl bg-[#182233] hover:bg-[#202c42] text-slate-200 hover:text-white text-xs font-bold transition border border-white/10">
                  Set Active
                </button>
              `}
              <button data-id="${b.id}" class="btn-lib-edit-page spring-btn px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition border border-white/10 flex items-center gap-1.5">
                <span>✎</span>
                <span>Page</span>
              </button>
            </div>
          </div>
        `;
      }).join('');

      libraryBooksGrid.querySelectorAll('.btn-lib-activate').forEach(btn => {
        btn.addEventListener('click', () => {
          const bId = btn.getAttribute('data-id');
          habitsData.reading.activeBookId = bId;
          const targetBook = habitsData.reading.books.find(b => b.id === bId);
          if (targetBook && inputStartPage) {
            inputStartPage.value = targetBook.currentPage || 0;
          }
          saveLocalData();
          postHabitsToServer();
          renderLibraryPage();
          renderHabitsDashboard();
          renderHabitsAnalytics();
          triggerHaptic(8, 500);
          showUndoToast(`Active book set to "${targetBook ? targetBook.title : 'Selected Book'}"`, bId);
        });
      });

      libraryBooksGrid.querySelectorAll('.btn-lib-edit-page').forEach(btn => {
        btn.addEventListener('click', () => {
          const bId = btn.getAttribute('data-id');
          const targetBook = habitsData.reading.books.find(b => b.id === bId);
          if (!targetBook) return;
          editingBookId = bId;
          if (valModalUpdateBookTitle) valModalUpdateBookTitle.textContent = targetBook.title;
          if (valModalUpdateTotalPages) valModalUpdateTotalPages.textContent = targetBook.totalPages;
          if (inputModalUpdateCurrentPage) {
            inputModalUpdateCurrentPage.value = targetBook.currentPage || 0;
            inputModalUpdateCurrentPage.max = targetBook.totalPages;
          }
          if (modalUpdateBookProgress) {
            modalUpdateBookProgress.classList.remove('hidden');
            inputModalUpdateCurrentPage.focus();
            inputModalUpdateCurrentPage.select();
          }
          triggerHaptic(8, 480);
        });
      });

      libraryBooksGrid.querySelectorAll('.btn-lib-delete').forEach(btn => {
        btn.addEventListener('click', () => {
          const bId = btn.getAttribute('data-id');
          if (habitsData.reading.books.length <= 1) {
            alert('You must keep at least 1 book in your library.');
            return;
          }
          const targetBook = habitsData.reading.books.find(b => b.id === bId);
          const bookTitle = targetBook ? targetBook.title : 'Book';
          if (!confirm(`Delete "${bookTitle}" from your library?`)) {
            return;
          }
          habitsData.reading.books = habitsData.reading.books.filter(b => b.id !== bId);
          if (habitsData.reading.activeBookId === bId) {
            habitsData.reading.activeBookId = habitsData.reading.books[0].id;
            const newActive = habitsData.reading.books[0];
            if (inputStartPage) inputStartPage.value = newActive.currentPage || 0;
          }
          saveLocalData();
          postHabitsToServer();
          renderLibraryPage();
          renderHabitsDashboard();
          renderHabitsAnalytics();
          triggerHaptic(8, 350);
          showUndoToast(`Deleted "${bookTitle}"`, bId);
        });
      });
    }
  }

  // --- Habits Engine Functions (Execution Mode) ---
  function renderHabitsDashboard() {
    const todayStr = getTodayDateStr();

    // 1. Sleep Rendering
    inputBedtime.value = habitsData.sleep.bedtimeRaw || '23:15';
    inputWakeup.value = habitsData.sleep.wakeupRaw || '07:15';
    const sleepRes = calculateSleep(inputBedtime.value, inputWakeup.value);
    badgeSleepQuality.textContent = `${sleepRes.durationText} (${sleepRes.isOptimal ? 'Optimal' : 'Short'})`;
    badgeSleepQuality.className = sleepRes.isOptimal
      ? 'text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-sky-950/60 border border-sky-800/40 text-sky-400'
      : 'text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-amber-950/60 border border-amber-800/40 text-amber-400';

    if (habitsData.sleep.sunlightDone) {
      sunlightIcon.textContent = '☀️';
      sunlightLabel.textContent = 'Sunlight Logged (+10m)';
      btnToggleSunlight.classList.add('border-amber-500/50', 'bg-amber-950/30', 'text-amber-300');
    } else {
      sunlightIcon.textContent = '☁️';
      sunlightLabel.textContent = 'Log 10m Sunlight';
      btnToggleSunlight.classList.remove('border-amber-500/50', 'bg-amber-950/30', 'text-amber-300');
    }

    // 2. Detox Rendering
    const cleanDays = habitsData.detox.cleanDays || 3;
    valCleanStreakDays.textContent = cleanDays;
    let habitsTier = 'Reset';
    if (cleanDays >= 14) habitsTier = 'Fortified';
    else if (cleanDays >= 7) habitsTier = 'Calibrated';
    badgeDetoxTier.textContent = `Level 2: ${habitsTier} (${cleanDays >= 7 ? '14d' : '7d'} Goal)`;

    chkMorningPhone.checked = !!habitsData.detox.morningPhoneFree;
    chkZeroReels.checked = !!habitsData.detox.zeroReels;
    chkNoPhoneInBed.checked = !!habitsData.detox.noPhoneInBed;

    // 3. Multi-Book Library Rendering
    if (!habitsData.reading.books) {
      habitsData.reading.books = [
        { id: 'book_1', title: 'Designing Data-Intensive Applications', author: 'Martin Kleppmann', totalPages: 560, currentPage: 64, completed: false }
      ];
      habitsData.reading.activeBookId = 'book_1';
    }

    valBooksCount.textContent = habitsData.reading.books.length;

    // Populate active book dropdown
    selectActiveBook.innerHTML = habitsData.reading.books.map(b => {
      return `<option value="${b.id}" ${b.id === habitsData.reading.activeBookId ? 'selected' : ''}>${escapeHtml(b.title)}</option>`;
    }).join('');

    const activeBook = habitsData.reading.books.find(b => b.id === habitsData.reading.activeBookId) || habitsData.reading.books[0];
    if (activeBook) {
      valActiveBookTitle.textContent = activeBook.title;
      valActiveBookAuthor.textContent = activeBook.author || 'Author';
      const pct = Math.min(100, Math.round(((activeBook.currentPage || 0) / (activeBook.totalPages || 1)) * 100));
      valActiveBookProgress.textContent = `Page ${activeBook.currentPage || 0} / ${activeBook.totalPages || 1} (${pct}%)`;
      barActiveBook.style.width = `${pct}%`;
      inputStartPage.value = activeBook.currentPage || 0;
    }

    // Update Sidebar badge & Library Page if active
    if (sidebarLibraryBadge) {
      sidebarLibraryBadge.textContent = `${habitsData.reading.books.length} Book${habitsData.reading.books.length === 1 ? '' : 's'}`;
    }
    if (currentDomain === 'library') {
      renderLibraryPage();
    }

    // Reading Timer Display
    const rSec = habitsData.reading.timerSeconds || 1200;
    const rM = Math.floor(rSec / 60);
    const rS = rSec % 60;
    valReadingTimerDisplay.textContent = `${String(rM).padStart(2, '0')}:${String(rS).padStart(2, '0')}`;

    // 4. Keystones
    chkBedMade.checked = !!habitsData.keystones.bedMade;
    chkRoomReset.checked = !!habitsData.keystones.roomReset;

    // Sync into daily records for today
    if (!habitsData.dailyRecords) habitsData.dailyRecords = {};
    habitsData.dailyRecords[todayStr] = {
      bedtimeRaw: inputBedtime.value,
      wakeupRaw: inputWakeup.value,
      sleepMinutes: sleepRes.totalMins,
      sunlightDone: !!habitsData.sleep.sunlightDone,
      cleanDay: true,
      pagesRead: habitsData.reading.pagesReadToday || 0,
      bedMade: !!habitsData.keystones.bedMade,
      roomReset: !!habitsData.keystones.roomReset
    };
  }

  // --- Habits Progress & Analytics Engine ---
  function renderHabitsAnalytics() {
    const todayStr = getTodayDateStr();
    const count = habitsAnalyticsPeriod === '30d' ? 30 : 7;
    const days = [];
    for (let i = count - 1; i >= 0; i--) days.push(offsetDate(todayStr, -i));

    if (!habitsData.dailyRecords) habitsData.dailyRecords = {};

    let totalSleepMins = 0;
    let daysWithSleep = 0;
    let optimalDays = 0;
    let totalPagesRange = 0;
    let sampleBedtime = habitsData.sleep.bedtimeRaw || '23:15';
    let sampleWakeup = habitsData.sleep.wakeupRaw || '07:15';

    days.forEach(d => {
      const rec = habitsData.dailyRecords[d] || {
        bedtimeRaw: sampleBedtime,
        wakeupRaw: sampleWakeup,
        sleepMinutes: 465,
        sunlightDone: false,
        cleanDay: true,
        pagesRead: d === todayStr ? (habitsData.reading.pagesReadToday || 0) : (Math.floor(Math.random() * 15) + 10),
        bedMade: true,
        roomReset: true
      };

      const sMins = rec.sleepMinutes || 465;
      totalSleepMins += sMins;
      daysWithSleep++;
      if (sMins >= (7 * 60) && sMins <= (9 * 60)) {
        optimalDays++;
      }
      totalPagesRange += (rec.pagesRead || 0);
    });

    // Scorecards
    const avgSleepMin = Math.round(totalSleepMins / (daysWithSleep || 1));
    const avgHrs = Math.floor(avgSleepMin / 60);
    const avgM = avgSleepMin % 60;
    valAvgSleepDuration.textContent = `${avgHrs}h ${String(avgM).padStart(2, '0')}m`;
    valAvgSleepTimes.textContent = `${formatTime12h(sampleBedtime)} → ${formatTime12h(sampleWakeup)}`;
    valBestCleanStreak.textContent = `${Math.max(habitsData.detox.cleanDays || 1, 3)} Days`;
    valTotalPagesReadRange.textContent = `${totalPagesRange} Pages`;

    // 1. Sleep Duration Chart
    const adherencePct = Math.round((optimalDays / (daysWithSleep || 1)) * 100);
    valSleepTargetAdherence.textContent = `${adherencePct}% in 7–9h Target Zone`;

    const MAX_SLEEP_HOURS = 10.0;
    const is30d = habitsAnalyticsPeriod === '30d';

    if (habitsSleepBarsContainer && habitsSleepDaysRow) {
      if (is30d) {
        habitsSleepBarsContainer.style.minWidth = '960px';
        habitsSleepDaysRow.style.minWidth = '960px';
      } else {
        habitsSleepBarsContainer.style.minWidth = '100%';
        habitsSleepDaysRow.style.minWidth = '100%';
      }
    }

    habitsSleepBarsContainer.innerHTML = `
      <!-- Optimal 7-9h Target Band -->
      <div class="absolute left-0 right-0 bg-emerald-500/10 border-y border-dashed border-emerald-400/30 pointer-events-none z-0" style="bottom: ${(7 / MAX_SLEEP_HOURS) * 100}%; top: ${100 - ((9 / MAX_SLEEP_HOURS) * 100)}%">
        <span class="text-[9px] font-mono text-emerald-400 absolute right-1 top-0.5">7–9h Optimal</span>
      </div>
      ${days.map(d => {
        const rec = habitsData.dailyRecords[d] || { sleepMinutes: 465 };
        const hrsFloat = (rec.sleepMinutes || 465) / 60;
        const barHeightPct = Math.min(100, Math.max(8, Math.round((hrsFloat / MAX_SLEEP_HOURS) * 100)));
        const isOptimal = hrsFloat >= 7.0 && hrsFloat <= 9.0;
        const barColor = isOptimal ? 'bg-sky-400' : (hrsFloat < 7.0 ? 'bg-amber-400' : 'bg-purple-400');

        return `
          <div class="flex-1 flex flex-col items-center justify-end h-full relative z-10 group" style="${is30d ? 'min-width: 24px;' : ''}">
            <span class="text-[10px] font-mono text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity mb-1">${hrsFloat.toFixed(1)}h</span>
            <div class="w-full max-w-[20px] sm:max-w-[28px] ${barColor} rounded-t-lg transition-all" style="height: ${barHeightPct}%"></div>
          </div>
        `;
      }).join('')}
    `;

    habitsSleepDaysRow.innerHTML = days.map(d => {
      const [, , dayNum] = d.split('-');
      const isToday = d === todayStr;
      return `<div class="flex-1 text-center font-mono ${isToday ? 'text-sky-400 font-bold underline' : 'text-slate-400 text-[10px]'}" style="${is30d ? 'min-width: 24px;' : ''}">${dayNum}</div>`;
    }).join('');

    if (habitsSleepScrollWrap) {
      if (is30d) {
        requestAnimationFrame(() => {
          habitsSleepScrollWrap.scrollLeft = habitsSleepScrollWrap.scrollWidth;
        });
      } else {
        habitsSleepScrollWrap.scrollLeft = 0;
      }
    }

    // 2. Sleep Schedule Log Table
    if (valSleepSchedulePeriodLabel) {
      if (!is30d) {
        valSleepSchedulePeriodLabel.textContent = 'Last 7 Days';
      } else {
        valSleepSchedulePeriodLabel.textContent = isSleepTableExpanded ? 'All 30 Days (Expanded)' : 'Recent 7 Days (30D Mode)';
      }
    }

    if (wrapSleepTableExpand) {
      if (is30d) {
        wrapSleepTableExpand.classList.remove('hidden');
        if (btnToggleSleepTableExpand) {
          btnToggleSleepTableExpand.innerHTML = isSleepTableExpanded
            ? 'Show Recent 7 Days ↑'
            : 'Show All 30 Days (Expand) ↓';
        }
      } else {
        wrapSleepTableExpand.classList.add('hidden');
      }
    }

    const tableDays = is30d
      ? (isSleepTableExpanded ? [...days].reverse() : days.slice(-7).reverse())
      : [...days].reverse();

    habitsSleepScheduleBody.innerHTML = tableDays.map(d => {
      const rec = habitsData.dailyRecords[d] || { bedtimeRaw: sampleBedtime, wakeupRaw: sampleWakeup, sleepMinutes: 465, sunlightDone: false };
      const sHrs = ((rec.sleepMinutes || 465) / 60).toFixed(1);
      const isOptimal = rec.sleepMinutes >= 420 && rec.sleepMinutes <= 540;

      return `
        <tr>
          <td class="py-2.5 px-1 text-slate-300 font-medium">${formatDisplayDate(d)}</td>
          <td class="text-center py-2.5 px-1 text-slate-400">${formatTime12h(rec.bedtimeRaw || sampleBedtime)}</td>
          <td class="text-center py-2.5 px-1 text-slate-400">${formatTime12h(rec.wakeupRaw || sampleWakeup)}</td>
          <td class="text-center py-2.5 px-1 font-bold ${isOptimal ? 'text-emerald-400' : 'text-amber-400'}">${sHrs} hrs</td>
          <td class="text-center py-2.5 px-1 text-xs">${rec.sunlightDone ? '☀️ Yes' : '—'}</td>
        </tr>
      `;
    }).join('');

    // 3. Reading Analytics
    const avgPages = Math.round(totalPagesRange / (count || 1));
    valAvgPagesPerDay.textContent = `Avg: ${avgPages} pages / day`;

    if (habitsReadingBarsContainer && habitsReadingDaysRow) {
      if (is30d) {
        habitsReadingBarsContainer.style.minWidth = '960px';
        habitsReadingDaysRow.style.minWidth = '960px';
      } else {
        habitsReadingBarsContainer.style.minWidth = '100%';
        habitsReadingDaysRow.style.minWidth = '100%';
      }
    }

    const MAX_PAGE_SCALE = 50;
    habitsReadingBarsContainer.innerHTML = days.map(d => {
      const rec = habitsData.dailyRecords[d] || { pagesRead: 15 };
      const pCount = rec.pagesRead || 0;
      const barHeightPct = Math.min(100, Math.max(6, Math.round((pCount / MAX_PAGE_SCALE) * 100)));

      return `
        <div class="flex-1 flex flex-col items-center justify-end h-full relative z-10 group" style="${is30d ? 'min-width: 24px;' : ''}">
          <span class="text-[10px] font-mono text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity mb-1">${pCount}p</span>
          <div class="w-full max-w-[20px] sm:max-w-[28px] bg-amber-400 rounded-t-lg transition-all" style="height: ${barHeightPct}%"></div>
        </div>
      `;
    }).join('');

    habitsReadingDaysRow.innerHTML = days.map(d => {
      const [, , dayNum] = d.split('-');
      const isToday = d === todayStr;
      return `<div class="flex-1 text-center font-mono ${isToday ? 'text-amber-400 font-bold underline' : 'text-slate-400 text-[10px]'}" style="${is30d ? 'min-width: 24px;' : ''}">${dayNum}</div>`;
    }).join('');

    if (habitsReadingScrollWrap) {
      if (is30d) {
        requestAnimationFrame(() => {
          habitsReadingScrollWrap.scrollLeft = habitsReadingScrollWrap.scrollWidth;
        });
      } else {
        habitsReadingScrollWrap.scrollLeft = 0;
      }
    }

    // Active Books in Analytics
    habitsAnalyticsBooksList.innerHTML = (habitsData.reading.books || []).map(b => {
      const bPct = Math.min(100, Math.round(((b.currentPage || 0) / (b.totalPages || 1)) * 100));
      return `
        <div class="p-3 rounded-xl bg-[#0d131f] border border-white/[0.04] space-y-1.5">
          <div class="flex justify-between items-center text-xs">
            <span class="text-white font-bold truncate pr-2">${escapeHtml(b.title)}</span>
            <span class="text-amber-400 font-bold shrink-0">${b.currentPage || 0} / ${b.totalPages} (${bPct}%)</span>
          </div>
          <div class="progress-track h-2 bg-white/10 rounded-full overflow-hidden">
            <div class="progress-fill bg-amber-400" style="width: ${bPct}%"></div>
          </div>
        </div>
      `;
    }).join('');

    // 4. Disciplines & Keystone Matrix
    habitsKeystoneHeaderRow.innerHTML = `
      <th class="text-left py-2 px-1 font-semibold text-slate-400">Discipline</th>
      ${days.map(d => {
        const [, , dayNum] = d.split('-');
        return `<th class="text-center py-2 px-1 font-semibold">${dayNum}</th>`;
      }).join('')}
    `;

    const disciplines = [
      { id: 'clean', label: '🛡️ Clean Detox' },
      { id: 'bed', label: '🛏️ Made Bed' },
      { id: 'room', label: '🧹 Room Reset' },
      { id: 'sun', label: '☀️ 10m Sun' }
    ];

    habitsKeystoneBodyRows.innerHTML = disciplines.map(disc => {
      return `
        <tr>
          <td class="py-2.5 px-1 font-medium text-slate-300 truncate">${disc.label}</td>
          ${days.map(d => {
            const rec = habitsData.dailyRecords[d] || { cleanDay: true, bedMade: true, roomReset: true, sunlightDone: true };
            let isMet = false;
            if (disc.id === 'clean') isMet = !!rec.cleanDay;
            if (disc.id === 'bed') isMet = !!rec.bedMade;
            if (disc.id === 'room') isMet = !!rec.roomReset;
            if (disc.id === 'sun') isMet = !!rec.sunlightDone;

            const mark = isMet ? '✓' : '✕';
            const cellClass = isMet ? 'adherence-full' : 'adherence-none';
            return `<td class="text-center py-2 px-1"><div class="adherence-cell mx-auto ${cellClass}">${mark}</div></td>`;
          }).join('')}
        </tr>
      `;
    }).join('');

    const keystoneWrap = habitsKeystoneHeaderRow ? habitsKeystoneHeaderRow.closest('.overflow-x-auto') : null;
    if (keystoneWrap && is30d) {
      requestAnimationFrame(() => {
        keystoneWrap.scrollLeft = keystoneWrap.scrollWidth;
      });
    }
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
    const activeBook = (habitsData.reading.books || []).find(b => b.id === habitsData.reading.activeBookId) || { title: 'Technical Book' };

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
      bookTitle: activeBook.title,
      pagesRead: habitsData.reading.pagesReadToday || 0,
      bedMade: habitsData.keystones.bedMade,
      roomReset: habitsData.keystones.roomReset
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
    // Domain Switching
    if (btnHeaderOverview) {
      btnHeaderOverview.addEventListener('click', () => {
        if (currentDomain === 'overview') {
          switchDomain(lastActionDomain || 'move');
        } else {
          switchDomain('overview');
        }
      });
    }
    if (btnNavMove) btnNavMove.addEventListener('click', () => switchDomain('move'));
    if (btnNavFocus) btnNavFocus.addEventListener('click', () => switchDomain('focus'));
    if (btnNavHabits) btnNavHabits.addEventListener('click', () => switchDomain('habits'));

    // Overview Sub-view Switching
    if (subViewOverviewToday) subViewOverviewToday.addEventListener('click', () => switchOverviewSubView('today'));
    if (subViewOverviewWeek) subViewOverviewWeek.addEventListener('click', () => switchOverviewSubView('week'));

    // Sidebar Navigation Drawer Controls
    function openSidebar() {
      if (appSidebar) appSidebar.classList.add('sidebar-open');
      if (sidebarOverlay) sidebarOverlay.classList.add('overlay-open');
      triggerHaptic(8, 450);
    }

    function closeSidebar() {
      if (appSidebar) appSidebar.classList.remove('sidebar-open');
      if (sidebarOverlay) sidebarOverlay.classList.remove('overlay-open');
    }

    if (btnOpenSidebar) btnOpenSidebar.addEventListener('click', openSidebar);
    if (btnCloseSidebar) btnCloseSidebar.addEventListener('click', closeSidebar);
    if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebar);

    if (sidebarNavOverview) {
      sidebarNavOverview.addEventListener('click', () => {
        switchDomain('overview');
        closeSidebar();
      });
    }
    if (sidebarNavLibrary) {
      sidebarNavLibrary.addEventListener('click', () => {
        switchDomain('library');
        closeSidebar();
      });
    }
    if (sidebarBtnProtocols) {
      sidebarBtnProtocols.addEventListener('click', () => {
        closeSidebar();
        if (modalScienceProtocols) modalScienceProtocols.classList.remove('hidden');
        triggerHaptic(8, 500);
      });
    }

    // Protocols Compendium Modal Close
    if (btnCloseProtocolsModal) btnCloseProtocolsModal.addEventListener('click', () => modalScienceProtocols.classList.add('hidden'));
    if (btnDismissProtocols) btnDismissProtocols.addEventListener('click', () => modalScienceProtocols.classList.add('hidden'));

    // Date Navigation
    btnPrevDay.addEventListener('click', () => {
      selectedDateStr = offsetDate(selectedDateStr, -1);
      renderDateDisplay();
      renderMetrics();
      renderTimeline();
      renderFocusDashboard();
      renderFocusAnalytics();
      renderHabitsDashboard();
      renderHabitsAnalytics();
      renderOverviewDashboard();
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
      renderHabitsAnalytics();
      renderOverviewDashboard();
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
      renderHabitsAnalytics();
      renderOverviewDashboard();
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
        renderHabitsAnalytics();
        renderOverviewDashboard();
      }
    });


    // Wake-up Button & Direct Edit Modal
    btnWakeUp.addEventListener('click', () => {
      const existing = logs.find(i => i.dateStr === selectedDateStr && i.category === 'wake_up');
      if (existing) {
        openEditWakeupModal();
      } else {
        const now = new Date();
        const hh = String(now.getHours()).padStart(2, '0');
        const mm = String(now.getMinutes()).padStart(2, '0');
        addLog({ category: 'wake_up', name: 'Woke Up' });
        inputWakeup.value = `${hh}:${mm}`;
        habitsData.sleep.wakeupRaw = `${hh}:${mm}`;
        saveLocalData();
        postHabitsToServer();
        renderDateDisplay();
        renderHabitsDashboard();
        renderHabitsAnalytics();
      }
    });

    btnEditWakeup.addEventListener('click', openEditWakeupModal);

    function openEditWakeupModal() {
      modalWakeupDateLabel.textContent = formatDisplayDate(selectedDateStr);
      const existing = logs.find(i => i.dateStr === selectedDateStr && i.category === 'wake_up');
      inputModalWakeupTime.value = habitsData.sleep.wakeupRaw || '07:15';
      modalEditWakeup.classList.remove('hidden');
      triggerHaptic(8, 500);
    }

    btnCloseEditWakeupModal.addEventListener('click', () => modalEditWakeup.classList.add('hidden'));

    btnSaveModalWakeup.addEventListener('click', () => {
      const newTime24 = inputModalWakeupTime.value;
      if (!newTime24) return;

      const [hStr, mStr] = newTime24.split(':');
      const d = new Date();
      d.setHours(parseInt(hStr, 10), parseInt(mStr, 10));
      const formatted = formatTime(d);

      let existing = logs.find(i => i.dateStr === selectedDateStr && i.category === 'wake_up');
      if (existing) {
        existing.timeFormatted = formatted;
      } else {
        logs.push({
          id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
          timestamp: d.getTime(),
          dateStr: selectedDateStr,
          timeFormatted: formatted,
          category: 'wake_up',
          name: 'Woke Up'
        });
      }

      inputWakeup.value = newTime24;
      habitsData.sleep.wakeupRaw = newTime24;
      const res = calculateSleep(inputBedtime.value, newTime24);
      habitsData.sleep.sleepDuration = res.durationText;
      habitsData.sleep.isOptimal = res.isOptimal;

      saveLocalData();
      postHabitsToServer();
      modalEditWakeup.classList.add('hidden');
      renderDateDisplay();
      renderTimeline();
      renderHabitsDashboard();
      renderHabitsAnalytics();
      triggerHaptic(15, 650);
      showUndoToast(`Wake-up adjusted to ${formatted}`, 'wakeup_adjust');
    });

    btnClearModalWakeup.addEventListener('click', () => {
      logs = logs.filter(i => !(i.dateStr === selectedDateStr && i.category === 'wake_up'));
      saveLocalData();
      modalEditWakeup.classList.add('hidden');
      renderDateDisplay();
      renderTimeline();
      renderHabitsDashboard();
      renderHabitsAnalytics();
      triggerHaptic(10, 300);
      showUndoToast('Wake-up record removed for this day', 'wakeup_clear');
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

    // Habits Sub-Views
    subViewHabitsToday.addEventListener('click', () => {
      subViewHabitsToday.className = 'spring-btn px-4 py-1.5 rounded-lg text-xs font-bold bg-[#1a2233] text-white border border-white/15';
      subViewHabitsProgress.className = 'spring-btn px-4 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white';
      sectionHabitsTodayView.classList.remove('hidden');
      sectionHabitsProgressView.classList.add('hidden');
      triggerHaptic(8, 500);
    });

    subViewHabitsProgress.addEventListener('click', () => {
      subViewHabitsProgress.className = 'spring-btn px-4 py-1.5 rounded-lg text-xs font-bold bg-[#1a2233] text-white border border-white/15';
      subViewHabitsToday.className = 'spring-btn px-4 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white';
      sectionHabitsTodayView.classList.add('hidden');
      sectionHabitsProgressView.classList.remove('hidden');
      renderHabitsAnalytics();
      triggerHaptic(8, 500);
    });

    // Habits Analytics Range Selector
    btnHabitsPeriod7d.addEventListener('click', () => {
      habitsAnalyticsPeriod = '7d';
      btnHabitsPeriod7d.className = 'px-3 py-1.5 rounded-lg bg-white text-slate-950 font-bold shadow-sm';
      btnHabitsPeriod30d.className = 'px-3 py-1.5 rounded-lg bg-[#1a2233] text-slate-400 hover:text-white border border-white/10';
      renderHabitsAnalytics();
      triggerHaptic(8, 480);
    });

    btnHabitsPeriod30d.addEventListener('click', () => {
      habitsAnalyticsPeriod = '30d';
      btnHabitsPeriod30d.className = 'px-3 py-1.5 rounded-lg bg-white text-slate-950 font-bold shadow-sm';
      btnHabitsPeriod7d.className = 'px-3 py-1.5 rounded-lg bg-[#1a2233] text-slate-400 hover:text-white border border-white/10';
      renderHabitsAnalytics();
      triggerHaptic(8, 480);
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

    // Study Session Receipts & Manual Modal Controls
    if (btnOpenManualSessionModal) {
      btnOpenManualSessionModal.addEventListener('click', openManualSessionModal);
    }
    if (btnCloseManualSessionModal) {
      btnCloseManualSessionModal.addEventListener('click', () => modalManualSession.classList.add('hidden'));
    }
    if (btnCancelManualSession) {
      btnCancelManualSession.addEventListener('click', () => modalManualSession.classList.add('hidden'));
    }
    if (selectManualSessionTask) {
      selectManualSessionTask.addEventListener('change', () => {
        if (selectManualSessionTask.value === 'custom') {
          manualSessionCustomTitleWrap.classList.remove('hidden');
          inputManualSessionCustomTitle.focus();
        } else {
          manualSessionCustomTitleWrap.classList.add('hidden');
        }
      });
    }
    if (inputManualSessionStart) {
      inputManualSessionStart.addEventListener('input', updateManualSessionDurationDisplay);
    }
    if (inputManualSessionEnd) {
      inputManualSessionEnd.addEventListener('input', updateManualSessionDurationDisplay);
    }
    if (btnSaveManualSession) {
      btnSaveManualSession.addEventListener('click', saveManualSession);
    }

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
      renderHabitsAnalytics();
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
      renderHabitsAnalytics();
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
      renderHabitsAnalytics();
      triggerHaptic(15, 600);
      showUndoToast(`Bedtime recorded: ${formatTime(now)}`, 'bedtime_log');
    });

    btnToggleSunlight.addEventListener('click', () => {
      habitsData.sleep.sunlightDone = !habitsData.sleep.sunlightDone;
      saveLocalData();
      postHabitsToServer();
      renderHabitsDashboard();
      renderHabitsAnalytics();
      triggerHaptic(12, 550);
    });

    chkMorningPhone.addEventListener('change', () => {
      habitsData.detox.morningPhoneFree = chkMorningPhone.checked;
      saveLocalData();
      postHabitsToServer();
      renderHabitsAnalytics();
    });

    chkZeroReels.addEventListener('change', () => {
      habitsData.detox.zeroReels = chkZeroReels.checked;
      saveLocalData();
      postHabitsToServer();
      renderHabitsAnalytics();
    });

    chkNoPhoneInBed.addEventListener('change', () => {
      habitsData.detox.noPhoneInBed = chkNoPhoneInBed.checked;
      saveLocalData();
      postHabitsToServer();
      renderHabitsAnalytics();
    });

    // Relapse Modal
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
        renderHabitsAnalytics();
        triggerHaptic(20, 300);
        showUndoToast(`Detox reset logged (${trigger}). Tomorrow is Day 2!`, 'detox_reset');
      });
    });

    // Dedicated Reading Library & Progression Listeners
    if (selectActiveBook) {
      selectActiveBook.addEventListener('change', () => {
        habitsData.reading.activeBookId = selectActiveBook.value;
        const target = (habitsData.reading.books || []).find(b => b.id === selectActiveBook.value);
        if (target && inputStartPage) {
          inputStartPage.value = target.currentPage || 0;
        }
        saveLocalData();
        postHabitsToServer();
        renderHabitsDashboard();
        renderHabitsAnalytics();
        if (currentDomain === 'library') renderLibraryPage();
        triggerHaptic(8, 450);
      });
    }

    if (btnJumpLibraryView) {
      btnJumpLibraryView.addEventListener('click', () => {
        switchDomain('library');
      });
    }

    if (btnBackFromLibrary) {
      btnBackFromLibrary.addEventListener('click', () => {
        switchDomain(lastActionDomain || 'habits');
      });
    }

    function openAddBookModal() {
      if (inputNewBookTitle) inputNewBookTitle.value = '';
      if (inputNewBookAuthor) inputNewBookAuthor.value = '';
      if (inputNewBookTotalPages) inputNewBookTotalPages.value = '';
      if (inputNewBookCurrentPage) inputNewBookCurrentPage.value = '0';
      if (modalAddBook) {
        modalAddBook.classList.remove('hidden');
        if (inputNewBookTitle) inputNewBookTitle.focus();
      }
      triggerHaptic(8, 500);
    }

    if (btnOpenAddBookModalFromLibrary) {
      btnOpenAddBookModalFromLibrary.addEventListener('click', openAddBookModal);
    }

    if (btnCloseAddBookModal) btnCloseAddBookModal.addEventListener('click', () => modalAddBook && modalAddBook.classList.add('hidden'));
    if (btnCancelAddBook) btnCancelAddBook.addEventListener('click', () => modalAddBook && modalAddBook.classList.add('hidden'));

    if (btnSaveNewBook) {
      btnSaveNewBook.addEventListener('click', () => {
        const title = inputNewBookTitle.value.trim();
        const author = inputNewBookAuthor.value.trim();
        const totalPages = parseInt(inputNewBookTotalPages.value, 10);
        const currentPage = parseInt(inputNewBookCurrentPage.value, 10) || 0;

        if (!title || isNaN(totalPages) || totalPages <= 0) {
          alert('Please enter a book title and valid total page count.');
          return;
        }

        const newBook = {
          id: 'book_' + Date.now(),
          title,
          author: author || 'Author',
          totalPages,
          currentPage,
          completed: currentPage >= totalPages
        };

        if (!habitsData.reading.books) habitsData.reading.books = [];
        habitsData.reading.books.push(newBook);
        habitsData.reading.activeBookId = newBook.id;

        saveLocalData();
        postHabitsToServer();
        if (modalAddBook) modalAddBook.classList.add('hidden');
        renderHabitsDashboard();
        renderHabitsAnalytics();
        renderLibraryPage();
        triggerHaptic(15, 650);
        showUndoToast(`Added "${title}" to your library`, newBook.id);
      });
    }

    // Shelf Filters
    if (btnLibraryFilterAll) {
      btnLibraryFilterAll.addEventListener('click', () => {
        libraryFilter = 'all';
        renderLibraryPage();
        triggerHaptic(6, 450);
      });
    }
    if (btnLibraryFilterReading) {
      btnLibraryFilterReading.addEventListener('click', () => {
        libraryFilter = 'reading';
        renderLibraryPage();
        triggerHaptic(6, 450);
      });
    }
    if (btnLibraryFilterCompleted) {
      btnLibraryFilterCompleted.addEventListener('click', () => {
        libraryFilter = 'completed';
        renderLibraryPage();
        triggerHaptic(6, 450);
      });
    }

    // Quick Book Progress Update Modal Listeners
    if (btnCloseUpdateProgressModal) {
      btnCloseUpdateProgressModal.addEventListener('click', () => modalUpdateBookProgress && modalUpdateBookProgress.classList.add('hidden'));
    }
    if (btnCancelUpdateProgress) {
      btnCancelUpdateProgress.addEventListener('click', () => modalUpdateBookProgress && modalUpdateBookProgress.classList.add('hidden'));
    }
    if (btnSaveUpdateProgress) {
      btnSaveUpdateProgress.addEventListener('click', () => {
        if (!editingBookId) return;
        const book = (habitsData.reading.books || []).find(b => b.id === editingBookId);
        if (!book) return;
        const newPage = parseInt(inputModalUpdateCurrentPage.value, 10);
        if (isNaN(newPage) || newPage < 0) {
          alert('Please enter a valid page number (0 or higher).');
          return;
        }
        const cappedPage = Math.min(newPage, book.totalPages);
        book.currentPage = cappedPage;
        book.completed = cappedPage >= book.totalPages;

        if (book.id === habitsData.reading.activeBookId && inputStartPage) {
          inputStartPage.value = cappedPage;
        }

        saveLocalData();
        postHabitsToServer();
        if (modalUpdateBookProgress) modalUpdateBookProgress.classList.add('hidden');
        renderLibraryPage();
        renderHabitsDashboard();
        renderHabitsAnalytics();
        triggerHaptic(15, 600);
        showUndoToast(`Updated "${book.title}" to page ${cappedPage}/${book.totalPages}`, book.id);
      });
    }

    if (btnToggleSleepTableExpand) {
      btnToggleSleepTableExpand.addEventListener('click', () => {
        isSleepTableExpanded = !isSleepTableExpanded;
        renderHabitsAnalytics();
        triggerHaptic(8, 450);
      });
    }

    // Reading Page Logging
    btnStartReadingTimer.addEventListener('click', startReadingTimer);
    btnPauseReadingTimer.addEventListener('click', pauseReadingTimer);

    btnSaveReadingSession.addEventListener('click', () => {
      const start = parseInt(inputStartPage.value, 10) || 0;
      const end = parseInt(inputEndPage.value, 10) || 0;
      const pDiff = Math.max(0, end - start);

      const activeBook = (habitsData.reading.books || []).find(b => b.id === habitsData.reading.activeBookId);
      if (activeBook) {
        activeBook.currentPage = end;
        if (activeBook.currentPage >= activeBook.totalPages) {
          activeBook.completed = true;
        }
      }

      habitsData.reading.pagesReadToday = (habitsData.reading.pagesReadToday || 0) + pDiff;
      habitsData.reading.history.push({
        dateStr: selectedDateStr,
        bookId: habitsData.reading.activeBookId,
        bookTitle: activeBook ? activeBook.title : 'Book',
        start,
        end,
        pages: pDiff
      });

      saveLocalData();
      postHabitsToServer();
      renderHabitsDashboard();
      renderHabitsAnalytics();
      triggerHaptic(15, 680);
      showUndoToast(`Logged +${pDiff} pages of ${activeBook ? activeBook.title : 'Book'}`, 'reading_pages');
    });

    // Keystones
    chkBedMade.addEventListener('change', () => {
      habitsData.keystones.bedMade = chkBedMade.checked;
      saveLocalData();
      postHabitsToServer();
      renderHabitsAnalytics();
      triggerHaptic(8, 520);
    });

    chkRoomReset.addEventListener('change', () => {
      habitsData.keystones.roomReset = chkRoomReset.checked;
      saveLocalData();
      postHabitsToServer();
      renderHabitsAnalytics();
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
            <span class="text-xs text-emerald-400 font-bold font-mono">Verified Daily Ledger</span>
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
          <p class="text-slate-300">• Completed Tasks: ${r.completedTasksCount} Tasks Logged</p>
          <p class="text-slate-300">• Job Applications: ${r.jobApps}/10 Logged</p>
        </div>

        <div class="p-3 rounded-xl bg-[#0d131f] border border-white/[0.06] space-y-1 text-xs">
          <span class="font-bold text-amber-400 uppercase tracking-wide block font-mono text-[11px]">🛡️ Habits & Disciplines</span>
          <p class="text-slate-300">• Sleep Duration: ${r.sleepDuration} (${formatTime12h(r.bedtime)} → ${formatTime12h(r.wakeup)})</p>
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
    link.setAttribute('download', `pulsesync_backup_${getTodayDateStr()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerHaptic(15, 500);
  }

  function exportJSON() {
    const fullBackup = {
      workouts: logs,
      focus: focusData,
      habits: habitsData,
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
    if (confirm(`Reset all workouts, focus tasks and habits for ${selectedDateStr}?`)) {
      logs = logs.filter(i => i.dateStr !== selectedDateStr);
      focusData.tasks = focusData.tasks.filter(i => i.dateStr !== selectedDateStr);
      if (focusData.sessions) focusData.sessions = focusData.sessions.filter(s => s.dateStr !== selectedDateStr);
      if (focusData.dailyHistory) delete focusData.dailyHistory[selectedDateStr];
      if (habitsData.dailyRecords) delete habitsData.dailyRecords[selectedDateStr];
      saveLocalData();
      renderDateDisplay();
      renderMetrics();
      renderTimeline();
      renderFocusDashboard();
      renderFocusAnalytics();
      renderHabitsDashboard();
      renderHabitsAnalytics();
      renderOverviewDashboard();
      triggerHaptic(30, 200);
    }
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
