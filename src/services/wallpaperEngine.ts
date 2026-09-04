import { 
  Wallpaper, 
  CachedFile, 
  UserSettings, 
  AutomationState, 
  PipelineLog, 
  DeviceSimulationState,
  IntervalPreset
} from '../types/wallpaper';
import { providerRegistry } from './providers';
import { CURATED_WALLPAPERS } from '../data/curatedWallpapers';
import { setDeviceSystemWallpaper } from './nativeWallpaper';

const STORAGE_KEY_SETTINGS = 'wallflow_settings';
const STORAGE_KEY_INTERESTS = 'wallflow_interests';
const STORAGE_KEY_HISTORY = 'wallflow_history';
const STORAGE_KEY_FAVORITES = 'wallflow_favorites';

export const PRESET_TO_MINUTES: Record<IntervalPreset, number> = {
  '1m': 1,
  '2m': 2,
  '5m': 5,
  '10m': 10,
  '15m': 15,
  '30m': 30,
  '1h': 60,
  '2h': 120,
  '6h': 360,
  '12h': 720,
  'daily': 1440,
  'custom': 10,
};

export class WallpaperEngine {
  public settings: UserSettings = {
    intervalMinutes: 10,
    presetKey: '10m',
    isEnabled: true,
    wifiOnly: false,
    batteryThreshold: 15, // 15% threshold
    applyTo: 'both',
    imageQuality: 'balanced',
    targetResolution: { width: 1080, height: 2400 },
    maxCacheMb: 30,
    activeProviders: ['pinterest', 'unsplash', 'pexels', 'curated'],
    pinterestFeeds: [
      {
        id: 'feed-krishna-images',
        url: 'https://www.pinterest.com/maity_kk1312/lord-krishna-images.rss',
        title: 'Lord Krishna Images',
        enabled: true,
        itemCount: 25,
        status: 'idle',
      },
    ],
  };

  public interests: string[] = ['Nature', 'Mountains', 'Cyberpunk', 'Minimal'];
  public state: AutomationState = 'RUNNING';
  public currentWallpaper: Wallpaper | null = null;
  public nextWallpaperBuffer: Wallpaper | null = null;
  public cachedFiles: CachedFile[] = [];
  public queue: Wallpaper[] = [];
  public recentImageIds: string[] = [];
  public history: Wallpaper[] = [];
  public favorites: Wallpaper[] = [];
  public logs: PipelineLog[] = [];

  public deviceState: DeviceSimulationState = {
    batteryLevel: 84,
    isCharging: false,
    networkType: 'wifi',
    screenView: 'app_view',
    showStatusBar: true,
    showAppIcons: false,
  };

  public nextChangeTimestamp: number = Date.now() + 10 * 60 * 1000;
  public remainingSeconds: number = 600;

  private timerIntervalId: any = null;
  private listeners: Set<() => void> = new Set();
  private isPipelineRunning = false;
  private interestRotationIndex = 0;

  constructor() {
    this.loadPersistedData();
    this.initFirstWallpaper();
    this.startCountdownLoop();
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public notify() {
    this.listeners.forEach((fn) => fn());
  }

  public async applyWallpaperManually(wallpaper: Wallpaper) {
    this.currentWallpaper = wallpaper;
    this.cachedFiles = [
      {
        slot: 'CURRENT',
        fileName: 'wallpaper_current.webp',
        wallpaper,
        fileSizeBytes: wallpaper.fileSizeBytes,
        cachedAt: Date.now(),
      },
    ];

    // Trigger native Android wallpaper change if running on native mobile
    setDeviceSystemWallpaper(wallpaper.downloadUrl, this.settings.applyTo);

    this.addLog(
      'APPLY_WALLPAPER',
      `Manual set from history/favorites: "${wallpaper.title}"`,
      `Applied to ${this.settings.applyTo.toUpperCase()} screen(s)`,
      'success'
    );
    this.notify();
  }

  private addLog(
    step: PipelineLog['step'], 
    message: string, 
    details?: string, 
    status: PipelineLog['status'] = 'info'
  ) {
    const log: PipelineLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
      step,
      message,
      details,
      status,
    };
    this.logs = [log, ...this.logs.slice(0, 49)];
    this.notify();
  }

