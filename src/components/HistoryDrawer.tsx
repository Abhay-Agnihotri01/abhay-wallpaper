import React, { useState } from 'react';
import { X, Heart, ExternalLink, Download, Clock, Sparkles } from 'lucide-react';
import { Wallpaper } from '../types/wallpaper';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: Wallpaper[];
  favorites: Wallpaper[];
  onToggleFavorite: (wallpaper: Wallpaper) => void;
  onApplyWallpaper: (wallpaper: Wallpaper) => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  favorites,
  onToggleFavorite,
  onApplyWallpaper,
}) => {
  const [activeTab, setActiveTab] = useState<'history' | 'favorites'>('history');

  if (!isOpen) return null;

  const items = activeTab === 'history' ? history : favorites;

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleDownload = (e: React.MouseEvent, url: string, filename: string) => {
    e.stopPropagation();
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.download = `${filename}.jpg`;
    a.click();
  };

  return (
    <div id="history-drawer-overlay" className="fixed inset-0 z-50 flex items-center justify-center sm:justify-end bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        id="history-drawer-panel"
        className="w-full sm:max-w-md h-full bg-neutral-900 border-l border-neutral-800 shadow-2xl flex flex-col overflow-hidden text-neutral-200"
      >
        {/* Top Header */}
        <div className="p-5 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-neutral-100">Wallpaper Collection</h2>
              <p className="text-xs text-neutral-400">Metadata stored locally • zero memory bloat</p>
            </div>
          </div>
          <button
            id="close-history-drawer-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="px-5 pt-3 pb-2 flex gap-2 border-b border-neutral-800 bg-neutral-950/30">
          <button
            id="tab-history-btn"
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
              activeTab === 'history'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
            }`}
          >
            History ({history.length})
          </button>
          <button
            id="tab-favorites-btn"
            onClick={() => setActiveTab('favorites')}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'favorites'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
            }`}
          >
            <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
            Favorites ({favorites.length})
          </button>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-neutral-400">
              <Sparkles className="w-8 h-8 text-neutral-600 mb-2" />
              <p className="text-sm font-medium text-neutral-300">
                {activeTab === 'history' ? 'No wallpaper history yet' : 'No favorites saved'}
              </p>
              <p className="text-xs text-neutral-500 mt-1 max-w-xs">
                {activeTab === 'history'
                  ? 'Wallpapers will appear here as the automator cycles through images.'
                  : 'Tap the heart icon on any wallpaper to add it to your favorites.'}
              </p>
            </div>
          ) : (
            items.map((wp) => {
              const isFav = favorites.some((f) => f.providerImageId === wp.providerImageId);
              return (
                <div
                  key={`${wp.id}-${wp.timestamp}`}
                  id={`history-item-${wp.providerImageId}`}
                  className="group relative flex gap-3 p-2.5 rounded-2xl bg-neutral-950/60 border border-neutral-800/80 hover:border-neutral-700 transition-all"
                >
                  {/* Image thumbnail */}
                  <div className="w-16 h-24 rounded-xl overflow-hidden bg-neutral-800 shrink-0 relative">
                    <img
                      src={wp.thumbnailUrl}
                      alt={wp.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute bottom-1 right-1 text-[9px] px-1 py-0.5 rounded bg-black/70 text-white font-mono">
                      {formatTime(wp.timestamp)}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="text-sm font-medium text-neutral-200 truncate">{wp.title}</h4>
                        <button
                          onClick={() => onToggleFavorite(wp)}
                          className="p-1 rounded-lg hover:bg-neutral-800 transition-colors text-neutral-400 hover:text-rose-400 shrink-0"
                          title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                        >
                          <Heart
                            className={`w-4 h-4 ${
                              isFav ? 'fill-rose-500 text-rose-500' : 'text-neutral-400'
                            }`}
                          />
                        </button>
                      </div>
                      <p className="text-xs text-neutral-400 truncate mt-0.5">
                        by{' '}
                        <a
                          href={wp.authorUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-neutral-300 hover:underline inline-flex items-center gap-0.5"
                        >
                          {wp.authorName}
                          <ExternalLink className="w-2.5 h-2.5 ml-0.5 text-neutral-500" />
                        </a>
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300">
                          {wp.category}
                        </span>
                        <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-mono">
                          {wp.provider}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-neutral-800/60">
                      <button
                        onClick={() => onApplyWallpaper(wp)}
                        className="text-xs px-2.5 py-1 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 rounded-lg font-medium transition-colors"
                      >
                        Set as Current
                      </button>
                      <button
                        onClick={(e) => handleDownload(e, wp.downloadUrl, wp.title)}
                        className="text-xs px-2 py-1 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg transition-colors inline-flex items-center gap-1"
                        title="Download image"
                      >
                        <Download className="w-3 h-3" />
                        <span>Save</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info notice */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950/40 text-[11px] text-neutral-500 text-center">
          WallFlow history complies with storage policies: only IDs & metadata are retained in Room DB.
        </div>
      </div>
    </div>
  );
};
