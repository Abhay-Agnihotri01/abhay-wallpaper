import { Wallpaper, PinterestFeedConfig } from '../types/wallpaper';
import { CURATED_WALLPAPERS } from '../data/curatedWallpapers';
import { fetchPinterestFeed, normalizePinterestRssUrl } from './pinterestRss';

export interface ImageProvider {
  id: string;
  name: string;
  enabled: boolean;
  permittedForWallpapers: boolean;
  rateLimitPerHour: number;
  attributionRequired: boolean;
  search(query: string, orientation?: 'portrait'): Promise<Wallpaper[]>;
  triggerDownloadEvent(downloadLocationUrl?: string): Promise<void>;
  getAttribution(wallpaper: Wallpaper): string;
  getSourceUrl(wallpaper: Wallpaper): string;
}

// Helper: match query against curated wallpapers semantically and token-wise
function matchesQuery(wallpaper: Wallpaper, query: string): boolean {
  const clean = query.trim().toLowerCase();
  const cat = wallpaper.category.toLowerCase();
  const kw = wallpaper.keyword.toLowerCase();
  const title = wallpaper.title.toLowerCase();

  if (cat.includes(clean) || clean.includes(cat)) return true;
  if (kw.includes(clean) || clean.includes(kw)) return true;
  if (title.includes(clean) || clean.includes(title)) return true;

  // Word-by-word token matching for multi-word queries like "lord krishna"
  const tokens = clean.split(/\s+/).filter((t) => t.length > 2);
  if (tokens.length > 0) {
    return tokens.some((token) => cat.includes(token) || kw.includes(token) || title.includes(token));
  }
  return false;
}

export class UnsplashProvider implements ImageProvider {
  id = 'unsplash';
  name = 'Unsplash (Official API)';
  enabled = true;
  permittedForWallpapers = true;
  rateLimitPerHour = 50; // Demo mode standard limit
  attributionRequired = true;

  private apiKey: string = '';

  setApiKey(key: string) {
    this.apiKey = key.trim();
  }

  getApiKey(): string {
    return this.apiKey;
  }

  async search(query: string, orientation: 'portrait' = 'portrait'): Promise<Wallpaper[]> {
    const cleanQuery = query.trim().toLowerCase();
    
    // If user provided an Unsplash Access Key, query Unsplash directly
    if (this.apiKey) {
      try {
        const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
          cleanQuery
        )}&orientation=${orientation}&per_page=15&client_id=${this.apiKey}`;
        
        const res = await fetch(url, {
          headers: {
            Authorization: `Client-ID ${this.apiKey}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.results) && data.results.length > 0) {
            return data.results.map((photo: any) => ({
              id: `unsplash-${photo.id}-${Date.now()}`,
              provider: 'unsplash' as const,
              providerImageId: photo.id,
              title: photo.description || photo.alt_description || `${cleanQuery.charAt(0).toUpperCase() + cleanQuery.slice(1)} Wallpaper`,
              category: cleanQuery.charAt(0).toUpperCase() + cleanQuery.slice(1),
              keyword: cleanQuery,
              sourceUrl: `${photo.links?.html || 'https://unsplash.com'}?utm_source=wallflow&utm_medium=referral`,
              authorName: photo.user?.name || 'Unsplash Creator',
              authorUrl: `${photo.user?.links?.html || 'https://unsplash.com'}?utm_source=wallflow&utm_medium=referral`,
              downloadUrl: photo.urls?.regular || photo.urls?.full,
              fullImageUrl: photo.urls?.raw || photo.urls?.full || photo.urls?.regular,
              thumbnailUrl: photo.urls?.thumb || photo.urls?.small,
              downloadLocationUrl: photo.links?.download_location,
              width: 1080,
              height: 2400,
              color: photo.color || '#1e293b',
              timestamp: Date.now(),
              fileSizeBytes: 850000 + Math.floor(Math.random() * 250000),
            }));
          }
        } else {
          console.warn(`Unsplash API responded with status ${res.status}: ${res.statusText}`);
        }
      } catch (err) {
        console.warn('Unsplash direct API fetch failed:', err);
      }
    }

    // Search in our authentic curated high-res portrait library only if no API key is provided
    if (!this.apiKey) {
      const matched = CURATED_WALLPAPERS.filter((item) => matchesQuery(item, cleanQuery));

      if (matched.length > 0) {
        const shuffled = [...matched].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, 5).map((p) => ({
          ...p,
          id: `curated-${p.providerImageId}-${Math.floor(Math.random() * 10000)}`,
          keyword: query,
          timestamp: Date.now(),
        }));
      }
    }

    return [];
  }

  async triggerDownloadEvent(downloadLocationUrl?: string): Promise<void> {
    // Unsplash API guidelines: trigger download_location endpoint on actual wallpaper set
    if (downloadLocationUrl && this.apiKey) {
      try {
        await fetch(`${downloadLocationUrl}?client_id=${this.apiKey}`);
      } catch (e) {
        console.warn('Unsplash download_location trigger ping notice:', e);
      }
    }
  }

  getAttribution(wallpaper: Wallpaper): string {
    return `Photo by ${wallpaper.authorName} on Unsplash`;
  }

  getSourceUrl(wallpaper: Wallpaper): string {
    return wallpaper.sourceUrl;
  }
}

