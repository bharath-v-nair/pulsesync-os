// PulseSync Life OS - 7-Day Themed Sprint Protocol & Move Engine
(function () {
  'use strict';

  // --- Constants & Storage Keys ---
  const STORAGE_KEY_LOGS = 'pulsesync_logs_v3';
  const STORAGE_KEY_DEFAULTS = 'pulsesync_defaults_v3';
  const STORAGE_KEY_FOCUS = 'pulsesync_focus_v5';

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
      title: 'Day 1 of 7: Frontend (Angular)',
      subtitle: '20 Concept Qs · 2-3 Live Coding · 2 C# DSA',
      category: 'Angular'
    },
    {
      day: 2,
      title: 'Day 2 of 7: Backend (.NET / C#)',
      subtitle: '20 Concept Qs · 2-3 Live Coding · 2 C# DSA',
      category: '.NET'
    },
    {
      day: 3,
      title: 'Day 3 of 7: Full Stack (Angular + .NET + Azure)',
      subtitle: '20 Concept Qs · 2-3 Azure Live · 2 C# DSA',
      category: 'Full Stack'
    },
    {
      day: 4,
      title: 'Day 4 of 7: Frontend (Angular Spaced Retrieval)',
      subtitle: '10 Deep Block + 10 Repeat Qs · 2-3 Live · 2 DSA',
      category: 'Angular'
    },
    {
      day: 5,
      title: 'Day 5 of 7: Backend (.NET Spaced Retrieval)',
      subtitle: '10 Deep Block + 10 Repeat Qs · 2-3 Live · 2 DSA',
      category: '.NET'
    },
    {
      day: 6,
      title: 'Day 6 of 7: Full Stack & Azure Live',
      subtitle: '20 Concept Qs · 2-3 Azure Live · 2 C# DSA',
      category: 'Full Stack'
    },
    {
      day: 7,
      title: 'Day 7 of 7: System Design & STAR Behavioral',
      subtitle: 'System Design · Projects Review · STAR Stories',
      category: 'SysDesign & STAR'
    }
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
    tasks: [
      {
        id: 'task_d1_1',
        title: 'Angular Signals vs RxJS: Core mental model, fine-grained reactivity, and when to use toSignal()',
        category: 'Angular',
        bucket: 'concept',
        subType: 'deep',
        curriculumDay: 1,
        dateStr: getTodayDateStr(),
        completed: false,
        completedAt: null
      },
      {
        id: 'task_d1_2',
        title: 'OnPush Change Detection: Mental model with immutable inputs vs signal-based leaf updates',
        category: 'Angular',
        bucket: 'concept',
        subType: 'deep',
        curriculumDay: 1,
        dateStr: getTodayDateStr(),
        completed: false,
        completedAt: null
      },
      {
        id: 'task_d1_3',
        title: 'Dependency Injection Hierarchy: root vs component vs EnvironmentInjector & viewProviders',
        category: 'Angular',
        bucket: 'concept',
        subType: 'deep',
        curriculumDay: 1,
        dateStr: getTodayDateStr(),
        completed: false,
        completedAt: null
      },
      {
        id: 'task_d1_4',
        title: 'Control Flow Syntax: @if, @for, @switch vs legacy structural directives performance impact',
        category: 'Angular',
        bucket: 'concept',
        subType: 'deep',
        curriculumDay: 1,
        dateStr: getTodayDateStr(),
        completed: false,
        completedAt: null
      },
      {
        id: 'task_d1_5',
        title: 'RxJS Higher-Order Mapping: switchMap vs mergeMap vs concatMap vs exhaustMap real scenarios',
        category: 'Angular',
        bucket: 'concept',
        subType: 'repeat',
        curriculumDay: 1,
        dateStr: getTodayDateStr(),
        completed: false,
        completedAt: null
      },
      {
        id: 'task_d1_live_1',
        title: 'Live Coding: Build a Typeahead Autocomplete Component using Signals & debounceTime',
        category: 'Angular',
        bucket: 'live',
        subType: 'live',
        curriculumDay: 1,
        dateStr: getTodayDateStr(),
        completed: false,
        completedAt: null
      },
      {
        id: 'task_d1_live_2',
        title: 'Live Coding: Create a Custom Attribute Directive with HostListener & Renderer2',
        category: 'Angular',
        bucket: 'live',
        subType: 'live',
        curriculumDay: 1,
        dateStr: getTodayDateStr(),
        completed: false,
        completedAt: null
      },
      {
        id: 'task_d1_dsa_1',
        title: 'NeetCode DSA (C#): Two Sum (Array / Hash Map O(N))',
        category: 'LeetCode',
        bucket: 'dsa',
        subType: 'dsa',
        curriculumDay: 1,
        dateStr: getTodayDateStr(),
        completed: false,
        completedAt: null
      },
      {
        id: 'task_d1_dsa_2',
        title: 'NeetCode DSA (C#): Valid Anagram (Frequency array / Dictionary)',
        category: 'LeetCode',
        bucket: 'dsa',
        subType: 'dsa',
        curriculumDay: 1,
        dateStr: getTodayDateStr(),
        completed: false,
        completedAt: null
      }
    ],
    timerState: {
      isRunning: false,
      phase: 'study', // 'study' (35m) or 'recall' (10m)
      preset: '45-15',
      totalSeconds: 35 * 60,
      remainingSeconds: 35 * 60,
      startTimestamp: null,
      endTimestamp: null,
      lastTickTimestamp: null,
      boundTaskId: null
    },
    stats: {
      totalStudySeconds: 0
    }
  };

  let activeBucketFilter = 'all';
  let modalSelectedBucket = 'concept';
  let modalSelectedSubType = 'deep';
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

  const valConceptCount = document.getElementById('valConceptCount');
  const barConcept = document.getElementById('barConcept');
  const valConceptSub = document.getElementById('valConceptSub');

  const valLiveCount = document.getElementById('valLiveCount');
  const barLive = document.getElementById('barLive');

  const valDsaCount = document.getElementById('valDsaCount');
  const barDsa = document.getElementById('barDsa');

  const valTotalStudyTime = document.getElementById('valTotalStudyTime');

  const timerPhaseBadge = document.getElementById('timerPhaseBadge');
  const preset4515 = document.getElementById('preset4515');
  const preset255 = document.getElementById('preset255');
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

  // --- Audio / Sensory Alerts ---
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
      feynmanAlarmTitle.textContent = 'Feynman Active Recall Time!';
      feynmanAlarmBody.textContent = 'Deep study block completed! Close notes and explain this topic out loud in plain English.';
      btnDismissAlarm.textContent = 'Start Active Recall (10m)';
    } else {
      feynmanAlarmTitle.textContent = 'Active Recall Complete!';
      feynmanAlarmBody.textContent = 'Concept solidified! Mark this completed and select your next challenge.';
      btnDismissAlarm.textContent = 'Ready for Next Challenge';
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

          if (Array.isArray(serverFocus.tasks)) {
            const taskMap = new Map();
            focusData.tasks.forEach(t => taskMap.set(t.id, t));
            serverFocus.tasks.forEach(t => taskMap.set(t.id, t));
            focusData.tasks = Array.from(taskMap.values());
          }

          if (serverFocus.stats) {
            focusData.stats.totalStudySeconds = Math.max(focusData.stats.totalStudySeconds || 0, serverFocus.stats.totalStudySeconds || 0);
          }

          // Sync Running Timer across devices
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

  // --- Focus Engine Functions (7-Day Themed Sprint Protocol) ---
  function renderFocusDashboard() {
    const currentDayConfig = CURRICULUM_DAYS.find(d => d.day === focusData.currentCurriculumDay) || CURRICULUM_DAYS[0];

    // 1. Curriculum Day Header
    curriculumDayBadge.textContent = currentDayConfig.title;
    curriculumDaySub.textContent = currentDayConfig.subtitle;

    // Filter tasks for this curriculum day
    const dayTasks = focusData.tasks.filter(t => t.curriculumDay === focusData.currentCurriculumDay);
    const completedTasks = dayTasks.filter(t => t.completed);
    const pendingTasks = dayTasks.filter(t => !t.completed);

    // 2. Scorecards: 3 Buckets
    // Bucket 1: 20 Concept Qs (10 Deep + 10 Recall)
    const conceptTasks = dayTasks.filter(t => t.bucket === 'concept');
    const conceptCompleted = conceptTasks.filter(t => t.completed);
    const deepCompleted = conceptTasks.filter(t => t.subType === 'deep' && t.completed).length;
    const repeatCompleted = conceptTasks.filter(t => t.subType === 'repeat' && t.completed).length;

    valConceptCount.textContent = `${conceptCompleted.length}/20`;
    barConcept.style.width = `${Math.min(100, Math.round((conceptCompleted.length / 20) * 100))}%`;
    valConceptSub.textContent = `${deepCompleted}/10 Deep · ${repeatCompleted}/10 Recall`;

    // Bucket 2: 2-3 Live Coding
    const liveTasks = dayTasks.filter(t => t.bucket === 'live');
    const liveCompleted = liveTasks.filter(t => t.completed);
    valLiveCount.textContent = `${liveCompleted.length}/3`;
    barLive.style.width = `${Math.min(100, Math.round((liveCompleted.length / 3) * 100))}%`;

    // Bucket 3: 2 NeetCode DSA
    const dsaTasks = dayTasks.filter(t => t.bucket === 'dsa');
    const dsaCompleted = dsaTasks.filter(t => t.completed);
    valDsaCount.textContent = `${dsaCompleted.length}/2`;
    barDsa.style.width = `${Math.min(100, Math.round((dsaCompleted.length / 2) * 100))}%`;

    // 3. Study Time Today
    const totalSec = focusData.stats.totalStudySeconds || 0;
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    valTotalStudyTime.textContent = `${hrs}h ${String(mins).padStart(2, '0')}m`;

    // 4. Timer UI Update
    updateTimerDisplay();
    if (focusData.timerState.phase === 'study') {
      timerPhaseBadge.textContent = 'Deep Study';
      timerPhaseBadge.className = 'text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-sky-950/60 text-sky-400 border border-sky-800/40 uppercase tracking-wide';
    } else {
      timerPhaseBadge.textContent = 'Active Recall';
      timerPhaseBadge.className = 'text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-amber-950/60 text-amber-300 border border-amber-800/40 uppercase tracking-wide';
    }

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
        boundTaskTitle.textContent = 'Select a task below to focus';
        btnUnbindTask.classList.add('hidden');
        btnTimerCompleteTask.classList.add('hidden');
      }
    } else {
      boundTaskTitle.textContent = 'Select a task below to focus';
      btnUnbindTask.classList.add('hidden');
      btnTimerCompleteTask.classList.add('hidden');
    }

    // 5. Filter & Render Task Queue
    const filteredTasks = pendingTasks.filter(t => {
      if (activeBucketFilter === 'all') return true;
      return t.bucket === activeBucketFilter;
    });

    if (filteredTasks.length === 0) {
      taskListContainer.innerHTML = `
        <div class="text-center py-6 text-slate-500 text-xs font-mono matte-card p-4">
          No pending tasks in this category.<br>Tap <span class="text-white font-bold">+ Add Task</span> to schedule your next question!
        </div>
      `;
    } else {
      taskListContainer.innerHTML = filteredTasks.map(t => {
        const isBound = focusData.timerState.boundTaskId === t.id;

        let badgeLabel = 'Concept Q';
        let badgeStyle = 'text-sky-400 bg-sky-950/40 border-sky-800/40';

        if (t.bucket === 'concept') {
          if (t.subType === 'deep') {
            badgeLabel = '10 Deep Block';
            badgeStyle = 'text-sky-300 bg-sky-950/50 border-sky-800/40';
          } else {
            badgeLabel = '10 Spaced Recall';
            badgeStyle = 'text-purple-300 bg-purple-950/50 border-purple-800/40';
          }
        } else if (t.bucket === 'live') {
          badgeLabel = 'Live Coding';
          badgeStyle = 'text-amber-300 bg-amber-950/50 border-amber-800/40';
        } else if (t.bucket === 'dsa') {
          badgeLabel = 'C# NeetCode DSA';
          badgeStyle = 'text-emerald-300 bg-emerald-950/50 border-emerald-800/40';
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

    // 6. Completed Tasks List with Revert
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

  // --- Wall-Clock Timer ---
  function updateTimerDisplay() {
    const remaining = focusData.timerState.remainingSeconds;
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    timerDisplay.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function setTimerPreset(preset) {
    focusData.timerState.preset = preset;
    if (preset === '45-15') {
      preset4515.className = 'px-2 py-0.5 rounded bg-white/10 text-white font-bold hover:bg-white/20';
      preset255.className = 'px-2 py-0.5 rounded text-slate-400 hover:text-white';
      focusData.timerState.totalSeconds = 35 * 60;
      focusData.timerState.remainingSeconds = 35 * 60;
      timerSubLabel.textContent = '35m Deep Dive → 10m Active Recall';
    } else {
      preset255.className = 'px-2 py-0.5 rounded bg-white/10 text-white font-bold hover:bg-white/20';
      preset4515.className = 'px-2 py-0.5 rounded text-slate-400 hover:text-white';
      focusData.timerState.totalSeconds = 25 * 60;
      focusData.timerState.remainingSeconds = 25 * 60;
      timerSubLabel.textContent = '25m Focus Study Session';
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
        alert('Please add or select a question first before starting study!');
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
      modalBody.textContent = 'Coming in Phase 3: Sleep tracking, 20m book reading, private dopamine detox clean streaks (anti-porn, anti-media bingeing), and lean peer pair code.';
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

    // Focus Timer Controls
    btnTimerStart.addEventListener('click', startTimer);
    btnTimerPause.addEventListener('click', pauseTimer);
    btnTimerReset.addEventListener('click', resetTimer);
    preset4515.addEventListener('click', () => setTimerPreset('45-15'));
    preset255.addEventListener('click', () => setTimerPreset('25-5'));

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
        transitionToPhase('study', 35 * 60);
      }
    });

    // Bucket Filters
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
        modalSelectedSubType = btn.getAttribute('data-subtype');
        triggerHaptic(6, 450);
      });
    });

    btnSaveTask.addEventListener('click', () => {
      const title = inputTaskTitle.value.trim();
      if (!title) {
        alert('Please enter a task or question title.');
        return;
      }

      const currentDayConfig = CURRICULUM_DAYS.find(d => d.day === focusData.currentCurriculumDay) || CURRICULUM_DAYS[0];
      const category = modalSelectedBucket === 'dsa' ? 'LeetCode' : currentDayConfig.category;

      const newTask = {
        id: 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        title,
        category,
        bucket: modalSelectedBucket,
        subType: modalSelectedSubType,
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
      { id: 'tasks', label: 'Curriculum Tasks', target: 20 }
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
