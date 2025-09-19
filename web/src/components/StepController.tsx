"use client";
import React from 'react';

type Props = {
  total: number; // total steps
  step: number; // current visible steps (0..total)
  onStep: (k: number) => void;
  playing: boolean;
  onTogglePlay: () => void;
  speed: number; // 0..1
  onSpeed: (v: number) => void;
  className?: string;
};

export function StepController({ total, step, onStep, playing, onTogglePlay, speed, onSpeed, className }: Props) {
  const next = () => onStep(Math.min(total, step + 1));
  const prev = () => onStep(Math.max(0, step - 1));
  const reset = () => onStep(0);
  const stepValue = Math.min(Math.floor(step), total);
  const stepPct = total > 0 ? Math.max(0, Math.min(100, (stepValue / total) * 100)) : 0;
  const speedClamped = Math.max(0, Math.min(1, Number.isFinite(speed) ? speed : 0));
  const speedPct = speedClamped * 100;
  return (
    <div className={`flex items-center flex-wrap gap-3 ${className || ''}`}>
      <div className="flex items-center gap-2">
        <button
          onClick={onTogglePlay}
          aria-pressed={playing}
          className={`inline-flex items-center h-7 px-3 rounded-full text-xs font-medium transition-colors ${
            playing
              ? 'bg-[var(--ui-accent)] text-white hover:bg-[var(--ui-accent)]/90'
              : 'bg-[var(--ui-surface-2)] text-[var(--ui-muted)] hover:bg-[var(--ui-surface-3)]'
          }`}
          title={playing ? 'Pause' : 'Play'}
        >
          {playing ? 'Pause' : 'Play'}
        </button>
      </div>

      <div className="flex items-center gap-1 ml-1">
        <button
          onClick={prev}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[var(--ui-border)] bg-[var(--ui-surface-2)] hover:bg-[var(--ui-surface-3)]"
          title="Previous step"
          aria-label="Previous step"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <button
          onClick={next}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[var(--ui-border)] bg-[var(--ui-surface-2)] hover:bg-[var(--ui-surface-3)]"
          title="Next step"
          aria-label="Next step"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
        <button
          onClick={reset}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[var(--ui-border)] bg-[var(--ui-surface-2)] hover:bg-[var(--ui-surface-3)]"
          title="Reset"
          aria-label="Reset"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15A9 9 0 1 0 7 4.27L1 10" />
          </svg>
        </button>
      </div>

      {/* Step slider */}
      <div className="flex items-center gap-2 ml-3 min-w-[220px]">
        <span className="text-xs text-[var(--ui-muted)]">Step</span>
        <input
          type="range"
          min={0}
          max={total}
          step={1}
          value={stepValue}
          onChange={(e)=>onStep(parseInt(e.target.value))}
          className="slider flex-1"
          style={{
            background: `linear-gradient(to right, var(--ui-accent) 0%, var(--ui-accent) ${stepPct}%, var(--ui-surface-2) ${stepPct}%, var(--ui-surface-2) 100%)`,
          }}
        />
        <span className="text-xs tabular-nums">{stepValue} / {total}</span>
      </div>

      {/* Speed slider */}
      <div className="flex items-center gap-2 ml-3 min-w-[200px]">
        <span className="text-xs text-[var(--ui-muted)]">Speed</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={speedClamped}
          onChange={(e)=>{
            const v = parseFloat(e.target.value);
            if (Number.isNaN(v)) { onSpeed(0); return; }
            onSpeed(Math.max(0, Math.min(1, v)));
          }}
          className="slider flex-1"
          style={{
            background: `linear-gradient(to right, var(--ui-accent) 0%, var(--ui-accent) ${speedPct}%, var(--ui-surface-2) ${speedPct}%, var(--ui-surface-2) 100%)`,
          }}
          aria-label="Animation speed"
        />
        <span className="text-xs font-mono tabular-nums w-10 text-right">{speedClamped.toFixed(2)}</span>
      </div>
      <style jsx>{`
        .slider { 
          -webkit-appearance: none; 
          appearance: none; 
          height: 8px; 
          border-radius: 9999px; 
          outline: none; 
          transition: background-color 0.2s ease;
        }
        .slider:focus {
          box-shadow: 0 0 0 3px color-mix(in oklab, var(--ui-accent) 30%, transparent);
        }
        /* WebKit */
        .slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 9999px;
          background: white;
          border: 2px solid var(--ui-accent);
          box-shadow: 0 1px 2px rgba(0,0,0,0.15);
          transition: transform 0.12s ease, box-shadow 0.12s ease;
          margin-top: -4px; /* center on 8px track */
        }
        .slider:hover::-webkit-slider-thumb {
          transform: scale(1.05);
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        }
        .slider:active::-webkit-slider-thumb {
          transform: scale(1.08);
        }
        /* Firefox */
        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 9999px;
          background: white;
          border: 2px solid var(--ui-accent);
          box-shadow: 0 1px 2px rgba(0,0,0,0.15);
          transition: transform 0.12s ease, box-shadow 0.12s ease;
        }
        .slider:hover::-moz-range-thumb { transform: scale(1.05); box-shadow: 0 2px 6px rgba(0,0,0,0.2); }
        .slider:active::-moz-range-thumb { transform: scale(1.08); }
        .slider::-moz-range-track { height: 8px; border-radius: 9999px; background: var(--ui-surface-2); }
        .slider::-moz-range-progress { height: 8px; border-radius: 9999px; background: var(--ui-accent); }
      `}</style>
    </div>
  );
}

export default StepController;
 