export class PexelsProvider implements ImageProvider {
  id = 'pexels';
  name = 'Pexels (Official API)';
  enabled = true;
  permittedForWallpapers = true;
  rateLimitPerHour = 200; // Free tier: 200 requests/hour, 20,000/month
  attributionRequired = true;

  private apiKey: string = '';

  constructor() {
    try {
      const savedKey = localStorage.getItem('wallflow_pexels_api_key');
      if (savedKey) {
        this.apiKey = savedKey.trim();
      }
    } catch (e) {
      console.warn('Could not read saved Pexels API key from localStorage', e);
    }
  }

  setApiKey(key: string) {
    this.apiKey = key.trim();
    try {
      if (this.apiKey) {
        localStorage.setItem('wallflow_pexels_api_key', this.apiKey);
      } else {
        localStorage.removeItem('wallflow_pexels_api_key');
      }
    } catch (e) {
      console.warn('Could not persist Pexels key to localStorage', e);
    }
  }

  getApiKey(): string {
    return this.apiKey;
  }

  async search(query: string, orientation: 'portrait' = 'portrait'): Promise<Wallpaper[]> {
    const cleanQuery = query.trim().toLowerCase();

    if (this.apiKey) {
      try {
        const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(
          cleanQuery
        )}&orientation=${orientation}&per_page=15`;

        const res = await fetch(url, {
          headers: {
            Authorization: this.apiKey,
          },
        });

        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.photos) && data.photos.length > 0) {
            return data.photos.map((photo: any) => ({
              id: `pexels-${photo.id}-${Date.now()}`,
              provider: 'pexels' as const,
              providerImageId: String(photo.id),
              title: photo.alt || `${cleanQuery.charAt(0).toUpperCase() + cleanQuery.slice(1)} Wallpaper`,
              category: cleanQuery.charAt(0).toUpperCase() + cleanQuery.slice(1),
              keyword: cleanQuery,
              sourceUrl: photo.url,
              authorName: photo.photographer || 'Pexels Photographer',
              authorUrl: photo.photographer_url || 'https://www.pexels.com',
              downloadUrl: photo.src?.large2x || photo.src?.portrait || photo.src?.original,
              fullImageUrl: photo.src?.original || photo.src?.large2x || photo.src?.large,
              thumbnailUrl: photo.src?.portrait || photo.src?.medium,
              width: photo.width || 1080,
              height: photo.height || 2400,
              color: photo.avg_color || '#1e293b',
              timestamp: Date.now(),
              fileSizeBytes: 820000 + Math.floor(Math.random() * 200000),
            }));
          }
        }
      } catch (err) {
        console.warn('Pexels direct API fetch failed:', err);
      }
    }

    return [];
  }

  async triggerDownloadEvent(): Promise<void> {}

  getAttribution(wallpaper: Wallpaper): string {
    return `Photo by ${wallpaper.authorName} on Pexels`;
  }

  getSourceUrl(wallpaper: Wallpaper): string {
    return wallpaper.sourceUrl;
  }
}

export class CuratedCollectionProvider implements ImageProvider {
  id = 'curated';
  name = 'WallFlow Curated Engine';
  enabled = true;
  permittedForWallpapers = true;
  rateLimitPerHour = 10000;
  attributionRequired = true;

  async search(query: string): Promise<Wallpaper[]> {
    const clean = query.trim().toLowerCase();
    const matching = CURATED_WALLPAPERS.filter((w) => matchesQuery(w, clean));
    
    if (matching.length > 0) {
      const shuffled = [...matching].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, 4).map((item) => ({
        ...item,
        id: `curated-${item.providerImageId}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        keyword: query,
        timestamp: Date.now(),
      }));
    }

    // If no exact match, return general authentic photography from curated catalog
    const shuffled = [...CURATED_WALLPAPERS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3).map((item) => ({
      ...item,
      id: `curated-${item.providerImageId}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      keyword: item.keyword,
      timestamp: Date.now(),
    }));
  }

  async triggerDownloadEvent(): Promise<void> {}

  getAttribution(wallpaper: Wallpaper): string {
    return `Photo by ${wallpaper.authorName} via WallFlow Curated`;
  }

  getSourceUrl(wallpaper: Wallpaper): string {
    return wallpaper.sourceUrl;
  }
}

export class PinterestProvider implements ImageProvider {
  id = 'pinterest';
  name = 'Pinterest (RSS Feeds)';
  enabled = true; // Enabled for wallpaper rotation
  permittedForWallpapers = true; // Fully permitted via public RSS feeds
  rateLimitPerHour = 1000;
  attributionRequired = true;

  private feeds: PinterestFeedConfig[] = [];
  private pool: Wallpaper[] = [];
  private isSyncing = false;
  private lastSyncTime = 0;

  constructor() {
    this.loadFeedsFromStorage();
  }

  private loadFeedsFromStorage() {
    try {
      const stored = localStorage.getItem('wallflow_pinterest_feeds');
      if (stored) {
        this.feeds = JSON.parse(stored);
      } else {
        // Initial default: user's requested Lord Krishna board
        this.feeds = [
          {
            id: 'feed-krishna-images',
            url: 'https://www.pinterest.com/maity_kk1312/lord-krishna-images.rss',
            title: 'Lord Krishna Images',
            enabled: true,
            itemCount: 25,
            status: 'idle',
          },
        ];
        this.saveFeedsToStorage();
      }
    } catch (e) {
      console.warn('Failed to load Pinterest feeds from storage:', e);
    }
  }

  public saveFeedsToStorage() {
    try {
      localStorage.setItem('wallflow_pinterest_feeds', JSON.stringify(this.feeds));
    } catch (e) {
      console.warn('Failed to save Pinterest feeds to storage:', e);
    }
  }

  public getFeeds(): PinterestFeedConfig[] {
    return [...this.feeds];
  }

  public setFeeds(feeds: PinterestFeedConfig[]) {
    this.feeds = feeds;
    this.saveFeedsToStorage();
  }

  public async addFeed(inputUrl: string, customTitle?: string): Promise<PinterestFeedConfig> {
    const { rssUrl, title } = normalizePinterestRssUrl(inputUrl);

    // Prevent duplicate feeds
    const existing = this.feeds.find((f) => f.url.toLowerCase() === rssUrl.toLowerCase());
    if (existing) {
      throw new Error(`This board is already added ("${existing.title}").`);
    }

    const newFeed: PinterestFeedConfig = {
      id: `feed-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      url: rssUrl,
      title: customTitle?.trim() || title,
      enabled: true,
      status: 'loading',
    };

    // Test fetch to confirm valid board and populate immediate images
    try {
      const { title: detectedTitle, wallpapers } = await fetchPinterestFeed(rssUrl, newFeed.title);
      newFeed.title = customTitle?.trim() || detectedTitle || newFeed.title;
      newFeed.itemCount = wallpapers.length;
      newFeed.status = 'success';
      newFeed.lastUpdated = Date.now();

      // Add to internal wallpaper pool
      this.addWallpapersToPool(wallpapers);
    } catch (err: any) {
      newFeed.status = 'error';
      newFeed.errorMessage = err.message;
      throw new Error(`Failed to load board: ${err.message}`);
    }

    this.feeds.push(newFeed);
    this.saveFeedsToStorage();
    return newFeed;
  }

  public removeFeed(id: string) {
    this.feeds = this.feeds.filter((f) => f.id !== id);
    this.saveFeedsToStorage();
    this.syncAllFeeds();
  }

  public toggleFeed(id: string, enabled: boolean) {
    const feed = this.feeds.find((f) => f.id === id);
    if (feed) {
      feed.enabled = enabled;
      this.saveFeedsToStorage();
      this.syncAllFeeds();
    }
  }

  private addWallpapersToPool(items: Wallpaper[]) {
    const existingIds = new Set(this.pool.map((w) => w.providerImageId));
    const newItems = items.filter((w) => !existingIds.has(w.providerImageId));
    this.pool = [...this.pool, ...newItems];
  }

  public async syncAllFeeds(): Promise<Wallpaper[]> {
    if (this.isSyncing) return this.pool;
    this.isSyncing = true;

    const activeFeeds = this.feeds.filter((f) => f.enabled);
    if (activeFeeds.length === 0) {
      this.pool = [];
      this.isSyncing = false;
      return [];
    }

    const allFetched: Wallpaper[] = [];

    await Promise.all(
      activeFeeds.map(async (feed) => {
        try {
          feed.status = 'loading';
          const { title, wallpapers } = await fetchPinterestFeed(feed.url, feed.title);
          feed.title = title || feed.title;
          feed.itemCount = wallpapers.length;
          feed.status = 'success';
          feed.lastUpdated = Date.now();
          allFetched.push(...wallpapers);
        } catch (e: any) {
          feed.status = 'error';
          feed.errorMessage = e.message;
          console.warn(`Pinterest feed fetch failed for ${feed.url}:`, e);
        }
      })
    );

    // Deduplicate by providerImageId or downloadUrl
    const seen = new Set<string>();
    const uniquePool: Wallpaper[] = [];
    for (const wp of allFetched) {
      if (!seen.has(wp.providerImageId) && !seen.has(wp.downloadUrl)) {
        seen.add(wp.providerImageId);
        seen.add(wp.downloadUrl);
        uniquePool.push(wp);
      }
    }

    this.pool = uniquePool;
    this.lastSyncTime = Date.now();
    this.saveFeedsToStorage();
    this.isSyncing = false;

    return this.pool;
  }

  public getCachedPool(): Wallpaper[] {
    return [...this.pool];
  }

  async search(query: string = ''): Promise<Wallpaper[]> {
    // If pool is empty or stale (> 30 mins), trigger sync
    if (this.pool.length === 0 || Date.now() - this.lastSyncTime > 30 * 60 * 1000) {
      await this.syncAllFeeds();
    }

    if (this.pool.length === 0) {
      return [];
    }

    const clean = query.trim().toLowerCase();
    if (!clean) {
      return [...this.pool].sort(() => Math.random() - 0.5);
    }

    // Filter by query tokens
    const tokens = clean.split(/\s+/).filter((t) => t.length > 2);
    const matched = this.pool.filter((wp) => {
      const cat = wp.category.toLowerCase();
      const kw = wp.keyword.toLowerCase();
      const title = wp.title.toLowerCase();
      if (cat.includes(clean) || kw.includes(clean) || title.includes(clean)) return true;
      if (tokens.length > 0) {
        return tokens.some((t) => cat.includes(t) || kw.includes(t) || title.includes(t));
      }
      return false;
    });

    if (matched.length > 0) {
      return [...matched].sort(() => Math.random() - 0.5);
    }

    // If query didn't match specific board keyword, return shuffled pool from all active boards
    return [...this.pool].sort(() => Math.random() - 0.5);
  }

  async triggerDownloadEvent(): Promise<void> {}

  getAttribution(wallpaper: Wallpaper): string {
    return `Pinned on Pinterest • ${wallpaper.category}`;
  }

  getSourceUrl(wallpaper: Wallpaper): string {
    return wallpaper.sourceUrl;
  }
}

