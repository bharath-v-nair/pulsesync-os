import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  FocusData,
  FocusTask,
  FocusSession,
  FocusTimerState,
  UserFocusConfig,
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
  focusConfig?: UserFocusConfig;
  selectedDate?: string;
  workouts?: any;
  habitsData?: any;
}

export const FocusEngine: React.FC<FocusEngineProps> = ({
  focusData,
  onUpdateFocusData,
  focusConfig,
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
  // Native Wall-Clock Target Architecture & Wake Lock
  // ----------------------------------------------------
  const focusDataRef = useRef(focusData);
  focusDataRef.current = focusData;

  const wakeLockRef = useRef<any>(null);
  const warnedRef = useRef(false);

  const requestWakeLock = async () => {
    try {
      if (typeof navigator !== 'undefined' && 'wakeLock' in navigator && !wakeLockRef.current) {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        wakeLockRef.current.addEventListener('release', () => {
          wakeLockRef.current = null;
        });
      }
    } catch {
      wakeLockRef.current = null;
    }
  };

  const releaseWakeLock = async () => {
    try {
      if (wakeLockRef.current) {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
    } catch {}
  };

  // Compute live remaining seconds directly from hardware clock if running
  const getInitialRemaining = (): number => {
    const ts = focusData.timerState || defaultTimerState;
    if (ts.isRunning && ts.endTimestamp) {
      return Math.max(0, Math.ceil((ts.endTimestamp - Date.now()) / 1000));
    }
    return ts.remainingSeconds ?? ts.totalSeconds ?? 50 * 60;
  };

  const [displayRemaining, setDisplayRemaining] = useState<number>(getInitialRemaining);

  // ----------------------------------------------------
  // Timer Actions
  // ----------------------------------------------------
  // ----------------------------------------------------
  // Timer Actions
  // ----------------------------------------------------
  const handleSelectPreset = (preset: any) => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    releaseWakeLock();

    const configured = focusConfig?.timerPresets?.find((p) => p.id === preset);
    let secs = configured ? configured.studyMinutes * 60 : 50 * 60;
    if (!configured) {
      if (preset === '30m') secs = 30 * 60;
      else if (preset === '60m') secs = 60 * 60;
      else if (preset === '25m') secs = 25 * 60;
      else if (preset === '10m') secs = 10 * 60;
    }

    setDisplayRemaining(secs);

    const updatedTimer: FocusTimerState = {
      ...timerState,
      preset,
      totalSeconds: secs,
      remainingSeconds: secs,
      isRunning: false,
      startTimestamp: null,
      endTimestamp: null,
      lastTickTimestamp: null,
      warningTriggered: false,
    };

    const nextData: FocusData = {
      ...focusData,
      currentSession: null,
      timerState: updatedTimer,
    };
    focusDataRef.current = nextData;
    onUpdateFocusData(nextData);
  };

  const handleBindTask = (taskId: string) => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    releaseWakeLock();

    const now = Date.now();
    let newSessions = [...focusData.sessions];
    let updatedTasks = [...focusData.tasks];
    let newAzureMinutes = focusData.azureMinutes || 0;

    // 1. If timer was running on an existing task, finalize its session receipt & bank elapsed time
    if (timerState.isRunning && focusData.currentSession) {
      const elapsedSec = Math.max(
        1,
        Math.floor((now - (timerState.startTimestamp || focusData.currentSession.startTimestamp)) / 1000)
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

    setDisplayRemaining(secs);

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

    const nextData: FocusData = {
      ...focusData,
      tasks: updatedTasks,
      sessions: newSessions,
      azureMinutes: newAzureMinutes,
      currentSession: null,
      timerState: updatedTimer,
    };
    focusDataRef.current = nextData;
    onUpdateFocusData(nextData);
  };

  const handleUnbindTask = () => {
    const nextData: FocusData = {
      ...focusData,
      timerState: {
        ...timerState,
        boundTaskId: null,
      },
    };
    focusDataRef.current = nextData;
    onUpdateFocusData(nextData);
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

    const durationSec = timerState.remainingSeconds > 0 ? timerState.remainingSeconds : timerState.totalSeconds;
    const endTimestamp = now + durationSec * 1000;

    setDisplayRemaining(durationSec);

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
      endTimestamp,
      endTimeFormatted: format12h(endTimestamp),
      durationSeconds: 0,
    };

    const nextData: FocusData = {
      ...focusData,
      tasks: updatedTasks,
      currentSession: newCurrentSession,
      timerState: {
        ...timerState,
        boundTaskId: targetTaskId,
        isRunning: true,
        remainingSeconds: durationSec,
        startTimestamp: now,
        endTimestamp,
        lastTickTimestamp: now,
      },
    };
    focusDataRef.current = nextData;
    onUpdateFocusData(nextData);
    requestWakeLock();
  };

  const handlePauseTimer = () => {
    const ts = focusDataRef.current.timerState || defaultTimerState;
    if (!ts.isRunning && !focusDataRef.current.currentSession) return;

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    releaseWakeLock();

    const now = Date.now();
    // Hardware wall-clock accurate remaining seconds
    const exactRemaining = ts.endTimestamp
      ? Math.max(0, Math.ceil((ts.endTimestamp - now) / 1000))
      : ts.remainingSeconds;

    // Exact elapsed seconds during this active running bout
    const elapsedThisRunSec = ts.startTimestamp
      ? Math.max(0, Math.floor((now - ts.startTimestamp) / 1000))
      : Math.max(0, ts.remainingSeconds - exactRemaining);

    setDisplayRemaining(exactRemaining);

    let newSessions = [...focusDataRef.current.sessions];
    let azureMinutesToAdd = 0;

    // Finalize current session receipt if it ran for at least 5 seconds
    if (focusDataRef.current.currentSession && elapsedThisRunSec >= 5) {
      const durationMinutes = Math.max(1, Math.round(elapsedThisRunSec / 60));
      const finalized: FocusSession = {
        ...focusDataRef.current.currentSession,
        endTimestamp: now,
        endTimeFormatted: format12h(now),
        durationSeconds: elapsedThisRunSec,
        durationMinutes,
      };
      newSessions.unshift(finalized);
      if (focusDataRef.current.currentSession.bucket === 'azure' && durationMinutes > 0) {
        azureMinutesToAdd = durationMinutes;
      }
    }

    // Accrue elapsed time in this run to bound task:
    let updatedTasks = focusDataRef.current.tasks;
    if (elapsedThisRunSec > 0 && ts.boundTaskId && ts.boundTaskId !== 'AZURE_AI_PRACTICE') {
      updatedTasks = focusDataRef.current.tasks.map((task) => {
        if (task.id === ts.boundTaskId) {
          const updatedActiveSec = (task.activeSeconds || 0) + elapsedThisRunSec;
          return {
            ...task,
            activeSeconds: updatedActiveSec,
            durationMinutes: Math.max(1, Math.round(updatedActiveSec / 60)),
          };
        }
        return task;
      });
    }

    const nextData: FocusData = {
      ...focusDataRef.current,
      azureMinutes: (focusDataRef.current.azureMinutes || 0) + azureMinutesToAdd,
      sessions: newSessions,
      tasks: updatedTasks,
      currentSession: null,
      stats: {
        ...focusDataRef.current.stats,
        totalStudySeconds: focusDataRef.current.stats.totalStudySeconds + elapsedThisRunSec,
      },
      timerState: {
        ...ts,
        remainingSeconds: exactRemaining,
        isRunning: false,
        startTimestamp: null,
        endTimestamp: null,
        lastTickTimestamp: null,
      },
    };
    focusDataRef.current = nextData;
    onUpdateFocusData(nextData);
  };

  const completeActiveTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    releaseWakeLock();

    const now = Date.now();
    const ts = focusDataRef.current.timerState || defaultTimerState;
    const elapsedThisRunSec = ts.startTimestamp
      ? Math.max(0, Math.floor((now - ts.startTimestamp) / 1000))
      : (ts.remainingSeconds || 0);

    setDisplayRemaining(0);

    let newSessions = [...focusDataRef.current.sessions];
    let azureMinutesToAdd = 0;

    if (focusDataRef.current.currentSession) {
      const totalSessionDurationSec = Math.max(
        (focusDataRef.current.currentSession.durationSeconds || 0) + elapsedThisRunSec,
        1
      );
      const durationMinutes = Math.max(1, Math.round(totalSessionDurationSec / 60));
      const finalized: FocusSession = {
        ...focusDataRef.current.currentSession,
        endTimestamp: now,
        endTimeFormatted: format12h(now),
        durationSeconds: totalSessionDurationSec,
        durationMinutes,
      };
      newSessions.unshift(finalized);
      if (focusDataRef.current.currentSession.bucket === 'azure') {
        azureMinutesToAdd = durationMinutes;
      }
    }

    let updatedTasks = focusDataRef.current.tasks;
    if (elapsedThisRunSec > 0 && ts.boundTaskId && ts.boundTaskId !== 'AZURE_AI_PRACTICE') {
      updatedTasks = focusDataRef.current.tasks.map((task) => {
        if (task.id === ts.boundTaskId) {
          const updatedActiveSec = (task.activeSeconds || 0) + elapsedThisRunSec;
          return {
            ...task,
            activeSeconds: updatedActiveSec,
            durationMinutes: Math.max(1, Math.round(updatedActiveSec / 60)),
          };
        }
        return task;
      });
    }

    const nextData: FocusData = {
      ...focusDataRef.current,
      azureMinutes: (focusDataRef.current.azureMinutes || 0) + azureMinutesToAdd,
      sessions: newSessions,
      tasks: updatedTasks,
      currentSession: null,
      stats: {
        ...focusDataRef.current.stats,
        totalStudySeconds: focusDataRef.current.stats.totalStudySeconds + elapsedThisRunSec,
      },
      timerState: {
        ...ts,
        remainingSeconds: ts.totalSeconds,
        isRunning: false,
        startTimestamp: null,
        endTimestamp: null,
        lastTickTimestamp: null,
        warningTriggered: false,
      },
    };
    focusDataRef.current = nextData;
    onUpdateFocusData(nextData);
    setDisplayRemaining(ts.totalSeconds);
  };
  const completeRef = useRef(completeActiveTimer);
  completeRef.current = completeActiveTimer;

  const handleResetTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    releaseWakeLock();

    const now = Date.now();
    const ts = focusDataRef.current.timerState || defaultTimerState;

    // Bank any elapsed time from the running segment if >= 5s
    const elapsedThisRunSec = (ts.isRunning && ts.startTimestamp)
      ? Math.max(0, Math.floor((now - ts.startTimestamp) / 1000))
      : 0;

    let newSessions = [...focusDataRef.current.sessions];
    let azureMinutesToAdd = 0;

    if (focusDataRef.current.currentSession && elapsedThisRunSec >= 5) {
      const durationMinutes = Math.max(1, Math.round(elapsedThisRunSec / 60));
      newSessions.unshift({
        ...focusDataRef.current.currentSession,
        endTimestamp: now,
        endTimeFormatted: format12h(now),
        durationSeconds: elapsedThisRunSec,
        durationMinutes,
      });
      if (focusDataRef.current.currentSession.bucket === 'azure') {
        azureMinutesToAdd = durationMinutes;
      }
    }

    let updatedTasks = focusDataRef.current.tasks;
    if (elapsedThisRunSec >= 5 && ts.boundTaskId && ts.boundTaskId !== 'AZURE_AI_PRACTICE') {
      updatedTasks = focusDataRef.current.tasks.map((task) => {
        if (task.id === ts.boundTaskId) {
          const updatedActiveSec = (task.activeSeconds || 0) + elapsedThisRunSec;
          return {
            ...task,
            activeSeconds: updatedActiveSec,
            durationMinutes: Math.max(1, Math.round(updatedActiveSec / 60)),
          };
        }
        return task;
      });
    }

    const nextData: FocusData = {
      ...focusDataRef.current,
      tasks: updatedTasks,
      sessions: newSessions,
      azureMinutes: (focusDataRef.current.azureMinutes || 0) + azureMinutesToAdd,
      currentSession: null,
      stats: {
        ...focusDataRef.current.stats,
        totalStudySeconds: focusDataRef.current.stats.totalStudySeconds + elapsedThisRunSec,
      },
      timerState: {
        ...ts,
        isRunning: false,
        remainingSeconds: ts.totalSeconds,
        warningTriggered: false,
        startTimestamp: null,
        endTimestamp: null,
        lastTickTimestamp: null,
      },
    };
    focusDataRef.current = nextData;
    onUpdateFocusData(nextData);
    setDisplayRemaining(ts.totalSeconds);
  };

  // Per-second tick loop: calculates remaining time directly from Android/system hardware clock
  useEffect(() => {
    if (!timerState.isRunning || !timerState.endTimestamp) {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      releaseWakeLock();
      return;
    }

    requestWakeLock();
    warnedRef.current = timerState.warningTriggered;

    // Immediate check & alignment on start/resume
    const initialRemaining = Math.max(0, Math.ceil((timerState.endTimestamp - Date.now()) / 1000));
    setDisplayRemaining(initialRemaining);

    if (initialRemaining <= 0) {
      playFeynmanChime();
      triggerHaptic(50);
      completeRef.current();
      return;
    }

    timerIntervalRef.current = setInterval(() => {
      const ts = focusDataRef.current.timerState || defaultTimerState;
      if (!ts.isRunning || !ts.endTimestamp) return;

      const remaining = Math.max(0, Math.ceil((ts.endTimestamp - Date.now()) / 1000));
      setDisplayRemaining(remaining);

      // Early Answer Warning alert
      const configuredWarningMins =
        focusConfig?.timerPresets?.find((p) => p.id === ts.preset)?.warningMinutes ?? 15;
      if (
        ts.totalSeconds >= 20 * 60 &&
        remaining <= configuredWarningMins * 60 &&
        !warnedRef.current
      ) {
        warnedRef.current = true;
        playWarningAlert();
        triggerHaptic(30);
      }

      // Session complete
      if (remaining <= 0) {
        playFeynmanChime();
        triggerHaptic(50);
        completeRef.current();
      }
    }, 1000);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [timerState.isRunning, timerState.endTimestamp, timerState.boundTaskId]);

  // Re-synchronize immediately on screen-on, tab wake-up, or app focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const ts = focusDataRef.current.timerState || defaultTimerState;
        if (ts.isRunning && ts.endTimestamp) {
          requestWakeLock();
          const remaining = Math.max(0, Math.ceil((ts.endTimestamp - Date.now()) / 1000));
          setDisplayRemaining(remaining);
          if (remaining <= 0) {
            playFeynmanChime();
            triggerHaptic(50);
            completeRef.current();
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
      releaseWakeLock();
    };
  }, []);

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
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      releaseWakeLock();
      setDisplayRemaining(timerState.totalSeconds);
      updatedTimerState.boundTaskId = null;
      updatedTimerState.isRunning = false;
      updatedTimerState.remainingSeconds = timerState.totalSeconds;
      updatedTimerState.startTimestamp = null;
      updatedTimerState.endTimestamp = null;
      updatedTimerState.lastTickTimestamp = null;
    }

    const nextData: FocusData = {
      ...focusData,
      tasks: updatedTasks,
      sessions: newSessions,
      currentSession: timerState.boundTaskId === id ? null : focusData.currentSession,
      timerState: updatedTimerState,
      stats: {
        ...focusData.stats,
        completedQuestions: updatedTasks.filter((t) => t.completed && t.bucket !== 'azure').length,
      },
    };
    focusDataRef.current = nextData;
    onUpdateFocusData(nextData);
  };

  const handleCompleteAzurePractice = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    releaseWakeLock();
    setDisplayRemaining(timerState.totalSeconds);

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

    const nextData: FocusData = {
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
    };
    focusDataRef.current = nextData;
    onUpdateFocusData(nextData);
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
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    const now = Date.now();
    const fortyFiveMinutes = 45 * 60;
    const cleanTitle = title?.trim() || 'Azure AI Deliberate Practice';

    requestWakeLock();
    setDisplayRemaining(fortyFiveMinutes);

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

    const nextData: FocusData = {
      ...focusData,
      currentSession: newCurrentSession,
      timerState: updatedTimer,
    };
    focusDataRef.current = nextData;
    onUpdateFocusData(nextData);

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

  // Today's actual study seconds (sum of sessions for today + unbuffered running seconds)
  const todayStudySeconds = useMemo(() => {
    const sessionSecs = focusData.sessions
      .filter((s) => s.dateStr === todayStr)
      .reduce(
        (sum, s) =>
          sum + (s.durationSeconds || (s.durationMinutes ? s.durationMinutes * 60 : 0)),
        0
      );
    const activeSecs =
      timerState.isRunning && timerState.startTimestamp
        ? Math.max(0, Math.floor((Date.now() - timerState.startTimestamp) / 1000))
        : 0;
    return sessionSecs + activeSecs;
  }, [focusData.sessions, todayStr, timerState.isRunning, timerState.startTimestamp, displayRemaining]);

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
        presets={focusConfig?.timerPresets}
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
        totalStudySeconds={todayStudySeconds}
        targetHours={focusConfig?.dailyStudyTargetHours ?? 5.5}
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
