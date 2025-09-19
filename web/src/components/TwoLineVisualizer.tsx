"use client";
import React, { useMemo } from 'react';
import type { WasmExports } from '../lib/wasm';

type Props = {
  wasm: WasmExports | null;
  n: string;
  exponent: string; // e or d
  mode?: 'enc' | 'dec';
  maxPoints?: number; // cap for performance
  width?: number; // coordinate width
  height?: number;
  visible?: number; // how many mappings to show (progressive)
};

export function TwoLineVisualizer({ wasm, n, exponent, mode = 'enc', maxPoints = 200, width = 1000, height = 260, visible }: Props) {
  const data = useMemo(() => {
    try {
      const N = BigInt(n);
      if (N <= 1n) return [] as Array<{ i: number; j: number }>;
      const count = Number(N <= BigInt(maxPoints) ? N : BigInt(maxPoints));
      if (!wasm) return [];
      const arr = wasm.map_modexp(exponent, n, count);
      const pairs: Array<{ i: number; j: number }> = new Array(count);
      for (let i = 0; i < count; i++) pairs[i] = { i, j: arr[i]! };
      return pairs;
    } catch {
      return [] as Array<{ i: number; j: number }>;
    }
  }, [wasm, n, exponent, maxPoints]);

  const margin = { top: 30, right: 20, bottom: 40, left: 20 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;
  const topY = 10;
  const bottomY = innerH - 10;
  const count = data.length;
  const linkCount = Math.max(0, Math.min(count, typeof visible === 'number' ? Math.floor(visible) : count));
  const x = (idx: number) => (count > 1 ? (idx / (count - 1)) * innerW : innerW / 2);

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="w-full">
      <g transform={`translate(${margin.left},${margin.top})`}>
        {/* axes lines */}
        <line x1={0} y1={topY} x2={innerW} y2={topY} style={{ stroke: 'var(--ui-border)', opacity: 0.6, strokeWidth: 1 }} />
        <line x1={0} y1={bottomY} x2={innerW} y2={bottomY} style={{ stroke: 'var(--ui-border)', opacity: 0.6, strokeWidth: 1 }} />
        {/* nodes */}
        {Array.from({ length: count }).map((_, i) => (
          <circle key={`t${i}`} cx={x(i)} cy={topY} r={1.5} className="fill-current" />
        ))}
        {Array.from({ length: count }).map((_, i) => (
          <circle key={`b${i}`} cx={x(i)} cy={bottomY} r={1.5} className="fill-current" />
        ))}
        {/* links */}
        {data.slice(0, linkCount).map(({ i, j }, k) => (
          <line
            key={`l${k}`}
            x1={x(i)}
            y1={topY}
            x2={x(j)}
            y2={bottomY}
            style={{ stroke: 'var(--ui-accent)', strokeWidth: 1.25, opacity: 0.95 }}
          />
        ))}
      </g>
    </svg>
  );
}

export default TwoLineVisualizer;
