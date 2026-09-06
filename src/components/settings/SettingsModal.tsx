import React, { useState } from 'react';
import { 
  X, 
  User, 
  Dumbbell, 
  BookOpen, 
  Moon, 
  Check, 
  Plus, 
  Trash2, 
  Copy, 
  Download, 
  Upload, 
  Flame, 
  ShieldCheck, 
  Award,
  Droplets,
  Activity,
  MapPin,
  Scale,
  Target,
} from 'lucide-react';
import { 
  UserProfile, 
  UserMoveConfig, 
  UserFocusConfig, 
  UserHabitsConfig,
  PhysicalProfile,
  DEFAULT_DUMBBELL_EXERCISES,
  DEFAULT_BODYWEIGHT_EXERCISES,
  DEFAULT_PHYSICAL_PROFILE,
  DEFAULT_WORKOUT_LOCATIONS,
} from '../../types';
import { StorageService } from '../../services/storage';
import { triggerHaptic } from '../../hooks/useHaptics';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProfile: UserProfile;
  profiles: UserProfile[];
  onUpdateActiveProfile: (profile: UserProfile) => void;
  onSwitchProfile: (profileId: string) => void;
  onProfilesChanged: () => void;
}

type SettingsTab = 'profile' | 'move' | 'focus' | 'habits';

