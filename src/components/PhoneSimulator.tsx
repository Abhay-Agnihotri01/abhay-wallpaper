import React from 'react';
import { 
  Wifi, 
  WifiOff, 
  Battery, 
  BatteryCharging, 
  Signal, 
  Pause, 
  Play, 
  SkipForward, 
  Square, 
  Search, 
  Phone, 
  MessageSquare, 
  Chrome, 
  Camera,
  Download,
  Maximize2,
  Minimize2,
  Sparkles
} from 'lucide-react';
import { Wallpaper, AutomationState, DeviceSimulationState, UserSettings } from '../types/wallpaper';

interface PhoneSimulatorProps {
  currentWallpaper: Wallpaper | null;
  state: AutomationState;
  remainingSeconds: number;
  deviceState: DeviceSimulationState;
  settings: UserSettings;
  onUpdateDeviceState: (partial: Partial<DeviceSimulationState>) => void;
  onToggleAutomation: () => void;
  onSkipNext: () => void;
  children: React.ReactNode;
}

export const PhoneSimulator: React.FC<PhoneSimulatorProps> = ({
  currentWallpaper,
  state,
  remainingSeconds,
  deviceState,
  settings,
  onUpdateDeviceState,
  onToggleAutomation,
  onSkipNext,
  children,
}) => {
  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleDownload = () => {
    if (!currentWallpaper) return;
    const a = document.createElement('a');
    a.href = currentWallpaper.downloadUrl;
    a.target = '_blank';
    a.download = `${currentWallpaper.title || 'wallflow_wallpaper'}.jpg`;
    a.click();
  };

  return (
    <div id="phone-simulator-container" className="flex flex-col items-center justify-center p-2 sm:p-4">
      {/* Phone Hardware Mockup Frame */}
      <div 
        id="phone-device-bezel"
        className="relative w-[340px] sm:w-[370px] h-[700px] sm:h-[740px] bg-neutral-950 rounded-[48px] p-3 shadow-2xl border-4 border-neutral-800 ring-1 ring-neutral-700/50 flex flex-col overflow-hidden"
      >
        {/* Device Inner Screen */}
        <div 
          id="phone-screen-viewport"
          className="relative w-full h-full bg-neutral-950 rounded-[38px] overflow-hidden flex flex-col border border-neutral-800"
          style={{
            backgroundImage:
              deviceState.screenView !== 'app_view' && currentWallpaper
                ? `url(${currentWallpaper.downloadUrl})`
                : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Top Status Bar & Camera Punch-hole */}
          <div className="h-9 px-6 flex items-center justify-between text-[11px] font-mono font-medium z-30 select-none text-white/90 drop-shadow-md">
            <span>09:41</span>

            {/* Camera Cutout */}
            <div className="w-4 h-4 rounded-full bg-black border border-neutral-800/80 shadow-inner flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-neutral-900" />
            </div>

            {/* Status Icons */}
            <div className="flex items-center gap-1.5">
              {deviceState.networkType === 'wifi' && <Wifi className="w-3.5 h-3.5" />}
              {deviceState.networkType === 'cellular' && <Signal className="w-3.5 h-3.5" />}
              {deviceState.networkType === 'offline' && <WifiOff className="w-3.5 h-3.5 text-rose-400" />}

              <div className="flex items-center gap-0.5">
                <span className="text-[10px]">{deviceState.batteryLevel}%</span>
                {deviceState.isCharging ? (
                  <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Battery className="w-3.5 h-3.5" />
                )}
              </div>
            </div>
          </div>

          {/* Screen Content based on view */}
          <div className="flex-1 overflow-hidden relative flex flex-col">
            {deviceState.screenView === 'app_view' && (
              <div className="h-full overflow-hidden flex flex-col">
                {children}
              </div>
            )}

            {/* Lock Screen Mode with PRD Section 39 Persistent Notification */}
            {deviceState.screenView === 'lockscreen' && (
              <div className="h-full flex flex-col justify-between p-6 text-white backdrop-blur-[2px] bg-black/25">
                {/* Lockscreen Clock */}
                <div className="text-center pt-8 space-y-1">
                  <div className="text-6xl font-light tracking-tighter drop-shadow-lg">09:41</div>
                  <div className="text-xs tracking-wider uppercase font-medium text-neutral-200 drop-shadow">
                    Friday, September 4 • 24°C Sunny
                  </div>
                </div>

                {/* Android 14/15 Persistent Notification (PRD Section 39 & 40) */}
                <div className="space-y-4">
                  <div 
                    id="lockscreen-wallflow-notification"
                    className="p-3.5 rounded-2xl bg-neutral-900/85 backdrop-blur-xl border border-neutral-700/60 shadow-2xl space-y-2 text-neutral-100"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                          <Sparkles className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold leading-none">WallFlow</h4>
                          <span className="text-[10px] text-neutral-400">Automatic wallpapers active</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400">
                        Next: {formatCountdown(remainingSeconds)}
                      </span>
                    </div>

                    <p className="text-xs text-neutral-300">
                      Current:{' '}
                      <span className="font-semibold text-white">
                        {currentWallpaper ? currentWallpaper.title : 'Nature'}
                      </span>{' '}
                      ({currentWallpaper?.category || 'Nature'})
                    </p>

                    {/* Notification Actions (PRD Section 40) */}
                    <div className="flex items-center gap-1.5 pt-1 border-t border-neutral-800/80">
                      <button
                        onClick={onToggleAutomation}
                        className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                      >
                        {state === 'RUNNING' ? (
                          <>
                            <Pause className="w-3 h-3" />
                            <span>Pause</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3" />
                            <span>Resume</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={onSkipNext}
                        className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                      >
                        <SkipForward className="w-3 h-3" />
                        <span>Next Wallpaper</span>
                      </button>

                      <button
                        onClick={onToggleAutomation}
                        className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-rose-400 text-[11px] font-semibold ml-auto transition-colors"
                      >
                        <Square className="w-2.5 h-2.5" />
                        <span>Stop</span>
                      </button>
                    </div>
                  </div>

                  {/* Swipe to unlock indicator */}
                  <div className="text-center text-xs text-white/70 font-medium tracking-wide pb-2">
                    Swipe up to unlock
                  </div>
                </div>
              </div>
            )}

            {/* Home Screen Mode */}
            {deviceState.screenView === 'homescreen' && (
              <div className="h-full flex flex-col justify-between p-5 text-white bg-black/20">
                {/* Android Launcher Widget */}
                <div className="pt-4 space-y-4">
                  <div className="p-3.5 rounded-2xl bg-neutral-900/60 backdrop-blur-xl border border-white/10 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold">WallFlow Active</span>
                      <p className="text-[10px] text-neutral-300">
                        Changing every {settings.intervalMinutes}m • {formatCountdown(remainingSeconds)} left
                      </p>
                    </div>
                    <button
                      onClick={onSkipNext}
                      className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white"
                      title="Next"
                    >
                      <SkipForward className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Google Search Bar Mock */}
                  <div className="h-11 rounded-full bg-neutral-900/70 backdrop-blur-xl border border-white/15 px-4 flex items-center justify-between text-xs text-neutral-300 shadow-lg">
                    <span className="flex items-center gap-2">
                      <Search className="w-3.5 h-3.5 text-neutral-400" />
                      <span>Search apps, web...</span>
                    </span>
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
                      G
                    </span>
                  </div>
                </div>

                {/* Android App Launcher Dock */}
                <div className="pb-4">
                  <div className="grid grid-cols-4 gap-4 p-3 rounded-3xl bg-neutral-950/50 backdrop-blur-xl border border-white/10">
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-11 h-11 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md">
                        <Phone className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-medium text-neutral-200">Phone</span>
                    </div>

                    <div className="flex flex-col items-center gap-1">
                      <div className="w-11 h-11 rounded-2xl bg-sky-600 flex items-center justify-center text-white shadow-md">
                        <MessageSquare className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-medium text-neutral-200">Messages</span>
                    </div>

                    <div className="flex flex-col items-center gap-1">
                      <div className="w-11 h-11 rounded-2xl bg-amber-600 flex items-center justify-center text-white shadow-md">
                        <Chrome className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-medium text-neutral-200">Chrome</span>
                    </div>

                    <div 
                      onClick={() => onUpdateDeviceState({ screenView: 'app_view' })}
                      className="flex flex-col items-center gap-1 cursor-pointer"
                    >
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-900/40 ring-2 ring-emerald-400/50">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-bold text-emerald-400">WallFlow</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Android Navigation Pill Bar */}
          <div className="h-5 flex items-center justify-center z-30 select-none pb-1">
            <div className="w-28 h-1 bg-neutral-400/60 rounded-full" />
          </div>
        </div>
      </div>

      {/* Simulator Quick View Controls */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2 max-w-sm">
        <div className="p-1 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center gap-1 text-xs">
          <button
            id="sim-view-app-btn"
            onClick={() => onUpdateDeviceState({ screenView: 'app_view' })}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              deviceState.screenView === 'app_view'
                ? 'bg-emerald-500/20 text-emerald-300 font-semibold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            App UI
          </button>
          <button
            id="sim-view-lock-btn"
            onClick={() => onUpdateDeviceState({ screenView: 'lockscreen' })}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              deviceState.screenView === 'lockscreen'
                ? 'bg-emerald-500/20 text-emerald-300 font-semibold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Lock Screen
          </button>
          <button
            id="sim-view-home-btn"
            onClick={() => onUpdateDeviceState({ screenView: 'homescreen' })}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              deviceState.screenView === 'homescreen'
                ? 'bg-emerald-500/20 text-emerald-300 font-semibold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Home Screen
          </button>
        </div>

        {/* Download original image button */}
        {currentWallpaper && (
          <button
            onClick={handleDownload}
            className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
            title="Download full resolution wallpaper image"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Wallpaper</span>
          </button>
        )}
      </div>
    </div>
  );
};
