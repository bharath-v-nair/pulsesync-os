import React, { useState, useEffect } from 'react';
import { 
  AppTab, 
  ActiveView, 
  WorkoutLog, 
  StickyDefaults, 
  FocusData, 
  HabitsData, 
  Book 
} from './types';
import { StorageService, getTodayDateStr, formatTime } from './services/storage';
import { Header } from './components/layout/Header';
import { BottomNav } from './components/layout/BottomNav';
import { SidebarDrawer } from './components/layout/SidebarDrawer';
import { MoveEngine } from './components/move/MoveEngine';
import { FocusEngine } from './components/focus/FocusEngine';
import { HabitsEngine } from './components/habits/HabitsEngine';
import { LibraryView } from './components/library/LibraryView';
import { OverviewView } from './components/overview/OverviewView';
import { ProtocolsGuideModal } from './components/overview/ProtocolsGuideModal';
import { ProtocolSidebar } from './components/habits/ProtocolSidebar';
import { X } from 'lucide-react';
import { triggerHaptic } from './hooks/useHaptics';
import { UndoToast } from './components/ui/UndoToast';

export const App: React.FC = () => {
  // Navigation State
  const [activeTab, setActiveTab] = useState<AppTab>('move');
  const [activeView, setActiveView] = useState<ActiveView>('move');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProtocolsGuideOpen, setIsProtocolsGuideOpen] = useState(false);
  const [isHabitsProtocolOpen, setIsHabitsProtocolOpen] = useState(false);
  const [habitsProtocolSection, setHabitsProtocolSection] = useState('sleep');

  const handleOpenHabitsProtocol = (section: string = 'sleep') => {
    setHabitsProtocolSection(section);
    setIsHabitsProtocolOpen(true);
  };

  // App Domain State
  const [selectedDate, setSelectedDate] = useState<string>(() => getTodayDateStr());
  const [workouts, setWorkouts] = useState<WorkoutLog[]>(() => StorageService.getWorkouts());
  const [stickyDefaults, setStickyDefaults] = useState<StickyDefaults>(() => StorageService.getStickyDefaults());
  const [focusData, setFocusData] = useState<FocusData>(() => StorageService.getFocusData());
  const [habitsData, setHabitsData] = useState<HabitsData>(() => StorageService.getHabitsData());

  // Undo Toast State
  const [undoToast, setUndoToast] = useState<{
    message: string;
    action: () => void;
  } | null>(null);

  // Past Day Banner Dismissal State
  const [isPastDayBannerDismissed, setIsPastDayBannerDismissed] = useState(false);

  useEffect(() => {
    setIsPastDayBannerDismissed(false);
  }, [selectedDate]);

  // Synchronize state changes to Local-First Storage
  useEffect(() => {
    StorageService.saveWorkouts(workouts);
  }, [workouts]);

  useEffect(() => {
    StorageService.saveStickyDefaults(stickyDefaults);
  }, [stickyDefaults]);

  useEffect(() => {
    StorageService.saveFocusData(focusData);
  }, [focusData]);

  useEffect(() => {
    StorageService.saveHabitsData(habitsData);
  }, [habitsData]);

  // Tab navigation handler
  const handleSelectTab = (tab: AppTab) => {
    setActiveTab(tab);
    setActiveView(tab);
  };

  // Toggle Overview View
  const handleToggleOverview = () => {
    if (activeView === 'overview') {
      setActiveView(activeTab);
    } else {
      setActiveView('overview');
    }
  };

  // Move Actions
  const handleLogWorkout = (
    log: Omit<WorkoutLog, 'id' | 'timestamp' | 'dateStr' | 'timeFormatted'> & {
      dateStr?: string;
      timeFormatted?: string;
    }
  ) => {
    const targetDate = log.dateStr || getTodayDateStr();
    const newEntry: WorkoutLog = {
      ...log,
      id: `log_${Date.now()}`,
      timestamp: Date.now(),
      dateStr: targetDate,
      timeFormatted: log.timeFormatted || formatTime(),
    };

    const previousWorkouts = [...workouts];
    setWorkouts([newEntry, ...workouts]);

    // Set 5-second undo toast
    setUndoToast({
      message: `Logged ${newEntry.name}`,
      action: () => {
        setWorkouts(previousWorkouts);
        setUndoToast(null);
      },
    });

    setTimeout(() => {
      setUndoToast((current) => (current?.message.includes(newEntry.name) ? null : current));
    }, 5000);
  };

  const handleUpdateWorkout = (updated: WorkoutLog) => {
    const previousWorkouts = [...workouts];
    setWorkouts(workouts.map((w) => (w.id === updated.id ? updated : w)));

    setUndoToast({
      message: `Updated ${updated.name}`,
      action: () => {
        setWorkouts(previousWorkouts);
        setUndoToast(null);
      },
    });

    setTimeout(() => {
      setUndoToast((current) => (current?.message.includes(updated.name) ? null : current));
    }, 5000);
  };

  const handleDeleteWorkout = (id: string) => {
    const target = workouts.find((w) => w.id === id);
    const previous = [...workouts];
    setWorkouts(workouts.filter((w) => w.id !== id));

    if (target) {
      setUndoToast({
        message: `Deleted ${target.name}`,
        action: () => {
          setWorkouts(previous);
          setUndoToast(null);
        },
      });
      setTimeout(() => {
        setUndoToast((current) => (current?.message.includes(target.name) ? null : current));
      }, 5000);
    }
  };

  // Library Actions
  const handleAddBook = (book: Omit<Book, 'id' | 'completed'>) => {
    const newBook: Book = {
      ...book,
      id: `book_${Date.now()}`,
      completed: book.currentPage >= book.totalPages,
    };

    setHabitsData({
      ...habitsData,
      reading: {
        ...habitsData.reading,
        books: [...habitsData.reading.books, newBook],
        activeBookId: habitsData.reading.books.length === 0 ? newBook.id : habitsData.reading.activeBookId,
      },
    });
  };

  const handleSetActiveBook = (id: string) => {
    setHabitsData({
      ...habitsData,
      reading: {
        ...habitsData.reading,
        activeBookId: id,
      },
    });
  };

  const handleUpdateBookProgress = (id: string, newPage: number) => {
    const updatedBooks = habitsData.reading.books.map((b) => {
      if (b.id === id) {
        const isFinished = newPage >= b.totalPages;
        return {
          ...b,
          currentPage: newPage,
          completed: isFinished,
        };
      }
      return b;
    });

    setHabitsData({
      ...habitsData,
      reading: {
        ...habitsData.reading,
        books: updatedBooks,
      },
    });
  };

  const handleDeleteBook = (id: string) => {
    const remaining = habitsData.reading.books.filter((b) => b.id !== id);
    setHabitsData({
      ...habitsData,
      reading: {
        ...habitsData.reading,
        books: remaining,
        activeBookId: habitsData.reading.activeBookId === id ? (remaining[0]?.id || '') : habitsData.reading.activeBookId,
      },
    });
  };

  const handleDataReset = () => {
    setWorkouts([]);
    setUndoToast(null);
  };

  // Move tab is 100% dedicated to TODAY's live execution
  const todayDateStr = getTodayDateStr();
  const todayMoveLogs = workouts.filter((w) => !w.dateStr || w.dateStr === todayDateStr);

  return (
    <div className="min-h-screen bg-[#080a0f] text-slate-100 font-sans antialiased pb-28">
      <div className="max-w-md mx-auto px-4 pt-2 sm:max-w-xl md:max-w-3xl lg:max-w-4xl">
        {/* Main Header */}
        <Header
          activeView={activeView}
          onToggleOverview={handleToggleOverview}
          onOpenSidebar={() => setIsSidebarOpen(true)}
        />

        {/* View Router */}
        <main>
          {activeView === 'overview' && (
            <OverviewView
              workouts={workouts}
              focus={focusData}
              habits={habitsData}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              onUpdateWorkout={handleUpdateWorkout}
              onDeleteWorkout={handleDeleteWorkout}
              onLogWorkout={handleLogWorkout}
              onUpdateFocusData={setFocusData}
              onUpdateHabitsData={setHabitsData}
            />
          )}

          {activeView === 'library' && (
            <LibraryView
              books={habitsData.reading.books}
              activeBookId={habitsData.reading.activeBookId}
              onBack={() => setActiveView(activeTab)}
              onSetActiveBook={handleSetActiveBook}
              onAddBook={handleAddBook}
              onUpdateBookProgress={handleUpdateBookProgress}
              onDeleteBook={handleDeleteBook}
            />
          )}

          {activeView === 'move' && (
            <MoveEngine
              logs={todayMoveLogs}
              stickyDefaults={stickyDefaults}
              onUpdateDefaults={setStickyDefaults}
              onLogWorkout={handleLogWorkout}
              onDeleteLog={handleDeleteWorkout}
              onUpdateLog={handleUpdateWorkout}
            />
          )}

          {activeView === 'focus' && (
            <FocusEngine
              focusData={focusData}
              onUpdateFocusData={setFocusData}
              workouts={workouts}
              habitsData={habitsData}
              selectedDate={selectedDate}
            />
          )}

          {activeView === 'habits' && (
            <HabitsEngine
              habitsData={habitsData}
              onUpdateHabitsData={setHabitsData}
              onNavigateLibrary={() => setActiveView('library')}
              onOpenProtocol={handleOpenHabitsProtocol}
            />
          )}
        </main>
      </div>

      {/* Sleek Floating Past Day Mode Banner (Dismissible) */}
      {selectedDate !== getTodayDateStr() && !isPastDayBannerDismissed && (
        <div className="fixed bottom-20 left-4 right-4 z-40 max-w-md mx-auto sm:max-w-xl md:max-w-3xl flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-[#1c1407]/95 border border-amber-500/40 backdrop-blur-md text-amber-200 shadow-2xl shadow-black/80 animate-fadeIn">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                Past Day Mode: <span className="font-mono text-amber-300">{selectedDate}</span>
              </p>
              <p className="text-[10px] text-amber-300/80 truncate">
                Logs and scorecards apply to this date
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                triggerHaptic(15);
                setSelectedDate(getTodayDateStr());
              }}
              className="spring-btn px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-black font-bold text-xs shadow-md transition-all tap-target active:scale-95"
            >
              Jump to Today
            </button>
            <button
              type="button"
              onClick={() => {
                triggerHaptic(10);
                setIsPastDayBannerDismissed(true);
              }}
              className="p-2 rounded-xl text-amber-300/70 hover:text-white hover:bg-white/10 active:bg-white/15 transition-colors tap-target"
              aria-label="Dismiss past day mode banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Floating 5-Second Undo Toast */}
      {undoToast && (
        <UndoToast
          message={undoToast.message}
          onUndo={undoToast.action}
          onDismiss={() => setUndoToast(null)}
        />
      )}

      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} onSelectTab={handleSelectTab} />

      {/* Sidebar Drawer */}
      <SidebarDrawer
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onNavigateLibrary={() => setActiveView('library')}
        onOpenProtocolsGuide={() => setIsProtocolsGuideOpen(true)}
        onOpenHabitsProtocol={() => handleOpenHabitsProtocol('sleep')}
        bookCount={habitsData.reading.books.length}
        onDataReset={handleDataReset}
      />

      {/* Sovereign Protocols & Field Guide Modal */}
      <ProtocolsGuideModal
        isOpen={isProtocolsGuideOpen}
        onClose={() => setIsProtocolsGuideOpen(false)}
      />

      {/* Habits Protocol Science Guide Drawer */}
      <ProtocolSidebar
        isOpen={isHabitsProtocolOpen}
        onClose={() => setIsHabitsProtocolOpen(false)}
        initialSection={habitsProtocolSection}
      />
    </div>
  );
};
