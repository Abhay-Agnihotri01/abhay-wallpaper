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

// 1. Write WallpaperReceiver.java (Native AlarmManager BroadcastReceiver)
const wallpaperReceiverContent = `package com.auracanvas.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.os.Build;
import android.util.Log;

import org.json.JSONArray;

public class WallpaperReceiver extends BroadcastReceiver {
    private static final String TAG = "AuraCanvasReceiver";
    public static final String ACTION_ROTATE_WALLPAPER = "com.auracanvas.app.ACTION_ROTATE_WALLPAPER";
    private static final String PREFS_NAME = "auracanvas_native_prefs";

    @Override
    public void onReceive(Context context, Intent intent) {
        Log.d(TAG, "Alarm triggered! Rotating wallpaper in background...");

        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String urlsJson = prefs.getString("urls", "[]");
        int currentIndex = prefs.getInt("current_index", 0);
        String target = prefs.getString("target", "both");
        int intervalMinutes = prefs.getInt("interval_minutes", 10);

        try {
            JSONArray urls = new JSONArray(urlsJson);
            if (urls.length() > 0) {
                String imageUrl = urls.getString(currentIndex % urls.length());
                int nextIndex = (currentIndex + 1) % urls.length();
                prefs.edit().putInt("current_index", nextIndex).apply();

                new Thread(() -> {
                    try {
                        Bitmap bitmap = WallpaperPlugin.downloadBitmap(imageUrl);
                        if (bitmap != null) {
                            WallpaperPlugin.applyBitmapToDevice(context, bitmap, target);
                            Log.d(TAG, "Successfully applied background wallpaper: " + imageUrl);
                        }
                    } catch (Exception e) {
                        Log.e(TAG, "Error setting background wallpaper", e);
                    }
                }).start();
            }
        } catch (Exception e) {
            Log.e(TAG, "Error parsing wallpaper URLs in receiver", e);
        }

        scheduleNextAlarm(context, intervalMinutes);
    }

    public static void scheduleNextAlarm(Context context, int intervalMinutes) {
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarmManager == null) return;

        Intent intent = new Intent(context, WallpaperReceiver.class);
        intent.setAction(ACTION_ROTATE_WALLPAPER);

        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }

        PendingIntent pendingIntent = PendingIntent.getBroadcast(context, 1001, intent, flags);
        long triggerAtMillis = System.currentTimeMillis() + (long) intervalMinutes * 60 * 1000;

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMillis, pendingIntent);
            } else {
                alarmManager.setExact(AlarmManager.RTC_WAKEUP, triggerAtMillis, pendingIntent);
            }
        } catch (SecurityException se) {
            Log.w(TAG, "Exact alarm permission not granted, falling back to setAndAllowWhileIdle", se);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMillis, pendingIntent);
            } else {
                alarmManager.set(AlarmManager.RTC_WAKEUP, triggerAtMillis, pendingIntent);
            }
        }
        Log.d(TAG, "Next wallpaper rotation scheduled in " + intervalMinutes + " minutes.");
    }

    public static void cancelAlarm(Context context) {
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarmManager == null) return;

        Intent intent = new Intent(context, WallpaperReceiver.class);
        intent.setAction(ACTION_ROTATE_WALLPAPER);

        int flags = PendingIntent.FLAG_NO_CREATE;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }

        PendingIntent pendingIntent = PendingIntent.getBroadcast(context, 1001, intent, flags);
        if (pendingIntent != null) {
            alarmManager.cancel(pendingIntent);
            pendingIntent.cancel();
            Log.d(TAG, "Background wallpaper rotation cancelled.");
        }
    }
}
`;

const receiverPath = path.join(javaPackageDir, 'WallpaperReceiver.java');
fs.writeFileSync(receiverPath, wallpaperReceiverContent, 'utf8');
console.log(`[Setup Native Wallpaper Plugin] Created ${receiverPath}`);

