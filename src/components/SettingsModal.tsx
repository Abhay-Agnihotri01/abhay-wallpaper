import React, { useState } from 'react';
import { 
  X, 
  Settings as SettingsIcon, 
  Wifi, 
  BatteryCharging, 
  Sliders, 
  Image as ImageIcon, 
  Layers, 
  Key, 
  ShieldAlert, 
  Trash2, 
  Check,
  Rss,
  Plus,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { UserSettings, IntervalPreset, PinterestFeedConfig } from '../types/wallpaper';
import { PRESET_TO_MINUTES, wallpaperEngine } from '../services/wallpaperEngine';
import { providerRegistry } from '../services/providers';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (partial: Partial<UserSettings>) => void;
  onClearCache: () => void;
  currentCacheMb: string;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onClearCache,
  currentCacheMb,
}) => {
  const [customMin, setCustomMin] = useState(settings.intervalMinutes.toString());
  const [unsplashKey, setUnsplashKey] = useState(() => providerRegistry.getUnsplashApiKey());
  const [showKeySaved, setShowKeySaved] = useState(false);
  const [pexelsKey, setPexelsKey] = useState(() => providerRegistry.getPexelsApiKey());
  const [showPexelsSaved, setShowPexelsSaved] = useState(false);

  // Pinterest RSS multi-feed state
  const [newFeedUrl, setNewFeedUrl] = useState('');
  const [isAddingFeed, setIsAddingFeed] = useState(false);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [feedSuccess, setFeedSuccess] = useState<string | null>(null);
  const [isSyncingFeeds, setIsSyncingFeeds] = useState(false);

  const feeds = settings.pinterestFeeds || wallpaperEngine.settings.pinterestFeeds || [];
  const activeFeedsCount = feeds.filter((f) => f.enabled).length;

  if (!isOpen) return null;

  const handleCustomIntervalChange = (val: string) => {
    setCustomMin(val);
    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= 1) {
      onUpdateSettings({
        presetKey: 'custom',
        intervalMinutes: num,
      });
    }
  };

  const handlePresetSelect = (preset: IntervalPreset) => {
    const minutes = PRESET_TO_MINUTES[preset];
    onUpdateSettings({
      presetKey: preset,
      intervalMinutes: minutes,
    });
  };

  const handleSaveKey = () => {
    providerRegistry.setUnsplashApiKey(unsplashKey);
    setShowKeySaved(true);
    setTimeout(() => setShowKeySaved(false), 2500);
  };

  const handleSavePexelsKey = () => {
    providerRegistry.setPexelsApiKey(pexelsKey);
    setShowPexelsSaved(true);
    setTimeout(() => setShowPexelsSaved(false), 2500);
  };

  const toggleProvider = (providerId: string, checked: boolean) => {
    let nextList: string[];
    if (checked) {
      nextList = [...settings.activeProviders, providerId];
    } else {
      nextList = settings.activeProviders.filter((p) => p !== providerId);
      // Ensure at least one provider is selected
      if (nextList.length === 0) {
        nextList = ['curated'];
      }
    }
    onUpdateSettings({ activeProviders: nextList });
  };

  const handleAddFeed = async (urlInput?: string) => {
    const url = (urlInput || newFeedUrl).trim();
    if (!url) return;
    setFeedError(null);
    setFeedSuccess(null);
    setIsAddingFeed(true);
    try {
      const added = await wallpaperEngine.addPinterestFeed(url);
      setNewFeedUrl('');
      setFeedSuccess(`Connected "${added.title}" (${added.itemCount || 0} wallpapers ready)`);
      setTimeout(() => setFeedSuccess(null), 3500);
      onUpdateSettings({
        activeProviders: wallpaperEngine.settings.activeProviders,
        pinterestFeeds: wallpaperEngine.settings.pinterestFeeds,
      });
    } catch (err: any) {
      setFeedError(err.message || 'Failed to add Pinterest board.');
    } finally {
      setIsAddingFeed(false);
    }
  };

  const handleRemoveFeed = (id: string) => {
    wallpaperEngine.removePinterestFeed(id);
    onUpdateSettings({
      pinterestFeeds: wallpaperEngine.settings.pinterestFeeds,
    });
  };

  const handleToggleFeed = (id: string, enabled: boolean) => {
    wallpaperEngine.togglePinterestFeed(id, enabled);
    onUpdateSettings({
      pinterestFeeds: wallpaperEngine.settings.pinterestFeeds,
    });
  };

  const handleSyncFeeds = async () => {
    setIsSyncingFeeds(true);
    setFeedError(null);
    try {
      await wallpaperEngine.syncAllPinterestFeeds();
      onUpdateSettings({
        pinterestFeeds: wallpaperEngine.settings.pinterestFeeds,
      });
      setFeedSuccess('All Pinterest feeds synchronized!');
      setTimeout(() => setFeedSuccess(null), 3000);
    } catch (err: any) {
      setFeedError('Sync failed: ' + (err.message || 'Check network'));
    } finally {
      setIsSyncingFeeds(false);
    }
  };

  return (
    <div id="settings-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        id="settings-modal-card"
        className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] text-neutral-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-neutral-800 text-neutral-200 flex items-center justify-center">
              <SettingsIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-neutral-100">AuraCanvas Settings</h2>
              <p className="text-xs text-neutral-400">Configure scheduling, storage, battery, and image sources</p>
            </div>
          </div>
          <button
            id="close-settings-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Section 1: Scheduling & Interval */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              <Sliders className="w-3.5 h-3.5 text-emerald-400" />
              <span>Wallpaper Interval Presets</span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {(['1m', '2m', '5m', '10m', '15m', '30m', '1h', '2h', '6h', '12h', 'daily'] as IntervalPreset[]).map(
                (preset) => {
                  const isSelected = settings.presetKey === preset;
                  return (
                    <button
                      key={preset}
                      onClick={() => handlePresetSelect(preset)}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                        isSelected
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                          : 'bg-neutral-950/60 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                      }`}
                    >
                      {preset === 'daily' ? 'Daily' : preset}
                    </button>
                  );
                }
              )}
            </div>

            {/* Custom Interval */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-950/60 border border-neutral-800">
              <span className="text-xs text-neutral-300 font-medium">Custom Interval:</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="1440"
                  value={customMin}
                  onChange={(e) => handleCustomIntervalChange(e.target.value)}
                  className="w-20 bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1 text-xs text-neutral-100 text-center font-mono focus:border-emerald-500 focus:outline-none"
                />
                <span className="text-xs text-neutral-400">minutes</span>
              </div>
            </div>

            {/* Technical Caveat (PRD Section 7) */}
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300/90 leading-relaxed flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Android Technical Caveat (PRD Sec 7):</span> WorkManager periodic work enforces a 15-minute minimum. 1-minute & 2-minute modes run via high-frequency AlarmManager / foreground service on Android and are considered best-effort depending on device manufacturer battery killers.
              </div>
            </div>
          </div>

          {/* Section 2: Target Screens (PRD Section 21) */}
          <div className="space-y-3 pt-4 border-t border-neutral-800">
            <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              <span>Apply Wallpaper To</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'both', label: 'Home & Lock Screen' },
                { key: 'home', label: 'Home Screen Only' },
                { key: 'lock', label: 'Lock Screen Only' },
              ].map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => onUpdateSettings({ applyTo: opt.key as any })}
                  className={`py-2 px-3 rounded-xl text-xs font-medium border text-center transition-all ${
                    settings.applyTo === opt.key
                      ? 'bg-sky-500/20 border-sky-500/50 text-sky-300'
                      : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Section 3: Network & Wi-Fi only (PRD Section 24) */}
          <div className="space-y-3 pt-4 border-t border-neutral-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4 text-emerald-400" />
                <div>
                  <h4 className="text-xs font-semibold text-neutral-200">Wi-Fi Only Mode</h4>
                  <p className="text-[11px] text-neutral-400">Do not download new wallpapers while on cellular data</p>
                </div>
              </div>
              <button
                onClick={() => onUpdateSettings({ wifiOnly: !settings.wifiOnly })}
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  settings.wifiOnly ? 'bg-emerald-500' : 'bg-neutral-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    settings.wifiOnly ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Section 4: Battery Saver (PRD Section 25) */}
          <div className="space-y-3 pt-4 border-t border-neutral-800">
            <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              <BatteryCharging className="w-3.5 h-3.5 text-amber-400" />
              <span>Battery Saver Mode</span>
            </div>
            <p className="text-xs text-neutral-400">Pause background wallpaper downloads when battery drops below:</p>
            <div className="grid grid-cols-4 gap-2">
              {[
                { val: 0, label: 'Never' },
                { val: 10, label: 'Below 10%' },
                { val: 20, label: 'Below 20%' },
                { val: 30, label: 'Below 30%' },
              ].map((opt) => (
                <button
                  key={opt.val}
                  onClick={() => onUpdateSettings({ batteryThreshold: opt.val })}
                  className={`py-2 px-2 text-xs font-medium rounded-xl border text-center transition-all ${
                    settings.batteryThreshold === opt.val
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                      : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Section 5: Image Sources (PRD Section 11, 12) */}
          <div className="space-y-4 pt-4 border-t border-neutral-800">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
                  <span>Active Wallpaper Providers</span>
                </div>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  Evaluated in priority order: Unsplash first, then Pexels, then Curated
                </p>
              </div>
              <span className="text-[11px] text-neutral-400">
                {settings.activeProviders.length} active source{settings.activeProviders.length > 1 ? 's' : ''}
              </span>
            </div>

            <div className="space-y-2.5">
              {/* Unsplash Provider Toggle */}
              <div 
                onClick={() => toggleProvider('unsplash', !settings.activeProviders.includes('unsplash'))}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  settings.activeProviders.includes('unsplash')
                    ? 'bg-neutral-950/80 border-emerald-500/40 shadow-sm'
                    : 'bg-neutral-950/40 border-neutral-800/80 opacity-70 hover:opacity-100'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-neutral-100">Unsplash</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-medium">
                      Official API
                    </span>
                    {providerRegistry.getUnsplashApiKey() && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20">
                        Key Configured
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    High-resolution photographs with official download attribution telemetry.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.activeProviders.includes('unsplash')}
                  onChange={(e) => toggleProvider('unsplash', e.target.checked)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
              </div>

              {/* Pexels Provider Toggle */}
              <div 
                onClick={() => toggleProvider('pexels', !settings.activeProviders.includes('pexels'))}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  settings.activeProviders.includes('pexels')
                    ? 'bg-neutral-950/80 border-emerald-500/40 shadow-sm'
                    : 'bg-neutral-950/40 border-neutral-800/80 opacity-70 hover:opacity-100'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-neutral-100">Pexels.com</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-medium">
                      Official API (200 req/hr)
                    </span>
                    {providerRegistry.getPexelsApiKey() && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20">
                        Key Configured
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    Worldwide high-quality curated stock photography with instant portrait search.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.activeProviders.includes('pexels')}
                  onChange={(e) => toggleProvider('pexels', e.target.checked)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
              </div>

              {/* Curated Photography Catalog Toggle */}
              <div 
                onClick={() => toggleProvider('curated', !settings.activeProviders.includes('curated'))}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  settings.activeProviders.includes('curated')
                    ? 'bg-neutral-950/80 border-emerald-500/40 shadow-sm'
                    : 'bg-neutral-950/40 border-neutral-800/80 opacity-70 hover:opacity-100'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-neutral-100">AuraCanvas Curated Photography</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-medium">
                      Zero-Latency Offline
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    Authentic photographer portfolio with verified temple, nature, and architectural works.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.activeProviders.includes('curated')}
                  onChange={(e) => toggleProvider('curated', e.target.checked)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
              </div>

              {/* Pinterest Provider Toggle */}
              <div 
                onClick={() => toggleProvider('pinterest', !settings.activeProviders.includes('pinterest'))}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  settings.activeProviders.includes('pinterest')
                    ? 'bg-neutral-950/80 border-rose-500/40 shadow-sm'
                    : 'bg-neutral-950/40 border-neutral-800/80 opacity-70 hover:opacity-100'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-neutral-100">Pinterest (RSS Feeds)</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 font-medium">
                      Free RSS • No API Key Needed
                    </span>
                    {activeFeedsCount > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                        {activeFeedsCount} board{activeFeedsCount > 1 ? 's' : ''} active
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    High-resolution wallpaper images extracted automatically from public Pinterest boards via RSS.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.activeProviders.includes('pinterest')}
                  onChange={(e) => toggleProvider('pinterest', e.target.checked)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-4 h-4 accent-rose-500 rounded cursor-pointer"
                />
              </div>
            </div>

            {/* Pinterest Multi-Feed Management Card */}
            <div className="p-4 rounded-xl bg-neutral-950/80 border border-rose-500/30 space-y-3.5 shadow-lg shadow-black/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
                    <Rss className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-neutral-100 flex items-center gap-1.5">
                      <span>Pinterest Board Feeds</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono">
                        {feeds.length} added
                      </span>
                    </h4>
                    <p className="text-[11px] text-neutral-400">
                      Add multiple Pinterest boards to load lots of wallpapers without API keys.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleSyncFeeds}
                  disabled={isSyncingFeeds || feeds.length === 0}
                  className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  title="Refresh and sync wallpapers from all Pinterest boards"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingFeeds ? 'animate-spin text-rose-400' : ''}`} />
                  <span>{isSyncingFeeds ? 'Syncing...' : 'Sync Feeds'}</span>
                </button>
              </div>

              {/* Feed URL Input Form */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Paste Pinterest board URL (e.g. https://in.pinterest.com/maity_kk1312/lord-krishna-images/)..."
                    value={newFeedUrl}
                    onChange={(e) => {
                      setNewFeedUrl(e.target.value);
                      setFeedError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddFeed();
                    }}
                    className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-rose-500 transition-colors"
                  />
                  <button
                    onClick={() => handleAddFeed()}
                    disabled={isAddingFeed || !newFeedUrl.trim()}
                    className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-xs font-medium text-white rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
                  >
                    {isAddingFeed ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                    <span>{isAddingFeed ? 'Connecting...' : 'Add Board'}</span>
                  </button>
                </div>

                {/* Error Banner */}
                {feedError && (
                  <div className="p-2.5 rounded-lg bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                    <span className="flex-1 leading-snug">{feedError}</span>
                  </div>
                )}

                {/* Success Banner */}
                {feedSuccess && (
                  <div className="p-2.5 rounded-lg bg-emerald-950/50 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                    <span className="flex-1 leading-snug">{feedSuccess}</span>
                  </div>
                )}

                {/* Preset suggestions to add with one click */}
                <div className="pt-1 flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-neutral-500">Quick add popular boards:</span>
                  <button
                    type="button"
                    onClick={() => handleAddFeed('https://in.pinterest.com/maity_kk1312/lord-krishna-images/')}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-700/60 hover:border-neutral-600 transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-2.5 h-2.5 text-rose-400" />
                    Lord Krishna Images
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddFeed('https://www.pinterest.com/divyabhaktiofficial/lord-shiva-hd-wallpapers/')}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-700/60 hover:border-neutral-600 transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-2.5 h-2.5 text-rose-400" />
                    Lord Shiva HD
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddFeed('https://www.pinterest.com/wallpaperaccess/feed.rss')}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-700/60 hover:border-neutral-600 transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-2.5 h-2.5 text-rose-400" />
                    Wallpaper Access
                  </button>
                </div>
              </div>

              {/* Added Feeds List */}
              <div className="space-y-2 pt-2 border-t border-neutral-800/80">
                <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
                  Configured Pinterest Boards ({feeds.length})
                </span>

                {feeds.length === 0 ? (
                  <div className="p-3 rounded-lg bg-neutral-900/50 border border-neutral-800 text-neutral-500 text-xs text-center">
                    No Pinterest boards added yet. Paste a board link or click a preset above to load lots of wallpapers!
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {feeds.map((feed) => (
                      <div
                        key={feed.id}
                        className={`p-2.5 rounded-lg border transition-all flex items-center justify-between gap-3 ${
                          feed.enabled
                            ? 'bg-neutral-900 border-neutral-800'
                            : 'bg-neutral-900/40 border-neutral-800/50 opacity-60'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-neutral-200 truncate">
                              {feed.title}
                            </span>
                            {feed.itemCount !== undefined && feed.itemCount > 0 && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20 font-mono shrink-0">
                                {feed.itemCount} wallpapers
                              </span>
                            )}
                            {feed.status === 'loading' && (
                              <span className="text-[10px] text-amber-400 flex items-center gap-1">
                                <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Fetching
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-neutral-500 truncate font-mono max-w-[240px]">
                              {feed.url}
                            </span>
                            <a
                              href={feed.url.replace(/\.rss$/, '')}
                              target="_blank"
                              rel="noreferrer"
                              className="text-neutral-500 hover:text-neutral-300 transition-colors"
                              title="View board on Pinterest"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <input
                            type="checkbox"
                            checked={feed.enabled}
                            onChange={(e) => handleToggleFeed(feed.id, e.target.checked)}
                            title={feed.enabled ? 'Disable this board' : 'Enable this board'}
                            className="w-4 h-4 accent-rose-500 rounded cursor-pointer"
                          />
                          <button
                            onClick={() => handleRemoveFeed(feed.id)}
                            className="p-1 text-neutral-500 hover:text-rose-400 hover:bg-neutral-800 rounded transition-colors"
                            title="Remove board"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Provider API Credentials Panel */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                <span>Provider API Keys</span>
              </div>

              {/* Pexels API Key */}
              <div className="p-3.5 rounded-xl bg-neutral-950/70 border border-neutral-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-xs font-medium text-neutral-200">
                    <span>Pexels API Key</span>
                  </label>
                  {providerRegistry.getPexelsApiKey() ? (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      Live Pexels Connected
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      Key Needed for Pexels Search
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Paste free Pexels API key (e.g. 563492ad6f917...)..."
                    value={pexelsKey}
                    onChange={(e) => setPexelsKey(e.target.value)}
                    className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-xs font-mono text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    onClick={handleSavePexelsKey}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-xs font-medium text-white rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                  >
                    {showPexelsSaved ? <Check className="w-3.5 h-3.5" /> : null}
                    {showPexelsSaved ? 'Saved' : 'Save Key'}
                  </button>
                  {pexelsKey && (
                    <button
                      onClick={() => {
                        setPexelsKey('');
                        providerRegistry.setPexelsApiKey('');
                      }}
                      className="px-2.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-400 hover:text-neutral-200 rounded-lg transition-colors"
                      title="Clear Pexels Key"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="text-[11px] text-neutral-400 leading-relaxed bg-neutral-900/60 p-2.5 rounded-lg border border-neutral-800/80">
                  <p>
                    Get a free instant key at <a href="https://www.pexels.com/api/" target="_blank" rel="noreferrer" className="text-emerald-400 underline hover:text-emerald-300">pexels.com/api</a> (free tier allows 200 requests/hour and 20,000 requests/month).
                  </p>
                </div>
              </div>

              {/* Unsplash API Key */}
              <div className="p-3.5 rounded-xl bg-neutral-950/70 border border-neutral-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-xs font-medium text-neutral-200">
                    <span>Unsplash Access Key (Client ID)</span>
                  </label>
                  {providerRegistry.getUnsplashApiKey() ? (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      Access Key Configured
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
                      Curated Fallback Active
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Paste your Unsplash Access Key here..."
                    value={unsplashKey}
                    onChange={(e) => setUnsplashKey(e.target.value)}
                    className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-xs font-mono text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    onClick={handleSaveKey}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-xs font-medium text-white rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                  >
                    {showKeySaved ? <Check className="w-3.5 h-3.5" /> : null}
                    {showKeySaved ? 'Saved' : 'Save Key'}
                  </button>
                  {unsplashKey && (
                    <button
                      onClick={() => {
                        setUnsplashKey('');
                        providerRegistry.setUnsplashApiKey('');
                      }}
                      className="px-2.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-400 hover:text-neutral-200 rounded-lg transition-colors"
                      title="Clear Key"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="text-[11px] text-neutral-400 leading-relaxed bg-neutral-900/60 p-2.5 rounded-lg border border-neutral-800/80">
                  <span className="text-neutral-300 font-medium">Unsplash Developer Key:</span>
                  <p className="mt-0.5 text-neutral-400">
                    Use the <strong className="text-amber-300 font-mono">Access Key</strong> (e.g. <span className="font-mono text-neutral-300">0zVKbuTbwI8...</span>) shown under <em>Keys → Access Key</em> in your Unsplash Developer app.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 6: Storage Cleanup (PRD Section 16) */}
          <div className="pt-4 border-t border-neutral-800 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-semibold text-neutral-200">Device Wallpaper Cache</h4>
              <p className="text-[11px] text-neutral-400">
                Currently resident: <span className="font-mono text-emerald-400">{currentCacheMb} MB</span> (Capped at {settings.maxCacheMb} MB)
              </p>
            </div>
            <button
              id="clear-cache-btn"
              onClick={onClearCache}
              className="px-3 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Purge Cache
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-950/50 flex justify-end">
          <button
            id="settings-done-btn"
            onClick={onClose}
            className="px-5 py-2 bg-neutral-100 hover:bg-white text-neutral-900 rounded-xl text-sm font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
