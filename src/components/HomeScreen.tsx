import React from 'react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  Settings as SettingsIcon, 
  Sparkles, 
  Plus, 
  Heart, 
  ExternalLink, 
  Check, 
  Clock, 
  ShieldAlert,
  Sliders,
  History,
  HardDrive
} from 'lucide-react';
import { Wallpaper, AutomationState, UserSettings, IntervalPreset } from '../types/wallpaper';

interface HomeScreenProps {
  currentWallpaper: Wallpaper | null;
  state: AutomationState;
  remainingSeconds: number;
  settings: UserSettings;
  interests: string[];
  onToggleAutomation: () => void;
  onSkipNext: () => void;
  onSetIntervalPreset: (preset: IntervalPreset) => void;
  onOpenInterests: () => void;
  onOpenSettings: () => void;
  onOpenHistory: () => void;
  onOpenPipeline: () => void;
  onToggleFavorite: (wp: Wallpaper) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  currentWallpaper,
  state,
  remainingSeconds,
  settings,
  interests,
  onToggleAutomation,
  onSkipNext,
  onSetIntervalPreset,
  onOpenInterests,
  onOpenSettings,
  onOpenHistory,
  onOpenPipeline,
  onToggleFavorite,
}) => {
  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isRunning = state === 'RUNNING';

  const presets: { id: IntervalPreset; label: string; note?: string }[] = [
    { id: '1m', label: '1 min', note: 'Best effort' },
    { id: '5m', label: '5 min' },
    { id: '10m', label: '10 min' },
    { id: '30m', label: '30 min' },
    { id: '1h', label: '1 hour' },
    { id: 'custom', label: 'Custom' },
  ];

  return (
    <div id="wallflow-home-screen" className="flex flex-col h-full bg-neutral-950 text-neutral-200 overflow-y-auto select-none">
      {/* App Top Bar */}
      <div className="px-5 py-3.5 border-b border-neutral-900 flex items-center justify-between sticky top-0 bg-neutral-950/95 backdrop-blur-md z-10">
        <div className="flex items-center gap-2">
          <img src="/logo.png" className="w-7 h-7 rounded-lg shadow border border-neutral-800 object-cover" alt="AuraCanvas Logo" />
          <h1 className="text-base font-bold tracking-wider text-neutral-100 uppercase">AuraCanvas</h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="home-open-history-btn"
            onClick={onOpenHistory}
            className="p-2 rounded-xl text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 transition-colors"
            title="History & Favorites"
          >
            <History className="w-4 h-4" />
          </button>
          <button
            id="home-open-pipeline-btn"
            onClick={onOpenPipeline}
            className="p-2 rounded-xl text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 transition-colors"
            title="Storage & Pipeline"
          >
            <HardDrive className="w-4 h-4" />
          </button>
          <button
            id="home-open-settings-btn"
            onClick={onOpenSettings}
            className="p-2 rounded-xl text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 transition-colors"
            title="Settings"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-5 space-y-5 flex-1">
        {/* Status Pill Badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              {isRunning && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              )}
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  state === 'RUNNING'
                    ? 'bg-emerald-500'
                    : state === 'PAUSED'
                    ? 'bg-amber-500'
                    : state === 'WAITING_FOR_NETWORK'
                    ? 'bg-sky-500'
                    : 'bg-neutral-600'
                }`}
              />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
              {state === 'RUNNING' && 'Automation Active'}
              {state === 'PAUSED' && 'Automation Paused'}
              {state === 'WAITING_FOR_NETWORK' && 'Waiting for Network'}
              {state === 'STOPPED' && 'Automation Stopped'}
              {state === 'ERROR' && 'Engine Error'}
            </span>
          </div>

          <span className="text-[11px] font-mono text-neutral-500">
            {settings.applyTo === 'both' ? 'Home + Lock' : `${settings.applyTo} only`}
          </span>
        </div>

        {/* Current Wallpaper Preview Card (PRD Section 6) */}
        <div 
          id="current-wallpaper-card" 
          className="relative rounded-2xl overflow-hidden border border-neutral-800/80 bg-neutral-900 shadow-xl group aspect-[16/11]"
        >
          {currentWallpaper ? (
            <>
              <img
                src={currentWallpaper.downloadUrl}
                alt={currentWallpaper.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border mb-1 backdrop-blur-sm ${
                      currentWallpaper.provider === 'pinterest'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    }`}>
                      {currentWallpaper.provider === 'pinterest' ? '📌 ' : '🌄 '}
                      {currentWallpaper.category}
                    </span>
                    <h3 className="text-sm font-bold text-white truncate leading-tight drop-shadow-sm">
                      {currentWallpaper.title}
                    </h3>
                    <p className="text-xs text-neutral-300 truncate mt-0.5">
                      by{' '}
                      <a
                        href={currentWallpaper.authorUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:underline text-neutral-100 font-medium inline-flex items-center gap-0.5"
                      >
                        {currentWallpaper.authorName}
                        <ExternalLink className="w-2.5 h-2.5 ml-0.5 text-neutral-400" />
                      </a>{' '}
                      • <span className={`uppercase text-[10px] font-mono px-1.5 py-0.2 rounded ${
                        currentWallpaper.provider === 'pinterest'
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'bg-neutral-800 text-neutral-400'
                      }`}>
                        {currentWallpaper.provider}
                      </span>
                    </p>
                  </div>

                  <button
                    onClick={() => onToggleFavorite(currentWallpaper)}
                    className="p-2 rounded-xl bg-black/50 hover:bg-black/80 backdrop-blur-md text-white transition-colors"
                    title="Toggle favorite"
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        currentWallpaper.isFavorite ? 'fill-rose-500 text-rose-500' : 'text-neutral-300'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-neutral-500">
              <Sparkles className="w-6 h-6 mb-2" />
              <p className="text-xs">No active wallpaper</p>
            </div>
          )}
        </div>

        {/* Countdown & Action Buttons (PRD Section 6) */}
        <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800/80 text-center space-y-3">
          <div className="space-y-0.5">
            <span className="text-[11px] uppercase tracking-widest text-neutral-400 font-semibold">
              Next change in
            </span>
            <div 
              id="home-countdown-timer"
              className="text-3xl font-black font-mono tracking-tight text-neutral-100"
            >
              {formatCountdown(remainingSeconds)}
            </div>
            {settings.presetKey === '1m' && (
              <span className="text-[10px] text-amber-400 font-medium">
                1-min mode is best effort on Android
              </span>
            )}
          </div>

          <div className="flex gap-2">
            <button
              id="pause-resume-automation-btn"
              onClick={onToggleAutomation}
              className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md ${
                isRunning
                  ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-100 border border-neutral-700'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20'
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>Pause Automation</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start Automation</span>
                </>
              )}
            </button>

            <button
              id="manual-skip-next-btn"
              onClick={onSkipNext}
              className="py-3 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              title="Skip to next wallpaper now"
            >
              <SkipForward className="w-4 h-4" />
              <span>Next</span>
            </button>
          </div>
        </div>

        {/* Interval Selector (PRD Section 6) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Interval
            </label>
            <span className="text-[11px] font-mono text-emerald-400">
              Every {settings.intervalMinutes} min
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {presets.map((p) => {
              const isSelected = settings.presetKey === p.id;
              return (
                <button
                  key={p.id}
                  id={`interval-preset-${p.id}`}
                  onClick={() => onSetIntervalPreset(p.id)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-semibold border flex items-center justify-between transition-all ${
                    isSelected
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                      : 'bg-neutral-900/50 border-neutral-800/80 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700'
                  }`}
                >
                  <span className="truncate">{p.label}</span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isSelected ? 'bg-emerald-400' : 'bg-neutral-700'
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Interests Section (PRD Section 6 & 8) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Interests ({interests.length})
            </label>
            <button
              id="edit-interests-btn"
              onClick={onOpenInterests}
              className="text-xs text-emerald-400 hover:underline font-medium flex items-center gap-1"
            >
              <span>Manage</span>
              <Plus className="w-3 h-3" />
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {interests.map((interest) => (
              <span
                key={interest}
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-neutral-900 border border-neutral-800 text-neutral-300 inline-flex items-center gap-1"
              >
                <span>{interest}</span>
              </span>
            ))}
            <button
              onClick={onOpenInterests}
              className="px-2.5 py-1 rounded-lg text-xs font-medium border border-dashed border-neutral-700 text-neutral-400 hover:text-neutral-200 hover:border-neutral-500 transition-colors flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              <span>Add</span>
            </button>
          </div>
        </div>
      </div>

      {/* Persistent Status Bar at bottom of screen */}
      <div className="p-3 border-t border-neutral-900 bg-neutral-950/80 flex items-center justify-between text-[11px] text-neutral-400">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>Storage: 2 files max (Purging old files)</span>
        </span>
        <button
          onClick={onOpenSettings}
          className="text-neutral-300 hover:text-white flex items-center gap-1 font-medium"
        >
          <SettingsIcon className="w-3 h-3" />
          <span>Settings</span>
        </button>
      </div>
    </div>
  );
};
