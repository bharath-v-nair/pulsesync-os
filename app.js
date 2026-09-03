// PulseSync Life OS - Phase 1 Move MVP Engine
(function () {
  'use strict';

  // --- Constants & Storage Keys ---
  const STORAGE_KEY_LOGS = 'pulsesync_logs_v1';
  const STORAGE_KEY_DEFAULTS = 'pulsesync_defaults_v1';

  // --- State ---
  let logs = [];
  let stickyDefaults = {
    pullupReps: 4,
    pushupReps: 10,
    barbellReps: 10,
    selectedLift: 'Squats'
  };
  let undoTimeout = null;
  let lastLoggedId = null;

  // --- DOM Elements ---
  const currentDateDisplay = document.getElementById('currentDateDisplay');
  const metricPullups = document.getElementById('metricPullups');
  const metricPushups = document.getElementById('metricPushups');
  const metricTonnage = document.getElementById('metricTonnage');
  const metricWalks = document.getElementById('metricWalks');

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

  const btnWalkMorning = document.getElementById('btnWalkMorning');
  const btnWalkEvening = document.getElementById('btnWalkEvening');
  const statusWalkMorning = document.getElementById('statusWalkMorning');
  const statusWalkEvening = document.getElementById('statusWalkEvening');
  const btnWakeUp = document.getElementById('btnWakeUp');
  const wakeUpLabel = document.getElementById('wakeUpLabel');

  const timelineContainer = document.getElementById('timelineContainer');
  const timelineList = document.getElementById('timelineList');
  const emptyTimeline = document.getElementById('emptyTimeline');
  const logCount = document.getElementById('logCount');

  const undoToast = document.getElementById('undoToast');
  const undoMessage = document.getElementById('undoMessage');
  const btnUndoAction = document.getElementById('btnUndoAction');
  const toastProgressBar = document.getElementById('toastProgressBar');

  const btnExportCSV = document.getElementById('btnExportCSV');
  const btnExportJSON = document.getElementById('btnExportJSON');
  const btnClearToday = document.getElementById('btnClearToday');

  const tabFocus = document.getElementById('tabFocus');
  const tabHabits = document.getElementById('tabHabits');
  const previewModal = document.getElementById('previewModal');
  const modalIcon = document.getElementById('modalIcon');
  const modalTitle = document.getElementById('modalTitle');
  const modalBody = document.getElementById('modalBody');
  const btnCloseModal = document.getElementById('btnCloseModal');

  // --- Audio / Haptics Sensory Feedback ---
  function playClickAudio(freq = 600, duration = 0.03) {
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
    } catch (e) {
      // Audio autoplay policy fallback
    }
  }

  function triggerHaptic(duration = 15, audioFreq = 600) {
    playClickAudio(audioFreq);
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(duration);
      } catch (e) {}
    }
  }

  // --- Date Formatter Utilities ---
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

  // --- Storage Management ---
  function loadData() {
    try {
      const storedLogs = localStorage.getItem(STORAGE_KEY_LOGS);
      logs = storedLogs ? JSON.parse(storedLogs) : [];

      const storedDefaults = localStorage.getItem(STORAGE_KEY_DEFAULTS);
      if (storedDefaults) {
        stickyDefaults = { ...stickyDefaults, ...JSON.parse(storedDefaults) };
      }
    } catch (err) {
      console.error('Error reading localStorage', err);
      logs = [];
    }
  }

  function saveData() {
    try {
      localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logs));
      localStorage.setItem(STORAGE_KEY_DEFAULTS, JSON.stringify(stickyDefaults));
    } catch (err) {
      console.error('Error writing to localStorage', err);
    }
  }

  // --- Rendering Functions ---
  function renderHeaderDate() {
    const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
    currentDateDisplay.textContent = new Date().toLocaleDateString(undefined, options);
  }

  function renderMetrics() {
    const todayStr = getTodayDateStr();
    const todayLogs = logs.filter(item => item.dateStr === todayStr);

    let totalPullups = 0;
    let totalPushups = 0;
    let totalTonnage = 0;
    let totalWalkKm = 0;
    let morningWalkDone = false;
    let eveningWalkDone = false;
    let wokeUpTime = null;

    todayLogs.forEach(item => {
      if (item.category === 'pullup') totalPullups += (item.reps || 0);
      if (item.category === 'pushup') totalPushups += (item.reps || 0);
      if (item.category === 'barbell') totalTonnage += ((item.reps || 0) * (item.weightKg || 30));
      if (item.category === 'walk') {
        totalWalkKm += (item.distanceKm || 0);
        if (item.name.includes('Morning')) morningWalkDone = true;
        if (item.name.includes('Evening')) eveningWalkDone = true;
      }
      if (item.category === 'wake_up') {
        wokeUpTime = item.timeFormatted;
      }
    });

    metricPullups.textContent = totalPullups;
    metricPushups.textContent = totalPushups;
    metricTonnage.textContent = totalTonnage;
    metricWalks.textContent = totalWalkKm.toFixed(1);

    // Update Walk Buttons Status
    if (morningWalkDone) {
      statusWalkMorning.textContent = 'Completed ✅';
      statusWalkMorning.className = 'text-[10px] text-emerald-400 font-bold';
    } else {
      statusWalkMorning.textContent = 'Tap to log';
      statusWalkMorning.className = 'text-[10px] text-slate-400';
    }

    if (eveningWalkDone) {
      statusWalkEvening.textContent = 'Completed ✅';
      statusWalkEvening.className = 'text-[10px] text-emerald-400 font-bold';
    } else {
      statusWalkEvening.textContent = 'Tap to log';
      statusWalkEvening.className = 'text-[10px] text-slate-400';
    }

    // Update Wake-Up Button
    if (wokeUpTime) {
      wakeUpLabel.textContent = `Woke ${wokeUpTime}`;
      btnWakeUp.classList.add('border-amber-500/50', 'bg-amber-950/40');
    } else {
      wakeUpLabel.textContent = 'Woke Up';
      btnWakeUp.classList.remove('border-amber-500/50', 'bg-amber-950/40');
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
      let icon = '💪';
      let badgeStyle = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      let details = `${item.reps} reps`;

      if (item.category === 'pushup') {
        icon = '🤸';
        badgeStyle = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      } else if (item.category === 'barbell') {
        icon = '🏋️';
        badgeStyle = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
        details = `${item.reps} reps @ 30kg (${item.reps * 30}kg vol)`;
      } else if (item.category === 'walk') {
        icon = '🚶';
        badgeStyle = 'bg-purple-500/10 text-purple-400 border-purple-500/20';
        details = `${item.distanceKm} km completed`;
      } else if (item.category === 'wake_up') {
        icon = '☀️';
        badgeStyle = 'bg-amber-500/10 text-amber-300 border-amber-500/20';
        details = 'Day anchor logged';
      }

      return `
        <div class="timeline-item flex items-center justify-between p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700 transition">
          <div class="flex items-center gap-3">
            <span class="text-xl">${icon}</span>
            <div>
              <div class="flex items-center gap-2">
                <span class="text-xs font-bold text-slate-100">${item.name}</span>
                <span class="text-[9px] px-1.5 py-0.5 rounded border ${badgeStyle} font-mono">${item.timeFormatted}</span>
              </div>
              <p class="text-[11px] text-slate-400 mt-0.5">${details}</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-[10px] text-slate-500 font-mono">${getRelativeTime(item.timestamp)}</span>
            <button data-id="${item.id}" class="btn-delete-log text-slate-500 hover:text-rose-400 p-1.5 rounded-lg tap-target text-xs transition">
              ✕
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Delete buttons
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
    triggerHaptic(15, 750);
    renderMetrics();
    renderTimeline();

    lastLoggedId = newLog.id;
    showUndoToast(`Logged ${newLog.name}`, newLog.id);
  }

  function deleteLog(id) {
    logs = logs.filter(item => item.id !== id);
    saveData();
    triggerHaptic(10, 300);
    renderMetrics();
    renderTimeline();
  }

  // --- Undo Toast System ---
  function showUndoToast(msg, logId) {
    if (undoTimeout) clearTimeout(undoTimeout);

    undoMessage.textContent = msg;
    undoToast.classList.remove('hidden');

    // Reset countdown bar animation
    toastProgressBar.classList.remove('toast-bar');
    void toastProgressBar.offsetWidth; // Force reflow
    toastProgressBar.classList.add('toast-bar');

    btnUndoAction.onclick = () => {
      deleteLog(logId);
      undoToast.classList.add('hidden');
      triggerHaptic(20, 250);
    };

    undoTimeout = setTimeout(() => {
      undoToast.classList.add('hidden');
    }, 5000);
  }

  // --- Export Utilities ---
  function exportCSV() {
    if (logs.length === 0) {
      alert('No workout logs to export yet.');
      return;
    }

    const headers = ['ID', 'Date', 'Time', 'Category', 'Exercise', 'Reps', 'WeightKg', 'DistanceKm'];
    const rows = logs.map(item => [
      item.id,
      item.dateStr,
      item.timeFormatted,
      item.category,
      `"${item.name}"`,
      item.reps || 0,
      item.weightKg || 0,
      item.distanceKm || 0
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
    const todayStr = getTodayDateStr();
    const count = logs.filter(i => i.dateStr === todayStr).length;
    if (count === 0) {
      alert('No logs to reset today.');
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

  // --- Event Listeners ---
  function setupListeners() {
    // Half Pull-ups Stepper
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

    // Barbell Pills Selection
    barbellPills.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        barbellPills.querySelectorAll('button').forEach(b => {
          b.className = 'spring-btn px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800/90 text-slate-300 hover:bg-slate-700 whitespace-nowrap';
        });
        btn.className = 'spring-btn px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 whitespace-nowrap';
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

    // Cardio Walks
    btnWalkMorning.addEventListener('click', () => {
      addLog({
        category: 'walk',
        name: 'Morning 5k Walk',
        distanceKm: 5.0
      });
    });

    btnWalkEvening.addEventListener('click', () => {
      addLog({
        category: 'walk',
        name: 'Evening 5k Walk',
        distanceKm: 5.0
      });
    });

    // Wake Up
    btnWakeUp.addEventListener('click', () => {
      const todayStr = getTodayDateStr();
      const existing = logs.find(i => i.dateStr === todayStr && i.category === 'wake_up');
      if (existing) {
        alert(`Wake-up already logged today at ${existing.timeFormatted}`);
        return;
      }
      addLog({
        category: 'wake_up',
        name: 'Woke Up'
      });
    });

    // Exports & Clear
    btnExportCSV.addEventListener('click', exportCSV);
    btnExportJSON.addEventListener('click', exportJSON);
    btnClearToday.addEventListener('click', clearToday);

    // Modal Previews for Phase 2 & Phase 3
    tabFocus.addEventListener('click', () => {
      modalIcon.textContent = '🧠';
      modalTitle.textContent = 'Phase 2: Focus Engine';
      modalBody.textContent = 'Upcoming in Phase 2: 7-Day Rotating Curriculum (Angular -> .NET -> Full Stack -> SysDesign), Daily 20-Question Queue, Active vs Break Split state machine, and the 45-15 Feynman timebox.';
      previewModal.classList.remove('hidden');
      triggerHaptic(10, 500);
    });

    tabHabits.addEventListener('click', () => {
      modalIcon.textContent = '🛡️';
      modalTitle.textContent = 'Phase 3: Habits & Peer Sync';
      modalBody.textContent = 'Upcoming in Phase 3: Sleep/wake duration, 20m book reading, private dopamine detox clean streaks (anti-porn, anti-media bingeing) with relapse trigger logging, and lean peer pair code.';
      previewModal.classList.remove('hidden');
      triggerHaptic(10, 500);
    });

    btnCloseModal.addEventListener('click', () => {
      previewModal.classList.add('hidden');
    });

    // App Shortcuts URL Handling
    const urlParams = new URLSearchParams(window.location.search);
    const quick = urlParams.get('quick');
    if (quick === 'pullup') {
      setTimeout(() => {
        addLog({
          category: 'pullup',
          name: 'Half Pull-ups',
          reps: stickyDefaults.pullupReps,
          weightKg: 0
        });
      }, 300);
    } else if (quick === 'pushup') {
      setTimeout(() => {
        addLog({
          category: 'pushup',
          name: 'Push-ups',
          reps: stickyDefaults.pushupReps,
          weightKg: 0
        });
      }, 300);
    } else if (quick === 'walk') {
      setTimeout(() => {
        addLog({
          category: 'walk',
          name: '5k Walk',
          distanceKm: 5.0
        });
      }, 300);
    }
  }

  // --- Service Worker Registration ---
  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
          .then(reg => {
            console.log('PulseSync SW registered:', reg.scope);
          })
          .catch(err => {
            console.log('SW registration note:', err);
          });
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