const ALL_POSSIBLE_EXERCISES = [
  'Squats',
  'Overhead Press',
  'Bicep Curls',
  'Bent Rows',
  'RDLs',
  'Deadlifts',
  'Bench Press',
  'Barbell Lunges',
  'Barbell Shrugs',
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  activeProfile,
  profiles,
  onUpdateActiveProfile,
  onSwitchProfile,
  onProfilesChanged,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [newProfileName, setNewProfileName] = useState('');
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);

  if (!isOpen) return null;

  // Local draft copies
  const physicalProfile: PhysicalProfile = {
    ...DEFAULT_PHYSICAL_PROFILE,
    ...(activeProfile.physicalProfile || {}),
  };
  const moveConfig = {
    ...activeProfile.moveConfig,
    locations: activeProfile.moveConfig?.locations || DEFAULT_WORKOUT_LOCATIONS,
    enabledDumbbellExercises: activeProfile.moveConfig?.enabledDumbbellExercises || DEFAULT_DUMBBELL_EXERCISES,
    enabledBodyweightExercises: activeProfile.moveConfig?.enabledBodyweightExercises || DEFAULT_BODYWEIGHT_EXERCISES,
    dumbbellWeightKg: activeProfile.moveConfig?.dumbbellWeightKg ?? 15,
  };
  const focusConfig = activeProfile.focusConfig;
  const habitsConfig = activeProfile.habitsConfig;

  const updatePhysical = (partial: Partial<PhysicalProfile>) => {
    const updated: UserProfile = {
      ...activeProfile,
      physicalProfile: { ...physicalProfile, ...partial },
    };
    onUpdateActiveProfile(updated);
    StorageService.saveActiveProfile(updated);
  };

  const handleSwitchLocation = (locId: string) => {
    triggerHaptic(15);
    const loc = (moveConfig.locations || DEFAULT_WORKOUT_LOCATIONS).find((l) => l.id === locId);
    if (loc) {
      const updatedMove: UserMoveConfig = {
        ...moveConfig,
        activeLocationId: loc.id,
        equipmentMode: loc.equipmentMode,
        barbellWeightKg: loc.barbellWeightKg ?? moveConfig.barbellWeightKg,
        dumbbellWeightKg: loc.dumbbellWeightKg ?? moveConfig.dumbbellWeightKg,
      };
      updateMove(updatedMove);
    }
  };

  const updateMove = (partial: Partial<UserMoveConfig>) => {
    const updated: UserProfile = {
      ...activeProfile,
      moveConfig: { ...moveConfig, ...partial },
    };
    onUpdateActiveProfile(updated);
    StorageService.saveActiveProfile(updated);
  };

  const updateFocus = (partial: Partial<UserFocusConfig>) => {
    const updated: UserProfile = {
      ...activeProfile,
      focusConfig: { ...focusConfig, ...partial },
    };
    onUpdateActiveProfile(updated);
    StorageService.saveActiveProfile(updated);
  };

  const updateHabits = (partial: Partial<UserHabitsConfig>) => {
    const updated: UserProfile = {
      ...activeProfile,
      habitsConfig: { ...habitsConfig, ...partial },
    };
    onUpdateActiveProfile(updated);
    StorageService.saveActiveProfile(updated);
  };

  // Profile Actions
  const handleCreateProfile = () => {
    if (!newProfileName.trim()) return;
    triggerHaptic(20);
    const created = StorageService.createProfile(newProfileName.trim(), {
      avatarColor: ['sky', 'emerald', 'amber', 'purple', 'rose'][Math.floor(Math.random() * 5)],
    });
    setNewProfileName('');
    setIsCreatingProfile(false);
    onProfilesChanged();
    onSwitchProfile(created.id);
  };

  const handleDuplicateProfile = () => {
    triggerHaptic(20);
    const created = StorageService.createProfile(`${activeProfile.name} (Copy)`, {
      moveConfig: JSON.parse(JSON.stringify(activeProfile.moveConfig)),
      focusConfig: JSON.parse(JSON.stringify(activeProfile.focusConfig)),
      habitsConfig: JSON.parse(JSON.stringify(activeProfile.habitsConfig)),
      avatarColor: activeProfile.avatarColor,
    });
    onProfilesChanged();
    onSwitchProfile(created.id);
  };

  const handleDeleteProfile = (id: string) => {
    if (profiles.length <= 1) {
      alert('Cannot delete the only profile.');
      return;
    }
    if (confirm(`Are you sure you want to delete this profile and all its partitioned data?`)) {
      triggerHaptic(25);
      StorageService.deleteProfile(id);
      onProfilesChanged();
      onSwitchProfile(StorageService.getActiveProfileId());
    }
  };

  // Export & Import
  const handleExport = () => {
    triggerHaptic(15);
    const jsonStr = StorageService.exportAllJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pulsesync_backup_v5_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content && StorageService.importAllJson(content)) {
        triggerHaptic(30);
        alert('Data successfully restored!');
        window.location.reload();
      } else {
        alert('Failed to parse backup JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
    { id: 'move', label: 'Workout', icon: <Dumbbell className="w-4 h-4" /> },
    { id: 'focus', label: 'Study', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'habits', label: 'Habits', icon: <Moon className="w-4 h-4" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-xl bg-[#0b0e14] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[85vh] max-h-[820px] z-10 animate-fadeIn">
        {/* Modal Header */}
        <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#0e131d]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-white font-mono uppercase">
                PulseSync Settings
              </h2>
              <p className="text-[11px] text-slate-400">
                Multi-User Profiles & Personal Configurations
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors tap-target min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="shrink-0 flex border-b border-white/10 bg-[#090d15] px-3 pt-2 gap-1 overflow-x-auto scrollbar-none z-10">
          {tabs.map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  triggerHaptic(10);
                  setActiveTab(tab.id);
                }}
                className={`shrink-0 flex items-center gap-2 px-3.5 py-2.5 rounded-t-xl text-xs font-semibold tracking-wide transition-all min-h-[44px] tap-target ${
                  isSelected
                    ? 'bg-[#0b0e14] text-sky-400 border-t-2 border-sky-400 shadow-sm font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-5 text-slate-200 text-sm">
          {/* ========================================================================= */}
          {/* TAB 1: PROFILE & IDENTITY */}
          {/* ========================================================================= */}
          {activeTab === 'profile' && (
            <div className="space-y-5">
              {/* Active Profile Switcher */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="eyebrow text-slate-400 font-mono text-[10px]">Active Profile</span>
                  <button
                    type="button"
                    onClick={() => setIsCreatingProfile(!isCreatingProfile)}
                    className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1 tap-target py-1 px-2"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isCreatingProfile ? 'Cancel' : 'New Profile'}</span>
                  </button>
                </div>

                {isCreatingProfile && (
                  <div className="p-3.5 rounded-2xl bg-[#121824] border border-sky-500/30 space-y-2.5 animate-fadeIn">
                    <p className="text-xs font-semibold text-white">Create New Profile</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. Alex (Powerlifting)"
                        value={newProfileName}
                        onChange={(e) => setNewProfileName(e.target.value)}
                        className="flex-1 h-10 px-3 rounded-xl bg-black/60 border border-white/10 text-white text-xs focus:outline-none focus:border-sky-400"
                      />
                      <button
                        type="button"
                        onClick={handleCreateProfile}
                        disabled={!newProfileName.trim()}
                        className="px-4 h-10 rounded-xl bg-sky-500 text-black font-bold text-xs hover:bg-sky-400 disabled:opacity-30 tap-target"
                      >
                        Create
                      </button>
                    </div>
                  </div>
                )}

                {/* Profiles List */}
                <div className="grid grid-cols-1 gap-2">
                  {profiles.map((p) => {
                    const isSelected = p.id === activeProfile.id;
                    return (
                      <div
                        key={p.id}
                        className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-[#121927] border-sky-500/50 shadow-md shadow-sky-500/10'
                            : 'bg-[#0e131d] border-white/5 hover:border-white/15'
                        }`}
                      >
                        <div
                          className="flex items-center gap-3 flex-1 cursor-pointer tap-target"
                          onClick={() => {
                            if (!isSelected) {
                              triggerHaptic(15);
                              onSwitchProfile(p.id);
                            }
                          }}
                        >
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs uppercase font-mono ${
                            p.avatarColor === 'emerald' ? 'bg-emerald-500/20 text-emerald-300' :
                            p.avatarColor === 'amber' ? 'bg-amber-500/20 text-amber-300' :
                            p.avatarColor === 'purple' ? 'bg-purple-500/20 text-purple-300' :
                            p.avatarColor === 'rose' ? 'bg-rose-500/20 text-rose-300' :
                            'bg-sky-500/20 text-sky-300'
                          }`}>
                            {p.name.slice(0, 2)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-white text-xs">{p.name}</span>
                              {isSelected && (
                                <span className="badge-pill bg-sky-500/20 text-sky-300 font-mono text-[9px]">
                                  Active
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 font-mono">
                              {p.moveConfig?.barbellWeightKg || 30}kg Barbell · {p.focusConfig?.dailyStudyTargetHours || 5.5}h Study
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1">
                          {isSelected && (
                            <button
                              type="button"
                              onClick={handleDuplicateProfile}
                              title="Duplicate Profile"
                              aria-label="Duplicate Profile"
                              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 tap-target min-h-[40px] min-w-[40px] flex items-center justify-center"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          )}
                          {profiles.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteProfile(p.id)}
                              title="Delete Profile"
                              aria-label="Delete Profile"
                              className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 tap-target min-h-[40px] min-w-[40px] flex items-center justify-center"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Profile Name & Theme Customization */}
              <div className="space-y-3 p-4 rounded-2xl bg-[#0e131d] border border-white/5">
                <span className="eyebrow text-slate-400 font-mono text-[10px]">Active Profile Identity</span>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={activeProfile.name}
                    onChange={(e) => {
                      const updated = { ...activeProfile, name: e.target.value };
                      onUpdateActiveProfile(updated);
                      StorageService.saveActiveProfile(updated);
                    }}
                    className="w-full h-10 px-3 rounded-xl bg-black/50 border border-white/10 text-white text-xs font-semibold focus:outline-none focus:border-sky-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Accent Color
                  </label>
                  <div className="flex gap-2">
                    {['sky', 'emerald', 'amber', 'purple', 'rose'].map((c) => {
                      const isChosen = activeProfile.avatarColor === c;
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => {
                            triggerHaptic(10);
                            const updated = { ...activeProfile, avatarColor: c };
                            onUpdateActiveProfile(updated);
                            StorageService.saveActiveProfile(updated);
                          }}
                          className={`w-9 h-9 rounded-xl border flex items-center justify-center tap-target transition-all ${
                            c === 'sky' ? 'bg-sky-500/30 border-sky-400 text-sky-300' :
                            c === 'emerald' ? 'bg-emerald-500/30 border-emerald-400 text-emerald-300' :
                            c === 'amber' ? 'bg-amber-500/30 border-amber-400 text-amber-300' :
                            c === 'purple' ? 'bg-purple-500/30 border-purple-400 text-purple-300' :
                            'bg-rose-500/30 border-rose-400 text-rose-300'
                          } ${isChosen ? 'ring-2 ring-white scale-105' : 'opacity-70 hover:opacity-100'}`}
                        >
                          {isChosen && <Check className="w-4 h-4 stroke-[3]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Physical Profile & Biometrics */}
              <div className="space-y-3 p-4 rounded-2xl bg-[#0e131d] border border-white/5">
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-emerald-400" />
                  <span className="font-semibold text-white text-xs">Physical Profile & Biometrics</span>
                </div>
                
                <div className="grid grid-cols-3 gap-3 font-mono">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Height (cm)</label>
                    <input
                      type="number"
                      value={physicalProfile.heightCm}
                      onChange={(e) => updatePhysical({ heightCm: parseInt(e.target.value, 10) || 175 })}
                      className="w-full h-10 px-3 rounded-xl bg-black/50 border border-white/10 text-white text-xs font-bold focus:outline-none focus:border-emerald-400 tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Current Weight</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={physicalProfile.weightKg}
                        onChange={(e) => updatePhysical({ weightKg: parseFloat(e.target.value) || 90 })}
                        className="w-full h-10 px-3 rounded-xl bg-black/50 border border-white/10 text-white text-xs font-bold focus:outline-none focus:border-emerald-400 tabular-nums"
                      />
                      <span className="text-[10px] text-slate-500">kg</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Target Weight</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={physicalProfile.targetWeightKg || 78}
                        onChange={(e) => updatePhysical({ targetWeightKg: parseFloat(e.target.value) || 78 })}
                        className="w-full h-10 px-3 rounded-xl bg-black/50 border border-white/10 text-white text-xs font-bold focus:outline-none focus:border-emerald-400 tabular-nums"
                      />
                      <span className="text-[10px] text-slate-500">kg</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Primary Body Transformation Goal</label>
                  <input
                    type="text"
                    value={physicalProfile.primaryGoal}
                    onChange={(e) => updatePhysical({ primaryGoal: e.target.value })}
                    placeholder="e.g. Lose love handles & man boobs, build lean muscle"
                    className="w-full h-10 px-3 rounded-xl bg-black/50 border border-white/10 text-white text-xs font-semibold focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              {/* Workout Location & Facility Switcher */}
              <div className="space-y-3 p-4 rounded-2xl bg-[#0e131d] border border-white/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-amber-400" />
                    <span className="font-semibold text-white text-xs">Workout Location & Equipment Setup</span>
                  </div>
                  <span className="badge-pill bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono text-[10px]">
                    Multi-Facility
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Switch your current workout location to instantly adjust available equipment and default loads:
                </p>

                <div className="space-y-2 pt-1">
                  {(moveConfig.locations || DEFAULT_WORKOUT_LOCATIONS).map((loc) => {
                    const isSelected = loc.id === (moveConfig.activeLocationId || 'loc_mothers');
                    const isMothersHome = loc.id === 'loc_mothers' || loc.name.includes("Mother");
                    const isGym = loc.id === 'loc_gym' || loc.name.includes("Gym");

                    return (
                      <div
                        key={loc.id}
                        onClick={() => handleSwitchLocation(loc.id)}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-[#121927] border-amber-500/50 shadow-md shadow-amber-500/10'
                            : 'bg-black/30 border-white/5 hover:border-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                              isSelected ? 'bg-amber-500/20 text-amber-400' : 'bg-white/5 text-slate-400'
                            }`}>
                              <MapPin className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-white text-xs">{loc.name}</span>
                                {isSelected && (
                                  <span className="badge-pill bg-amber-500/20 text-amber-300 font-mono text-[9px]">
                                    Active Setup
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                {loc.notes}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 font-mono text-[11px]">
                            {isSelected && <Check className="w-4 h-4 text-amber-400" />}
                          </div>
                        </div>

                        {/* Equipment Setup Detail (shown when selected) */}
                        {isSelected && isMothersHome && (
                          <div className="mt-3 pt-3 border-t border-white/10 space-y-2 animate-fadeIn">
                            <span className="text-[10px] uppercase font-mono tracking-wider text-amber-400 font-bold block">
                              Active Equipment Inventory:
                            </span>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="p-2 rounded-xl bg-black/40 border border-white/5 flex items-center gap-2">
                                <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                <div>
                                  <span className="text-slate-200 font-medium block">Barbell (30 kg)</span>
                                  <span className="text-[10px] text-slate-400">Fixed load · 6 Lifts</span>
                                </div>
                              </div>
                              <div className="p-2 rounded-xl bg-black/40 border border-white/5 flex items-center gap-2">
                                <Dumbbell className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                                <div>
                                  <span className="text-slate-200 font-medium block">Pull-up Bar</span>
                                  <span className="text-[10px] text-slate-400">Half Pull-ups</span>
                                </div>
                              </div>
                              <div className="p-2 rounded-xl bg-black/40 border border-white/5 flex items-center gap-2">
                                <Activity className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                                <div>
                                  <span className="text-slate-200 font-medium block">Dips Bar</span>
                                  <span className="text-[10px] text-slate-400">Parallel Dips</span>
                                </div>
                              </div>
                              <div className="p-2 rounded-xl bg-black/40 border border-white/5 flex items-center gap-2">
                                <ShieldCheck className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                                <div>
                                  <span className="text-slate-200 font-medium block">Floor Space</span>
                                  <span className="text-[10px] text-slate-400">Push-ups</span>
                                </div>
                              </div>
                            </div>
                            <p className="text-[10px] text-slate-500 italic mt-1">
                              * Dumbbells: None added yet (can be added if purchased)
                            </p>
                          </div>
                        )}

                        {isSelected && isGym && (
                          <div className="mt-3 pt-3 border-t border-white/10 text-xs text-slate-400 space-y-1 animate-fadeIn">
                            <p className="text-[11px] text-amber-300 font-medium">
                              Commercial Gym facility registered.
                            </p>
                            <p className="text-[10px] text-slate-400">
                              Custom gym routine and heavy equipment will be configured once you begin attending gym. Currently training at Mother&apos;s Home.
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Data Sovereignty: Unified Backup & Restore */}
              <div className="space-y-2.5 p-4 rounded-2xl bg-[#0e131d] border border-white/5">
                <span className="eyebrow text-slate-400 font-mono text-[10px]">Data Sovereignty & Backups</span>
                <p className="text-xs text-slate-400">
                  Export all profiles, workouts, focus receipts, and habit ledgers to local JSON or restore an existing backup.
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleExport}
                    className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 flex items-center justify-center gap-2 tap-target min-h-[44px]"
                  >
                    <Download className="w-4 h-4 text-sky-400" />
                    <span>Backup JSON</span>
                  </button>

                  <label className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 flex items-center justify-center gap-2 cursor-pointer tap-target min-h-[44px]">
                    <Upload className="w-4 h-4 text-purple-400" />
                    <span>Restore JSON</span>
                    <input
                      type="file"
                      accept=".json"
                      className="hidden"
                      onChange={handleImport}
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: EQUIPMENT & WORKOUT CONFIGURATOR */}
          {/* ========================================================================= */}
          {activeTab === 'move' && (
            <div className="space-y-5">
              {/* Equipment Mode */}
              <div className="space-y-2 p-4 rounded-2xl bg-[#0e131d] border border-white/5">
                <span className="eyebrow text-slate-400 font-mono text-[10px]">Equipment Setup</span>
                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  {[
                    { id: 'barbell_home', label: 'Barbell' },
                    { id: 'dumbbells', label: 'Dumbbells' },
                    { id: 'bodyweight_only', label: 'Bodyweight' },
                  ].map((mode) => {
                    const isSelected = moveConfig.equipmentMode === mode.id;
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => {
                          triggerHaptic(10);
                          updateMove({ equipmentMode: mode.id as any });
                        }}
                        className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all tap-target min-h-[44px] ${
                          isSelected
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm font-bold'
                            : 'bg-black/30 text-slate-400 border-white/5 hover:border-white/10'
                        }`}
                      >
                        {mode.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Conditional Equipment View 1: Barbell */}
              {moveConfig.equipmentMode === 'barbell_home' && (
                <>
                  {/* Barbell Load Settings */}
                  <div className="space-y-3 p-4 rounded-2xl bg-[#0e131d] border border-white/5 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Flame className="w-4 h-4 text-amber-400" />
                        <span className="font-semibold text-white text-xs">Home Barbell Load</span>
                      </div>
                      <span className="badge-pill bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono text-xs tabular-nums">
                        {moveConfig.barbellWeightKg} kg
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={10}
                        max={120}
                        step={2.5}
                        value={moveConfig.barbellWeightKg}
                        onChange={(e) => updateMove({ barbellWeightKg: parseFloat(e.target.value) })}
                        className="flex-1 accent-amber-400 cursor-pointer h-2 bg-white/10 rounded-lg"
                      />
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            triggerHaptic(10);
                            updateMove({ barbellWeightKg: Math.max(5, moveConfig.barbellWeightKg - 2.5) });
                          }}
                          className="tactile-pill-btn tap-target hover:border-amber-500/40 text-amber-300"
                        >
                          -2.5
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            triggerHaptic(10);
                            updateMove({ barbellWeightKg: moveConfig.barbellWeightKg + 2.5 });
                          }}
                          className="tactile-pill-btn tap-target hover:border-amber-500/40 text-amber-300"
                        >
                          +2.5
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Barbell Exercise Rotation Checklist */}
                  <div className="space-y-2 p-4 rounded-2xl bg-[#0e131d] border border-white/5 animate-fadeIn">
                    <span className="eyebrow text-slate-400 font-mono text-[10px]">Active Barbell Lift Rotation</span>
                    <p className="text-xs text-slate-400">
                      Select which lifts appear on the quick-tap Barbell card:
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-1">
                      {ALL_POSSIBLE_EXERCISES.map((lift) => {
                        const isEnabled = moveConfig.enabledExercises.includes(lift);
                        return (
                          <button
                            key={lift}
                            type="button"
                            onClick={() => {
                              triggerHaptic(10);
                              let next = [...moveConfig.enabledExercises];
                              if (isEnabled) {
                                if (next.length > 1) next = next.filter((e) => e !== lift);
                              } else {
                                next.push(lift);
                              }
                              updateMove({ enabledExercises: next });
                            }}
                            className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all text-left flex items-center justify-between min-h-[44px] tap-target ${
                              isEnabled
                                ? 'bg-amber-500/15 text-amber-200 border-amber-500/30'
                                : 'bg-black/30 text-slate-500 border-white/5 opacity-60'
                            }`}
                          >
                            <span className="truncate">{lift}</span>
                            {isEnabled && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {/* Conditional Equipment View 2: Dumbbells */}
              {moveConfig.equipmentMode === 'dumbbells' && (
                <>
                  {/* Dumbbell Load Settings */}
                  <div className="space-y-3 p-4 rounded-2xl bg-[#0e131d] border border-white/5 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Dumbbell className="w-4 h-4 text-sky-400" />
                        <span className="font-semibold text-white text-xs">Dumbbell Load (Per Hand)</span>
                      </div>
                      <span className="badge-pill bg-sky-500/10 text-sky-400 border border-sky-500/20 font-mono text-xs tabular-nums">
                        {moveConfig.dumbbellWeightKg} kg / hand
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={2.5}
                        max={60}
                        step={2.5}
                        value={moveConfig.dumbbellWeightKg}
                        onChange={(e) => updateMove({ dumbbellWeightKg: parseFloat(e.target.value) })}
                        className="flex-1 accent-sky-400 cursor-pointer h-2 bg-white/10 rounded-lg"
                      />
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            triggerHaptic(10);
                            updateMove({ dumbbellWeightKg: Math.max(2.5, moveConfig.dumbbellWeightKg - 2.5) });
                          }}
                          className="tactile-pill-btn tap-target hover:border-sky-500/40 text-sky-300"
                        >
                          -2.5
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            triggerHaptic(10);
                            updateMove({ dumbbellWeightKg: moveConfig.dumbbellWeightKg + 2.5 });
                          }}
                          className="tactile-pill-btn tap-target hover:border-sky-500/40 text-sky-300"
                        >
                          +2.5
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Dumbbell Exercise Rotation */}
                  <div className="space-y-2 p-4 rounded-2xl bg-[#0e131d] border border-white/5 animate-fadeIn">
                    <span className="eyebrow text-slate-400 font-mono text-[10px]">Active Dumbbell Exercise Rotation</span>
                    <p className="text-xs text-slate-400">
                      Select which dumbbell exercises appear on your workout card:
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-1">
                      {DEFAULT_DUMBBELL_EXERCISES.map((ex) => {
                        const isEnabled = (moveConfig.enabledDumbbellExercises || DEFAULT_DUMBBELL_EXERCISES).includes(ex);
                        return (
                          <button
                            key={ex}
                            type="button"
                            onClick={() => {
                              triggerHaptic(10);
                              let currentList = moveConfig.enabledDumbbellExercises || DEFAULT_DUMBBELL_EXERCISES;
                              let next = [...currentList];
                              if (isEnabled) {
                                if (next.length > 1) next = next.filter((e) => e !== ex);
                              } else {
                                next.push(ex);
                              }
                              updateMove({ enabledDumbbellExercises: next });
                            }}
                            className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all text-left flex items-center justify-between min-h-[44px] tap-target ${
                              isEnabled
                                ? 'bg-sky-500/15 text-sky-200 border-sky-500/30'
                                : 'bg-black/30 text-slate-500 border-white/5 opacity-60'
                            }`}
                          >
                            <span className="truncate">{ex}</span>
                            {isEnabled && <Check className="w-3.5 h-3.5 text-sky-400 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {/* Conditional Equipment View 3: Bodyweight Only */}
              {moveConfig.equipmentMode === 'bodyweight_only' && (
                <>
                  <div className="p-4 rounded-2xl bg-[#0e131d] border border-white/5 space-y-2 animate-fadeIn">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-emerald-400" />
                      <span className="font-semibold text-white text-xs">Grease-the-Groove Calisthenics Protocol</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Optimized for travel, home, or mother&apos;s residence with zero heavy gym equipment. High-frequency submaximal sets throughout the day trigger steady muscle hypertrophy and neurological strength adaptations.
                    </p>
                  </div>

                  {/* Bodyweight Movement Rotation */}
                  <div className="space-y-2 p-4 rounded-2xl bg-[#0e131d] border border-white/5 animate-fadeIn">
                    <span className="eyebrow text-slate-400 font-mono text-[10px]">Active Bodyweight Movement Rotation</span>
                    <p className="text-xs text-slate-400">
                      Select which calisthenics exercises to track in your rotation:
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-1">
                      {DEFAULT_BODYWEIGHT_EXERCISES.map((ex) => {
                        const isEnabled = (moveConfig.enabledBodyweightExercises || DEFAULT_BODYWEIGHT_EXERCISES).includes(ex);
                        return (
                          <button
                            key={ex}
                            type="button"
                            onClick={() => {
                              triggerHaptic(10);
                              let currentList = moveConfig.enabledBodyweightExercises || DEFAULT_BODYWEIGHT_EXERCISES;
                              let next = [...currentList];
                              if (isEnabled) {
                                if (next.length > 1) next = next.filter((e) => e !== ex);
                              } else {
                                next.push(ex);
                              }
                              updateMove({ enabledBodyweightExercises: next });
                            }}
                            className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all text-left flex items-center justify-between min-h-[44px] tap-target ${
                              isEnabled
                                ? 'bg-emerald-500/15 text-emerald-200 border-emerald-500/30'
                                : 'bg-black/30 text-slate-500 border-white/5 opacity-60'
                            }`}
                          >
                            <span className="truncate">{ex}</span>
                            {isEnabled && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {/* Quick Steppers Configuration */}
              <div className="space-y-3 p-4 rounded-2xl bg-[#0e131d] border border-white/5">
                <span className="eyebrow text-slate-400 font-mono text-[10px]">Quick-Action Steppers</span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1 truncate">
                      Stepper 1
                    </label>
                    <input
                      type="text"
                      value={moveConfig.stepper1.title}
                      onChange={(e) =>
                        updateMove({
                          stepper1: { ...moveConfig.stepper1, title: e.target.value },
                        })
                      }
                      className="w-full h-9 px-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1 truncate">
                      Stepper 2 (Dips)
                    </label>
                    <input
                      type="text"
                      value={moveConfig.stepper2.title}
                      onChange={(e) =>
                        updateMove({
                          stepper2: { ...moveConfig.stepper2, title: e.target.value },
                        })
                      }
                      className="w-full h-9 px-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs focus:outline-none focus:border-teal-400"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1 truncate">
                      Stepper 3
                    </label>
                    <input
                      type="text"
                      value={moveConfig.stepper3?.title || 'Push-ups'}
                      onChange={(e) =>
                        updateMove({
                          stepper3: { title: e.target.value, category: 'pushup', defaultReps: 10 },
                        })
                      }
                      className="w-full h-9 px-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-400"
                    />
                  </div>
                </div>
              </div>

              {/* Daily Target Goals */}
              <div className="space-y-3 p-4 rounded-2xl bg-[#0e131d] border border-white/5">
                <span className="eyebrow text-slate-400 font-mono text-[10px]">Daily Move Targets</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Pull-ups Goal</label>
                    <input
                      type="number"
                      value={moveConfig.targets.pullups}
                      onChange={(e) =>
                        updateMove({
                          targets: { ...moveConfig.targets, pullups: parseInt(e.target.value, 10) || 0 },
                        })
                      }
                      className="w-full h-10 px-3 rounded-xl bg-black/50 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400 tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Dips Goal</label>
                    <input
                      type="number"
                      value={moveConfig.targets.dips ?? 30}
                      onChange={(e) =>
                        updateMove({
                          targets: { ...moveConfig.targets, dips: parseInt(e.target.value, 10) || 0 },
                        })
                      }
                      className="w-full h-10 px-3 rounded-xl bg-black/50 border border-white/10 text-white text-xs focus:outline-none focus:border-teal-400 tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Push-ups Goal</label>
                    <input
                      type="number"
                      value={moveConfig.targets.pushups}
                      onChange={(e) =>
                        updateMove({
                          targets: { ...moveConfig.targets, pushups: parseInt(e.target.value, 10) || 0 },
                        })
                      }
                      className="w-full h-10 px-3 rounded-xl bg-black/50 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-400 tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Daily Tonnage (kg)</label>
                    <input
                      type="number"
                      value={moveConfig.targets.tonnage}
                      onChange={(e) =>
                        updateMove({
                          targets: { ...moveConfig.targets, tonnage: parseInt(e.target.value, 10) || 0 },
                        })
                      }
                      className="w-full h-10 px-3 rounded-xl bg-black/50 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400 tabular-nums"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-2">
                    <label className="text-xs text-slate-400 block mb-1">Cardio Steps Target</label>
                    <input
                      type="number"
                      value={moveConfig.targets.cardioSteps}
                      onChange={(e) =>
                        updateMove({
                          targets: { ...moveConfig.targets, cardioSteps: parseInt(e.target.value, 10) || 0 },
                        })
                      }
                      className="w-full h-10 px-3 rounded-xl bg-black/50 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400 tabular-nums"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: STUDY & CURRICULUM CONFIGURATOR */}
          {/* ========================================================================= */}
          {activeTab === 'focus' && (
            <div className="space-y-5">
              {/* Daily Study & DSA Targets */}
              <div className="space-y-3 p-4 rounded-2xl bg-[#0e131d] border border-white/5">
                <span className="eyebrow text-slate-400 font-mono text-[10px]">Daily Study Targets</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Daily Study Hours
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step={0.5}
                        min={1}
                        max={16}
                        value={focusConfig.dailyStudyTargetHours}
                        onChange={(e) =>
                          updateFocus({ dailyStudyTargetHours: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full h-10 px-3 rounded-xl bg-black/50 border border-white/10 text-white text-xs font-mono font-bold focus:outline-none focus:border-sky-400 tabular-nums"
                      />
                      <span className="text-xs text-slate-400 font-mono">hours</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Daily DSA Target
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={focusConfig.dailyDsaTargetProblems}
                        onChange={(e) =>
                          updateFocus({ dailyDsaTargetProblems: parseInt(e.target.value, 10) || 1 })
                        }
                        className="w-full h-10 px-3 rounded-xl bg-black/50 border border-white/10 text-white text-xs font-mono font-bold focus:outline-none focus:border-sky-400 tabular-nums"
                      />
                      <span className="text-xs text-slate-400 font-mono">problems</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Question Targets Breakdown */}
              <div className="space-y-3 p-4 rounded-2xl bg-[#0e131d] border border-white/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-sky-400" />
                    <span className="font-semibold text-white text-xs">Daily Question & Problem Targets</span>
                  </div>
                  <span className="badge-pill bg-sky-500/10 text-sky-300 border border-sky-500/20 font-mono text-[10px]">
                    {((focusConfig.questionTargets?.deepAnchors ?? 3) + 
                      (focusConfig.questionTargets?.spacedChecks ?? 5) + 
                      (focusConfig.questionTargets?.liveCoding ?? 1) + 
                      (focusConfig.questionTargets?.dsaProblems ?? 1))} Sprints Total
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Target distribution across deep conceptual anchors, spaced checks, live coding, and DSA:
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono">
                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                    <label className="text-[10px] text-slate-400 block mb-1">Deep Anchors</label>
                    <input
                      type="number"
                      min={0}
                      max={20}
                      value={focusConfig.questionTargets?.deepAnchors ?? 3}
                      onChange={(e) =>
                        updateFocus({
                          questionTargets: {
                            deepAnchors: parseInt(e.target.value, 10) || 0,
                            spacedChecks: focusConfig.questionTargets?.spacedChecks ?? 5,
                            liveCoding: focusConfig.questionTargets?.liveCoding ?? 1,
                            dsaProblems: focusConfig.questionTargets?.dsaProblems ?? 1,
                          },
                        })
                      }
                      className="w-full h-8 px-2 rounded-lg bg-black/50 border border-white/10 text-white text-xs font-bold text-center focus:outline-none focus:border-sky-400 tabular-nums"
                    />
                  </div>

                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                    <label className="text-[10px] text-slate-400 block mb-1">Spaced Checks</label>
                    <input
                      type="number"
                      min={0}
                      max={30}
                      value={focusConfig.questionTargets?.spacedChecks ?? 5}
                      onChange={(e) =>
                        updateFocus({
                          questionTargets: {
                            deepAnchors: focusConfig.questionTargets?.deepAnchors ?? 3,
                            spacedChecks: parseInt(e.target.value, 10) || 0,
                            liveCoding: focusConfig.questionTargets?.liveCoding ?? 1,
                            dsaProblems: focusConfig.questionTargets?.dsaProblems ?? 1,
                          },
                        })
                      }
                      className="w-full h-8 px-2 rounded-lg bg-black/50 border border-white/10 text-white text-xs font-bold text-center focus:outline-none focus:border-sky-400 tabular-nums"
                    />
                  </div>

                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                    <label className="text-[10px] text-slate-400 block mb-1">Live Coding</label>
                    <input
                      type="number"
                      min={0}
                      max={10}
                      value={focusConfig.questionTargets?.liveCoding ?? 1}
                      onChange={(e) =>
                        updateFocus({
                          questionTargets: {
                            deepAnchors: focusConfig.questionTargets?.deepAnchors ?? 3,
                            spacedChecks: focusConfig.questionTargets?.spacedChecks ?? 5,
                            liveCoding: parseInt(e.target.value, 10) || 0,
                            dsaProblems: focusConfig.questionTargets?.dsaProblems ?? 1,
                          },
                        })
                      }
                      className="w-full h-8 px-2 rounded-lg bg-black/50 border border-white/10 text-white text-xs font-bold text-center focus:outline-none focus:border-sky-400 tabular-nums"
                    />
                  </div>

                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                    <label className="text-[10px] text-slate-400 block mb-1">DSA Problems</label>
                    <input
                      type="number"
                      min={0}
                      max={10}
                      value={focusConfig.questionTargets?.dsaProblems ?? 1}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10) || 0;
                        updateFocus({
                          dailyDsaTargetProblems: val,
                          questionTargets: {
                            deepAnchors: focusConfig.questionTargets?.deepAnchors ?? 3,
                            spacedChecks: focusConfig.questionTargets?.spacedChecks ?? 5,
                            liveCoding: focusConfig.questionTargets?.liveCoding ?? 1,
                            dsaProblems: val,
                          },
                        });
                      }}
                      className="w-full h-8 px-2 rounded-lg bg-black/50 border border-white/10 text-white text-xs font-bold text-center focus:outline-none focus:border-sky-400 tabular-nums"
                    />
                  </div>
                </div>
              </div>

              {/* Active Curriculum Track */}
              <div className="space-y-3 p-4 rounded-2xl bg-[#0e131d] border border-white/5">
                <span className="eyebrow text-slate-400 font-mono text-[10px]">Curriculum Track</span>
                <div className="space-y-2">
                  {focusConfig.curriculumTracks.map((track) => {
                    const isSelected = track.id === focusConfig.curriculumTrackId;
                    return (
                      <button
                        key={track.id}
                        type="button"
                        onClick={() => {
                          triggerHaptic(10);
                          updateFocus({ curriculumTrackId: track.id });
                        }}
                        className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all min-h-[44px] tap-target ${
                          isSelected
                            ? 'bg-sky-500/15 border-sky-500/40 text-white shadow-sm'
                            : 'bg-black/30 border-white/5 text-slate-400 hover:border-white/10'
                        }`}
                      >
                        <div>
                          <p className="text-xs font-bold text-slate-100">{track.title}</p>
                          {track.description && (
                            <p className="text-[10px] text-slate-400 mt-0.5">{track.description}</p>
                          )}
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-sky-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Focus Timer Presets */}
              <div className="space-y-3 p-4 rounded-2xl bg-[#0e131d] border border-white/5">
                <span className="eyebrow text-slate-400 font-mono text-[10px]">Timer Presets</span>
                <p className="text-xs text-slate-400">
                  Switch or customize your focus intervals (e.g. 50m Feynman vs 25m Pomodoro):
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1 font-mono">
                  {focusConfig.timerPresets.map((preset) => {
                    const isSelected = preset.id === focusConfig.activePresetId;
                    return (
                      <div
                        key={preset.id}
                        onClick={() => {
                          triggerHaptic(10);
                          updateFocus({ activePresetId: preset.id });
                        }}
                        className={`p-3 rounded-xl border cursor-pointer transition-all tap-target ${
                          isSelected
                            ? 'bg-sky-500/15 border-sky-500/40 text-white'
                            : 'bg-black/30 border-white/5 text-slate-400 hover:border-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs text-sky-300">{preset.label}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-sky-400" />}
                        </div>
                        <p className="text-[10px] text-slate-400 font-sans">{preset.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: CIRCADIAN & HABIT CONFIGURATOR */}
          {/* ========================================================================= */}
          {activeTab === 'habits' && (
            <div className="space-y-5">
              {/* Sleep Target Hours */}
              <div className="space-y-3 p-4 rounded-2xl bg-[#0e131d] border border-white/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Moon className="w-4 h-4 text-indigo-400" />
                    <span className="font-semibold text-white text-xs">Circadian Sleep Baseline</span>
                  </div>
                  <span className="badge-pill bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-mono text-xs tabular-nums">
                    {habitsConfig.sleepTargetHours} hours
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={6.0}
                    max={10.0}
                    step={0.25}
                    value={habitsConfig.sleepTargetHours}
                    onChange={(e) => updateHabits({ sleepTargetHours: parseFloat(e.target.value) })}
                    className="flex-1 accent-indigo-400 cursor-pointer h-2 bg-white/10 rounded-lg"
                  />
                  <div className="flex items-center gap-1 font-mono text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic(10);
                        updateHabits({ sleepTargetHours: Math.max(5.0, habitsConfig.sleepTargetHours - 0.25) });
                      }}
                      className="tactile-pill-btn tap-target text-indigo-300 hover:border-indigo-500/40"
                    >
                      -0.25
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic(10);
                        updateHabits({ sleepTargetHours: Math.min(12.0, habitsConfig.sleepTargetHours + 0.25) });
                      }}
                      className="tactile-pill-btn tap-target text-indigo-300 hover:border-indigo-500/40"
                    >
                      +0.25
                    </button>
                  </div>
                </div>
              </div>

              {/* Hydration & Bottle Size */}
              <div className="space-y-3 p-4 rounded-2xl bg-[#0e131d] border border-white/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-sky-400" />
                    <span className="font-semibold text-white text-xs">Fluid Dynamics & Bottle Size</span>
                  </div>
                  <span className="badge-pill bg-sky-500/10 text-sky-300 border border-sky-500/20 font-mono text-xs tabular-nums">
                    {habitsConfig.hydrationTargetMl} ml
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 font-mono">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Hydration Goal (ml)</label>
                    <input
                      type="number"
                      step={250}
                      value={habitsConfig.hydrationTargetMl}
                      onChange={(e) => updateHabits({ hydrationTargetMl: parseInt(e.target.value, 10) || 0 })}
                      className="w-full h-10 px-3 rounded-xl bg-black/50 border border-white/10 text-white text-xs focus:outline-none focus:border-sky-400 tabular-nums font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Bottle Size (ml)</label>
                    <input
                      type="number"
                      step={50}
                      value={habitsConfig.containerMl}
                      onChange={(e) => {
                        const bottleSize = parseInt(e.target.value, 10) || 700;
                        updateHabits({ 
                          containerMl: bottleSize,
                          quickAddAmounts: [bottleSize, Math.round(bottleSize / 2)]
                        });
                      }}
                      className="w-full h-10 px-3 rounded-xl bg-black/50 border border-white/10 text-white text-xs focus:outline-none focus:border-sky-400 tabular-nums font-bold"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 font-mono">
                  = {(habitsConfig.hydrationTargetMl / (habitsConfig.containerMl || 700)).toFixed(1)} bottles daily
                </p>
              </div>

              {/* Keystone Disciplines Customization */}
              <div className="space-y-3 p-4 rounded-2xl bg-[#0e131d] border border-white/5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="font-semibold text-white text-xs">Keystone Disciplines (Clean Day Matrix)</span>
                </div>
                <p className="text-xs text-slate-400">
                  Core disciplines must all be completed to achieve a Clean Day:
                </p>
                <div className="space-y-2 pt-1">
                  {habitsConfig.keystones.map((k, index) => {
                    return (
                      <div
                        key={k.id}
                        className="p-2.5 rounded-xl bg-black/30 border border-white/5 flex items-center justify-between gap-3"
                      >
                        <input
                          type="text"
                          value={k.label}
                          onChange={(e) => {
                            const updated = [...habitsConfig.keystones];
                            updated[index] = { ...updated[index], label: e.target.value };
                            updateHabits({ keystones: updated });
                          }}
                          className="flex-1 h-8 px-2.5 rounded-lg bg-black/50 border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-400"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            triggerHaptic(10);
                            const updated = [...habitsConfig.keystones];
                            updated[index] = { ...updated[index], isCore: !updated[index].isCore };
                            updateHabits({ keystones: updated });
                          }}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider font-mono border tap-target transition-all min-h-[36px] ${
                            k.isCore
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : 'bg-white/5 text-slate-400 border-white/10'
                          }`}
                        >
                          {k.isCore ? 'Core' : 'Optional'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Reading Pages Target */}
              <div className="space-y-2 p-4 rounded-2xl bg-[#0e131d] border border-white/5">
                <span className="eyebrow text-slate-400 font-mono text-[10px]">Deep Reading Sprint</span>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">Daily Pages Goal</span>
                  <div className="flex items-center gap-2 font-mono">
                    <input
                      type="number"
                      value={habitsConfig.readingTargetPages}
                      onChange={(e) =>
                        updateHabits({ readingTargetPages: parseInt(e.target.value, 10) || 0 })
                      }
                      className="w-20 h-9 px-3 rounded-xl bg-black/50 border border-white/10 text-white text-xs focus:outline-none focus:border-sky-400 tabular-nums font-bold text-center"
                    />
                    <span className="text-xs text-slate-400">pages/day</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="shrink-0 px-5 py-3 border-t border-white/10 bg-[#0e131d] flex items-center justify-between z-10">
          <span className="text-[11px] font-mono text-slate-400">
            Active: <span className="text-sky-400 font-bold">{activeProfile.name}</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="spring-btn px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-black font-extrabold text-xs uppercase tracking-wider shadow-md shadow-sky-500/20 tap-target"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
