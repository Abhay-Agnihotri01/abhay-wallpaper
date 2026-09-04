import React from 'react';
import { 
  HardDrive, 
  Trash2, 
  Play, 
  Layers, 
  Database, 
  ShieldCheck, 
  Cpu, 
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Info
} from 'lucide-react';
import { CachedFile, PipelineLog, Wallpaper } from '../types/wallpaper';

interface PipelineVisualizerProps {
  cachedFiles: CachedFile[];
  currentWallpaper: Wallpaper | null;
  nextWallpaperBuffer: Wallpaper | null;
  queue: Wallpaper[];
  logs: PipelineLog[];
  maxCacheMb: number;
  onManualTrigger: () => void;
  onRefillQueue: () => void;
}

export const PipelineVisualizer: React.FC<PipelineVisualizerProps> = ({
  cachedFiles,
  currentWallpaper,
  nextWallpaperBuffer,
  queue,
  logs,
  maxCacheMb,
  onManualTrigger,
  onRefillQueue,
}) => {
  const totalBytes = cachedFiles.reduce((acc, f) => acc + f.fileSizeBytes, 0);
  const totalMb = (totalBytes / (1024 * 1024)).toFixed(2);
  const usagePercentage = Math.min(100, Math.round((Number(totalMb) / maxCacheMb) * 100));

  const currentFile = cachedFiles.find((f) => f.slot === 'CURRENT');
  const nextFile = cachedFiles.find((f) => f.slot === 'NEXT');

  return (
    <div id="pipeline-visualizer-container" className="space-y-6 text-neutral-200">
      {/* Top Banner: Storage Architecture Guarantee */}
      <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-neutral-100">Aggressive Storage Architecture</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                PRD Sec 14-16 Active
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Strict 2-file limit (/cache/wallpaper_*.webp) • Oldest file deleted instantly on transition
            </p>
          </div>
        </div>

        {/* Storage Bar */}
        <div className="w-full md:w-64 space-y-1.5">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-neutral-400">Cache Used:</span>
            <span className="text-emerald-400 font-semibold">{totalMb} MB / {maxCacheMb} MB</span>
          </div>
          <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
              style={{ width: `${Math.max(4, usagePercentage)}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-neutral-500">
            <span>{cachedFiles.length} file(s) resident</span>
            <span>{usagePercentage}% of max</span>
          </div>
        </div>
      </div>

      {/* Two-Image Pipeline Diagram (PRD Section 15) */}
      <div className="p-5 rounded-2xl bg-neutral-900/90 border border-neutral-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-sky-400" />
            <h4 className="text-sm font-semibold text-neutral-200">Two-Image Buffer Engine</h4>
          </div>
          <button
            id="trigger-pipeline-step-btn"
            onClick={onManualTrigger}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Simulate Next Transition
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          {/* Slot CURRENT */}
          <div className="p-4 rounded-xl bg-neutral-950/80 border border-emerald-500/30 relative">
            <div className="flex items-center justify-between mb-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 font-bold">
                SLOT: CURRENT
              </span>
              <span className="text-[10px] text-neutral-400 font-mono">
                {currentFile ? `${(currentFile.fileSizeBytes / 1024).toFixed(0)} KB` : 'Empty'}
              </span>
            </div>
            {currentWallpaper ? (
              <div className="flex items-center gap-3">
                <img
                  src={currentWallpaper.thumbnailUrl}
                  alt={currentWallpaper.title}
                  className="w-12 h-16 rounded-lg object-cover bg-neutral-800 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-neutral-200 truncate">{currentWallpaper.title}</p>
                  <p className="text-[11px] text-neutral-400 truncate">by {currentWallpaper.authorName}</p>
                  <p className="text-[10px] font-mono text-emerald-400 mt-1">wallpaper_current.webp</p>
                </div>
              </div>
            ) : (
              <div className="py-4 text-center text-xs text-neutral-500">No active wallpaper</div>
            )}
            <div className="mt-3 pt-2 border-t border-neutral-800 flex items-center justify-between text-[10px] text-neutral-400">
              <span>Status: Active on device</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
          </div>

          {/* Transition Arrow Indicator */}
          <div className="flex flex-col items-center justify-center p-2 text-center">
            <div className="hidden md:flex items-center gap-1 text-xs font-mono text-neutral-400 mb-1">
              <span className="text-neutral-500">Transition Flow</span>
              <ArrowRight className="w-4 h-4 text-emerald-400 animate-pulse" />
            </div>
            <div className="text-[11px] text-neutral-400 bg-neutral-950/60 px-3 py-1.5 rounded-lg border border-neutral-800">
              <span className="text-emerald-300 font-semibold">1.</span> Apply NEXT
              <br />
              <span className="text-rose-300 font-semibold">2.</span> Purge OLD file
            </div>
          </div>

          {/* Slot NEXT */}
          <div className="p-4 rounded-xl bg-neutral-950/80 border border-sky-500/30 relative">
            <div className="flex items-center justify-between mb-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-sky-500/20 text-sky-300 font-bold">
                SLOT: NEXT (Pre-Buffer)
              </span>
              <span className="text-[10px] text-neutral-400 font-mono">
                {nextFile ? `${(nextFile.fileSizeBytes / 1024).toFixed(0)} KB` : 'Standby'}
              </span>
            </div>
            {nextWallpaperBuffer ? (
              <div className="flex items-center gap-3">
                <img
                  src={nextWallpaperBuffer.thumbnailUrl}
                  alt={nextWallpaperBuffer.title}
                  className="w-12 h-16 rounded-lg object-cover bg-neutral-800 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-neutral-200 truncate">{nextWallpaperBuffer.title}</p>
                  <p className="text-[11px] text-neutral-400 truncate">by {nextWallpaperBuffer.authorName}</p>
                  <p className="text-[10px] font-mono text-sky-400 mt-1">wallpaper_next.webp</p>
                </div>
              </div>
            ) : (
              <div className="py-4 text-center text-xs text-neutral-400">
                Next image queued in RAM, ready for buffer write
              </div>
            )}
            <div className="mt-3 pt-2 border-t border-neutral-800 flex items-center justify-between text-[10px] text-neutral-400">
              <span>Ready for seamless swap</span>
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
            </div>
          </div>
        </div>
      </div>

      {/* Queue Monitor & Rate-Limit Protection (PRD Section 31 & 32) */}
      <div className="p-5 rounded-2xl bg-neutral-900/90 border border-neutral-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-amber-400" />
            <div>
              <h4 className="text-sm font-semibold text-neutral-200">
                Rate-Limit Protection Queue ({queue.length} items ready)
              </h4>
              <p className="text-xs text-neutral-400">
                Batched metadata pre-fetching protects Unsplash API quota (50 req/hr limit)
              </p>
            </div>
          </div>
          <button
            onClick={onRefillQueue}
            className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium flex items-center gap-1 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Refill Batch
          </button>
        </div>

        {queue.length === 0 ? (
          <p className="text-xs text-neutral-500 italic p-3 bg-neutral-950/50 rounded-xl">
            Queue is refilling automatically in background...
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {queue.slice(0, 6).map((item, idx) => (
              <div
                key={`${item.id}-${idx}`}
                className="p-2 rounded-xl bg-neutral-950/70 border border-neutral-800/80 flex items-center gap-2"
              >
                <img
                  src={item.thumbnailUrl}
                  alt={item.title}
                  className="w-8 h-12 rounded object-cover bg-neutral-800 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <span className="text-[9px] font-mono text-amber-400">#{idx + 1}</span>
                  <p className="text-[11px] font-medium text-neutral-200 truncate">{item.title}</p>
                  <p className="text-[9px] text-neutral-500 truncate">{item.category}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Live Pipeline Execution Log Console */}
      <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <h4 className="text-sm font-semibold text-neutral-200">Android Wallpaper Pipeline Log</h4>
          </div>
          <span className="text-xs font-mono text-neutral-500">{logs.length} events logged</span>
        </div>

        <div className="h-64 overflow-y-auto rounded-xl bg-neutral-950 border border-neutral-800/90 p-3 space-y-2 font-mono text-xs">
          {logs.length === 0 ? (
            <p className="text-neutral-500 italic">No events logged yet. Trigger next wallpaper to start.</p>
          ) : (
            logs.map((log) => {
              let badgeColor = 'text-neutral-400 bg-neutral-800/40 border-neutral-700';
              let Icon = Info;
              if (log.status === 'success') {
                badgeColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
                Icon = CheckCircle2;
              } else if (log.status === 'warning') {
                badgeColor = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
                Icon = AlertTriangle;
              } else if (log.status === 'error') {
                badgeColor = 'text-rose-400 bg-rose-500/10 border-rose-500/30';
                Icon = AlertTriangle;
              }

              return (
                <div 
                  key={log.id} 
                  className="flex items-start gap-2.5 p-2 rounded-lg bg-neutral-900/40 border border-neutral-800/50 hover:border-neutral-700/80 transition-colors"
                >
                  <Icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                    log.status === 'success' ? 'text-emerald-400' :
                    log.status === 'warning' ? 'text-amber-400' :
                    log.status === 'error' ? 'text-rose-400' : 'text-neutral-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.2 rounded text-[10px] uppercase font-bold border ${badgeColor}`}>
                        {log.step}
                      </span>
                      <span className="text-[10px] text-neutral-500">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}
                      </span>
                    </div>
                    <p className="text-neutral-200 mt-1">{log.message}</p>
                    {log.details && (
                      <p className="text-[11px] text-neutral-400 mt-0.5 font-sans">{log.details}</p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
