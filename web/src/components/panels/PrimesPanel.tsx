"use client";
import React from 'react';
import { Panel } from '../../components/Panel';

type Props = {
  p: string; q: string;
  setP: (v: string)=>void; setQ: (v: string)=>void;
  n: string; nMin: string; nMax: string;
  setNMin: (v: string)=>void; setNMax: (v: string)=>void;
  onAuto: () => void;
  isPrime?: (v: string)=>boolean;
  twoLineCap: number;
  collapsible?: boolean;
  collapsed?: boolean;
  onToggle?: ()=>void;
};

export default function PrimesPanel({ p, q, setP, setQ, n, nMin, nMax, setNMin, setNMax, onAuto, isPrime, twoLineCap, collapsible, collapsed, onToggle }: Props) {
  const pPrime = p ? !!isPrime?.(p) : false;
  const qPrime = q ? !!isPrime?.(q) : false;
  return (
    <Panel title="Primes" subtitle="Provide p and q or auto-generate. Auto‑generate picks small primes (≤ 19) so n ≤ 323; you can manually enter larger values." collapsible={collapsible} collapsed={collapsed} onToggle={onToggle}>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">p</label>
          <input value={p} onChange={(e)=>setP(e.target.value)} className="w-full rounded-md bg-[var(--ui-surface)] border border-[var(--ui-border)] px-2 py-1 font-mono text-[var(--ui-text)]" placeholder="prime p" />
          <div className={`mt-1 text-[11px] ${p ? (pPrime ? 'text-gray-500' : 'text-amber-600 dark:text-amber-400') : ''}`}>
            {p ? (pPrime ? 'p is prime' : 'Warning: p is not prime') : '\u00A0'}
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">q</label>
          <input value={q} onChange={(e)=>setQ(e.target.value)} className="w-full rounded-md bg-[var(--ui-surface)] border border-[var(--ui-border)] px-2 py-1 font-mono text-[var(--ui-text)]" placeholder="prime q" />
          <div className={`mt-1 text-[11px] ${q ? (qPrime ? 'text-gray-500' : 'text-amber-600 dark:text-amber-400') : ''}`}>
            {q ? (qPrime ? 'q is prime' : 'Warning: q is not prime') : '\u00A0'}
          </div>
        </div>
      </div>
  <div className="mt-3 flex items-center gap-2">
    <button onClick={onAuto} className="ml-auto rounded-md bg-[var(--ui-accent)] hover:opacity-90 px-3 py-1 text-xs text-[var(--ui-accent-contrast)]">Auto-generate</button>
  </div>
      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
        <div>
          <label className="block text-gray-500 mb-1">n min</label>
          <input value={nMin} onChange={(e)=>setNMin(e.target.value)} className="w-full rounded-md bg-[var(--ui-surface)] border border-[var(--ui-border)] px-2 py-1 font-mono text-[var(--ui-text)]" />
        </div>
        <div>
          <label className="block text-gray-500 mb-1">n max</label>
          <input value={nMax} onChange={(e)=>setNMax(e.target.value)} className="w-full rounded-md bg-[var(--ui-surface)] border border-[var(--ui-border)] px-2 py-1 font-mono text-[var(--ui-text)]" />
        </div>
      </div>
      {(Number(p) > 19 || Number(q) > 19) && (
        <div className="mt-2 text-[11px] text-[var(--ui-muted)]">Note: Auto‑generate selects primes ≤ 19. Larger primes are accepted when entered manually.</div>
      )}
      {n && BigInt(n) > 323n && (
        <div className="mt-1 text-[11px] text-[var(--ui-warning)]">Large n detected. Visualizer displays only when n ≤ 323.</div>
      )}
    </Panel>
  );
}
