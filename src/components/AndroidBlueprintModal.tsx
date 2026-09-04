import React, { useState } from 'react';
import { 
  X, 
  Terminal, 
  Copy, 
  Check, 
  FolderTree, 
  FileCode, 
  BookOpen, 
  Cpu, 
  Sparkles,
  Layers,
  Smartphone,
  Github,
  Download
} from 'lucide-react';

interface AndroidBlueprintModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidBlueprintModal: React.FC<AndroidBlueprintModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'github' | 'prompts' | 'structure' | 'gradle' | 'engine'>('github');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const ANTIGRAVITY_PROMPTS = [
    {
      step: 1,
      title: 'Project Init & Dependencies',
      prompt: `Create a modern Android Studio project called "AuraCanvas" using Kotlin and Jetpack Compose (Material 3). Add dependencies for Retrofit2, OkHttp3, Kotlinx Serialization, Room DB, AndroidX DataStore Preferences, and AndroidX WorkManager. Set compileSdk = 35 and minSdk = 26.`,
    },
    {
      step: 2,
      title: 'Domain Models & Storage Clean-Up Types',
      prompt: `In domain/model, create Wallpaper.kt, UserSettings.kt, and CachedFile.kt. Design the models such that the application never stores raw bitmaps in Room; store only providerImageId, photographer name, sourceUrl, downloadUrl, and timestamp to avoid storage leaks.`,
    },
    {
      step: 3,
      title: 'ImageProvider Interface & Unsplash Implementation',
      prompt: `In domain/provider, create ImageProvider interface with search(query), triggerDownloadEvent(downloadUrl), and getAttribution(). Implement UnsplashProvider adhering to official Unsplash guidelines, including calling the download_location endpoint when a wallpaper is applied.`,
    },
    {
      step: 4,
      title: 'Two-Image File Cache Manager',
      prompt: `In wallpaper/WallpaperCacheManager.kt, implement a two-slot cache mechanism maintaining strictly /cache/wallpapers/wallpaper_current.webp and wallpaper_next.webp. Include an automatic deleteOldFile() method that runs immediately after the new wallpaper is applied, guaranteeing cache size <= 30 MB.`,
    },
    {
      step: 5,
      title: 'Android Native WallpaperManager Engine',
      prompt: `In wallpaper/WallpaperManagerHelper.kt, write a coroutine function to download the image byte stream via OkHttp, decode into a Bitmap, scale and crop to the device's native screen resolution (e.g. 1080x2400 portrait), and apply via android.app.WallpaperManager.getInstance(context).setBitmap(bitmap, null, true, whichScreen).`,
    },
    {
      step: 6,
      title: 'Foreground Service & AlarmManager Scheduler',
      prompt: `In wallpaper/WallpaperScheduler.kt, implement AlarmManager scheduling with Android 14+ SCHEDULE_EXACT_ALARM handling and a foreground service for 1-minute to 10-minute intervals. Implement a fallback to WorkManager PeriodicWorkRequest for intervals >= 15 minutes.`,
    },
    {
      step: 7,
      title: 'Persistent Notification with Quick Actions',
      prompt: `Create a foreground service notification for AuraCanvas showing active status: "Automatic wallpapers active • Next: 4 min" with three pending intent notification action buttons: [Pause], [Next Wallpaper], and [Stop].`,
    },
    {
      step: 8,
      title: 'Concept-by-Concept Keyword Rotation',
      prompt: `In data/repository/WallpaperRepository.kt, implement single-concept keyword selection. Instead of combining all keywords into one query, rotate through user tags sequentially (e.g. mountains -> cyberpunk -> dark forest) and pull 20 results into a local queue to minimize API calls.`,
    },
    {
      step: 9,
      title: 'Room Database & Duplicate Prevention',
      prompt: `Create AppDatabase and WallpaperDao for storing wallpaper history and favorites. Implement duplicate prevention that excludes the last 20 displayed image IDs from search results.`,
    },
    {
      step: 10,
      title: 'Jetpack Compose Home Screen & UI',
      prompt: `Build the Home Screen in Jetpack Compose matching the PRD Section 6 specification: prominent current wallpaper preview, countdown timer, pause/resume button, interval radio chips (1m, 5m, 10m, 30m, 1h, custom), interest chip tags, and settings gear.`,
    },
    {
      step: 11,
      title: 'Battery Saver & Network Constraints',
      prompt: `Integrate ConnectivityManager and BatteryManager broadcast receivers. If Wi-Fi only is checked and mobile data is active, or if battery drops below threshold (e.g. 20%), transition automation state to WAITING_FOR_NETWORK or PAUSED without crashing.`,
    },
    {
      step: 12,
      title: 'History & Favorites Composables',
      prompt: `Create HistoryScreen.kt and FavoritesScreen.kt displaying lazy columns of past wallpapers with photographer links, original resolution download button, and heart toggle.`,
    },
  ];

  const FOLDER_STRUCTURE_TEXT = `app/
├── src/main/java/com/auracanvas/app/
│   ├── ui/
│   │   ├── home/HomeScreen.kt
│   │   ├── settings/SettingsScreen.kt
│   │   ├── interests/InterestsDialog.kt
│   │   ├── history/HistoryScreen.kt
│   │   ├── theme/Theme.kt
│   │   └── components/WallpaperCard.kt
│   │
│   ├── data/
│   │   ├── api/UnsplashApi.kt
│   │   ├── database/AppDatabase.kt
│   │   ├── database/WallpaperDao.kt
│   │   └── repository/WallpaperRepository.kt
│   │
│   ├── domain/
│   │   ├── model/Wallpaper.kt
│   │   ├── model/UserSettings.kt
│   │   └── provider/ImageProvider.kt
│   │   └── provider/UnsplashProvider.kt
│   │
│   ├── wallpaper/
│   │   ├── WallpaperManagerHelper.kt
│   │   ├── WallpaperCacheManager.kt
│   │   ├── WallpaperScheduler.kt
│   │   └── WallpaperForegroundService.kt
│   │
│   ├── worker/
│   │   └── WallpaperWorker.kt
│   │
│   └── MainActivity.kt
└── src/main/res/`;

  const GRADLE_KTS_SNIPPET = `plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.kotlin.serialization)
    alias(libs.plugins.ksp)
}

android {
    namespace = "com.auracanvas.app"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.auracanvas.app"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"
    }

    buildFeatures {
        compose = true
    }
}

dependencies {
    // Jetpack Compose & Material 3
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.compose.ui)
    implementation(libs.androidx.compose.material3)
    implementation(libs.androidx.compose.material.icons.extended)

    // Networking & Serialization
    implementation("com.squareup.retrofit2:retrofit:2.11.0")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.7.3")

    // Image loading for UI previews
    implementation("io.coil-kt:coil-compose:2.7.0")

    // Room Database
    implementation("androidx.room:room-runtime:2.6.1")
    implementation("androidx.room:room-ktx:2.6.1")
    ksp("androidx.room:room-compiler:2.6.1")

    // Preferences DataStore
    implementation("androidx.datastore:datastore-preferences:1.1.2")

    // WorkManager & Lifecycle
    implementation("androidx.work:work-runtime-ktx:2.10.0")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.7")
}`;

  const KOTLIN_WALLPAPER_HELPER = `package com.auracanvas.app.wallpaper

import android.app.WallpaperManager
import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.os.Build
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.File
import java.io.FileOutputStream

class WallpaperManagerHelper(private val context: Context) {
    private val client = OkHttpClient()
    private val wallpaperManager = WallpaperManager.getInstance(context)

    suspend fun downloadAndApplyWallpaper(
        imageUrl: String,
        whichScreen: Int = WallpaperManager.FLAG_SYSTEM or WallpaperManager.FLAG_LOCK
    ): Result<File> = withContext(Dispatchers.IO) {
        try {
            val cacheDir = File(context.cacheDir, "wallpapers").apply { mkdirs() }
            val nextFile = File(cacheDir, "wallpaper_next.webp")
            val currentFile = File(cacheDir, "wallpaper_current.webp")

            // 1. Fetch byte stream
            val request = Request.Builder().url(imageUrl).build()
            val response = client.newCall(request).execute()
            if (!response.isSuccessful) throw Exception("HTTP \${response.code}")

            // 2. Decode & compress locally
            val bytes = response.body?.bytes() ?: throw Exception("Empty body")
            val originalBitmap = BitmapFactory.decodeByteArray(bytes, 0, bytes.size)

            // 3. Write NEXT file
            FileOutputStream(nextFile).use { out ->
                originalBitmap.compress(Bitmap.CompressFormat.WEBP, 85, out)
            }

            // 4. Apply via Android WallpaperManager
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                wallpaperManager.setBitmap(originalBitmap, null, true, whichScreen)
            } else {
                wallpaperManager.setBitmap(originalBitmap)
            }

            // 5. Strict Storage Architecture: Delete CURRENT, promote NEXT
            if (currentFile.exists()) {
                currentFile.delete() // Immediate file cleanup
            }
            nextFile.renameTo(currentFile)

            Result.success(currentFile)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}`;

  return (
    <div id="android-blueprint-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        id="android-blueprint-modal-card"
        className="w-full max-w-4xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-neutral-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-neutral-100">Android Studio Native Blueprint</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                  Antigravity Sequence Ready
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Complete Kotlin + Jetpack Compose + WallpaperManager code and 12-step generation plan
              </p>
            </div>
          </div>
          <button
            id="close-blueprint-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-3 pb-2 flex gap-2 border-b border-neutral-800 bg-neutral-950/40 overflow-x-auto">
          {[
            { id: 'github', label: 'GitHub Cloud APK Build', icon: Github },
            { id: 'prompts', label: '12 Antigravity Prompts', icon: Sparkles },
            { id: 'structure', label: 'Project Architecture', icon: FolderTree },
            { id: 'gradle', label: 'build.gradle.kts', icon: Terminal },
            { id: 'engine', label: 'Native Wallpaper Engine', icon: FileCode },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-3 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shrink-0 ${
                  isActive
                    ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 font-sans text-neutral-200">
          {activeTab === 'github' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-neutral-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-emerald-300 text-sm">
                  <Github className="w-4 h-4 text-emerald-400" />
                  <span>Automatic GitHub Cloud APK Build Configured!</span>
                </div>
                <p className="text-neutral-300 leading-relaxed">
                  You don't need Android Studio or complex developer tools installed on your computer! We have configured a complete <strong>GitHub Actions Workflow</strong> (<code>.github/workflows/build-apk.yml</code>) and <strong>Capacitor config</strong> (<code>capacitor.config.json</code>).
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                  <Download className="w-4 h-4 text-emerald-400" />
                  How to Download the APK from GitHub (3 Simple Steps):
                </h4>

                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-xs text-emerald-400">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-mono">1</span>
                    Push / Upload repository to GitHub
                  </div>
                  <p className="text-xs text-neutral-400 pl-7">
                    Create a new repository on GitHub and push your code. GitHub will automatically detect <code>.github/workflows/build-apk.yml</code> and trigger the cloud build process.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-xs text-emerald-400">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-mono">2</span>
                    Open the "Actions" tab on your GitHub Repository
                  </div>
                  <p className="text-xs text-neutral-400 pl-7">
                    Click on the <strong>Actions</strong> tab at the top of your GitHub repository. You will see a workflow run named <strong>"Build Android APK"</strong> in progress.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-xs text-emerald-400">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-mono">3</span>
                    Download "AuraCanvas-APK-Debug" Artifact
                  </div>
                  <p className="text-xs text-neutral-400 pl-7">
                    Once the workflow run finishes (indicated by a green checkmark ✓), click on the run, scroll down to the <strong>Artifacts</strong> section, and click <strong>AuraCanvas-APK-Debug</strong> to download your APK!
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                <span className="text-xs text-neutral-400 font-mono block">Git Push Commands (Run in Terminal):</span>
                <pre className="p-3 rounded-lg bg-neutral-900 font-mono text-xs text-emerald-300 leading-relaxed overflow-x-auto">
{`git init
git add .
git commit -m "Initial commit with GitHub Actions APK build"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main`}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'prompts' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-neutral-950/80 border border-neutral-800 text-xs text-neutral-400 flex items-start gap-2">
                <BookOpen className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p>
                  As highlighted in PRD Section 53, paste these structured prompts into Antigravity or your AI coding assistant one by one. This keeps the codebase maintainable, avoids hallucinated monolithic files, and adheres strictly to Android background policies.
                </p>
              </div>

              <div className="space-y-3">
                {ANTIGRAVITY_PROMPTS.map((item) => (
                  <div
                    key={item.step}
                    className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-mono font-bold flex items-center justify-center">
                          {item.step}
                        </span>
                        <h4 className="text-sm font-semibold text-neutral-200">{item.title}</h4>
                      </div>
                      <button
                        onClick={() => copyToClipboard(item.prompt, `prompt-${item.step}`)}
                        className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                      >
                        {copiedId === `prompt-${item.step}` ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Prompt</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-neutral-300 bg-neutral-900/60 p-3 rounded-lg font-mono border border-neutral-800/80 leading-relaxed">
                      {item.prompt}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'structure' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-400 font-mono">Recommended MVVM Package Layout (PRD Sec 36)</span>
                <button
                  onClick={() => copyToClipboard(FOLDER_STRUCTURE_TEXT, 'structure-copy')}
                  className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs flex items-center gap-1 transition-colors"
                >
                  {copiedId === 'structure-copy' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === 'structure-copy' ? 'Copied' : 'Copy Structure'}</span>
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 font-mono text-xs text-emerald-300 leading-relaxed overflow-x-auto">
                {FOLDER_STRUCTURE_TEXT}
              </pre>
            </div>
          )}

          {activeTab === 'gradle' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-400 font-mono">app/build.gradle.kts with Compose, Room, & OkHttp</span>
                <button
                  onClick={() => copyToClipboard(GRADLE_KTS_SNIPPET, 'gradle-copy')}
                  className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs flex items-center gap-1 transition-colors"
                >
                  {copiedId === 'gradle-copy' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === 'gradle-copy' ? 'Copied' : 'Copy Gradle'}</span>
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 font-mono text-xs text-sky-300 leading-relaxed overflow-x-auto">
                {GRADLE_KTS_SNIPPET}
              </pre>
            </div>
          )}

          {activeTab === 'engine' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-400 font-mono">WallpaperManagerHelper.kt (Native Kotlin + Cache Purge)</span>
                <button
                  onClick={() => copyToClipboard(KOTLIN_WALLPAPER_HELPER, 'engine-copy')}
                  className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs flex items-center gap-1 transition-colors"
                >
                  {copiedId === 'engine-copy' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === 'engine-copy' ? 'Copied' : 'Copy Code'}</span>
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 font-mono text-xs text-amber-200 leading-relaxed overflow-x-auto">
                {KOTLIN_WALLPAPER_HELPER}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-between">
          <p className="text-xs text-neutral-500">
            Compliant with Android 14+ background execution and Unsplash API policies.
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-neutral-100 hover:bg-white text-neutral-900 rounded-xl text-sm font-semibold transition-colors"
          >
            Close Blueprint
          </button>
        </div>
      </div>
    </div>
  );
};
