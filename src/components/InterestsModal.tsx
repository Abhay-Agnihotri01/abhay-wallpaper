import React, { useState } from 'react';
import { X, Plus, Sparkles, Check } from 'lucide-react';
import { PREDEFINED_CATEGORIES } from '../data/curatedWallpapers';

interface InterestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedInterests: string[];
  onAddInterest: (tag: string) => void;
  onRemoveInterest: (tag: string) => void;
}

export const InterestsModal: React.FC<InterestsModalProps> = ({
  isOpen,
  onClose,
  selectedInterests,
  onAddInterest,
  onRemoveInterest,
}) => {
  const [customInput, setCustomInput] = useState('');

  if (!isOpen) return null;

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = customInput.trim();
    if (clean && !selectedInterests.includes(clean)) {
      onAddInterest(clean);
      setCustomInput('');
    }
  };

  const toggleCategory = (cat: string) => {
    if (selectedInterests.includes(cat)) {
      onRemoveInterest(cat);
    } else {
      onAddInterest(cat);
    }
  };

  return (
    <div id="interests-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        id="interests-modal-card" 
        className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-neutral-100">Wallpaper Interests</h2>
              <p className="text-xs text-neutral-400">Search keywords rotated one-by-one for maximum variety</p>
            </div>
          </div>
          <button
            id="close-interests-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-neutral-200">
          {/* Custom tag input */}
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-2 uppercase tracking-wider">
              Add Custom Keyword
            </label>
            <form onSubmit={handleAddCustom} className="flex gap-2">
              <input
                id="custom-interest-input"
                type="text"
                placeholder="e.g. dark forest, neon rain, cyberpunk, retro anime..."
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
              <button
                id="add-custom-interest-btn"
                type="submit"
                disabled={!customInput.trim()}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-sm font-medium flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </form>
          </div>

          {/* Currently Selected Chips */}
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-2 uppercase tracking-wider">
              Active Interests ({selectedInterests.length})
            </label>
            {selectedInterests.length === 0 ? (
              <p className="text-xs text-amber-400/90 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                No interests selected. Please pick at least one topic below or add a custom keyword.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {selectedInterests.map((interest) => (
                  <span
                    key={interest}
                    id={`active-interest-${interest.toLowerCase().replace(/\s+/g, '-')}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/15 border border-emerald-500/30 text-emerald-300"
                  >
                    <span>{interest}</span>
                    <button
                      onClick={() => onRemoveInterest(interest)}
                      className="hover:text-emerald-100 transition-colors"
                      title="Remove"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Predefined Categories */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
                Explore Predefined Categories
              </label>
              <span className="text-xs text-neutral-500">Tap to toggle</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PREDEFINED_CATEGORIES.map((cat) => {
                const isSelected = selectedInterests.includes(cat);
                return (
                  <button
                    key={cat}
                    id={`category-toggle-${cat.toLowerCase().replace(/\s+/g, '-')}`}
                    onClick={() => toggleCategory(cat)}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium border text-left transition-all ${
                      isSelected
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-sm'
                        : 'bg-neutral-950/60 border-neutral-800 text-neutral-300 hover:border-neutral-700 hover:text-white'
                    }`}
                  >
                    <span className="truncate">{cat}</span>
                    {isSelected ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-1" />
                    ) : (
                      <Plus className="w-3.5 h-3.5 text-neutral-500 shrink-0 ml-1" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-950/50 flex justify-end">
          <button
            id="interests-done-btn"
            onClick={onClose}
            className="px-5 py-2 bg-neutral-100 hover:bg-white text-neutral-900 rounded-xl text-sm font-semibold transition-colors"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};
