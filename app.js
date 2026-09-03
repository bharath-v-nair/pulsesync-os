// PulseSync Life OS - Refined MOVE Engine with Wi-Fi Sync & 4-Level Architecture
(function () {
  'use strict';

  // --- Constants & Storage Keys ---
  const STORAGE_KEY_LOGS = 'pulsesync_logs_v3';
  const STORAGE_KEY_DEFAULTS = 'pulsesync_defaults_v3';

  // Daily targets for 90kg bodyweight + cognitive interview load
  const TARGETS = {
    pullups: 20,       // 20 half pull-up reps (GTG)
    pushups: 50,       // 50 push-up reps (micro-sets)
    tonnage: 900,      // 900 kg volume (30 reps @ 30kg)
    steps: 8000        // 8,000 steps (cardio / active recovery)
  };

  const BARBELL_EXERCISES = [
    'Squats', 'Overhead Press', 'Bicep Curls', 'Bent Rows', 'RDLs', 'Deadlifts'
  ];

  // --- State ---
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
  let undoTimeout = null;
  let lastLoggedId = null;
  let isBarbellDrawerOpen = false;

  // --- DOM Elements ---
  const syncIndicator = document.getElementById('syncIndicator');
  const serverSyncStatus = document.getElementById('serverSyncStatus');
  const btnWakeUp = document.getElementById('btnWakeUp');
  const wakeUpLabel = document.getElementById('wakeUpLabel');

  // Date Navigation
  const btnPrevDay = document.getElementById('btnPrevDay');
  const btnNextDay = document.getElementById('btnNextDay');
  const btnDateContainer = document.getElementById('btnDateContainer');
  const selectedDateTitle = document.getElementById('selectedDateTitle');
  const btnJumpToday = document.getElementById('btnJumpToday');
  const datePickerInput = document.getElementById('datePickerInput');
  const dateContextSubtitle = document.getElementById('dateContextSubtitle');

  // Sub-Views
  const subViewToday = document.getElementById('subViewToday');
  const subViewProgress = document.getElementById('subViewProgress');
  const sectionTodayView = document.getElementById('sectionTodayView');
  const sectionProgressView = document.getElementById('sectionProgressView');

  // Movement Targets
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

  // Steppers
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

  // Timeline
  const timelineContainer = document.getElementById('timelineContainer');
  const timelineList = document.getElementById('timelineList');
  const emptyTimeline = document.getElementById('emptyTimeline');
  const logCount = document.getElementById('logCount');

  // Toast
  const undoToast = document.getElementById('undoToast');
  const undoMessage = document.getElementById('undoMessage');
  const btnUndoAction = document.getElementById('btnUndoAction');
  const toastProgressBar = document.getElementById('toastProgressBar');

  // Progress View Elements
  const adherenceHeaderRow = document.getElementById('adherenceHeaderRow');
  const adherenceBodyRows = document.getElementById('adherenceBodyRows');
  const exerciseProgressionList = document.getElementById('exerciseProgressionList');

  // Utilities & Previews
  const btnExportCSV = document.getElementById('btnExportCSV');
  const btnExportJSON = document.getElementById('btnExportJSON');
  const btnClearToday = document.getElementById('btnClearToday');

  const tabFocus = document.getElementById('tabFocus');
  const tabHabits = document.getElementById('tabHabits');
  const previewModal = document.getElementById('previewModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalBody = document.getElementById('modalBody');
  const btnCloseModal = document.getElementById('btnCloseModal');

  // --- Audio / Haptics Sensory Feedback ---
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

  function triggerHaptic(duration = 15, audioFreq = 550) {
    playClickAudio(audioFreq);
    if ('vibrate' in navigator) {
      try { navigator.vibrate(duration); } catch (e) {}
    }
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
    const yesterdayStr = offsetDate(todayStr, -1);
    const tomorrowStr = offsetDate(todayStr, 1);

    if (dateStr === todayStr) return 'Today';
    if (dateStr === yesterdayStr) return 'Yesterday';
    if (dateStr === tomorrowStr) return 'Tomorrow';

    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  }

  // --- Storage & Wi-Fi Sync Engine ---
  function loadLocalData() {
    try {
      const storedLogs = localStorage.getItem(STORAGE_KEY_LOGS);
      if (storedLogs) {
        logs = JSON.parse(storedLogs);
      }

      const storedDefaults = localStorage.getItem(STORAGE_KEY_DEFAULTS);
      if (storedDefaults) {
        stickyDefaults = { ...stickyDefaults, ...JSON.parse(storedDefaults) };
      }
    } catch (err) {
      console.error('Error reading localStorage:', err);
    }
  }

  function saveLocalData() {
    try {
      localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logs));
      localStorage.setItem(STORAGE_KEY_DEFAULTS, JSON.stringify(stickyDefaults));
    } catch (err) {
      console.error('Error saving localStorage:', err);
    }
  }

  // Real-Time Local Wi-Fi Sync with Node.js Server
  async function syncWithServer() {
    try {
      const res = await fetch('/api/logs');
      if (res.ok) {
        const serverLogs = await res.json();
        if (Array.isArray(serverLogs)) {
          // Merge server logs with local logs
          const mergedMap = new Map();
          logs.forEach(l => mergedMap.set(l.id, l));
          serverLogs.forEach(l => mergedMap.set(l.id, l));
          logs = Array.from(mergedMap.values());
          saveLocalData();

          // Push merged back if local had more
          if (logs.length > serverLogs.length) {
            await fetch('/api/logs', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(logs)
            });
          }

          syncIndicator.className = 'w-1.5 h-1.5 rounded-full bg-emerald-400';
          serverSyncStatus.textContent = 'Wi-Fi Synced (Live)';
        }
      }
    } catch (err) {
      // Offline / standalone PWA mode
      syncIndicator.className = 'w-1.5 h-1.5 rounded-full bg-slate-500';
      serverSyncStatus.textContent = 'Offline (Local Storage)';
    }

    renderDateDisplay();
    renderMetrics();
    renderTimeline();
  }

  async function postLogToServer(entry) {
    try {
      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      });
    } catch (err) {
      // Silently fall back to localStorage
    }
  }

  async function deleteLogFromServer(id) {
    try {
      await fetch(`/api/logs/${id}`, { method: 'DELETE' });
    } catch (err) {}
  }

  // --- Date Navigation Handlers ---
  function setDate(newDateStr) {
    selectedDateStr = newDateStr;
    renderDateDisplay();
    renderMetrics();
    renderTimeline();
    triggerHaptic(8, 480);
  }

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

  // --- Rendering Functions ---
  function renderMetrics() {
    const dayLogs = logs.filter(item => item.dateStr === selectedDateStr);

    let totalPullups = 0;
    let totalPushups = 0;
    let totalTonnage = 0;
    let totalSteps = 0;
    let wokeUpTime = null;

    // Per barbell lift tracking
    const barbellStats = {};
    BARBELL_EXERCISES.forEach(name => {
      barbellStats[name] = { reps: 0, sets: 0, bestSet: 0 };
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
          barbellStats[lift].bestSet = Math.max(barbellStats[lift].bestSet, reps);
        }
      }
      if (item.category === 'walk') totalSteps += (item.steps || 0);
      if (item.category === 'elliptical') totalSteps += ((item.minutes || 0) * 120);
      if (item.category === 'wake_up') wokeUpTime = item.timeFormatted;
    });

    // Update numbers
    metricPullups.textContent = totalPullups;
    metricPushups.textContent = totalPushups;
    metricTonnage.textContent = totalTonnage;
    metricSteps.textContent = totalSteps >= 1000 ? `${(totalSteps / 1000).toFixed(1)}k` : totalSteps;

    // Progress Bar percentage calculations
    const pctPullup = Math.min(100, Math.round((totalPullups / TARGETS.pullups) * 100));
    const pctPushup = Math.min(100, Math.round((totalPushups / TARGETS.pushups) * 100));
    const pctTonnage = Math.min(100, Math.round((totalTonnage / TARGETS.tonnage) * 100));
    const pctSteps = Math.min(100, Math.round((totalSteps / TARGETS.steps) * 100));

    barPullup.style.width = `${pctPullup}%`;
    barPushup.style.width = `${pctPushup}%`;
    barTonnage.style.width = `${pctTonnage}%`;
    barSteps.style.width = `${pctSteps}%`;

    // Render Barbell Breakdown Grid in Drawer
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

    // Wake-Up Button update
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

    // Attach delete listeners
    document.querySelectorAll('.btn-delete-log').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        deleteLog(id);
      });
    });
  }

  // --- Render Progress View (7D Adherence Matrix & Progression) ---
  function renderProgressView() {
    const todayStr = getTodayDateStr();
    const days = [];
    for (let i = 6; i >= 0; i--) {
      days.push(offsetDate(todayStr, -i));
    }

    // Render Table Header
    adherenceHeaderRow.innerHTML = `
      <th class="text-left py-2 px-1 font-semibold text-slate-400">Target</th>
      ${days.map(d => {
        const [y, m, dayNum] = d.split('-');
        const dateObj = new Date(Number(y), Number(m) - 1, Number(dayNum));
        const dayLabel = dateObj.toLocaleDateString(undefined, { weekday: 'narrow' });
        const isSelected = d === selectedDateStr;
        return `<th class="text-center py-2 px-1 font-semibold ${isSelected ? 'text-sky-400 font-bold' : ''}">${dayLabel}<br><span class="text-[8px] text-slate-600">${dayNum}</span></th>`;
      }).join('')}
    `;

    // Calculate Daily Adherence for the 4 Domains
    const categories = [
      { id: 'pullups', label: 'Pull-ups', target: TARGETS.pullups },
      { id: 'pushups', label: 'Push-ups', target: TARGETS.pushups },
      { id: 'tonnage', label: 'Barbell', target: TARGETS.tonnage },
      { id: 'steps', label: 'Cardio', target: TARGETS.steps }
    ];

    adherenceBodyRows.innerHTML = categories.map(cat => {
      return `
        <tr>
          <td class="py-2 px-1 font-medium text-slate-300">${cat.label}</td>
          ${days.map(d => {
            const dayLogs = logs.filter(l => l.dateStr === d);
            let val = 0;
            dayLogs.forEach(l => {
              if (cat.id === 'pullups' && l.category === 'pullup') val += (l.reps || 0);
              if (cat.id === 'pushups' && l.category === 'pushup') val += (l.reps || 0);
              if (cat.id === 'tonnage' && l.category === 'barbell') val += ((l.reps || 0) * (l.weightKg || 30));
              if (cat.id === 'steps') {
                if (l.category === 'walk') val += (l.steps || 0);
                if (l.category === 'elliptical') val += ((l.minutes || 0) * 120);
              }
            });

            let mark = '✕';
            let cellClass = 'adherence-none';
            if (val >= cat.target) {
              mark = '✓';
              cellClass = 'adherence-full';
            } else if (val > 0) {
              mark = '~';
              cellClass = 'adherence-partial';
            }

            return `
              <td class="text-center py-2 px-1">
                <div class="adherence-cell mx-auto ${cellClass}">${mark}</div>
              </td>
            `;
          }).join('')}
        </tr>
      `;
    }).join('');

    // Render Exercise Progression Summary (Last 7 Days)
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
            <div class="text-xs font-bold text-sky-400">${totalReps} <span class="text-[10px] text-slate-400 font-normal">total reps</span></div>
            <div class="text-[10px] text-slate-500">${totalSets} sets completed</div>
          </div>
        </div>
      `;
    }).filter(Boolean).join('') || '<div class="text-slate-500 py-4 text-center">No exercise history in last 7 days.</div>';
  }

  function updateStepperDisplays() {
    valPullup.textContent = stickyDefaults.pullupReps;
    btnPullupLog.textContent = `LOG (+${stickyDefaults.pullupReps})`;

    valPushup.textContent = stickyDefaults.pushupReps;
    btnPushupLog.textContent = `LOG (+${stickyDefaults.pushupReps})`;

    selectedLiftName.textContent = `${stickyDefaults.selectedLift}:`;
    valBarbell.textContent = stickyDefaults.barbellReps;
    const vol = stickyDefaults.barbellReps * 30;
    btnBarbellLog.textContent = `LOG (${vol}kg)`;

    valSteps.textContent = stickyDefaults.stepIncrement.toLocaleString();
    valElliptical.textContent = `${stickyDefaults.ellipticalMins}m`;
  }

  // --- Action Logging Handlers ---
  function addLog(entry) {
    const now = new Date();
    const newLog = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      timestamp: now.getTime(),
      dateStr: selectedDateStr, // logs to current selected date!
      timeFormatted: formatTime(now),
      ...entry
    };

    logs.push(newLog);
    saveLocalData();
    postLogToServer(newLog);
    triggerHaptic(15, 680);
    renderMetrics();
    renderTimeline();

    lastLoggedId = newLog.id;
    showUndoToast(`Logged ${newLog.name}`, newLog.id);
  }

  function deleteLog(id) {
    logs = logs.filter(item => item.id !== id);
    saveLocalData();
    deleteLogFromServer(id);
    triggerHaptic(10, 240);
    renderMetrics();
    renderTimeline();
  }

  // --- Undo Toast System ---
  function showUndoToast(msg, logId) {
    if (undoTimeout) clearTimeout(undoTimeout);

    undoMessage.textContent = msg;
    undoToast.classList.remove('hidden');

    toastProgressBar.classList.remove('toast-bar');
    void toastProgressBar.offsetWidth;
    toastProgressBar.classList.add('toast-bar');

    btnUndoAction.onclick = () => {
      deleteLog(logId);
      undoToast.classList.add('hidden');
      triggerHaptic(20, 220);
    };

    undoTimeout = setTimeout(() => {
      undoToast.classList.add('hidden');
    }, 5000);
  }

  // --- Export Utilities ---
  function exportCSV() {
    if (logs.length === 0) {
      alert('No logs available to export yet.');
      return;
    }

    const headers = ['ID', 'Date', 'Time', 'Category', 'Exercise', 'Reps', 'WeightKg', 'Steps', 'Minutes'];
    const rows = logs.map(item => [
      item.id,
      item.dateStr,
      item.timeFormatted,
      item.category,
      `"${item.name}"`,
      item.reps || 0,
      item.weightKg || 0,
      item.steps || 0,
      item.minutes || 0
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `pulsesync_workouts_${getTodayDateStr()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerHaptic(15, 500);
  }

  function exportJSON() {
    if (logs.length === 0) {
      alert('No workout logs to export yet.');
      return;
    }

    const jsonStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', jsonStr);
    link.setAttribute('download', `pulsesync_backup_${getTodayDateStr()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerHaptic(15, 500);
  }

  function clearToday() {
    const count = logs.filter(i => i.dateStr === selectedDateStr).length;
    if (count === 0) {
      alert(`No workouts logged for ${selectedDateStr}.`);
      return;
    }

    if (confirm(`Reset all ${count} workouts for ${selectedDateStr}?`)) {
      const toDelete = logs.filter(i => i.dateStr === selectedDateStr);
      logs = logs.filter(i => i.dateStr !== selectedDateStr);
      saveLocalData();
      toDelete.forEach(item => deleteLogFromServer(item.id));
      triggerHaptic(30, 200);
      renderMetrics();
      renderTimeline();
    }
  }

  // --- Event Listeners Setup ---
  function setupListeners() {
    // Date Navigation
    btnPrevDay.addEventListener('click', () => {
      setDate(offsetDate(selectedDateStr, -1));
    });

    btnNextDay.addEventListener('click', () => {
      setDate(offsetDate(selectedDateStr, 1));
    });

    btnJumpToday.addEventListener('click', () => {
      setDate(getTodayDateStr());
    });

    btnDateContainer.addEventListener('click', () => {
      try {
        datePickerInput.showPicker();
      } catch (e) {
        datePickerInput.click();
      }
    });

    datePickerInput.addEventListener('change', (e) => {
      if (e.target.value) {
        setDate(e.target.value);
      }
    });

    // Sub-view Switcher
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

    // Barbell Drawer Toggle
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

    // Pull-ups Stepper
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
      addLog({
        category: 'pullup',
        name: 'Half Pull-ups',
        reps: stickyDefaults.pullupReps,
        weightKg: 0
      });
    });

    // Push-ups Stepper
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
      addLog({
        category: 'pushup',
        name: 'Push-ups',
        reps: stickyDefaults.pushupReps,
        weightKg: 0
      });
    });

    // Barbell Pills
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

    // Barbell Stepper
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
      addLog({
        category: 'barbell',
        name: `Barbell ${stickyDefaults.selectedLift}`,
        liftName: stickyDefaults.selectedLift,
        reps: stickyDefaults.barbellReps,
        weightKg: 30
      });
    });

    // Steps Stepper
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
      addLog({
        category: 'walk',
        name: 'Outdoor Walk',
        steps: stickyDefaults.stepIncrement
      });
    });

    // Elliptical Stepper
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
      addLog({
        category: 'elliptical',
        name: 'Elliptical / Cycle',
        minutes: stickyDefaults.ellipticalMins
      });
    });

    // Wake Up
    btnWakeUp.addEventListener('click', () => {
      const existing = logs.find(i => i.dateStr === selectedDateStr && i.category === 'wake_up');
      if (existing) {
        alert(`Wake-up already logged for ${selectedDateStr} at ${existing.timeFormatted}`);
        return;
      }
      addLog({
        category: 'wake_up',
        name: 'Woke Up'
      });
    });

    // Export & Clear
    btnExportCSV.addEventListener('click', exportCSV);
    btnExportJSON.addEventListener('click', exportJSON);
    btnClearToday.addEventListener('click', clearToday);

    // Modal Previews
    tabFocus.addEventListener('click', () => {
      modalTitle.textContent = 'Phase 2: Focus Engine';
      modalBody.textContent = 'Coming in Phase 2: Add-Task Queue for interview questions, dual-clock Active vs Break Split timer, and 45-15 Feynman timebox with dual chime/flash alerts.';
      previewModal.classList.remove('hidden');
      triggerHaptic(10, 500);
    });

    tabHabits.addEventListener('click', () => {
      modalTitle.textContent = 'Phase 3: Habits & Peer Sync';
      modalBody.textContent = 'Coming in Phase 3: Bedtime logging, 20m book reading, private dopamine detox clean streaks (anti-porn, anti-media bingeing), and lean peer pair code.';
      previewModal.classList.remove('hidden');
      triggerHaptic(10, 500);
    });

    btnCloseModal.addEventListener('click', () => {
      previewModal.classList.add('hidden');
    });
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

  // --- Initialization ---
  function init() {
    loadLocalData();
    updateStepperDisplays();
    setupListeners();
    registerServiceWorker();

    // Perform initial sync with server
    syncWithServer();

    // Auto-refresh sync every 15 seconds
    setInterval(() => {
      syncWithServer();
    }, 15000);
  }

  init();
})();
