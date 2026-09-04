import { registerPlugin, Capacitor } from '@capacitor/core';

export interface NativeWallpaperPlugin {
  setWallpaper(options: {
    url: string;
    target?: 'home' | 'lock' | 'both';
  }): Promise<{ success: boolean }>;
}

const NativeWallpaper = registerPlugin<NativeWallpaperPlugin>('NativeWallpaper');

export async function setDeviceSystemWallpaper(
  imageUrl: string,
  target: 'home' | 'lock' | 'both' = 'both'
): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    console.log('[NativeWallpaper] Running in web browser. Skipping native wallpaper manager.');
    return false;
  }

  try {
    console.log(`[NativeWallpaper] Setting system wallpaper to target: ${target}, URL: ${imageUrl}`);
    await NativeWallpaper.setWallpaper({ url: imageUrl, target });
    return true;
  } catch (error) {
    console.error('[NativeWallpaper] Failed to set native system wallpaper:', error);
    return false;
  }
}
