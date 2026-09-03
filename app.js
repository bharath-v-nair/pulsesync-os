// PulseSync Life OS - Matte Industrial Move Engine
(function () {
  'use strict';

  // --- Constants & Storage Keys ---
  const STORAGE_KEY_LOGS = 'pulsesync_logs_v2';
  const STORAGE_KEY_DEFAULTS = 'pulsesync_defaults_v2';

  // Targets tailored for 90kg bodyweight + cognitive study load
  const TARGETS = {
    pullups: 20,       // 20 half pull-up reps (GTG)
    pushups: 50,       // 50 push-up reps (micro-sets)
    tonnage: 900,      // 900 kg volume (30 reps @ 30kg)
    steps: 8000        // 8,000 steps (cardio / active recovery)
  };

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
  let undoTimeout = null;
  let lastLoggedId = null;

  // --- DOM Elements ---
  const currentDateDisplay = document.getElementById('currentDateDisplay');
  const overallProgressText = document.getElementById('overallProgressText');

  const metricPullups = document.getElementById('metricPullups');
  const barPullup = document.getElementById('barPullup');

  const metricPushups = document.getElementById('metricPushups');
  const barPushup = document.getElementById('barPushup');

  const metricTonnage = document.getElementById('metricTonnage');
  const barTonnage = document.getElementById('barTonnage');

  const metricSteps = document.getElementById('metricSteps');
  const barSteps = document.getElementById('barSteps');

  // Pull-up Stepper
  const valPullup = document.getElementById('valPullup');
  const btnPullupDec = document.getElementById('btnPullupDec');
  const btnPullupInc = document.getElementById('btnPullupInc');
  const btnPullupLog = document.getElementById('btnPullupLog');

  // Push-up Stepper
  const valPushup = document.getElementById('valPushup');
  const btnPushupDec = document.getElementById('btnPushupDec');
  const btnPushupInc = document.getElementById('btnPushupInc');
  const btnPushupLog = document.getElementById('btnPushupLog');

  // Barbell Module
  const barbellPills = document.getElementById('barbellPills');
  const selectedLiftName = document.getElementById('selectedLiftName');
  const valBarbell = document.getElementById('valBarbell');
  const btnBarbellDec = document.getElementById('btnBarbellDec');
  const btnBarbellInc = document.getElementById('btnBarbellInc');
  const btnBarbellLog = document.getElementById('btnBarbellLog');

  // Cardio: Steps & Elliptical
  const valSteps = document.getElementById('valSteps');
  const btnStepDec = document.getElementById('btnStepDec');
  const btnStepInc = document.getElementById('btnStepInc');
  const btnStepLog = document.getElementById('btnStepLog');

  const valElliptical = document.getElementById('valElliptical');
  const btnEllipticalDec = document.getElementById('btnEllipticalDec');
  const btnEllipticalInc = document.getElementById('btnEllipticalInc');
  const btnEllipticalLog = document.getElementById('btnEllipticalLog');

  // Wake Up Button
  const btnWakeUp = document.getElementById('btnWakeUp');
  const wakeUpLabel = document.getElementById('wakeUpLabel');

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

  // Utilities
  const btnExportCSV = document.getElementById('btnExportCSV');
  const btnExportJSON = document.getElementById('btnExportJSON');
  const btnClearToday = document.getElementById('btnClearToday');

  // Navigation Previews
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
      try {
        navigator.vibrate(duration);
      } catch (e) {}
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

  // --- Storage ---
  function loadData() {
    try {
      const storedLogs = localStorage.getItem(STORAGE_KEY_LOGS);
      logs = storedLogs ? JSON.parse(storedLogs) : [];

      const storedDefaults = localStorage.getItem(STORAGE_KEY_DEFAULTS);
      if (storedDefaults) {
        stickyDefaults = { ...stickyDefaults, ...JSON.parse(storedDefaults) };
      }
    } catch (err) {
      console.error('Error loading data', err);
      logs = [];
    }
  }

  function saveData() {
    try {
      localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logs));
      localStorage.setItem(STORAGE_KEY_DEFAULTS, JSON.stringify(stickyDefaults));
    } catch (err) {
      console.error('Error saving data', err);
    }
  }

  // --- Rendering Functions ---
  function renderHeaderDate() {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    currentDateDisplay.textContent = new Date().toLocaleDateString(undefined, options);
  }

  function renderMetrics() {
    const todayStr = getTodayDateStr();
    const todayLogs = logs.filter(item => item.dateStr === todayStr);

    let totalPullups = 0;
    let totalPushups = 0;
    let totalTonnage = 0;
    let totalSteps = 0;
    let wokeUpTime = null;

    todayLogs.forEach(item => {
      if (item.category === 'pullup') totalPullups += (item.reps || 0);
      if (item.category === 'pushup') totalPushups += (item.reps || 0);
      if (item.category === 'barbell') totalTonnage += ((item.reps || 0) * (item.weightKg || 30));
      if (item.category === 'walk') totalSteps += (item.steps || 0);
      if (item.category === 'elliptical') totalSteps += ((item.minutes || 0) * 120); // ~120 steps/min equivalent
      if (item.category === 'wake_up') wokeUpTime = item.timeFormatted;
    });

    // Update numbers
    metricPullups.textContent = totalPullups;
    metricPushups.textContent = totalPushups;
    metricTonnage.textContent = totalTonnage;
    metricSteps.textContent = totalSteps >= 1000 ? `${(totalSteps / 1000).toFixed(1)}k` : totalSteps;

    // Progress Bar calculations
    const pctPullup = Math.min(100, Math.round((totalPullups / TARGETS.pullups) * 100));
    const pctPushup = Math.min(100, Math.round((totalPushups / TARGETS.pushups) * 100));
    const pctTonnage = Math.min(100, Math.round((totalTonnage / TARGETS.tonnage) * 100));
    const pctSteps = Math.min(100, Math.round((totalSteps / TARGETS.steps) * 100));

    barPullup.style.width = `${pctPullup}%`;
    barPushup.style.width = `${pctPushup}%`;
    barTonnage.style.width = `${pctTonnage}%`;
    barSteps.style.width = `${pctSteps}%`;

    const avgProgress = Math.round((pctPullup + pctPushup + pctTonnage + pctSteps) / 4);
    overallProgressText.textContent = `${avgProgress}% Target Achieved`;

    // Wake-Up button
    if (wokeUpTime) {
      wakeUpLabel.textContent = `Woke ${wokeUpTime}`;
      btnWakeUp.classList.add('border-amber-500/40', 'bg-amber-950/20');
    } else {
      wakeUpLabel.textContent = 'Woke Up';
      btnWakeUp.classList.remove('border-amber-500/40', 'bg-amber-950/20');
    }
  }

  function renderTimeline() {
    const todayStr = getTodayDateStr();
    const todayLogs = logs
      .filter(item => item.dateStr === todayStr)
      .sort((a, b) => b.timestamp - a.timestamp);

    logCount.textContent = `${todayLogs.length} set${todayLogs.length === 1 ? '' : 's'}`;

    if (todayLogs.length === 0) {
      emptyTimeline.classList.remove('hidden');
      timelineList.classList.add('hidden');
      timelineList.innerHTML = '';
      return;
    }

    emptyTimeline.classList.add('hidden');
    timelineList.classList.remove('hidden');

    timelineList.innerHTML = todayLogs.map(item => {
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
            <button data-id="${item.id}" class="btn-delete-log text-slate-500 hover:text-rose-400 p-1 rounded tap-target text-xs transition">
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
      dateStr: getTodayDateStr(),
      timeFormatted: formatTime(now),
      ...entry
    };

    logs.push(newLog);
    saveData();
    triggerHaptic(15, 680);
    renderMetrics();
    renderTimeline();

    lastLoggedId = newLog.id;
    showUndoToast(`Logged ${newLog.name}`, newLog.id);
  }

  function deleteLog(id) {
    logs = logs.filter(item => item.id !== id);
    saveData();
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
    link.setAttribute('download', `pulsesync_${getTodayDateStr()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerHaptic(15, 500);
  }

  function exportJSON() {
    if (logs.length === 0) {
      alert('No logs available to export yet.');
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
    const todayStr = getTodayDateStr();
    const count = logs.filter(i => i.dateStr === todayStr).length;
    if (count === 0) {
      alert('No workouts logged today.');
      return;
    }

    if (confirm(`Reset all ${count} workouts for today?`)) {
      logs = logs.filter(i => i.dateStr !== todayStr);
      saveData();
      triggerHaptic(30, 200);
      renderMetrics();
      renderTimeline();
    }
  }

  // --- Event Listeners Setup ---
  function setupListeners() {
    // Pull-ups Stepper
    btnPullupDec.addEventListener('click', () => {
      if (stickyDefaults.pullupReps > 1) {
        stickyDefaults.pullupReps--;
        saveData();
        updateStepperDisplays();
        triggerHaptic(8, 450);
      }
    });

    btnPullupInc.addEventListener('click', () => {
      stickyDefaults.pullupReps++;
      saveData();
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
        saveData();
        updateStepperDisplays();
        triggerHaptic(8, 450);
      }
    });

    btnPushupInc.addEventListener('click', () => {
      stickyDefaults.pushupReps += 2;
      saveData();
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
        saveData();
        updateStepperDisplays();
        triggerHaptic(10, 550);
      });
    });

    // Barbell Stepper
    btnBarbellDec.addEventListener('click', () => {
      if (stickyDefaults.barbellReps > 1) {
        stickyDefaults.barbellReps = Math.max(1, stickyDefaults.barbellReps - 2);
        saveData();
        updateStepperDisplays();
        triggerHaptic(8, 450);
      }
    });

    btnBarbellInc.addEventListener('click', () => {
      stickyDefaults.barbellReps += 2;
      saveData();
      updateStepperDisplays();
      triggerHaptic(8, 650);
    });

    btnBarbellLog.addEventListener('click', () => {
      addLog({
        category: 'barbell',
        name: `Barbell ${stickyDefaults.selectedLift}`,
        reps: stickyDefaults.barbellReps,
        weightKg: 30
      });
    });

    // Steps Stepper
    btnStepDec.addEventListener('click', () => {
      if (stickyDefaults.stepIncrement > 500) {
        stickyDefaults.stepIncrement = Math.max(500, stickyDefaults.stepIncrement - 500);
        saveData();
        updateStepperDisplays();
        triggerHaptic(8, 450);
      }
    });

    btnStepInc.addEventListener('click', () => {
      stickyDefaults.stepIncrement += 500;
      saveData();
      updateStepperDisplays();
      triggerHaptic(8, 650);
    });

    btnStepLog.addEventListener('click', () => {
      addLog({
        category: 'walk',
        name: 'Walk Steps',
        steps: stickyDefaults.stepIncrement
      });
    });

    // Elliptical Stepper
    btnEllipticalDec.addEventListener('click', () => {
      if (stickyDefaults.ellipticalMins > 5) {
        stickyDefaults.ellipticalMins = Math.max(5, stickyDefaults.ellipticalMins - 5);
        saveData();
        updateStepperDisplays();
        triggerHaptic(8, 450);
      }
    });

    btnEllipticalInc.addEventListener('click', () => {
      stickyDefaults.ellipticalMins += 5;
      saveData();
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
      const todayStr = getTodayDateStr();
      const existing = logs.find(i => i.dateStr === todayStr && i.category === 'wake_up');
      if (existing) {
        alert(`Wake-up already recorded today at ${existing.timeFormatted}`);
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
      modalBody.textContent = 'Upcoming in Phase 2: Add-Task Queue for interview questions, dual-clock Active vs Break Split timer, and 45-15 Feynman timebox with dual chime/flash alerts.';
      previewModal.classList.remove('hidden');
      triggerHaptic(10, 500);
    });

    tabHabits.addEventListener('click', () => {
      modalTitle.textContent = 'Phase 3: Habits & Peer Sync';
      modalBody.textContent = 'Upcoming in Phase 3: Bedtime logging, 20m book reading, private dopamine detox clean streaks (anti-porn, anti-media bingeing), and lean peer pair code.';
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
    loadData();
    renderHeaderDate();
    updateStepperDisplays();
    renderMetrics();
    renderTimeline();
    setupListeners();
    registerServiceWorker();

    setInterval(() => {
      renderTimeline();
    }, 60000);
  }

  init();
})();
