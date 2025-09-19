"use client";
import React from 'react';
import { Panel } from '../../components/Panel';

type Props = {
  n: string;
  useLambda: boolean; setUseLambda: (v: boolean)=>void;
  phiVal: string; lambdaVal: string; gcdOk: boolean; gcdValue?: string;
  e: string; d: string;
  collapsible?: boolean; collapsed?: boolean; onToggle?: ()=>void;
};

export default function DerivedPanel({ n, useLambda, setUseLambda, phiVal, lambdaVal, gcdOk, gcdValue, e, d, collapsible, collapsed, onToggle }: Props) {
  const T = useLambda ? lambdaVal : phiVal;
  return (
    <Panel title="Derived" subtitle="Choose totient φ(n) or Carmichael λ(n) for exponent validity and inverse." collapsible={collapsible} collapsed={collapsed} onToggle={onToggle}>
      <div className="grid grid-cols-1 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">n</label>
          <div className="w-full rounded-md bg-[var(--ui-surface)] border border-[var(--ui-border)] px-2 py-1 font-mono text-[var(--ui-text)] break-all">{n || '—'}</div>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-gray-500">Coprime to:</span>
          <label className="inline-flex items-center gap-1 cursor-pointer"><input type="radio" name="tot" checked={!useLambda} onChange={()=>setUseLambda(false)} /> φ(n) = (p−1)(q−1)</label>
          <label className="inline-flex items-center gap-1 cursor-pointer"><input type="radio" name="tot" checked={useLambda} onChange={()=>setUseLambda(true)} /> λ(n) = lcm(p−1, q−1)</label>
        </div>
        {T && (
          <div className="-mt-2 text-xs flex flex-wrap items-center gap-x-4 gap-y-1">
            <div className="text-[var(--ui-muted)]">T = {useLambda ? 'λ(n)' : 'φ(n)'}</div>
            {typeof gcdValue === 'string' && gcdValue !== '' && (
              <div className={gcdOk ? 'text-[var(--ui-positive)]' : 'text-[var(--ui-warning)]'}>
                gcd(e, T) = {gcdValue}{!gcdOk && ' · no inverse'}
              </div>
            )}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
          <div className="truncate"><span className="text-gray-500">φ(n): </span><span className="font-mono break-all">{phiVal || '—'}</span></div>
          <div className="truncate"><span className="text-gray-500">λ(n): </span><span className="font-mono break-all">{lambdaVal || '—'}</span></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">e (public exponent)</label>
            <div className="w-full rounded-md bg-[var(--ui-surface)] border border-[var(--ui-border)] px-2 py-1 font-mono text-[var(--ui-text)] break-all">{e || '—'}</div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">d (private)</label>
            <div className="w-full rounded-md bg-[var(--ui-surface)] border border-[var(--ui-border)] px-2 py-1 font-mono text-[var(--ui-text)] break-all">{gcdOk ? (d || '—') : 'no inverse (gcd ≠ 1)'}</div>
          </div>
        </div>
        {e && d && e === d && (
          <div className="text-xs text-[var(--ui-warning)]">Note: e and d should differ; try another e.</div>
        )}
      </div>
    </Panel>
  );
}
