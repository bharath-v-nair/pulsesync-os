import React, { useState, useEffect, useRef } from 'react';
import {
  FocusData,
  FocusTask,
  FocusSession,
  FocusTimerState,
} from '../../types';
import { CurriculumDayBanner } from './CurriculumDayBanner';
import { CurriculumPickerModal } from './CurriculumPickerModal';
import { FeynmanTimerCard } from './FeynmanTimerCard';
import { TodayFocusProgressCard } from './TodayFocusProgressCard';
import { FocusTaskRoster } from './FocusTaskRoster';
import { SpacedRetrievalAccordion } from './SpacedRetrievalAccordion';
import { AccountabilityTrackCard } from './AccountabilityTrackCard';
import { CompletedTasksFeed } from './CompletedTasksFeed';
import { AddTaskModal } from './AddTaskModal';
import { EditCompletedTaskModal } from './EditCompletedTaskModal';
import { LogAzureSessionModal } from './LogAzureSessionModal';
import { EditAzureSessionModal } from './EditAzureSessionModal';
import { triggerHaptic } from '../../hooks/useHaptics';
import { playWarningAlert, playFeynmanChime } from '../../utils/audio';
import { getTodayDateStr } from '../../services/storage';

interface FocusEngineProps {
  focusData: FocusData;
  onUpdateFocusData: (data: FocusData) => void;
  selectedDate?: string;
  workouts?: any;
  habitsData?: any;
}