// 2. Write WallpaperPlugin.java
const wallpaperPluginContent = `package com.auracanvas.app;

import android.app.WallpaperManager;
import android.content.Context;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.widget.Toast;

import com.getcapacitor.JSArray;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

@CapacitorPlugin(name = "NativeWallpaper")
public class WallpaperPlugin extends Plugin {
    private static final String TAG = "AuraCanvasPlugin";
    private static final String PREFS_NAME = "auracanvas_native_prefs";

    public static Bitmap downloadBitmap(String urlString) throws Exception {
        return downloadBitmap(urlString, 0);
    }

    private static Bitmap downloadBitmap(String urlString, int redirectCount) throws Exception {
        if (redirectCount > 5) {
            throw new Exception("Too many HTTP redirects");
        }
        URL url = new URL(urlString);
        HttpURLConnection connection = (HttpURLConnection) url.openConnection();
        connection.setConnectTimeout(20000);
        connection.setReadTimeout(20000);
        connection.setInstanceFollowRedirects(true);
        connection.setRequestProperty("User-Agent", "Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36");
        
        int status = connection.getResponseCode();
        if (status == HttpURLConnection.HTTP_MOVED_PERM || status == HttpURLConnection.HTTP_MOVED_TEMP || status == 307 || status == 308) {
            String newUrl = connection.getHeaderField("Location");
            if (newUrl != null && !newUrl.isEmpty()) {
                connection.disconnect();
                return downloadBitmap(newUrl, redirectCount + 1);
            }
        }

        if (status != HttpURLConnection.HTTP_OK) {
            throw new Exception("HTTP status code: " + status);
        }

        InputStream inputStream = connection.getInputStream();
        Bitmap bitmap = BitmapFactory.decodeStream(inputStream);
        inputStream.close();
        connection.disconnect();
        return bitmap;
    }

    public static boolean applyBitmapToDevice(Context context, Bitmap bitmap, String target) {
        try {
            WallpaperManager wallpaperManager = WallpaperManager.getInstance(context);
            int flags;
            if ("home".equalsIgnoreCase(target)) {
                flags = WallpaperManager.FLAG_SYSTEM;
            } else if ("lock".equalsIgnoreCase(target)) {
                flags = WallpaperManager.FLAG_LOCK;
            } else {
                flags = WallpaperManager.FLAG_SYSTEM | WallpaperManager.FLAG_LOCK;
            }

            boolean success = false;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                try {
                    wallpaperManager.setBitmap(bitmap, null, true, flags);
                    success = true;
                } catch (Exception e) {
                    Log.w(TAG, "4-parameter setBitmap failed, falling back to standard setBitmap", e);
                }
            }

            if (!success) {
                wallpaperManager.setBitmap(bitmap);
            }
            return true;
        } catch (Exception e) {
            Log.e(TAG, "Failed to apply wallpaper bitmap to device", e);
            return false;
        }
    }

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
                Log.d(TAG, "Downloading wallpaper from URL: " + urlString);
                Bitmap bitmap = downloadBitmap(urlString);

                if (bitmap != null) {
                    boolean ok = applyBitmapToDevice(getContext(), bitmap, target);
                    if (ok) {
                        new Handler(Looper.getMainLooper()).post(() -> {
                            Toast.makeText(getContext(), "AuraCanvas: Wallpaper Applied! 🎨", Toast.LENGTH_SHORT).show();
                        });
                        call.resolve();
                    } else {
                        call.reject("Failed to apply wallpaper to device");
                    }
                } else {
                    call.reject("Failed to decode image from URL");
                }
            } catch (Exception e) {
                Log.e(TAG, "Error in setWallpaper", e);
                call.reject("Error setting wallpaper: " + e.getMessage());
            }
        }).start();
    }

    @PluginMethod
    public void scheduleBackgroundRotation(PluginCall call) {
        int intervalMinutes = call.getInt("intervalMinutes", 10);
        JSArray urlsArray = call.getArray("urls");
        String target = call.getString("target", "both");

        if (urlsArray == null || urlsArray.length() == 0) {
            call.reject("URLs list is required");
            return;
        }

        SharedPreferences prefs = getContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit()
            .putString("urls", urlsArray.toString())
            .putInt("interval_minutes", intervalMinutes)
            .putString("target", target)
            .putInt("current_index", 0)
            .apply();

        WallpaperReceiver.scheduleNextAlarm(getContext(), intervalMinutes);
        call.resolve();
    }

    @PluginMethod
    public void stopBackgroundRotation(PluginCall call) {
        WallpaperReceiver.cancelAlarm(getContext());
        call.resolve();
    }
}
`;

const pluginPath = path.join(javaPackageDir, 'WallpaperPlugin.java');
fs.writeFileSync(pluginPath, wallpaperPluginContent, 'utf8');
console.log(`[Setup Native Wallpaper Plugin] Created ${pluginPath}`);

// 3. Write / Update MainActivity.java
const mainActivityContent = `package com.auracanvas.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        registerPlugin(WallpaperPlugin.class);
    }
}
`;

const mainActivityPath = path.join(javaPackageDir, 'MainActivity.java');
fs.writeFileSync(mainActivityPath, mainActivityContent, 'utf8');
console.log(`[Setup Native Wallpaper Plugin] Updated ${mainActivityPath}`);

// 4. Patch AndroidManifest.xml for permissions & WallpaperReceiver
if (fs.existsSync(manifestPath)) {
  let manifest = fs.readFileSync(manifestPath, 'utf8');
  const permissions = [
    '<uses-permission android:name="android.permission.SET_WALLPAPER" />',
    '<uses-permission android:name="android.permission.SET_WALLPAPER_HINTS" />',
    '<uses-permission android:name="android.permission.WAKE_LOCK" />',
    '<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />',
    '<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />',
  ];

  permissions.forEach((perm) => {
    if (!manifest.includes(perm)) {
      manifest = manifest.replace('<application', `    ${perm}\n    <application`);
    }
  });

  const receiverTag = `
        <receiver
            android:name="com.auracanvas.app.WallpaperReceiver"
            android:exported="true">
            <intent-filter>
                <action android:name="com.auracanvas.app.ACTION_ROTATE_WALLPAPER" />
                <action android:name="android.intent.action.BOOT_COMPLETED" />
            </intent-filter>
        </receiver>
  `;

  if (!manifest.includes('WallpaperReceiver')) {
    manifest = manifest.replace('</application>', `${receiverTag}\n    </application>`);
  }

  fs.writeFileSync(manifestPath, manifest, 'utf8');
  console.log(`[Setup Native Wallpaper Plugin] Patched permissions & Receiver in ${manifestPath}`);
} else {
  console.warn(`[Setup Native Wallpaper Plugin] Warning: AndroidManifest.xml not found at ${manifestPath}`);
}

console.log('[Setup Native Wallpaper Plugin] Setup Complete!');
