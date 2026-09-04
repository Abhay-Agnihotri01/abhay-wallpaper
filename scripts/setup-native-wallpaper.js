import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const javaPackageDir = path.join(rootDir, 'android/app/src/main/java/com/auracanvas/app');
const manifestPath = path.join(rootDir, 'android/app/src/main/AndroidManifest.xml');

console.log('[Setup Native Wallpaper Plugin] Starting setup...');

if (!fs.existsSync(javaPackageDir)) {
  console.log(`[Setup Native Wallpaper Plugin] Creating directory: ${javaPackageDir}`);
  fs.mkdirSync(javaPackageDir, { recursive: true });
}

// 1. Write WallpaperPlugin.java
const wallpaperPluginContent = `package com.auracanvas.app;

import android.app.WallpaperManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Build;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

@CapacitorPlugin(name = "NativeWallpaper")
public class WallpaperPlugin extends Plugin {

    @PluginMethod
    public void setWallpaper(PluginCall call) {
        String urlString = call.getString("url");
        String target = call.getString("target", "both");

        if (urlString == null || urlString.isEmpty()) {
            call.reject("URL is required");
            return;
        }

        new Thread(() -> {
            try {
                URL url = new URL(urlString);
                HttpURLConnection connection = (HttpURLConnection) url.openConnection();
                connection.setConnectTimeout(15000);
                connection.setReadTimeout(15000);
                connection.connect();
                InputStream inputStream = connection.getInputStream();
                Bitmap bitmap = BitmapFactory.decodeStream(inputStream);

                if (bitmap != null) {
                    WallpaperManager wallpaperManager = WallpaperManager.getInstance(getContext());
                    int flags;
                    if ("home".equalsIgnoreCase(target)) {
                        flags = WallpaperManager.FLAG_SYSTEM;
                    } else if ("lock".equalsIgnoreCase(target)) {
                        flags = WallpaperManager.FLAG_LOCK;
                    } else {
                        flags = WallpaperManager.FLAG_SYSTEM | WallpaperManager.FLAG_LOCK;
                    }

                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                        wallpaperManager.setBitmap(bitmap, null, true, flags);
                    } else {
                        wallpaperManager.setBitmap(bitmap);
                    }

                    call.resolve();
                } else {
                    call.reject("Failed to decode image from URL");
                }
            } catch (Exception e) {
                call.reject("Error setting wallpaper: " + e.getLocalizedMessage());
            }
        }).start();
    }
}
`;

const pluginPath = path.join(javaPackageDir, 'WallpaperPlugin.java');
fs.writeFileSync(pluginPath, wallpaperPluginContent, 'utf8');
console.log(`[Setup Native Wallpaper Plugin] Created ${pluginPath}`);

// 2. Write / Update MainActivity.java
const mainActivityContent = `package com.auracanvas.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(WallpaperPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
`;

const mainActivityPath = path.join(javaPackageDir, 'MainActivity.java');
fs.writeFileSync(mainActivityPath, mainActivityContent, 'utf8');
console.log(`[Setup Native Wallpaper Plugin] Updated ${mainActivityPath}`);

// 3. Patch AndroidManifest.xml for SET_WALLPAPER permissions
if (fs.existsSync(manifestPath)) {
  let manifest = fs.readFileSync(manifestPath, 'utf8');
  const permissions = [
    '<uses-permission android:name="android.permission.SET_WALLPAPER" />',
    '<uses-permission android:name="android.permission.SET_WALLPAPER_HINTS" />',
  ];

  permissions.forEach((perm) => {
    if (!manifest.includes(perm)) {
      manifest = manifest.replace('<application', `    ${perm}\n    <application`);
    }
  });

  fs.writeFileSync(manifestPath, manifest, 'utf8');
  console.log(`[Setup Native Wallpaper Plugin] Patched permissions in ${manifestPath}`);
} else {
  console.warn(`[Setup Native Wallpaper Plugin] Warning: AndroidManifest.xml not found at ${manifestPath}`);
}

console.log('[Setup Native Wallpaper Plugin] Complete!');