export const FocusEngine: React.FC<FocusEngineProps> = ({
  focusData,
  onUpdateFocusData,
  selectedDate: _selectedDate = getTodayDateStr(),
}) => {
  // Modals state
  const [isCurriculumPickerOpen, setIsCurriculumPickerOpen] = useState(false);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [editingCompletedTask, setEditingCompletedTask] = useState<FocusTask | null>(null);
  const [isAzureModalOpen, setIsAzureModalOpen] = useState(false);
  const [editingAzureSession, setEditingAzureSession] = useState<FocusSession | null>(null);

  // Local fallback for timer state if not present in focusData
  const defaultTimerState: FocusTimerState = {
    isRunning: false,
    phase: 'study',
    preset: '50m',
    totalSeconds: 50 * 60,
    remainingSeconds: 50 * 60,
    startTimestamp: null,
    endTimestamp: null,
    boundTaskId: null,
    warningTriggered: false,
  };

  const timerState = focusData.timerState || defaultTimerState;
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const todayStr = getTodayDateStr();

  // Self-heal & user-requested reset: clean out legacy fake azure tasks and reset Azure practice to 0
  useEffect(() => {
    const hasResetAzure = localStorage.getItem('ps_azure_clean_reset_v3');
    if (!hasResetAzure) {
      const cleanedSessions = focusData.sessions.filter(
        (s) => s.bucket !== 'azure' && s.category !== 'Azure'
      );
      const cleanedTasks = focusData.tasks.filter(
        (t) => !t.id.startsWith('task_azure_') && t.bucket !== 'azure'
      );
      onUpdateFocusData({
        ...focusData,
        azureMinutes: 0,
        sessions: cleanedSessions,
        tasks: cleanedTasks,
        dailyHistory: {},
      });
      localStorage.setItem('ps_azure_clean_reset_v3', 'true');
    } else if (focusData.dailyHistory?.['2026-09-04']?.studySeconds === 9449) {
      const updatedHistory = { ...(focusData.dailyHistory || {}) };
      delete updatedHistory['2026-09-04'];
      onUpdateFocusData({
        ...focusData,
        dailyHistory: updatedHistory,
      });
    } else if (focusData.tasks.some((t) => t.id.startsWith('task_azure_') || t.bucket === 'azure')) {
      onUpdateFocusData({
        ...focusData,
        tasks: focusData.tasks.filter(
          (t) => !t.id.startsWith('task_azure_') && t.bucket !== 'azure'
        ),
      });
    }
  }, []);

  // Day's tasks for current curriculum day (curriculum interview questions only)
  const currentDayTasks = focusData.tasks.filter(
    (t) =>
      t.curriculumDay === focusData.currentCurriculumDay &&
      !t.id.startsWith('task_azure_') &&
      t.bucket !== 'azure'
  );

  // Bound task reference: supports regular curriculum tasks or virtual Azure AI Practice
  const isAzureBound = timerState.boundTaskId === 'AZURE_AI_PRACTICE';
  const boundTask: FocusTask | null = isAzureBound
    ? {
        id: 'AZURE_AI_PRACTICE',
        title: '☁️ Azure AI Deliberate Practice',
        category: 'Azure',
        bucket: 'azure',
        curriculumDay: focusData.currentCurriculumDay,
        completed: false,
        activeSeconds: (focusData.azureMinutes || 0) * 60,
      }
    : timerState.boundTaskId
    ? focusData.tasks.find((t) => t.id === timerState.boundTaskId) || null
    : null;

  // Format 12-hour timestamp
  const format12h = (ts: number) =>
    new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  // ----------------------------------------------------
  // Timer Actions
  // ----------------------------------------------------
  const handleSelectPreset = (preset: '50m' | '30m' | '60m') => {
    let secs = 50 * 60;
    if (preset === '30m') secs = 30 * 60;
    if (preset === '60m') secs = 60 * 60;

    const updatedTimer: FocusTimerState = {
      ...timerState,
      preset,
      totalSeconds: secs,
      remainingSeconds: secs,
      isRunning: false,
      startTimestamp: null,
      endTimestamp: null,
      warningTriggered: false,
    };

    onUpdateFocusData({
      ...focusData,
      timerState: updatedTimer,
    });
  };

  const handleBindTask = (taskId: string) => {
    const now = Date.now();
    let newSessions = [...focusData.sessions];
    let updatedTasks = [...focusData.tasks];
    let newAzureMinutes = focusData.azureMinutes || 0;

    // 1. If timer was running on an existing task, finalize its session receipt & bank elapsed time
    if (timerState.isRunning && focusData.currentSession) {
      const elapsedSec = Math.max(
        1,
        Math.floor((now - focusData.currentSession.startTimestamp) / 1000)
      );
      const elapsedMins = Math.max(1, Math.round(elapsedSec / 60));

      const finalized: FocusSession = {
        ...focusData.currentSession,
        endTimestamp: now,
        endTimeFormatted: format12h(now),
        durationSeconds: elapsedSec,
        durationMinutes: elapsedMins,
      };
      newSessions.unshift(finalized);

      if (focusData.currentSession.bucket === 'azure') {
        newAzureMinutes += elapsedMins;
      }
    }

    // 2. Lookup new task and choose preset
    const targetTask = focusData.tasks.find((t) => t.id === taskId);
    let preset: '50m' | '30m' | '60m' = '50m';
    if (targetTask) {
      if (targetTask.bucket === 'spaced') preset = '30m';
      else if (targetTask.bucket === 'live' || targetTask.bucket === 'dsa') preset = '60m';
    }

    let secs = 50 * 60;
    if (preset === '30m') secs = 30 * 60;
    if (preset === '60m') secs = 60 * 60;

    // 3. Mark startedAt if not set
    if (targetTask && !targetTask.startedAt) {
      updatedTasks = updatedTasks.map((t) =>
        t.id === taskId ? { ...t, startedAt: format12h(now) } : t
      );
    }

    // 4. Pause the timer on switch so user has full control to press START FOCUS
    const updatedTimer: FocusTimerState = {
      ...timerState,
      boundTaskId: taskId,
      preset,
      totalSeconds: secs,
      remainingSeconds: secs,
      isRunning: false,
      startTimestamp: null,
      endTimestamp: null,
      lastTickTimestamp: null,
      warningTriggered: false,
    };

    onUpdateFocusData({
      ...focusData,
      tasks: updatedTasks,
      sessions: newSessions,
      azureMinutes: newAzureMinutes,
      currentSession: null,
      timerState: updatedTimer,
    });
  };

  const handleUnbindTask = () => {
    onUpdateFocusData({
      ...focusData,
      timerState: {
        ...timerState,
        boundTaskId: null,
      },
    });
  };

  const handleStartTimer = () => {
    // If no bound task, auto-bind the first pending task
    let targetTaskId = timerState.boundTaskId;
    if (!targetTaskId) {
      const pending = currentDayTasks.filter((t) => !t.completed);
      if (pending.length > 0) {
        targetTaskId = pending[0].id;
      }
    }

    const now = Date.now();
    const isAzure = targetTaskId === 'AZURE_AI_PRACTICE';
    const bound = isAzure
      ? null
      : targetTaskId
      ? focusData.tasks.find((t) => t.id === targetTaskId)
      : null;

    // Mark task startedAt if not set
    const updatedTasks = focusData.tasks.map((t) =>
      t.id === targetTaskId && !t.startedAt
        ? { ...t, startedAt: format12h(now) }
        : t
    );

    // Create active session receipt
    const newCurrentSession: FocusSession = {
      id: `sess_${now}_${Math.random().toString(36).substring(2, 7)}`,
      taskId: isAzure ? null : targetTaskId || null,
      taskTitle: isAzure
        ? '☁️ Azure AI Deliberate Practice'
        : bound
        ? bound.title
        : 'Deep Study Session',
      category: isAzure ? 'Azure' : bound ? bound.category : 'General',
      bucket: isAzure ? 'azure' : bound ? bound.bucket : 'deep',
      dateStr: todayStr,
      startTimestamp: now,
      startTimeFormatted: format12h(now),
      endTimestamp: now + timerState.remainingSeconds * 1000,
      endTimeFormatted: format12h(now + timerState.remainingSeconds * 1000),
      durationSeconds: 0,
    };

    onUpdateFocusData({
      ...focusData,
      tasks: updatedTasks,
      currentSession: newCurrentSession,
      timerState: {
        ...timerState,
        boundTaskId: targetTaskId,
        isRunning: true,
        startTimestamp: now,
        endTimestamp: now + timerState.remainingSeconds * 1000,
        lastTickTimestamp: now,
      },
    });
  };

  const handlePauseTimer = () => {
    if (!timerState.isRunning && !focusData.currentSession) return;

    const now = Date.now();
    let newSessions = [...focusData.sessions];
    let azureMinutesToAdd = 0;

    // Finalize current session receipt if it ran for at least 5 seconds
    if (focusData.currentSession) {
      const durationSec = Math.max(
        5,
        Math.floor((now - focusData.currentSession.startTimestamp) / 1000)
      );

      const durationMinutes = Math.max(1, Math.round(durationSec / 60));

      const finalized: FocusSession = {
        ...focusData.currentSession,
        endTimestamp: now,
        endTimeFormatted: format12h(now),
        durationSeconds: durationSec,
        durationMinutes,
      };

      newSessions.unshift(finalized);

      if (focusData.currentSession.bucket === 'azure' && durationMinutes > 0) {
        azureMinutesToAdd = durationMinutes;
      }
    }

    onUpdateFocusData({
      ...focusData,
      azureMinutes: (focusData.azureMinutes || 0) + azureMinutesToAdd,
      sessions: newSessions,
      currentSession: null,
      timerState: {
        ...timerState,
        isRunning: false,
        startTimestamp: null,
        endTimestamp: null,
        lastTickTimestamp: null,
      },
    });
  };

  const handleResetTimer = () => {
    handlePauseTimer();
    onUpdateFocusData({
      ...focusData,
      currentSession: null,
      timerState: {
        ...timerState,
        isRunning: false,
        remainingSeconds: timerState.totalSeconds,
        warningTriggered: false,
        startTimestamp: null,
        endTimestamp: null,
        lastTickTimestamp: null,
      },
    });
  };

  // ----------------------------------------------------
  // Timer Tick Engine — throttled persistence (Stabilization)
  // ----------------------------------------------------
  // Per-second ticks update LOCAL display state only. Accrued study seconds
  // buffer in `pendingSecRef` and flush to root state (=> localStorage) once
  // per FLUSH_INTERVAL_SEC, on pause/stop/complete, on timer-identity change,
  // on tab-hide, and on unmount. Previously each 1s tick rewrote the entire
  // FocusData blob to disk (~3,000 writes per 50m session).
  const FLUSH_INTERVAL_SEC = 60;

  const focusDataRef = useRef(focusData);
  const pendingSecRef = useRef(0);
  const lastTickRef = useRef<number>(Date.now());
  const warnedRef = useRef(false);
  const [displayRemaining, setDisplayRemaining] = useState<number | null>(null);

  // Keep the latest snapshot reachable from the stable 1s interval.
  useEffect(() => {
    focusDataRef.current = focusData;
  });

  // Applies buffered seconds to root state in a SINGLE write.
  const flushAccrual = () => {
    const pending = Math.floor(pendingSecRef.current);
    if (pending <= 0) return;
    pendingSecRef.current = 0;

    const fd = focusDataRef.current;
    const ts = fd.timerState || defaultTimerState;
    const now = Date.now();
    const newRemaining = Math.max(0, ts.remainingSeconds - pending);

    // ACCRUE BUFFERED TIME TO BOUND TASK:
    let updatedTasks = fd.tasks;
    if (ts.boundTaskId && ts.boundTaskId !== 'AZURE_AI_PRACTICE') {
      updatedTasks = fd.tasks.map((task) => {
        if (task.id === ts.boundTaskId) {
          const updatedActiveSec = (task.activeSeconds || 0) + pending;
          return {
            ...task,
            activeSeconds: updatedActiveSec,
            durationMinutes: Math.max(1, Math.round(updatedActiveSec / 60)),
          };
        }
        return task;
      });
    }

    // Update current session receipt duration
    const updatedCurrentSession = fd.currentSession
      ? {
          ...fd.currentSession,
          durationSeconds: fd.currentSession.durationSeconds + pending,
          durationMinutes: Math.round((fd.currentSession.durationSeconds + pending) / 60),
        }
      : null;

    onUpdateFocusData({
      ...fd,
      tasks: updatedTasks,
      currentSession: updatedCurrentSession,
      stats: {
        ...fd.stats,
        totalStudySeconds: fd.stats.totalStudySeconds + pending,
      },
      timerState: {
        ...ts,
        remainingSeconds: newRemaining,
        lastTickTimestamp: now,
        warningTriggered: warnedRef.current || ts.warningTriggered,
      },
    });
    setDisplayRemaining(newRemaining);
  };
  const flushRef = useRef(flushAccrual);
  flushRef.current = flushAccrual;

  // Latest pause handler for the completion path (render-scoped by necessity).
  const pauseRef = useRef(handlePauseTimer);
  pauseRef.current = handlePauseTimer;

  // Per-second LOCAL tick: countdown display + buffer. Zero disk writes here.
  // Wall-clock differential also keeps the countdown honest across background
  // throttling / device sleep (previously the timer froze when throttled).
  useEffect(() => {
    if (!timerState.isRunning) {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      setDisplayRemaining(null);
      return;
    }

    lastTickRef.current = Date.now();
    warnedRef.current = timerState.warningTriggered;
    setDisplayRemaining(timerState.remainingSeconds);

    timerIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.max(0, Math.floor((now - lastTickRef.current) / 1000));
      if (elapsed <= 0) return;
      lastTickRef.current = now;
      pendingSecRef.current += elapsed;

      const ts = focusDataRef.current.timerState || defaultTimerState;
      const pending = Math.floor(pendingSecRef.current);
      const newDisplay = Math.max(0, ts.remainingSeconds - pending);
      setDisplayRemaining(newDisplay);

      // 15-Minute Early Answer Warning alert (persisted on next flush)
      if (
        ts.totalSeconds >= 45 * 60 &&
        newDisplay <= 15 * 60 &&
        !warnedRef.current
      ) {
        warnedRef.current = true;
        playWarningAlert();
        triggerHaptic(30);
      }

      // Session complete: flush the buffer, then finalize via wall-clock pause
      if (newDisplay <= 0) {
        playFeynmanChime();
        triggerHaptic(50);
        flushRef.current();
        pauseRef.current();
        return;
      }

      // Periodic persistence boundary
      if (pending >= FLUSH_INTERVAL_SEC) {
        flushRef.current();
      }
    }, 1000);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [timerState.isRunning, timerState.boundTaskId]);

  // Flush buffered seconds before timer identity changes (preset switch, task
  // bind/unbind, pause/stop, complete), on tab-hide, and on unmount. The flush
  // targets the LATEST snapshot via refs, so it never clobbers fresh updates.
  useEffect(() => {
    const onHidden = () => {
      if (document.visibilityState === 'hidden') {
        flushRef.current();
      }
    };
    document.addEventListener('visibilitychange', onHidden);
    return () => {
      document.removeEventListener('visibilitychange', onHidden);
      flushRef.current();
    };
  }, [timerState.isRunning, timerState.boundTaskId, timerState.totalSeconds]);

  // ----------------------------------------------------
  // Task Actions
  // ----------------------------------------------------
  const handleCheckTask = (id: string) => {
    const now = Date.now();
    let newSessions = [...focusData.sessions];
    let additionalSecs = 0;

    // 1. If currently running on this task, finalize receipt with exact time
    if (timerState.boundTaskId === id && timerState.isRunning && focusData.currentSession) {
      const elapsedSec = Math.max(
        1,
        Math.floor((now - focusData.currentSession.startTimestamp) / 1000)
      );
      additionalSecs = elapsedSec;

      const finalized: FocusSession = {
        ...focusData.currentSession,
        endTimestamp: now,
        endTimeFormatted: format12h(now),
        durationSeconds: elapsedSec,
        durationMinutes: Math.max(1, Math.round(elapsedSec / 60)),
      };
      newSessions.unshift(finalized);
    }

    const updatedTasks = focusData.tasks.map((task) => {
      if (task.id === id) {
        const totalActiveSec = (task.activeSeconds || 0) + additionalSecs;
        // Use real active minutes if actively timed, else default to 1m (or existing durationMinutes if edited)
        const realMinutes = totalActiveSec > 0
          ? Math.max(1, Math.round(totalActiveSec / 60))
          : (task.durationMinutes || 1);

        return {
          ...task,
          completed: true,
          completedAt: format12h(now),
          activeSeconds: totalActiveSec,
          durationMinutes: realMinutes,
        };
      }
      return task;
    });

    // If bound task is completed, unbind and stop timer
    let updatedTimerState = { ...timerState };
    if (timerState.boundTaskId === id) {
      updatedTimerState.boundTaskId = null;
      updatedTimerState.isRunning = false;
      updatedTimerState.remainingSeconds = timerState.totalSeconds;
      updatedTimerState.startTimestamp = null;
      updatedTimerState.endTimestamp = null;
      updatedTimerState.lastTickTimestamp = null;
    }

    onUpdateFocusData({
      ...focusData,
      tasks: updatedTasks,
      sessions: newSessions,
      currentSession: timerState.boundTaskId === id ? null : focusData.currentSession,
      timerState: updatedTimerState,
      stats: {
        ...focusData.stats,
        completedQuestions: updatedTasks.filter((t) => t.completed && t.bucket !== 'azure').length,
      },
    });
  };

  const handleCompleteAzurePractice = () => {
    const now = Date.now();
    let newSessions = [...focusData.sessions];

    if (focusData.currentSession) {
      const durationSec = Math.max(
        1,
        Math.floor((now - focusData.currentSession.startTimestamp) / 1000)
      );
      const durationMinutes = Math.max(1, Math.round(durationSec / 60));

      const finalized: FocusSession = {
        ...focusData.currentSession,
        taskTitle: focusData.currentSession.taskTitle || 'Azure AI Deliberate Practice',
        notes: focusData.currentSession.notes || focusData.currentSession.description,
        description: focusData.currentSession.description || focusData.currentSession.notes,
        endTimestamp: now,
        endTimeFormatted: format12h(now),
        durationSeconds: durationSec,
        durationMinutes,
      };
      newSessions.unshift(finalized);
    }

    const newAzureMinutes = newSessions
      .filter((s) => s.bucket === 'azure' || s.category === 'Azure')
      .reduce(
        (sum, s) =>
          sum + (s.durationMinutes || Math.max(1, Math.round((s.durationSeconds || 0) / 60))),
        0
      );

    onUpdateFocusData({
      ...focusData,
      azureMinutes: newAzureMinutes,
      sessions: newSessions,
      currentSession: null,
      timerState: {
        ...timerState,
        boundTaskId: null,
        isRunning: false,
        remainingSeconds: timerState.totalSeconds,
        startTimestamp: null,
        endTimestamp: null,
        lastTickTimestamp: null,
        warningTriggered: false,
      },
    });
  };

  const handleUpdateCompletedTask = (updatedTask: FocusTask) => {
    const updatedTasks = focusData.tasks.map((task) =>
      task.id === updatedTask.id ? updatedTask : task
    );
    onUpdateFocusData({
      ...focusData,
      tasks: updatedTasks,
    });
  };

  const handleRevertTask = (id: string) => {
    const updatedTasks = focusData.tasks.map((task) =>
      task.id === id ? { ...task, completed: false, completedAt: null } : task
    );

    onUpdateFocusData({
      ...focusData,
      tasks: updatedTasks,
      stats: {
        ...focusData.stats,
        completedQuestions: updatedTasks.filter((t) => t.completed).length,
      },
    });
  };

  const handleDeleteTask = (id: string) => {
    const updatedTasks = focusData.tasks.filter((t) => t.id !== id);
    let updatedTimer = { ...timerState };
    if (timerState.boundTaskId === id) {
      updatedTimer.boundTaskId = null;
    }

    onUpdateFocusData({
      ...focusData,
      tasks: updatedTasks,
      timerState: updatedTimer,
      stats: {
        ...focusData.stats,
        completedQuestions: updatedTasks.filter((t) => t.completed).length,
      },
    });
  };

  const handleAddTask = (
    newTask: Omit<FocusTask, 'id' | 'completed' | 'completedAt' | 'startedAt'>
  ) => {
    const created: FocusTask = {
      ...newTask,
      id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      completed: false,
      completedAt: null,
      startedAt: null,
    };

    onUpdateFocusData({
      ...focusData,
      tasks: [created, ...focusData.tasks],
    });
  };


  // ----------------------------------------------------
  // Accountability & Cloud Track Actions
  // ----------------------------------------------------
  const handleUpdateJobApps = (count: number) => {
    onUpdateFocusData({
      ...focusData,
      jobAppsCount: count,
    });
  };

  const handleCustomAzureSession = (
    mins: number,
    title: string,
    description?: string,
    startTime?: string,
    endTime?: string
  ) => {
    const now = Date.now();
    const durationSeconds = mins * 60;
    const taskTitle = title.trim() || 'Azure AI Deliberate Practice';

    const newSession: FocusSession = {
      id: `sess_az_${now}_${Math.random().toString(36).substring(2, 7)}`,
      taskId: 'AZURE_AI_PRACTICE',
      taskTitle,
      category: 'Azure',
      bucket: 'azure',
      dateStr: todayStr,
      startTimestamp: now - durationSeconds * 1000,
      startTimeFormatted: startTime || format12h(now - durationSeconds * 1000),
      endTimestamp: now,
      endTimeFormatted: endTime || format12h(now),
      durationSeconds,
      durationMinutes: mins,
      notes: description,
      description,
    };

    const newSessions = [newSession, ...focusData.sessions];
    const newAzureMinutes = newSessions
      .filter((s) => s.bucket === 'azure' || s.category === 'Azure')
      .reduce(
        (sum, s) =>
          sum + (s.durationMinutes || Math.max(1, Math.round((s.durationSeconds || 0) / 60))),
        0
      );

    onUpdateFocusData({
      ...focusData,
      azureMinutes: newAzureMinutes,
      sessions: newSessions,
      stats: {
        ...focusData.stats,
        totalStudySeconds: focusData.stats.totalStudySeconds + durationSeconds,
      },
    });
  };

  const handleStartAzureTimer = (title?: string, description?: string) => {
    const now = Date.now();
    const fortyFiveMinutes = 45 * 60;
    const cleanTitle = title?.trim() || 'Azure AI Deliberate Practice';

    const newCurrentSession: FocusSession = {
      id: `sess_az_${now}_${Math.random().toString(36).substring(2, 7)}`,
      taskId: 'AZURE_AI_PRACTICE',
      taskTitle: cleanTitle,
      category: 'Azure',
      bucket: 'azure',
      dateStr: todayStr,
      startTimestamp: now,
      startTimeFormatted: format12h(now),
      endTimestamp: now + fortyFiveMinutes * 1000,
      endTimeFormatted: format12h(now + fortyFiveMinutes * 1000),
      durationSeconds: 0,
      notes: description,
      description,
    };

    const updatedTimer: FocusTimerState = {
      ...timerState,
      boundTaskId: 'AZURE_AI_PRACTICE',
      preset: '50m',
      totalSeconds: fortyFiveMinutes,
      remainingSeconds: fortyFiveMinutes,
      isRunning: true,
      startTimestamp: now,
      endTimestamp: now + fortyFiveMinutes * 1000,
      lastTickTimestamp: now,
      warningTriggered: false,
    };

    onUpdateFocusData({
      ...focusData,
      currentSession: newCurrentSession,
      timerState: updatedTimer,
    });

    // Smoothly scroll to the Feynman Timer card so the user sees it running immediately
    setTimeout(() => {
      const timerEl = document.getElementById('feynman-timer-card');
      if (timerEl) {
        timerEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const handleRevertAzureSession = (sessionId: string) => {
    const target = focusData.sessions.find((s) => s.id === sessionId);
    const durationSeconds =
      target?.durationSeconds || (target?.durationMinutes ? target.durationMinutes * 60 : 0);
    const remainingSessions = focusData.sessions.filter((s) => s.id !== sessionId);

    const newAzureMinutes = remainingSessions
      .filter((s) => s.bucket === 'azure' || s.category === 'Azure')
      .reduce(
        (sum, s) =>
          sum + (s.durationMinutes || Math.max(1, Math.round((s.durationSeconds || 0) / 60))),
        0
      );

    onUpdateFocusData({
      ...focusData,
      azureMinutes: newAzureMinutes,
      sessions: remainingSessions,
      stats: {
        ...focusData.stats,
        totalStudySeconds: Math.max(0, focusData.stats.totalStudySeconds - durationSeconds),
      },
    });
  };

  const handleUpdateAzureSession = (updatedSession: FocusSession) => {
    const prevSession = focusData.sessions.find((s) => s.id === updatedSession.id);
    const prevSecs =
      prevSession?.durationSeconds ||
      (prevSession?.durationMinutes ? prevSession.durationMinutes * 60 : 0);
    const newSecs =
      updatedSession.durationSeconds ||
      (updatedSession.durationMinutes ? updatedSession.durationMinutes * 60 : 0);
    const diffSecs = newSecs - prevSecs;

    const updatedSessions = focusData.sessions.map((s) =>
      s.id === updatedSession.id ? updatedSession : s
    );

    const newAzureMinutes = updatedSessions
      .filter((s) => s.bucket === 'azure' || s.category === 'Azure')
      .reduce(
        (sum, s) =>
          sum + (s.durationMinutes || Math.max(1, Math.round((s.durationSeconds || 0) / 60))),
        0
      );

    onUpdateFocusData({
      ...focusData,
      azureMinutes: newAzureMinutes,
      sessions: updatedSessions,
      stats: {
        ...focusData.stats,
        totalStudySeconds: Math.max(0, focusData.stats.totalStudySeconds + diffSecs),
      },
    });
  };

  // Countdown shown to the user ticks locally every second; persisted state
  // only advances on flush boundaries (see tick engine above).
  const displayTimerState: FocusTimerState =
    timerState.isRunning && displayRemaining !== null
      ? { ...timerState, remainingSeconds: displayRemaining }
      : timerState;

  return (
    <div className="space-y-4 pb-6">
      {/* ZONE 1: Day Navigation Bar */}
      <CurriculumDayBanner
        currentDay={focusData.currentCurriculumDay}
        onSelectDay={(day) =>
          onUpdateFocusData({ ...focusData, currentCurriculumDay: day })
        }
        onOpenPicker={() => setIsCurriculumPickerOpen(true)}
      />

      {/* ZONE 2: Hero Feynman Focus Timer */}
      <FeynmanTimerCard
        timerState={displayTimerState}
        boundTask={boundTask}
        onStart={handleStartTimer}
        onPause={handlePauseTimer}
        onReset={handleResetTimer}
        onSelectPreset={handleSelectPreset}
        onUnbindTask={handleUnbindTask}
        onCompleteActiveTask={() => {
          if (timerState.boundTaskId === 'AZURE_AI_PRACTICE') {
            handleCompleteAzurePractice();
          } else if (timerState.boundTaskId) {
            handleCheckTask(timerState.boundTaskId);
          }
        }}
      />

      {/* ZONE 3: Consolidated Daily Progress Card */}
      <TodayFocusProgressCard
        tasks={currentDayTasks}
        totalStudySeconds={focusData.stats.totalStudySeconds}
      />

      {/* ZONE 4: Clean Task Roster */}
      <FocusTaskRoster
        tasks={currentDayTasks}
        boundTaskId={timerState.boundTaskId}
        onCheckTask={handleCheckTask}
        onBindTask={handleBindTask}
        onDeleteTask={handleDeleteTask}
        onOpenAddTask={() => setIsAddTaskModalOpen(true)}
      />

      {/* Expandable Spaced Retrieval Drawer */}
      <SpacedRetrievalAccordion
        tasks={currentDayTasks}
        boundTaskId={timerState.boundTaskId}
        onCheckTask={handleCheckTask}
        onBindTask={handleBindTask}
        onDeleteTask={handleDeleteTask}
      />

      {/* ZONE 5: Accountability & Cloud Track */}
      <AccountabilityTrackCard
        jobAppsCount={focusData.jobAppsCount || 0}
        azureMinutes={focusData.azureMinutes || 0}
        sessions={focusData.sessions}
        onUpdateJobApps={handleUpdateJobApps}
        onOpenAzureModal={() => setIsAzureModalOpen(true)}
        onStartAzureTimer={handleStartAzureTimer}
        onEditAzureSession={(session) => setEditingAzureSession(session)}
        onRevertAzureSession={handleRevertAzureSession}
      />

      {/* Completed Tasks Feed with Edit and Revert */}
      <CompletedTasksFeed
        tasks={currentDayTasks}
        onRevertTask={handleRevertTask}
        onEditTask={(task) => setEditingCompletedTask(task)}
      />

      {/* Modals */}
      <CurriculumPickerModal
        isOpen={isCurriculumPickerOpen}
        currentDay={focusData.currentCurriculumDay}
        onSelectDay={(day) =>
          onUpdateFocusData({ ...focusData, currentCurriculumDay: day })
        }
        onClose={() => setIsCurriculumPickerOpen(false)}
      />

      <AddTaskModal
        isOpen={isAddTaskModalOpen}
        currentDay={focusData.currentCurriculumDay}
        onClose={() => setIsAddTaskModalOpen(false)}
        onAddTask={handleAddTask}
      />

      {/* Edit Completed Task Modal */}
      <EditCompletedTaskModal
        task={editingCompletedTask}
        isOpen={!!editingCompletedTask}
        onClose={() => setEditingCompletedTask(null)}
        onSave={handleUpdateCompletedTask}
        onDelete={handleDeleteTask}
      />

      {/* Custom Azure AI Practice Session Modal */}
      <LogAzureSessionModal
        isOpen={isAzureModalOpen}
        onClose={() => setIsAzureModalOpen(false)}
        currentAzureMinutes={focusData.azureMinutes || 0}
        sessions={focusData.sessions}
        onAddSession={handleCustomAzureSession}
      />

      {/* Edit Azure AI Practice Session Modal */}
      <EditAzureSessionModal
        isOpen={!!editingAzureSession}
        session={editingAzureSession}
        onClose={() => setEditingAzureSession(null)}
        onSave={handleUpdateAzureSession}
        onDelete={handleRevertAzureSession}
      />
    </div>
  );
};
