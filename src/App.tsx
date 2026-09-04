import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Smartphone, 
  Layers, 
  History, 
  Settings as SettingsIcon, 
  Code2, 
  HardDrive, 
  Wifi, 
  WifiOff, 
  Battery, 
  BatteryCharging, 
  Signal, 
  Play, 
  Pause, 
  SkipForward, 
  Heart, 
  Download, 
  ExternalLink,
  BookOpen,
  Info,
  Sliders,
  Maximize2
} from 'lucide-react';
import { wallpaperEngine } from './services/wallpaperEngine';
import { Wallpaper, IntervalPreset } from './types/wallpaper';
import { HomeScreen } from './components/HomeScreen';
import { PhoneSimulator } from './components/PhoneSimulator';
import { InterestsModal } from './components/InterestsModal';
import { SettingsModal } from './components/SettingsModal';
import { HistoryDrawer } from './components/HistoryDrawer';
import { PipelineVisualizer } from './components/PipelineVisualizer';
import { AndroidBlueprintModal } from './components/AndroidBlueprintModal';
import { OnboardingModal } from './components/OnboardingModal';

export default function App() {
  // Reactive state synced with wallpaperEngine
  const [, setTick] = useState(0);

  // Modals state
  const [isInterestsOpen, setIsInterestsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isBlueprintOpen, setIsBlueprintOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  // View tabs
  const [activeTab, setActiveTab] = useState<'simulator' | 'pipeline' | 'history' | 'blueprint'>('simulator');
  const [isAmbianceMode, setIsAmbianceMode] = useState(true);

  useEffect(() => {
    // Subscribe to engine state mutations
    const unsubscribe = wallpaperEngine.subscribe(() => {
      setTick((t) => t + 1);
    });

    // Check first launch
    const hasSeenOnboarding = localStorage.getItem('wallflow_onboarding_completed');
    if (!hasSeenOnboarding) {
      setIsOnboardingOpen(true);
    }

    return () => unsubscribe();
  }, []);

  const handleOnboardingComplete = (data: {
    interests: string[];
    intervalMinutes: number;
    wifiOnly: boolean;
  }) => {
    wallpaperEngine.setInterests(data.interests);
    wallpaperEngine.settings.intervalMinutes = data.intervalMinutes;
    wallpaperEngine.settings.wifiOnly = data.wifiOnly;
    wallpaperEngine.updateSettings({
      intervalMinutes: data.intervalMinutes,
      wifiOnly: data.wifiOnly,
      presetKey: 'custom',
    });
    localStorage.setItem('wallflow_onboarding_completed', 'true');
    setIsOnboardingOpen(false);
  };

  const handleClearCache = () => {
    wallpaperEngine.cachedFiles = [];
    if (wallpaperEngine.currentWallpaper) {
      wallpaperEngine.cachedFiles = [
        {
          slot: 'CURRENT',
          fileName: 'wallpaper_current.webp',
          wallpaper: wallpaperEngine.currentWallpaper,
          fileSizeBytes: wallpaperEngine.currentWallpaper.fileSizeBytes,
          cachedAt: Date.now(),
        },
      ];
    }
    wallpaperEngine.refillQueue();
  };

  const currentWp = wallpaperEngine.currentWallpaper;
  const currentCacheMb = (wallpaperEngine.getTotalCacheSizeKb() / 1024).toFixed(2);

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      id="wallflow-root-container" 
      className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans relative overflow-x-hidden selection:bg-emerald-500/30 selection:text-emerald-200"
      style={
        isAmbianceMode && currentWp
          ? {
              backgroundImage: `radial-gradient(ellipse at top, ${currentWp.color}40, #0a0a0c 80%)`,
            }
          : undefined
      }
    >
      {/* Top Main App Navigation Header */}
      <header className="border-b border-neutral-800/80 bg-neutral-950/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Brand Logo & Tagline */}
          <div className="flex items-center gap-3">
            <img src="/logo.png" className="w-9 h-9 rounded-xl shadow-md shadow-purple-950/50 border border-neutral-700/50 object-cover" alt="AuraCanvas Logo" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-white">AuraCanvas</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hidden sm:inline-block">
                  AI Wallpaper Engine
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 hidden sm:block">
                Aggressive Cache Cleanup • Next change in {formatCountdown(wallpaperEngine.remainingSeconds)}
              </p>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="flex items-center gap-1.5 bg-neutral-900/80 p-1 rounded-xl border border-neutral-800 text-xs font-medium">
            <button
              id="nav-tab-simulator"
              onClick={() => setActiveTab('simulator')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                activeTab === 'simulator'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Device Simulator</span>
            </button>

            <button
              id="nav-tab-pipeline"
              onClick={() => setActiveTab('pipeline')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                activeTab === 'pipeline'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <HardDrive className="w-3.5 h-3.5" />
              <span>Storage & Pipeline</span>
            </button>

            <button
              id="nav-tab-blueprint"
              onClick={() => setIsBlueprintOpen(true)}
              className="px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
            >
              <Code2 className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Android Blueprint</span>
            </button>
          </nav>

          {/* Top Right Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              id="open-settings-top-btn"
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
              title="Settings"
            >
              <SettingsIcon className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsOnboardingOpen(true)}
              className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors hidden sm:block"
              title="Re-run Onboarding Guide"
            >
              <BookOpen className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Persistent Automation Status Banner */}
      <div className="bg-neutral-900/40 border-b border-neutral-800/60 py-2 px-4 text-xs select-none">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 font-medium">
              <span
                className={`w-2 h-2 rounded-full ${
                  wallpaperEngine.state === 'RUNNING'
                    ? 'bg-emerald-400 animate-pulse'
                    : wallpaperEngine.state === 'PAUSED'
                    ? 'bg-amber-400'
                    : 'bg-sky-400'
                }`}
              />
              <span className="text-neutral-300">
                State:{' '}
                <span className="font-semibold text-white">{wallpaperEngine.state}</span>
              </span>
            </span>

            <span className="text-neutral-600">•</span>

            <span className="text-neutral-400">
              Interval:{' '}
              <span className="text-neutral-200 font-mono">
                {wallpaperEngine.settings.intervalMinutes}m
              </span>
            </span>

            <span className="text-neutral-600 hidden sm:inline">•</span>

            <span className="text-neutral-400 hidden sm:inline">
              Cache Resident:{' '}
              <span className="text-emerald-400 font-mono font-semibold">
                {currentCacheMb} MB / {wallpaperEngine.settings.maxCacheMb} MB
              </span>
            </span>
          </div>

          {/* Quick inline controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => wallpaperEngine.toggleAutomation()}
              className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium text-[11px] flex items-center gap-1 transition-colors"
            >
              {wallpaperEngine.state === 'RUNNING' ? (
                <>
                  <Pause className="w-3 h-3" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3" />
                  <span>Start</span>
                </>
              )}
            </button>

            <button
              onClick={() => wallpaperEngine.triggerNextWallpaper()}
              className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium text-[11px] flex items-center gap-1 transition-colors"
            >
              <SkipForward className="w-3 h-3" />
              <span>Next</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main App Body */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6">
        {activeTab === 'simulator' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left/Main Column: Phone Mockup Frame */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <PhoneSimulator
                currentWallpaper={wallpaperEngine.currentWallpaper}
                state={wallpaperEngine.state}
                remainingSeconds={wallpaperEngine.remainingSeconds}
                deviceState={wallpaperEngine.deviceState}
                settings={wallpaperEngine.settings}
                onUpdateDeviceState={(p) => wallpaperEngine.updateDeviceState(p)}
                onToggleAutomation={() => wallpaperEngine.toggleAutomation()}
                onSkipNext={() => wallpaperEngine.triggerNextWallpaper()}
              >
                <HomeScreen
                  currentWallpaper={wallpaperEngine.currentWallpaper}
                  state={wallpaperEngine.state}
                  remainingSeconds={wallpaperEngine.remainingSeconds}
                  settings={wallpaperEngine.settings}
                  interests={wallpaperEngine.interests}
                  onToggleAutomation={() => wallpaperEngine.toggleAutomation()}
                  onSkipNext={() => wallpaperEngine.triggerNextWallpaper()}
                  onSetIntervalPreset={(p) => wallpaperEngine.setIntervalPreset(p)}
                  onOpenInterests={() => setIsInterestsOpen(true)}
                  onOpenSettings={() => setIsSettingsOpen(true)}
                  onOpenHistory={() => setIsHistoryOpen(true)}
                  onOpenPipeline={() => setActiveTab('pipeline')}
                  onToggleFavorite={(wp) => wallpaperEngine.toggleFavorite(wp)}
                />
              </PhoneSimulator>
            </div>

            {/* Right Column: Interactive Companion Console & Testing Panel */}
            <div className="lg:col-span-7 space-y-6">
              {/* Card 1: Active Wallpaper Spotlight */}
              {currentWp && (
                <div className="p-6 rounded-3xl bg-neutral-900/80 border border-neutral-800 backdrop-blur-xl shadow-xl space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          {currentWp.category}
                        </span>
                        <span className="text-xs text-neutral-400 uppercase font-mono tracking-wider">
                          {currentWp.provider}
                        </span>
                      </div>
                      <h2 className="text-xl font-bold text-white leading-snug">{currentWp.title}</h2>
                      <p className="text-xs text-neutral-400 mt-1">
                        Photograph by{' '}
                        <a
                          href={currentWp.authorUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-neutral-200 hover:underline inline-flex items-center gap-0.5 font-medium"
                        >
                          {currentWp.authorName}
                          <ExternalLink className="w-2.5 h-2.5 ml-0.5 text-neutral-400" />
                        </a>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => wallpaperEngine.toggleFavorite(currentWp)}
                        className="p-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
                        title="Favorite"
                      >
                        <Heart
                          className={`w-4 h-4 ${
                            currentWp.isFavorite ? 'fill-rose-500 text-rose-500' : 'text-neutral-300'
                          }`}
                        />
                      </button>

                      <a
                        href={currentWp.downloadUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors flex items-center gap-1 text-xs font-medium"
                        title="Download Original"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download</span>
                      </a>
                    </div>
                  </div>

                  {/* Android Native Resolution & Optimization Specs */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-neutral-800 text-xs">
                    <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800/80">
                      <span className="text-[10px] text-neutral-500 uppercase tracking-wider block font-mono">Target Crop</span>
                      <span className="font-semibold text-neutral-200 mt-0.5 block">1080 × 2400 (9:20)</span>
                    </div>

                    <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800/80">
                      <span className="text-[10px] text-neutral-500 uppercase tracking-wider block font-mono">Compressed Size</span>
                      <span className="font-semibold text-emerald-400 mt-0.5 block">
                        {(currentWp.fileSizeBytes / 1024).toFixed(0)} KB (WebP)
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800/80">
                      <span className="text-[10px] text-neutral-500 uppercase tracking-wider block font-mono">Screen Target</span>
                      <span className="font-semibold text-neutral-200 mt-0.5 block capitalize">
                        {wallpaperEngine.settings.applyTo} Screen
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800/80">
                      <span className="text-[10px] text-neutral-500 uppercase tracking-wider block font-mono">Cache Slots</span>
                      <span className="font-semibold text-sky-400 mt-0.5 block">1 Resident / 1 Buffer</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Card 2: Device Condition Simulator (Testing Battery & Network Constraints) */}
              <div className="p-5 rounded-3xl bg-neutral-900/80 border border-neutral-800 backdrop-blur-xl shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-bold text-neutral-100">Simulate Android Device Conditions</h3>
                  </div>
                  <span className="text-[11px] text-neutral-500">Test PRD Sec 22-25 offline/battery state logic</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Network Simulator */}
                  <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-neutral-300">Device Connection:</span>
                      <span className="font-mono text-emerald-400 uppercase text-[10px]">
                        {wallpaperEngine.deviceState.networkType}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        onClick={() => wallpaperEngine.updateDeviceState({ networkType: 'wifi' })}
                        className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 border transition-all ${
                          wallpaperEngine.deviceState.networkType === 'wifi'
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                            : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                        }`}
                      >
                        <Wifi className="w-3 h-3" />
                        <span>Wi-Fi</span>
                      </button>

                      <button
                        onClick={() => wallpaperEngine.updateDeviceState({ networkType: 'cellular' })}
                        className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 border transition-all ${
                          wallpaperEngine.deviceState.networkType === 'cellular'
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                            : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                        }`}
                      >
                        <Signal className="w-3 h-3" />
                        <span>Cellular</span>
                      </button>

                      <button
                        onClick={() => wallpaperEngine.updateDeviceState({ networkType: 'offline' })}
                        className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 border transition-all ${
                          wallpaperEngine.deviceState.networkType === 'offline'
                            ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                            : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                        }`}
                      >
                        <WifiOff className="w-3 h-3" />
                        <span>Offline</span>
                      </button>
                    </div>
                  </div>

                  {/* Battery Simulator */}
                  <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-neutral-300">Battery Level:</span>
                      <span className="font-mono text-amber-400 text-xs font-semibold">
                        {wallpaperEngine.deviceState.batteryLevel}% {wallpaperEngine.deviceState.isCharging && '(Charging)'}
                      </span>
                    </div>

                    <input
                      type="range"
                      min="5"
                      max="100"
                      value={wallpaperEngine.deviceState.batteryLevel}
                      onChange={(e) =>
                        wallpaperEngine.updateDeviceState({ batteryLevel: parseInt(e.target.value, 10) })
                      }
                      className="w-full accent-amber-500"
                    />

                    <div className="flex items-center justify-between text-[10px] text-neutral-500">
                      <span>Threshold: {wallpaperEngine.settings.batteryThreshold}%</span>
                      <button
                        onClick={() =>
                          wallpaperEngine.updateDeviceState({
                            isCharging: !wallpaperEngine.deviceState.isCharging,
                          })
                        }
                        className="text-neutral-400 hover:text-white underline"
                      >
                        Toggle {wallpaperEngine.deviceState.isCharging ? 'Unplug' : 'Plug In'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: Quick Navigation to Submodules */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => setIsInterestsOpen(true)}
                  className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 hover:border-neutral-700 text-left transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-neutral-200">Interests Pool</h4>
                  <p className="text-[11px] text-neutral-400 mt-0.5">{wallpaperEngine.interests.length} keywords active</p>
                </button>

                <button
                  onClick={() => setIsHistoryOpen(true)}
                  className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 hover:border-neutral-700 text-left transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                    <History className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-neutral-200">Wallpaper History</h4>
                  <p className="text-[11px] text-neutral-400 mt-0.5">{wallpaperEngine.history.length} metadata records</p>
                </button>

                <button
                  onClick={() => setIsBlueprintOpen(true)}
                  className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 hover:border-neutral-700 text-left transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                    <Code2 className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-neutral-200">Android Studio Blueprint</h4>
                  <p className="text-[11px] text-neutral-400 mt-0.5">Kotlin & 12 Antigravity Prompts</p>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Storage & Pipeline Inspector */}
        {activeTab === 'pipeline' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Pipeline & Storage Architecture</h2>
                <p className="text-xs text-neutral-400">
                  Inspect real-time cache buffers, API rate-limit queue, and system execution logs
                </p>
              </div>
              <button
                onClick={() => setActiveTab('simulator')}
                className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-xl transition-colors"
              >
                Back to Simulator
              </button>
            </div>

            <PipelineVisualizer
              cachedFiles={wallpaperEngine.cachedFiles}
              currentWallpaper={wallpaperEngine.currentWallpaper}
              nextWallpaperBuffer={wallpaperEngine.nextWallpaperBuffer}
              queue={wallpaperEngine.queue}
              logs={wallpaperEngine.logs}
              maxCacheMb={wallpaperEngine.settings.maxCacheMb}
              onManualTrigger={() => wallpaperEngine.triggerNextWallpaper()}
              onRefillQueue={() => wallpaperEngine.refillQueue()}
            />
          </div>
        )}
      </main>

      {/* Modals & Drawers */}
      <InterestsModal
        isOpen={isInterestsOpen}
        onClose={() => setIsInterestsOpen(false)}
        selectedInterests={wallpaperEngine.interests}
        onAddInterest={(tag) => wallpaperEngine.addInterest(tag)}
        onRemoveInterest={(tag) => wallpaperEngine.removeInterest(tag)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={wallpaperEngine.settings}
        onUpdateSettings={(p) => wallpaperEngine.updateSettings(p)}
        onClearCache={handleClearCache}
        currentCacheMb={currentCacheMb}
      />

      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={wallpaperEngine.history}
        favorites={wallpaperEngine.favorites}
        onToggleFavorite={(wp) => wallpaperEngine.toggleFavorite(wp)}
        onApplyWallpaper={(wp) => {
          wallpaperEngine.applyWallpaperManually(wp);
          setIsHistoryOpen(false);
        }}
      />

      <AndroidBlueprintModal
        isOpen={isBlueprintOpen}
        onClose={() => setIsBlueprintOpen(false)}
      />

      <OnboardingModal
        isOpen={isOnboardingOpen}
        onComplete={handleOnboardingComplete}
      />
    </div>
  );
}