  private loadPersistedData() {
    try {
      const savedSettings = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (savedSettings) {
        this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
      }
      // Ensure pinterestFeeds is an array and synced to provider
      if (!this.settings.pinterestFeeds || this.settings.pinterestFeeds.length === 0) {
        this.settings.pinterestFeeds = [
          {
            id: 'feed-krishna-images',
            url: 'https://www.pinterest.com/maity_kk1312/lord-krishna-images.rss',
            title: 'Lord Krishna Images',
            enabled: true,
            itemCount: 25,
            status: 'idle',
          },
        ];
      }
      providerRegistry.getPinterestProvider().setFeeds(this.settings.pinterestFeeds);

      const savedInterests = localStorage.getItem(STORAGE_KEY_INTERESTS);
      if (savedInterests) {
        this.interests = JSON.parse(savedInterests);
      }
      const savedHistory = localStorage.getItem(STORAGE_KEY_HISTORY);
      if (savedHistory) {
        this.history = JSON.parse(savedHistory);
      }
      const savedFavs = localStorage.getItem(STORAGE_KEY_FAVORITES);
      if (savedFavs) {
        this.favorites = JSON.parse(savedFavs);
      }
    } catch (e) {
      console.warn('Could not load local storage data:', e);
    }
  }

  private saveSettings() {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(this.settings));
      localStorage.setItem(STORAGE_KEY_INTERESTS, JSON.stringify(this.interests));
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(this.history.slice(0, 50)));
      localStorage.setItem(STORAGE_KEY_FAVORITES, JSON.stringify(this.favorites));
      if (this.settings.pinterestFeeds) {
        providerRegistry.getPinterestProvider().setFeeds(this.settings.pinterestFeeds);
      }
    } catch (e) {
      console.warn('Failed to write to local storage:', e);
    }
  }

  public isWallpaperMatchingInterests(wp: Wallpaper | null): boolean {
    if (!wp) return false;
    if (this.interests.length === 0) return true;

    const cat = wp.category.toLowerCase();
    const kw = wp.keyword.toLowerCase();
    const title = wp.title.toLowerCase();

    // If wallpaper is from Pinterest and Pinterest is active, match active board titles
    if (wp.provider === 'pinterest' && this.settings.activeProviders.includes('pinterest')) {
      const activeFeedTitles = (this.settings.pinterestFeeds || [])
        .filter((f) => f.enabled)
        .map((f) => f.title.toLowerCase());
      if (activeFeedTitles.some((t) => cat.includes(t) || t.includes(cat) || title.includes(t))) {
        return true;
      }
    }

    return this.interests.some((interest) => {
      const clean = interest.trim().toLowerCase();
      if (!clean) return false;
      if (cat.includes(clean) || clean.includes(cat)) return true;
      if (kw.includes(clean) || clean.includes(kw)) return true;
      if (title.includes(clean) || clean.includes(title)) return true;

      const tokens = clean.split(/\s+/).filter((t) => t.length > 2);
      if (tokens.length > 0) {
        return tokens.some((t) => cat.includes(t) || kw.includes(t) || title.includes(t));
      }
      return false;
    });
  }

  public pruneQueueForActiveInterests() {
    if (this.interests.length === 0) return;
    this.queue = this.queue.filter((item) => this.isWallpaperMatchingInterests(item));

    if (this.nextWallpaperBuffer && !this.isWallpaperMatchingInterests(this.nextWallpaperBuffer)) {
      this.nextWallpaperBuffer = null;
      this.cachedFiles = this.cachedFiles.filter((c) => c.slot !== 'NEXT');
    }
  }

  private initFirstWallpaper() {
    let initial = CURATED_WALLPAPERS[0];
    if (this.interests.length > 0) {
      const match = CURATED_WALLPAPERS.find((w) => this.isWallpaperMatchingInterests(w));
      if (match) {
        initial = match;
      }
    }

    this.currentWallpaper = initial;
    this.recentImageIds.push(initial.providerImageId);
    
    this.cachedFiles = [
      {
        slot: 'CURRENT',
        fileName: 'wallpaper_current.webp',
        wallpaper: initial,
        fileSizeBytes: initial.fileSizeBytes,
        cachedAt: Date.now(),
      }
    ];

    if (!this.history.some((h) => h.providerImageId === initial.providerImageId)) {
      this.history.unshift(initial);
    }

    this.addLog(
      'APPLY_WALLPAPER',
      `Initial wallpaper loaded: ${initial.title}`,
      `Category: ${initial.category} • Slot: CURRENT (wallpaper_current.webp, ${(initial.fileSizeBytes / 1024).toFixed(0)} KB)`,
      'success'
    );

    // Pre-populate NEXT buffer and pre-fetch queue in background
    this.refillQueue();
  }

  private startCountdownLoop() {
    if (this.timerIntervalId) {
      clearInterval(this.timerIntervalId);
    }

    this.scheduleNextChange();

    this.timerIntervalId = setInterval(() => {
      this.tick();
    }, 1000);
  }

  private scheduleNextChange() {
    const minutes = this.settings.intervalMinutes;
    this.remainingSeconds = Math.max(1, Math.round(minutes * 60));
    this.nextChangeTimestamp = Date.now() + this.remainingSeconds * 1000;
  }

  private tick() {
    // Evaluate automation state vs device conditions
    this.evaluateAutomationState();

    if (this.state !== 'RUNNING') {
      return;
    }

    if (this.remainingSeconds > 0) {
      this.remainingSeconds -= 1;
      this.notify();
    } else {
      this.addLog('TRIGGER', `Interval timer expired (${this.settings.intervalMinutes}m). Triggering wallpaper change.`);
      this.executeWallpaperPipeline();
      this.scheduleNextChange();
    }
  }

  private evaluateAutomationState() {
    if (!this.settings.isEnabled) {
      if (this.state !== 'STOPPED') {
        this.state = 'STOPPED';
        this.notify();
      }
      return;
    }

    // Network check
    if (this.deviceState.networkType === 'offline') {
      if (this.state !== 'WAITING_FOR_NETWORK') {
        this.state = 'WAITING_FOR_NETWORK';
        this.addLog('NETWORK_CHECK', 'Internet disconnected. Waiting for network...', undefined, 'warning');
        this.notify();
      }
      return;
    }

    if (this.settings.wifiOnly && this.deviceState.networkType === 'cellular') {
      if (this.state !== 'WAITING_FOR_NETWORK') {
        this.state = 'WAITING_FOR_NETWORK';
        this.addLog('NETWORK_CHECK', 'Wi-Fi only mode active, currently on mobile data. Pausing downloads.', undefined, 'warning');
        this.notify();
      }
      return;
    }

    // Battery threshold check
    if (
      this.settings.batteryThreshold > 0 &&
      this.deviceState.batteryLevel < this.settings.batteryThreshold &&
      !this.deviceState.isCharging
    ) {
      if (this.state !== 'PAUSED') {
        this.state = 'PAUSED';
        this.addLog(
          'TRIGGER',
          `Battery level (${this.deviceState.batteryLevel}%) is below threshold (${this.settings.batteryThreshold}%). Battery saver active.`,
          undefined,
          'warning'
        );
        this.notify();
      }
      return;
    }

    if (this.state === 'WAITING_FOR_NETWORK' || this.state === 'PAUSED') {
      this.state = 'RUNNING';
      this.addLog('NETWORK_CHECK', 'Conditions restored. Automation state resumed: RUNNING.', undefined, 'success');
      this.notify();
    }
  }

  /**
   * Refills the queue with search results (Section 31 & 32: Rate-limit protection)
   */
  public async refillQueue(): Promise<void> {
    const matchingItems = this.queue.filter((item) => this.isWallpaperMatchingInterests(item));
    if (matchingItems.length >= 8) return;

    // Concept-by-concept keyword pick (Section 8)
    const keywords = this.interests.length > 0 ? this.interests : ['Nature'];
    const currentKeyword = keywords[this.interestRotationIndex % keywords.length];
    this.interestRotationIndex++;

    this.addLog(
      'KEYWORD_SELECT',
      `Refilling wallpaper queue using concept: "${currentKeyword}"`,
      `Interests pool: [${keywords.join(', ')}]`
    );

    try {
      const { results, usedProvider } = await providerRegistry.searchWithFallback(
        currentKeyword,
        this.settings.activeProviders
      );

      // Duplicate prevention filter (Section 29: don't reuse last 20 images)
      const freshResults = results.filter(
        (r) => !this.recentImageIds.includes(r.providerImageId)
      );

      const toAdd = freshResults.length > 0 ? freshResults : results;
      this.queue = [...this.queue, ...toAdd];

      this.addLog(
        'SEARCH_API',
        `Fetched ${toAdd.length} wallpapers from ${usedProvider.name}`,
        `Current queue depth: ${this.queue.length} items. Concept: "${currentKeyword}".`
      );

      // Also ensure NEXT buffer slot is filled for instant 2-image pipeline
      if (!this.nextWallpaperBuffer && this.queue.length > 0) {
        this.prepareNextBuffer();
      }
    } catch (e: any) {
      this.addLog('SEARCH_API', `Queue refill notice: ${e.message}`, undefined, 'warning');
    }
    this.notify();
  }

  private prepareNextBuffer() {
    if (this.queue.length === 0) return;
    const nextItem = this.queue.shift()!;
    this.nextWallpaperBuffer = nextItem;

    // Simulate downloading NEXT image to /app/cache/wallpapers/wallpaper_next.webp
    const nextCached: CachedFile = {
      slot: 'NEXT',
      fileName: 'wallpaper_next.webp',
      wallpaper: nextItem,
      fileSizeBytes: nextItem.fileSizeBytes,
      cachedAt: Date.now(),
    };

    // Keep only slot CURRENT and slot NEXT in cache list
    this.cachedFiles = [
      ...this.cachedFiles.filter((c) => c.slot !== 'NEXT'),
      nextCached,
    ];

    this.addLog(
      'DOWNLOAD_NEXT',
      `Buffered NEXT wallpaper: "${nextItem.title}" (${(nextItem.fileSizeBytes / 1024).toFixed(0)} KB)`,
      `Pre-cached in slot NEXT to guarantee instantaneous transition.`
    );
  }

  /**
   * The core wallpaper transition pipeline (Section 13, 14, 15, 17, 19, 20)
   */
  public async executeWallpaperPipeline(): Promise<boolean> {
    if (this.isPipelineRunning) return false;
    this.isPipelineRunning = true;

    try {
      this.addLog('TRIGGER', 'Beginning Wallpaper Transition Pipeline...');

      // 1. Check network & battery
      this.evaluateAutomationState();
      if (this.state !== 'RUNNING') {
        this.addLog('NETWORK_CHECK', `Pipeline suspended: state is ${this.state}`, undefined, 'warning');
        this.isPipelineRunning = false;
        return false;
      }

      // 2. Obtain candidate wallpaper matching active interests
      let candidate: Wallpaper | null = null;
      if (this.nextWallpaperBuffer && this.isWallpaperMatchingInterests(this.nextWallpaperBuffer)) {
        candidate = this.nextWallpaperBuffer;
        this.nextWallpaperBuffer = null;
      }

      while (!candidate && this.queue.length > 0) {
        const item = this.queue.shift()!;
        if (this.isWallpaperMatchingInterests(item)) {
          candidate = item;
          break;
        }
      }

      if (!candidate) {
        this.addLog('QUEUE_HIT', 'Queue empty or needs matching concept. Executing real-time fetch...');
        await this.refillQueue();
        if (this.nextWallpaperBuffer && this.isWallpaperMatchingInterests(this.nextWallpaperBuffer)) {
          candidate = this.nextWallpaperBuffer;
          this.nextWallpaperBuffer = null;
        } else if (this.queue.length > 0) {
          candidate = this.queue.shift()!;
        }
      }

      if (!candidate) {
        const targetQuery = this.interests[0] || 'Nature';
        const { results } = await providerRegistry.searchWithFallback(targetQuery, this.settings.activeProviders);
        candidate = results[0] || CURATED_WALLPAPERS[0];
      }

      // 3. Image Optimization & Resize/Compress (Section 17, 19)
      this.addLog(
        'RESIZE_COMPRESS',
        `Simulating Android native Bitmap processing for 1080x2400 portrait`,
        `Optimized byte stream down to ${(candidate.fileSizeBytes / 1024).toFixed(0)} KB (WebP 80% compression)`
      );

      // 4. Provider Attribution & Download trigger event (Section 11)
      const provider = providerRegistry.getProvider(candidate.provider);
      if (provider) {
        await provider.triggerDownloadEvent(candidate.downloadLocationUrl);
      }

      // 5. Apply to Android WallpaperManager (Section 20 & 21)
      const oldCurrent = this.currentWallpaper;
      this.currentWallpaper = candidate;

      // Trigger native Android wallpaper change if running on native mobile
      setDeviceSystemWallpaper(candidate.downloadUrl, this.settings.applyTo);

      // Duplicate prevention: remember last 20 image IDs (Section 29)
      this.recentImageIds.unshift(candidate.providerImageId);
      if (this.recentImageIds.length > 20) {
        this.recentImageIds.pop();
      }

      this.addLog(
        'APPLY_WALLPAPER',
        `WallpaperManager.setBitmap applied to ${this.settings.applyTo.toUpperCase()} screen(s)`,
        `Wallpaper: "${candidate.title}" by ${candidate.authorName} (${candidate.category})`,
        'success'
      );

      // 6. Delete old local image (Section 14 & 16: Strict Storage Architecture)
      const oldCached = this.cachedFiles.find((f) => f.slot === 'CURRENT');
      if (oldCached) {
        this.addLog(
          'DELETE_OLD_CACHE',
          `Deleted previous file: ${oldCached.fileName} (Freed ${(oldCached.fileSizeBytes / 1024).toFixed(0)} KB)`,
          `Storage clean-up complete. App storage remains capped at <= 2 images.`,
          'success'
        );
      }

      // 7. NEXT becomes CURRENT in cache slot (Section 15)
      const newCurrentCached: CachedFile = {
        slot: 'CURRENT',
        fileName: 'wallpaper_current.webp',
        wallpaper: candidate,
        fileSizeBytes: candidate.fileSizeBytes,
        cachedAt: Date.now(),
      };
      this.cachedFiles = [newCurrentCached];

      // 8. Update history
      this.history.unshift({
        ...candidate,
        timestamp: Date.now(),
        isFavorite: this.favorites.some((f) => f.providerImageId === candidate?.providerImageId),
      });
      if (this.history.length > 60) {
        this.history.pop();
      }

      // 9. Reset next buffer and trigger background refill if queue low
      this.nextWallpaperBuffer = null;
      if (this.queue.length < 3) {
        this.refillQueue();
      } else {
        this.prepareNextBuffer();
      }

      this.saveSettings();
      this.notify();
      return true;
    } catch (err: any) {
      this.addLog('APPLY_WALLPAPER', `Pipeline execution error: ${err.message}`, undefined, 'error');
      return false;
    } finally {
      this.isPipelineRunning = false;
    }
  }

  // --- Public Controls ---

  public triggerNextWallpaper() {
    this.addLog('TRIGGER', 'User triggered manual wallpaper skip ("Next Wallpaper")');
    this.executeWallpaperPipeline();
    this.scheduleNextChange();
  }

  public pauseAutomation() {
    this.state = 'PAUSED';
    this.addLog('TRIGGER', 'User paused wallpaper automation.');
    this.notify();
  }

  public resumeAutomation() {
    this.state = 'RUNNING';
    this.addLog('TRIGGER', 'User resumed wallpaper automation.');
    this.scheduleNextChange();
    this.notify();
  }

  public toggleAutomation() {
    if (this.state === 'RUNNING') {
      this.pauseAutomation();
    } else {
      this.resumeAutomation();
    }
  }

  public setIntervalPreset(preset: IntervalPreset, customMinutes?: number) {
    const minutes = preset === 'custom' && customMinutes ? customMinutes : PRESET_TO_MINUTES[preset];
    this.settings.presetKey = preset;
    this.settings.intervalMinutes = Math.max(1, minutes);
    this.saveSettings();
    this.scheduleNextChange();
    this.addLog('TRIGGER', `Interval changed to ${this.settings.intervalMinutes}m (${preset})`);
    this.notify();
  }

  public async addInterest(keyword: string) {
    const clean = keyword.trim();
    if (!clean) return;
    if (!this.interests.includes(clean)) {
      this.interests.push(clean);
      this.saveSettings();
      this.addLog('KEYWORD_SELECT', `Added interest tag: "${clean}"`);
      
      // Prune old queue items that don't match any active interest
      this.pruneQueueForActiveInterests();

      // Immediately fetch fresh wallpapers specifically for this newly added keyword
      try {
        const { results } = await providerRegistry.searchWithFallback(
          clean,
          this.settings.activeProviders
        );
        // Prepend so this new interest is served immediately
        this.queue = [...results, ...this.queue];
      } catch (e: any) {
        console.warn('Failed to fetch for new interest:', e);
      }

      // If current wallpaper does not match ANY active interests, apply the new interest wallpaper immediately!
      if (!this.isWallpaperMatchingInterests(this.currentWallpaper) && this.queue.length > 0) {
        await this.executeWallpaperPipeline();
      } else {
        if (!this.nextWallpaperBuffer && this.queue.length > 0) {
          this.prepareNextBuffer();
        }
        this.notify();
      }
    }
  }

  public async setInterests(newInterests: string[]) {
    this.interests = [...newInterests];
    this.saveSettings();
    this.addLog('KEYWORD_SELECT', `Updated interests pool: [${this.interests.join(', ')}]`);
    this.pruneQueueForActiveInterests();

    if (this.interests.length > 0) {
      await this.refillQueue();
      if (!this.isWallpaperMatchingInterests(this.currentWallpaper) && this.queue.length > 0) {
        await this.executeWallpaperPipeline();
      } else {
        this.notify();
      }
    } else {
      this.notify();
    }
  }

  public removeInterest(keyword: string) {
    this.interests = this.interests.filter((i) => i !== keyword);
    this.saveSettings();
    this.addLog('KEYWORD_SELECT', `Removed interest tag: "${keyword}"`);
    this.pruneQueueForActiveInterests();
    this.notify();
  }

  public toggleFavorite(wallpaper: Wallpaper) {
    const exists = this.favorites.some((f) => f.providerImageId === wallpaper.providerImageId);
    if (exists) {
      this.favorites = this.favorites.filter((f) => f.providerImageId !== wallpaper.providerImageId);
      this.history = this.history.map((h) => 
        h.providerImageId === wallpaper.providerImageId ? { ...h, isFavorite: false } : h
      );
      if (this.currentWallpaper?.providerImageId === wallpaper.providerImageId) {
        this.currentWallpaper = { ...this.currentWallpaper, isFavorite: false };
      }
    } else {
      const fav = { ...wallpaper, isFavorite: true };
      this.favorites.unshift(fav);
      this.history = this.history.map((h) => 
        h.providerImageId === wallpaper.providerImageId ? { ...h, isFavorite: true } : h
      );
      if (this.currentWallpaper?.providerImageId === wallpaper.providerImageId) {
        this.currentWallpaper = { ...this.currentWallpaper, isFavorite: true };
      }
    }
    this.saveSettings();
    this.notify();
  }

  public updateSettings(partial: Partial<UserSettings>) {
    this.settings = { ...this.settings, ...partial };
    this.saveSettings();
    this.evaluateAutomationState();
    this.notify();
  }

  public updateDeviceState(partial: Partial<DeviceSimulationState>) {
    this.deviceState = { ...this.deviceState, ...partial };
    this.evaluateAutomationState();
    this.notify();
  }

  public getTotalCacheSizeKb(): number {
    return this.cachedFiles.reduce((acc, f) => acc + f.fileSizeBytes / 1024, 0);
  }

  public async addPinterestFeed(url: string, customTitle?: string) {
    const provider = providerRegistry.getPinterestProvider();
    const newFeed = await provider.addFeed(url, customTitle);
    this.settings.pinterestFeeds = provider.getFeeds();
    
    // Ensure pinterest is in active providers
    if (!this.settings.activeProviders.includes('pinterest')) {
      this.settings.activeProviders = ['pinterest', ...this.settings.activeProviders];
    }
    
    // Also auto-add to interests if not present
    if (newFeed.title && !this.interests.includes(newFeed.title)) {
      this.interests = [newFeed.title, ...this.interests];
    }

    this.saveSettings();
    this.addLog(
      'SEARCH_API',
      `Added Pinterest Board Feed: "${newFeed.title}"`,
      `Loaded ${newFeed.itemCount || 0} images. Feed: ${newFeed.url}`,
      'success'
    );
    await this.refillQueue();
    this.notify();
    return newFeed;
  }

  public removePinterestFeed(id: string) {
    const provider = providerRegistry.getPinterestProvider();
    provider.removeFeed(id);
    this.settings.pinterestFeeds = provider.getFeeds();
    this.saveSettings();
    this.notify();
  }

  public togglePinterestFeed(id: string, enabled: boolean) {
    const provider = providerRegistry.getPinterestProvider();
    provider.toggleFeed(id, enabled);
    this.settings.pinterestFeeds = provider.getFeeds();
    this.saveSettings();
    this.notify();
  }

  public async syncAllPinterestFeeds() {
    this.addLog('SEARCH_API', 'Synchronizing all active Pinterest RSS board feeds...');
    const provider = providerRegistry.getPinterestProvider();
    const wallpapers = await provider.syncAllFeeds();
    this.settings.pinterestFeeds = provider.getFeeds();
    this.saveSettings();
    this.addLog(
      'SEARCH_API',
      `Pinterest Sync Complete: ${wallpapers.length} HD wallpapers ready from ${this.settings.pinterestFeeds.filter((f) => f.enabled).length} boards.`,
      undefined,
      'success'
    );
    await this.refillQueue();
    this.notify();
  }
}

export const wallpaperEngine = new WallpaperEngine();
