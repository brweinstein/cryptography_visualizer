"use client";
import { useEffect, useMemo, useRef, useState } from 'react';
import { loadWasm, WasmExports } from '../lib/wasm';
import PrimesPanel from '../components/panels/PrimesPanel';
import DerivedPanel from '../components/panels/DerivedPanel';
import VisualizersPanel from '../components/panels/VisualizersPanel';
// All RSA/number theory is delegated to Rust via WASM exports. No JS math here.

type Keypair = { p: string; q: string; n: string; e: string; d: string };

export default function HomePage() {
  const [w, setW] = useState<WasmExports | null>(null);
  const [status, setStatus] = useState('Loading WASM...');

  // Parameters
  // bits slider removed
  const [p, setP] = useState('');
  const [q, setQ] = useState('');
  const [n, setN] = useState('');
  const [e, setE] = useState('65537');
  const [d, setD] = useState('');
  const [useLambda, setUseLambda] = useState(true); // λ(n)=lcm(p-1,q-1) vs φ(n)=(p-1)(q-1)
  // n range for auto-generate
  const [nMin, setNMin] = useState('2');
  const [nMax, setNMax] = useState('200');
  const [touchedE, setTouchedE] = useState(false);
  const [touchedD, setTouchedD] = useState(false);
  // Removed Encrypt/Decrypt and Text converter panels; no message/text state here
  // Only Two-line visualizer is supported
  // dynamic width & caps via ResizeObserver
  const vizRef = useRef<HTMLDivElement | null>(null);
  const [vizWidth, setVizWidth] = useState(960); // dynamic width for visualizers
  useEffect(() => {
    if (!vizRef.current) return;
    const el = vizRef.current;
    const ro = new (window as any).ResizeObserver((entries: any) => {
      for (const e of entries) {
        const w = Math.floor(e.contentRect?.width || el.clientWidth || 960);
        setVizWidth(w);
      }
    });
    ro.observe(el);
    setVizWidth(Math.floor(el.clientWidth || 960));
    return () => ro.disconnect();
  }, [vizRef.current]);
  const twoLineCap = Math.max(60, Math.floor((vizWidth - 40) / 6));
  // circleCap removed
  // play/animation for visualizers
  const [vizPlaying, setVizPlaying] = useState(false);
  const [vizSpeed, setVizSpeed] = useState<number>(()=>{
    if (typeof window === 'undefined') return 0.5;
    const v = Number(window.localStorage.getItem('vizSpeed') || '0.5');
    return isFinite(v) ? Math.max(0, Math.min(1, v)) : 0.5;
  }); // 0..1
  const [vizStep, setVizStep] = useState(0); // how many links visible
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number | null>(null);
  // Step count equals number of residues we draw: min(n, cap) unless Show all is enabled,
  // in which case it is n (bounded to a safety max for perf in code that sets maxPoints).
  const vizTotal = useMemo(() => {
    try {
      if (!n || BigInt(n) <= 0n) return 0;
      const N = Number(n);
      return Math.min(N, 2000);
    } catch { return 0; }
  }, [n]);
  useEffect(() => { setVizStep((k) => Math.min(k, vizTotal)); }, [vizTotal]);

  // drive animation
  useEffect(() => {
    if (!n || BigInt(n) <= 0n) return;
  const total = Number(Math.min(Number(n), 2000));
    if (!vizPlaying) { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; lastRef.current = null; return; }
    const tick = (t: number) => {
      const last = lastRef.current ?? t;
      lastRef.current = t;
      const dt = (t - last) / 1000; // seconds
      const speed = Math.max(0, Math.min(1, vizSpeed));
      const advance = dt * (2 + 60 * speed); // 2..62 links per second
      setVizStep((k) => {
        const nk = Math.min(total, Math.max(0, k + advance));
        if (nk >= total) {
          // stop at completion
          if (rafRef.current) cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
          lastRef.current = null;
          setVizPlaying(false);
          return total;
        }
        return nk;
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; lastRef.current = null; };
  }, [vizPlaying, vizSpeed, n, twoLineCap]);

  useEffect(() => {
    let mounted = true;
    loadWasm()
      .then((mod) => { if (!mounted) return; setW(mod); setStatus('Ready'); })
      .catch((err) => { console.error(err); setStatus('Using JS stub.'); });
    return () => { mounted = false; };
  }, []);

  // Persist UI prefs
  // no vizTab persistence
  useEffect(()=>{ try { if (typeof window !== 'undefined') window.localStorage.setItem('vizSpeed', String(vizSpeed)); } catch {} }, [vizSpeed]);

  // Helpers
  const isReady = !!w;
  const canKeyFromPQ = Boolean(p && q && p !== q && w?.is_prime(p) && w?.is_prime(q));

  // Derive n and (optionally) e,d when p,q or totient choice changes.
  useEffect(() => {
    if (!w || !canKeyFromPQ) return;
    const bigN = w.n_from_pq(p, q);
    setN((prev) => (prev === bigN ? prev : bigN));
    const hint = touchedE ? e : undefined;
    const ed = w.choose_e_d(p, q, useLambda, hint);
    if (ed) {
      if (!touchedE) setE((prev) => (prev === ed.e ? prev : ed.e));
      if (!touchedD) setD((prev) => (prev === ed.d ? prev : ed.d));
    }
  }, [w, canKeyFromPQ, p, q, useLambda, touchedE, touchedD, e]);

  // Handlers for e/d edits to keep coherence when possible
  const handleEChange = (val: string) => {
    setTouchedE(true);
    setE(val);
    try {
      if (!w || !canKeyFromPQ) return;
      const totStr = useLambda ? w.lambda_of(p, q) : w.phi_of(p, q);
      const tot = BigInt(totStr);
      let ee = BigInt(val);
      // if gcd != 1, search next odd
      if (ee <= 1n || ee >= tot || BigInt(w.gcd(ee.toString(), totStr)) !== 1n) {
        let guard = 0; if ((ee & 1n) === 0n) ee += 1n;
        while (BigInt(w.gcd(ee.toString(), totStr)) !== 1n && guard++ < 1000) ee += 2n;
        if (ee.toString() !== val) setE(ee.toString());
      }
  const inv = w.mod_inv(ee.toString(), totStr);
      if (inv) {
        if (inv === ee.toString()) {
          // try to bump e
          let adj = ee + 2n; let guard = 0;
          while (guard++ < 1000) {
            if (BigInt(w.gcd(adj.toString(), totStr)) === 1n) {
              const inv2 = w.mod_inv(adj.toString(), totStr);
              if (inv2 && inv2 !== adj.toString()) { if (adj.toString() !== val) setE(adj.toString()); setD(inv2); break; }
            }
            adj += 2n;
          }
        } else {
          if (!touchedD) setD(inv);
        }
      }
    } catch { /* ignore */ }
  };
  const handleDChange = (val: string) => { setTouchedD(true); setD(val); };

  // Bias autogenerate to very small primes for visual smoothness (n <= 323); allow manual larger input
  const autoGenerate = () => {
    // Pick two distinct primes from <= 19 so that max n = 17*19 = 323
    const primes = [2,3,5,7,11,13,17,19];
    let P = '';
    let Q = '';
    for (let guard = 0; guard < 10; guard++) {
      const i = Math.floor(Math.random() * primes.length);
      let j = Math.floor(Math.random() * primes.length);
      if (j === i) j = (j + 1) % primes.length;
      P = String(primes[i]);
      Q = String(primes[j]);
      if (P !== Q) break;
    }
    setP(P);
    setQ(Q);
    if (w) setN(w.n_from_pq(P, Q));
    // Let the derivation effect compute fresh (e,d)
    setTouchedE(false);
    setTouchedD(false);
    setE('');
    setD('');
  };

  const fillNandPhi = () => {
    if (!p || !q) return;
    if (p === q) return; // require distinct primes
    if (!w) return;
    setN(w.n_from_pq(p, q));
  };


  // derived displays
  const phiVal = useMemo(() => {
    try {
      if (!p || !q || !w) return '';
      return w.phi_of(p, q);
    } catch { return ''; }
  }, [p, q, w]);

  const lambdaVal = useMemo(() => {
    try {
      if (!p || !q || !w) return '';
      return w.lambda_of(p, q);
    } catch { return ''; }
  }, [p, q, w]);

  const gcdOk = useMemo(() => {
    try {
      if (!e || !w) return false;
      const totStr = useLambda ? lambdaVal : phiVal;
      if (!totStr) return false;
      return w.gcd(e, totStr) === '1';
    } catch { return false; }
  }, [e, phiVal, lambdaVal, useLambda, w]);

  const gcdValue = useMemo(() => {
    try {
      if (!e || !w) return '';
      const totStr = useLambda ? lambdaVal : phiVal;
      if (!totStr) return '';
      return w.gcd(e, totStr);
    } catch { return ''; }
  }, [e, phiVal, lambdaVal, useLambda, w]);

  // Validation messages for e and d
  const eWarn = useMemo(() => {
    try {
      const T = useLambda ? lambdaVal : phiVal;
      if (!T || !e) return '';
      const ee = BigInt(e);
      const TT = BigInt(T);
      if (ee <= 1n || ee >= TT) return 'e must satisfy 1 < e < T';
      if (w && w.gcd(e, T) !== '1') return 'e must be coprime to T';
      return '';
    } catch { return 'e is not a valid integer'; }
  }, [e, phiVal, lambdaVal, useLambda, w]);

  const dWarn = useMemo(() => {
    try {
      const T = useLambda ? lambdaVal : phiVal;
      if (!T || !d) return '';
      const TT = BigInt(T);
      const dd = BigInt(d);
      if (dd <= 1n || dd >= TT) return 'd must satisfy 1 < d < T';
      if (!w) return '';
      // Only validate inverse if gcd(e,T) = 1 and e present
      if (!e || w.gcd(e, T) !== '1') return '';
      const inv = w.mod_inv(e, T);
      if (!inv) return 'no inverse exists for this e';
      // compare normalized d mod T with inv
      const norm = (dd % TT + TT) % TT;
      if (norm.toString() !== inv) return 'd must be the modular inverse of e mod T';
      return '';
    } catch { return 'd is not a valid integer'; }
  }, [d, e, phiVal, lambdaVal, useLambda, w]);

  // Collapsible states for panels
  const [collapsePrimes, setCollapsePrimes] = useState(false);
  const [collapseDerived, setCollapseDerived] = useState(false);
  // Removed collapse states for Encrypt/Decrypt and Text panels

  // Persist collapsed state
  useEffect(() => {
    try {
      const cp = localStorage.getItem('collapsePrimes');
      const cd = localStorage.getItem('collapseDerived');
      if (cp !== null) setCollapsePrimes(cp === '1');
      if (cd !== null) setCollapseDerived(cd === '1');
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { try { localStorage.setItem('collapsePrimes', collapsePrimes ? '1':'0'); } catch {} }, [collapsePrimes]);
  useEffect(() => { try { localStorage.setItem('collapseDerived', collapseDerived ? '1':'0'); } catch {} }, [collapseDerived]);
  // Removed localStorage persistence for deleted panels

  return (
    <div className="space-y-6">
      <div className="text-xs text-[var(--ui-muted)]">Status: {status}</div>
      <section ref={vizRef}>
        <VisualizersPanel
          n={n}
          wasm={w}
          e={e} d={d}
          vizTotal={vizTotal} vizStep={vizStep} setVizStep={setVizStep}
          vizPlaying={vizPlaying} setVizPlaying={(v)=>setVizPlaying(v)}
          vizSpeed={vizSpeed} setVizSpeed={setVizSpeed}
          vizWidth={vizWidth}
        />
      </section>
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <PrimesPanel
  p={p} q={q}
  setP={setP} setQ={setQ}
        n={n}
        nMin={nMin} nMax={nMax}
  setNMin={(v)=>setNMin(v)}
  setNMax={(v)=>setNMax(v)}
        onAuto={autoGenerate}
        isPrime={(v)=>!!w?.is_prime(v)}
        twoLineCap={twoLineCap}
        collapsible
        collapsed={collapsePrimes}
        onToggle={()=>setCollapsePrimes(v=>!v)}
        />

  <DerivedPanel
    n={n}
        useLambda={useLambda} setUseLambda={setUseLambda}
  phiVal={phiVal} lambdaVal={lambdaVal} gcdOk={gcdOk}
  gcdValue={gcdValue}
    e={e} d={d}
        collapsible
        collapsed={collapseDerived}
        onToggle={()=>setCollapseDerived(v=>!v)}
        />

        {/* Encrypt/Decrypt and Text converter panels removed */}
      </section>
      {/* Footer bar is now provided globally by layout.tsx */}
    </div>
  );
}