export class ProviderRegistry {
  private providers: Map<string, ImageProvider> = new Map();

  constructor() {
    const unsplash = new UnsplashProvider();
    const pexels = new PexelsProvider();
    const curated = new CuratedCollectionProvider();
    const pinterest = new PinterestProvider();

    try {
      const savedKey = localStorage.getItem('wallflow_unsplash_access_key') || '0zVKbuTbwI8OpstJNreaKjn79i0Ye0-feq_IBtN40JQ';
      if (savedKey) {
        unsplash.setApiKey(savedKey);
      }
    } catch (e) {
      console.warn('Could not read saved Unsplash access key from localStorage', e);
    }

    this.providers.set(unsplash.id, unsplash);
    this.providers.set(pexels.id, pexels);
    this.providers.set(curated.id, curated);
    this.providers.set(pinterest.id, pinterest);
  }

  getUnsplashApiKey(): string {
    const unsplash = this.providers.get('unsplash') as UnsplashProvider | undefined;
    return unsplash ? unsplash.getApiKey() : '';
  }

  setUnsplashApiKey(key: string) {
    const unsplash = this.providers.get('unsplash') as UnsplashProvider | undefined;
    if (unsplash) {
      unsplash.setApiKey(key);
      try {
        if (key.trim()) {
          localStorage.setItem('wallflow_unsplash_access_key', key.trim());
        } else {
          localStorage.removeItem('wallflow_unsplash_access_key');
        }
      } catch (e) {
        console.warn('Could not persist Unsplash key to localStorage', e);
      }
    }
  }

