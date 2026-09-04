export type AutomationState = 
  | 'STOPPED' 
  | 'RUNNING' 
  | 'PAUSED' 
  | 'WAITING_FOR_NETWORK' 
  | 'ERROR';

export type IntervalPreset = 
  | '1m' 
  | '2m' 
  | '5m' 
  | '10m' 
  | '15m' 
  | '30m' 
  | '1h' 
  | '2h' 
  | '6h' 
  | '12h' 
  | 'daily' 
  | 'custom';

export interface Wallpaper {
  id: string;
  provider: 'unsplash' | 'pexels' | 'curated' | 'pinterest';
  providerImageId: string;
  title: string;
  category: string;
  keyword: string;
  sourceUrl: string;
  authorName: string;
  authorUrl: string;
  downloadUrl: string;
  fullImageUrl: string;
  thumbnailUrl: string;
  downloadLocationUrl?: string;
  width: number;
  height: number;
  color: string;
  timestamp: number;
  fileSizeBytes: number;
  isFavorite?: boolean;
}

export interface CachedFile {
  slot: 'CURRENT' | 'NEXT';
  fileName: string;
  wallpaper: Wallpaper;
  fileSizeBytes: number;
  cachedAt: number;
}

export interface PinterestFeedConfig {
  id: string;
  url: string;
  title: string;
  enabled: boolean;
  itemCount?: number;
  lastUpdated?: number;
  status?: 'idle' | 'loading' | 'success' | 'error';
  errorMessage?: string;
}

export interface UserSettings {
  intervalMinutes: number;
  presetKey: IntervalPreset;
  isEnabled: boolean;
  wifiOnly: boolean;
  batteryThreshold: number; // 0 (Never), 10, 20, 30
  applyTo: 'home' | 'lock' | 'both';
  imageQuality: 'balanced' | 'high' | 'dataSaver';
  targetResolution: { width: number; height: number };
  maxCacheMb: number;
  activeProviders: string[];
  pinterestFeeds: PinterestFeedConfig[];
}

export interface PipelineLog {
  id: string;
  timestamp: number;
  step: 
    | 'TRIGGER' 
    | 'NETWORK_CHECK' 
    | 'PROVIDER_SELECT' 
    | 'KEYWORD_SELECT' 
    | 'SEARCH_API' 
    | 'QUEUE_HIT' 
    | 'DOWNLOAD_NEXT' 
    | 'RESIZE_COMPRESS' 
    | 'APPLY_WALLPAPER' 
    | 'DELETE_OLD_CACHE' 
    | 'SCHEDULE_NEXT';
  message: string;
  details?: string;
  status: 'info' | 'success' | 'warning' | 'error';
}

export interface DeviceSimulationState {
  batteryLevel: number; // 0 to 100
  isCharging: boolean;
  networkType: 'wifi' | 'cellular' | 'offline';
  screenView: 'lockscreen' | 'homescreen' | 'app_view';
  showStatusBar: boolean;
  showAppIcons: boolean;
}
