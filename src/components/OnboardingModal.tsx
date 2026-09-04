import React, { useState } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  Check, 
  Wifi, 
  Sliders, 
  ShieldCheck, 
  Layers,
  Image as ImageIcon
} from 'lucide-react';
import { PREDEFINED_CATEGORIES } from '../data/curatedWallpapers';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: (data: {
    interests: string[];
    intervalMinutes: number;
    wifiOnly: boolean;
  }) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onComplete,
}) => {
  const [step, setStep] = useState<number>(1);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    'Nature',
    'Mountains',
    'Cyberpunk',
    'Minimal',
  ]);
  const [intervalMinutes, setIntervalMinutes] = useState<number>(10);
  const [wifiOnly, setWifiOnly] = useState<boolean>(false);

  if (!isOpen) return null;

  const toggleInterest = (cat: string) => {
    if (selectedInterests.includes(cat)) {
      if (selectedInterests.length > 1) {
        setSelectedInterests(selectedInterests.filter((c) => c !== cat));
      }
    } else {
      setSelectedInterests([...selectedInterests, cat]);
    }
  };

  const handleFinish = () => {
    onComplete({
      interests: selectedInterests,
      intervalMinutes,
      wifiOnly,
    });
  };

  return (
    <div id="onboarding-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        id="onboarding-modal-card"
        className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-neutral-200"
      >
        {/* Step progress header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold text-sm">
              {step}
            </div>
            <span className="text-xs font-semibold text-neutral-300">Step {step} of 4</span>
          </div>
          <div className="flex gap-1">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`w-6 h-1 rounded-full transition-colors ${
                  s <= step ? 'bg-emerald-500' : 'bg-neutral-800'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step 1: Welcome */}
        {step === 1 && (
          <div className="p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-neutral-100">Welcome to WallFlow</h2>
              <p className="text-sm text-neutral-400 mt-1 leading-relaxed">
                Automatically discover stunning wallpapers based on your exact interests, rotate them at your preferred interval, and maintain zero phone storage bloat with aggressive cache cleanup.
              </p>
            </div>

            <div className="space-y-2 pt-2 text-xs text-neutral-300">
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-neutral-950/60 border border-neutral-800">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Rotates concept-by-concept for maximum aesthetic variety</span>
              </div>
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-neutral-950/60 border border-neutral-800">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Strict 2-file storage cache: deletes previous images immediately</span>
              </div>
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-neutral-950/60 border border-neutral-800">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Rate-limit protected queue & battery conscious</span>
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full mt-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 2: Interests */}
        {step === 2 && (
          <div className="p-6 space-y-4">
            <div>
              <h2 className="text-lg font-bold text-neutral-100">What wallpapers do you love?</h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Pick your preferred topics. The engine rotates these one-by-one.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
              {PREDEFINED_CATEGORIES.slice(0, 16).map((cat) => {
                const isSelected = selectedInterests.includes(cat);
                return (
                  <button
                    key={cat}
                    onClick={() => toggleInterest(cat)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                        : 'bg-neutral-950/60 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                    }`}
                  >
                    <span>{cat}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setStep(1)}
                className="py-2.5 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold rounded-xl"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5"
              >
                <span>Next: Frequency</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Interval */}
        {step === 3 && (
          <div className="p-6 space-y-4">
            <div>
              <h2 className="text-lg font-bold text-neutral-100">How often should wallpapers change?</h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Select your preferred interval. You can fine-tune this anytime in settings.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { label: '1 min*', minutes: 1 },
                { label: '5 min', minutes: 5 },
                { label: '10 min', minutes: 10 },
                { label: '30 min', minutes: 30 },
                { label: '1 hour', minutes: 60 },
                { label: 'Daily', minutes: 1440 },
              ].map((opt) => (
                <button
                  key={opt.minutes}
                  onClick={() => setIntervalMinutes(opt.minutes)}
                  className={`py-3 px-3 rounded-xl text-xs font-semibold border transition-all ${
                    intervalMinutes === opt.minutes
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                      : 'bg-neutral-950/60 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <p className="text-[11px] text-neutral-500 italic">
              *Note: 1-minute mode on Android operates on a best-effort schedule due to OEM background limitations.
            </p>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setStep(2)}
                className="py-2.5 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold rounded-xl"
              >
                Back
              </button>
              <button
                onClick={() => setStep(4)}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5"
              >
                <span>Next: Network & Permissions</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Network & Confirm */}
        {step === 4 && (
          <div className="p-6 space-y-4">
            <div>
              <h2 className="text-lg font-bold text-neutral-100">Almost ready!</h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Confirm your network preferences to begin automation.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-emerald-400" />
                  <div>
                    <span className="text-xs font-medium text-neutral-200">Wi-Fi Only Mode</span>
                    <p className="text-[10px] text-neutral-400">Save mobile data by pausing cellular downloads</p>
                  </div>
                </div>
                <button
                  onClick={() => setWifiOnly(!wifiOnly)}
                  className={`w-10 h-5 rounded-full transition-colors relative ${
                    wifiOnly ? 'bg-emerald-500' : 'bg-neutral-800'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      wifiOnly ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              <div className="pt-2 border-t border-neutral-800/80 flex items-center gap-2 text-xs text-neutral-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Granted: INTERNET & WALLPAPER_MANAGER permissions</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setStep(3)}
                className="py-2.5 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold rounded-xl"
              >
                Back
              </button>
              <button
                id="start-wallpaper-automation-btn"
                onClick={handleFinish}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>Start Wallpaper Automation</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
