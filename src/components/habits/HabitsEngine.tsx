import React, { useState } from 'react';
import { HabitsData, SleepRecord, ReadingState, HydrationRecord, KeystonesState, UserHabitsConfig } from '../../types';
import { HydrationCard } from './HydrationCard';
import { SleepCard } from './SleepCard';
import { DeepReadingCard } from './DeepReadingCard';
import { KeystonesCard } from './KeystonesCard';
import { ProtocolSidebar } from './ProtocolSidebar';
import { syncTodayCockpitToDailyRecords } from '../../utils/habitsSync';
import { StorageService, getTodayDateStr } from '../../services/storage';

interface HabitsEngineProps {
  habitsData: HabitsData;
  habitsConfig?: UserHabitsConfig;
  onUpdateHabitsData: (data: HabitsData) => void;
  onNavigateLibrary: () => void;
  onOpenProtocol?: (section: string) => void;
}

export const HabitsEngine: React.FC<HabitsEngineProps> = ({
  habitsData,
  habitsConfig,
  onUpdateHabitsData,
  onNavigateLibrary,
  onOpenProtocol,
}) => {
  const todayStr = getTodayDateStr();
  const [isProtocolOpen, setIsProtocolOpen] = useState(false);
  const [protocolSection, setProtocolSection] = useState('sleep');

  const handleOpenProtocol = (section: string = 'sleep') => {
    if (onOpenProtocol) {
      onOpenProtocol(section);
    } else {
      setProtocolSection(section);
      setIsProtocolOpen(true);
    }
  };

  const handleUpdateHydration = (hydration: HydrationRecord) => {
    const updated = { ...habitsData, hydration };
    const synced = syncTodayCockpitToDailyRecords(updated, todayStr);
    StorageService.saveHabitsData(synced);
    onUpdateHabitsData(synced);
  };

  const handleUpdateSleep = (sleep: SleepRecord) => {
    const updated = { ...habitsData, sleep };
    const synced = syncTodayCockpitToDailyRecords(updated, todayStr);
    StorageService.saveHabitsData(synced);
    onUpdateHabitsData(synced);
  };

  const handleUpdateReading = (reading: ReadingState) => {
    const updated = { ...habitsData, reading };
    const synced = syncTodayCockpitToDailyRecords(updated, todayStr);
    StorageService.saveHabitsData(synced);
    onUpdateHabitsData(synced);
  };

  const handleUpdateKeystones = (keystones: KeystonesState) => {
    const updated = { ...habitsData, keystones };
    const synced = syncTodayCockpitToDailyRecords(updated, todayStr);
    StorageService.saveHabitsData(synced);
    onUpdateHabitsData(synced);
  };

  return (
    <div className="space-y-4">

      {/* Pillar 1: Water (Hydration) */}
      <HydrationCard
        hydration={habitsData.hydration}
        containerMl={habitsConfig?.containerMl}
        onUpdateHydration={handleUpdateHydration}
        onOpenProtocol={handleOpenProtocol}
      />

      {/* Pillar 2: Sleep & Circadian Timing */}
      <SleepCard
        sleep={habitsData.sleep}
        sleepTargetHours={habitsConfig?.sleepTargetHours}
        onUpdateSleep={handleUpdateSleep}
        onOpenProtocol={handleOpenProtocol}
      />

      {/* Pillar 3: Keystone Discipline */}
      <KeystonesCard
        keystones={habitsData.keystones}
        detox={habitsData.detox}
        keystonesConfig={habitsConfig?.keystones}
        onUpdateKeystones={handleUpdateKeystones}
        onOpenProtocol={handleOpenProtocol}
      />

      {/* Pillar 4: Deep Reading */}
      <DeepReadingCard
        reading={habitsData.reading}
        onNavigateLibrary={onNavigateLibrary}
        onUpdateReading={handleUpdateReading}
        onOpenProtocol={handleOpenProtocol}
      />

      {/* Slide-over Protocol Science Guide */}
      <ProtocolSidebar
        isOpen={isProtocolOpen}
        onClose={() => setIsProtocolOpen(false)}
        initialSection={protocolSection}
      />
    </div>
  );
};
