"use client";
import React, { useMemo } from 'react';
import { Panel } from '../../components/Panel';
import { StepController } from '../../components/StepController';
import { TwoLineVisualizer } from '../../components/TwoLineVisualizer';
import type { WasmExports } from '../../lib/wasm';

type Props = {
  n: string;
  wasm: WasmExports | null;
  e: string; d: string;
  vizTotal: number; vizStep: number; setVizStep: (k: number)=>void;
  vizPlaying: boolean; setVizPlaying: (v: boolean)=>void;
  vizSpeed: number; setVizSpeed: (v: number)=>void;
  vizWidth: number;
};

export default function VisualizersPanel({ n, wasm, e, d, vizTotal, vizStep, setVizStep, vizPlaying, setVizPlaying, vizSpeed, setVizSpeed, vizWidth }: Props) {
  // Precompute mapping pairs for small n to power the math explanation box.
  const pairs = useMemo(() => {
    try {
      if (!n || !wasm) return [] as Array<{ i: number; j: number }>;
      const N = BigInt(n);
      if (N <= 1n) return [] as Array<{ i: number; j: number }>;
      const count = Math.max(0, Math.min(vizTotal, 2000));
      const arr = wasm.map_modexp(e, n, count);
      const p: Array<{ i: number; j: number }> = new Array(count);
      for (let i = 0; i < count; i++) p[i] = { i, j: arr[i]! };
      return p;
    } catch { return [] as Array<{ i: number; j: number }>; }
  }, [wasm, n, e, vizTotal]);
  const linkCount = Math.max(0, Math.min(pairs.length, typeof vizStep === 'number' ? Math.floor(vizStep) : pairs.length));
  const current = linkCount > 0 ? pairs[linkCount - 1] : null;

  return (
    <Panel title="Visualizers" subtitle="Explore mappings across all residues.">
      {!n && (
        <div className="text-sm text-gray-500">Enter p and q or click Auto-generate to compute n.</div>
      )}
      {n && BigInt(n) > 323n && (
        <div className="text-sm text-[var(--ui-muted)] py-10">n is large (&gt; 323). The visualizer is hidden for large n. Choose smaller primes (≤ 19) to explore the mappings.</div>
      )}
      {n && BigInt(n) <= 323n && (
        <div>
          <div className="border-b border-[var(--ui-border)] mb-3 flex items-center justify-end">
            <div className="flex items-center gap-3 text-xs text-[var(--ui-muted)]">
              <StepController
                total={vizTotal}
                step={vizStep}
                onStep={setVizStep}
                playing={vizPlaying}
                onTogglePlay={()=>setVizPlaying(!vizPlaying)}
                speed={vizSpeed}
                onSpeed={setVizSpeed}
              />
            </div>
          </div>
          <div className="mb-2">
            <TwoLineVisualizer wasm={wasm} n={n} exponent={e} maxPoints={Math.min(Number(n), 2000)} width={vizWidth} visible={vizStep} />
          </div>
          {/* math explanation box */}
          <div className="mt-3">
            {current ? (
              <div className="rounded-lg border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2 text-sm flex items-center justify-between">
                <div className="text-[var(--ui-muted)]">Step {linkCount}</div>
                <div className="font-mono text-[var(--ui-text)]">
                  {current.i}<sup className="ml-0.5">{e}</sup>
                  <span className="mx-1">mod</span>
                  {n}
                  <span className="mx-1">=</span>
                  <span className="text-[var(--ui-accent)] font-semibold">{current.j}</span>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2 text-sm text-[var(--ui-muted)]">Press Play or drag the Step slider to see each congruence i^e mod n.</div>
            )}
          </div>
          {/* history (always on) and optional detail */}
          {linkCount > 1 && (
            <div className="mt-2 text-sm font-mono text-[var(--ui-muted)]">
              <div className="text-xs mb-1">Previous results</div>
              <div className="max-h-32 overflow-y-auto pr-2 space-y-0.5">
                {Array.from({length: Math.min(10, linkCount - 1)}).map((_, idx)=>{
                  const k = linkCount - 2 - idx; // exclude current
                  const s = pairs[k]!;
                  return (
                    <div key={`h${k}`}>{s.i}^{e} mod {n} = <span className="text-[var(--ui-text)]">{s.j}</span></div>
                  );
                })}
              </div>
            </div>
          )}
          {/* square-and-multiply detail removed by request */}
        </div>
      )}
    </Panel>
  );
}