  getPexelsApiKey(): string {
    const pexels = this.providers.get('pexels') as PexelsProvider | undefined;
    return pexels ? pexels.getApiKey() : '';
  }

  setPexelsApiKey(key: string) {
    const pexels = this.providers.get('pexels') as PexelsProvider | undefined;
    if (pexels) {
      pexels.setApiKey(key);
    }
  }

  getPinterestProvider(): PinterestProvider {
    return this.providers.get('pinterest') as PinterestProvider;
  }

  getAllProviders(): ImageProvider[] {
    return Array.from(this.providers.values());
  }

  getProvider(id: string): ImageProvider | undefined {
    return this.providers.get(id);
  }

  setProviderEnabled(id: string, enabled: boolean) {
    const p = this.providers.get(id);
    if (p) {
      p.enabled = enabled;
    }
  }

  /**
   * Deterministic priority search with graceful fallback (Section 30 & 43)
   * Evaluates active providers strictly in order of priority (e.g. Unsplash -> Pexels -> Pinterest -> Curated)
   */
  async searchWithFallback(
    query: string, 
    activeProviderIds: string[]
  ): Promise<{ results: Wallpaper[]; usedProvider: ImageProvider }> {
    // Normalize active provider list preserving priority order
    const active = activeProviderIds
      .map((id) => this.providers.get(id))
      .filter((p): p is ImageProvider => !!p && p.enabled);

    if (active.length === 0) {
      const fallback = this.providers.get('curated')!;
      const results = await fallback.search(query);
      return { results, usedProvider: fallback };
    }

    // Attempt each provider strictly in the configured order (e.g. Unsplash first, then Pinterest, Pexels)
    for (const provider of active) {
      try {
        const results = await provider.search(query);
        if (results && results.length > 0) {
          return { results, usedProvider: provider };
        }
      } catch (e) {
        console.warn(`Provider ${provider.name} failed or gave no results for "${query}", falling back...`, e);
      }
    }

    // Final safety net: curated provider
    const curated = this.providers.get('curated')!;
    const fallbackResults = await curated.search(query);
    return { results: fallbackResults, usedProvider: curated };
  }
}

export const providerRegistry = new ProviderRegistry();
