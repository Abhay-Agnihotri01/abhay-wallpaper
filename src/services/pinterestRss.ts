import { Wallpaper } from '../types/wallpaper';

/**
 * Normalizes any Pinterest board URL, profile URL, or RSS link into a valid .rss feed URL
 * Handles:
 * - https://in.pinterest.com/maity_kk1312/lord-krishna-images/
 * - https://www.pinterest.com/maity_kk1312/lord-krishna-images
 * - https://www.pinterest.com/maity_kk1312/lord-krishna-images.rss
 * - https://www.pinterest.com/username/feed.rss
 * - https://www.pinterest.com/username/
 * - username/board-name
 */
export function normalizePinterestRssUrl(input: string): { 
  rssUrl: string; 
  title: string; 
  username: string; 
  boardName: string;
} {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error('Please enter a Pinterest URL or board link.');
  }

  let clean = trimmed.replace(/[?#].*$/, ''); // Strip query params or hash
  clean = clean.replace(/\/+$/, ''); // Strip trailing slashes

  let urlStr = clean;
  if (!urlStr.startsWith('http://') && !urlStr.startsWith('https://')) {
    urlStr = `https://www.pinterest.com/${clean}`;
  }

  try {
    const parsed = new URL(urlStr);
    const pathParts = parsed.pathname.split('/').filter(Boolean);

    if (pathParts.length === 0) {
      throw new Error('Invalid Pinterest URL. Please provide a user or board path.');
    }

    const username = pathParts[0];

    // Case 1: User profile feed (e.g. /username or /username/feed.rss)
    if (pathParts.length === 1 || (pathParts.length === 2 && pathParts[1] === 'feed.rss')) {
      const feedUrl = `https://www.pinterest.com/${username}/feed.rss`;
      const title = `${username.charAt(0).toUpperCase() + username.slice(1)}'s Pins`;
      return {
        rssUrl: feedUrl,
        title,
        username,
        boardName: 'feed',
      };
    }

    // Case 2: Board feed (e.g. /username/board-name or /username/board-name.rss)
    const rawBoard = pathParts[1].replace(/\.rss$/, '');
    const feedUrl = `https://www.pinterest.com/${username}/${rawBoard}.rss`;
    
    // Format human-friendly title from slug (e.g. "lord-krishna-images" -> "Lord Krishna Images")
    const formattedTitle = rawBoard
      .split(/[-_]/)
      .map((w) => (w.length > 0 ? w.charAt(0).toUpperCase() + w.slice(1) : ''))
      .join(' ');

    return {
      rssUrl: feedUrl,
      title: formattedTitle || `${username}/${rawBoard}`,
      username,
      boardName: rawBoard,
    };
  } catch (err: any) {
    throw new Error(`Could not parse Pinterest link: ${err.message}`);
  }
}

/**
 * Extracts the image source from an RSS item's description HTML
 */
function extractImageFromDescription(descHtml: string): string | null {
  if (!descHtml) return null;
  const match = descHtml.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match ? match[1] : null;
}

/**
 * Converts a 236x Pinterest thumbnail into high-res variants
 */
function enhancePinterestUrls(thumbUrl: string) {
  // Typical: https://i.pinimg.com/236x/b7/4c/2a/b74c2a543d73199d74be279e165c52fb.jpg
  if (thumbUrl.includes('i.pinimg.com')) {
    const highRes = thumbUrl.replace(/\/(236x|474x|564x)\//, '/736x/');
    const original = thumbUrl.replace(/\/(236x|474x|564x|736x)\//, '/originals/');
    return {
      thumbnail: thumbUrl,
      highRes,
      original,
    };
  }
  return {
    thumbnail: thumbUrl,
    highRes: thumbUrl,
    original: thumbUrl,
  };
}

/**
 * Fetches and parses a Pinterest RSS feed using multi-tier fallback (Local Proxy -> rss2json -> AllOrigins)
 */
export async function fetchPinterestFeed(
  feedUrl: string, 
  fallbackTitle?: string
): Promise<{ title: string; wallpapers: Wallpaper[] }> {
  let items: any[] = [];
  let detectedTitle = fallbackTitle || 'Pinterest Board';

  // Strategy 1: Try rss2json (CORS friendly, fast, structured JSON)
  try {
    const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`;
    const res = await fetch(apiUrl);
    if (res.ok) {
      const data = await res.json();
      if (data.status === 'ok' && Array.isArray(data.items)) {
        if (data.feed?.title) {
          detectedTitle = data.feed.title;
        }
        items = data.items.map((it: any) => ({
          title: it.title,
          link: it.link,
          description: it.description,
          guid: it.guid || it.link,
          pubDate: it.pubDate,
          author: it.author || detectedTitle,
        }));
      }
    }
  } catch (e) {
    console.warn('rss2json attempt notice:', e);
  }

  // Strategy 2: Try local Vite middleware proxy if available
  if (items.length === 0) {
    try {
      const proxyUrl = `/api/pinterest-proxy?url=${encodeURIComponent(feedUrl)}`;
      const res = await fetch(proxyUrl);
      if (res.ok) {
        const text = await res.text();
        const parsed = parseXmlFeed(text);
        if (parsed.items.length > 0) {
          items = parsed.items;
          if (parsed.title) detectedTitle = parsed.title;
        }
      }
    } catch (e) {
      console.warn('Local proxy attempt notice:', e);
    }
  }

  // Strategy 3: Try AllOrigins CORS relay
  if (items.length === 0) {
    try {
      const relayUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(feedUrl)}`;
      const res = await fetch(relayUrl);
      if (res.ok) {
        const text = await res.text();
        const parsed = parseXmlFeed(text);
        if (parsed.items.length > 0) {
          items = parsed.items;
          if (parsed.title) detectedTitle = parsed.title;
        }
      }
    } catch (e) {
      console.warn('AllOrigins attempt notice:', e);
    }
  }

  if (items.length === 0) {
    throw new Error('Unable to retrieve pins from this board. Ensure the board is public and contains active pins.');
  }

  // Clean and transform items into Wallpaper objects
  const wallpapers: Wallpaper[] = [];
  const now = Date.now();

  for (const item of items) {
    const rawImg = extractImageFromDescription(item.description);
    if (!rawImg) continue;

    const { thumbnail, highRes, original } = enhancePinterestUrls(rawImg);
    const pinIdMatch = item.link?.match(/pin\/(\d+)/);
    const pinId = pinIdMatch ? pinIdMatch[1] : `pin-${Math.random().toString(36).slice(2, 9)}`;

    // Strip HTML from title/description
    const rawTitle = item.title?.replace(/<[^>]+>/g, '').trim() || '';
    const cleanTitle = rawTitle.length > 0 
      ? (rawTitle.length > 60 ? rawTitle.slice(0, 60) + '...' : rawTitle)
      : `${detectedTitle} Wallpaper`;

    wallpapers.push({
      id: `pinterest-${pinId}`,
      provider: 'pinterest',
      providerImageId: pinId,
      title: cleanTitle,
      category: detectedTitle,
      keyword: detectedTitle.toLowerCase(),
      sourceUrl: item.link || feedUrl,
      authorName: item.author || detectedTitle,
      authorUrl: feedUrl.replace(/\.rss$/, ''),
      downloadUrl: highRes,
      fullImageUrl: original,
      thumbnailUrl: thumbnail,
      width: 1080,
      height: 2400,
      color: '#0f172a',
      timestamp: item.pubDate ? new Date(item.pubDate).getTime() || now : now,
      fileSizeBytes: 700000 + Math.floor(Math.random() * 300000),
    });
  }

  return {
    title: detectedTitle,
    wallpapers,
  };
}

/**
 * Helper to parse raw XML string via DOMParser
 */
function parseXmlFeed(xmlText: string): { title: string; items: any[] } {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
  const channelTitle = xmlDoc.querySelector('channel > title')?.textContent?.trim() || '';
  const itemNodes = Array.from(xmlDoc.querySelectorAll('item'));

  const items = itemNodes.map((node) => ({
    title: node.querySelector('title')?.textContent || '',
    link: node.querySelector('link')?.textContent || '',
    description: node.querySelector('description')?.textContent || '',
    guid: node.querySelector('guid')?.textContent || '',
    pubDate: node.querySelector('pubDate')?.textContent || '',
  }));

  return {
    title: channelTitle,
    items,
  };
}
