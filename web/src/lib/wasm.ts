/// <reference path="../types/wasm-pack.d.ts" />
// WASM loader with typed bindings. Currently provides a dev-stub implementation
// so the app can run before we wire the actual wasm-pack output.

export interface RsaKeyPair { p: string; q: string; n: string; e: string; d: string }

export interface WasmExports {
  generate_prime(bits: number): string;
  is_prime(n: string): boolean;
  mod_pow(base: string, exp: string, modulus: string): string;
  gcd(a: string, b: string): string;
  lcm(a: string, b: string): string;
  egcd(a: string, b: string): { g: string; x: string; y: string };
  mod_inv(a: string, m: string): string | undefined;
  rsa_keypair(bits: number): RsaKeyPair;
  encrypt(message: string, e: string, n: string): string;
  decrypt(ciphertext: string, d: string, n: string): string;
  n_from_pq(p: string, q: string): string;
  phi_of(p: string, q: string): string;
  lambda_of(p: string, q: string): string;
  d_from_e_pq(e: string, p: string, q: string, use_lambda: boolean): string | undefined;
  pick_small_primes_in_range(n_min: string, n_max: string): { p: string; q: string; n: string } | null;
  text_to_big(s: string): string;
  big_to_text(n: string): string | undefined;
  choose_e_d(p: string, q: string, use_lambda: boolean, e_hint?: string): { e: string; d: string } | null;
  map_modexp(e: string, n: string, count: number): Uint32Array;
}

function bi(s: string | number | bigint): bigint {
  return typeof s === 'string' ? BigInt(s) : BigInt(s);
}

function modPow(base: bigint, exp: bigint, mod: bigint): bigint {
  if (mod === 0n) return 0n;
  let result = 1n;
  let b = base % mod;
  let e = exp;
  while (e > 0n) {
    if (e & 1n) result = (result * b) % mod;
    b = (b * b) % mod;
    e >>= 1n;
  }
  return result;
}

function egcd(a: bigint, b: bigint): { g: bigint; x: bigint; y: bigint } {
  if (b === 0n) return { g: a, x: 1n, y: 0n };
  const { g, x, y } = egcd(b, a % b);
  return { g, x: y, y: x - (a / b) * y };
}

function modInv(a: bigint, m: bigint): bigint | undefined {
  const { g, x } = egcd(a, m);
  if (g !== 1n) return undefined;
  let r = x % m;
  if (r < 0) r += m;
  return r;
}

const devStub: WasmExports = {
  generate_prime(bits: number): string {
    // Not a real prime generator; returns a fixed small prime per size bucket for demo only.
    if (bits <= 8) return '251';
    if (bits <= 16) return '65521';
    return '65537';
  },
  is_prime(n: string): boolean {
    const N = bi(n);
    if (N < 2n) return false;
    for (let i = 2n; i * i <= N; i++) if (N % i === 0n) return false;
    return true;
  },
  mod_pow(base: string, exp: string, modulus: string): string {
    return modPow(bi(base), bi(exp), bi(modulus)).toString();
  },
  gcd(a: string, b: string): string {
    let A = bi(a), B = bi(b);
    while (B) { const T = B; B = A % B; A = T; }
    return A.toString();
  },
  lcm(a: string, b: string): string {
    const A = bi(a), B = bi(b);
    if (A === 0n || B === 0n) return '0';
    // lcm(a,b) = |a|/gcd(a,b) * |b|
    let g = A; let Bb = B; while (Bb) { const T = Bb; Bb = g % Bb; g = T; }
    return ((A / g) * B).toString();
  },
  egcd(a: string, b: string) {
    const { g, x, y } = egcd(bi(a), bi(b));
    return { g: g.toString(), x: x.toString(), y: y.toString() };
  },
  mod_inv(a: string, m: string): string | undefined {
    const r = modInv(bi(a), bi(m));
    return r !== undefined ? r.toString() : undefined;
  },
  rsa_keypair(bits: number): RsaKeyPair {
    // Toy RSA with small fixed primes for demo UI only (INSECURE!)
    const p = 61n, q = 53n;
    const n = p * q;
    const phi = (p - 1n) * (q - 1n);
    let e = 65537n;
    // ensure coprime; fallback to 17 if needed
    const g = ((): bigint => { let A = e, B = phi; while (B) { const T = B; B = A % B; A = T; } return A; })();
    if (g !== 1n) e = 17n;
    const d = modInv(e, phi)!;
    return { p: p.toString(), q: q.toString(), n: n.toString(), e: e.toString(), d: d.toString() };
  },
  encrypt(message: string, e: string, n: string): string {
    return modPow(bi(message), bi(e), bi(n)).toString();
  },
  decrypt(ciphertext: string, d: string, n: string): string {
    return modPow(bi(ciphertext), bi(d), bi(n)).toString();
  },
  n_from_pq(p: string, q: string): string { return (bi(p) * bi(q)).toString(); },
  phi_of(p: string, q: string): string { return ((bi(p)-1n)*(bi(q)-1n)).toString(); },
  lambda_of(p: string, q: string): string {
    const a = bi(p)-1n, b = bi(q)-1n; let g=a, B=b; while(B){const T=B; B=g%B; g=T;} return ((a/g)*b).toString();
  },
  d_from_e_pq(e: string, p: string, q: string, use_lambda: boolean): string | undefined {
    const a = bi(e);
    const p1 = bi(p)-1n, q1 = bi(q)-1n;
    const g = (x: bigint, y: bigint)=>{ let A=x,B=y; while(B){const T=B; B=A%B; A=T;} return A; };
    const l = (x: bigint, y: bigint)=> (x/g(x,y))*y;
    const tot = use_lambda ? l(p1,q1) : p1*q1;
    const inv = modInv(a, tot);
    return inv?.toString();
  },
  pick_small_primes_in_range(n_min: string, n_max: string) {
    const minN = bi(n_min), maxN = bi(n_max);
    const limit = 200;
    const sieve = Array(limit+1).fill(true); sieve[0]=false; sieve[1]=false;
    for (let i=2; i*i<=limit; i++) if (sieve[i]) for (let j=i*i; j<=limit; j+=i) sieve[j]=false;
    const primes:number[]=[]; for (let i=2;i<=limit;i++) if (sieve[i]) primes.push(i);
    for (let ai=0; ai<primes.length; ai++) {
      for (let biIdx=ai+1; biIdx<primes.length; biIdx++) {
        const P=BigInt(primes[ai]), Q=BigInt(primes[biIdx]); const prod=P*Q;
        if (prod < minN) continue; if (maxN!==0n && prod>maxN) break;
        return { p: P.toString(), q: Q.toString(), n: prod.toString() };
      }
    }
    return null;
  },
  text_to_big(s: string): string {
    const bytes = new TextEncoder().encode(s); let acc=0n; for (const b of bytes) acc=(acc<<8n)|BigInt(b); return acc.toString();
  },
  big_to_text(n: string): string | undefined {
    try { let N=bi(n); const parts:number[]=[]; while(N>0n){ parts.unshift(Number(N & 255n)); N >>= 8n; } return new TextDecoder().decode(new Uint8Array(parts)); } catch { return undefined; }
  },
  choose_e_d(p: string, q: string, use_lambda: boolean, e_hint?: string) {
    const p1 = bi(p)-1n, q1 = bi(q)-1n;
    const g = (x: bigint, y: bigint)=>{ let A=x,B=y; while(B){const T=B; B=A%B; A=T;} return A; };
    const l = (x: bigint, y: bigint)=> (x/g(x,y))*y;
    const tot = use_lambda ? l(p1,q1) : p1*q1;
    let e = e_hint ? bi(e_hint) : 65537n;
    if (e <= 1n || e >= tot || g(e, tot) !== 1n) {
      e = 65537n;
      if (g(e, tot) !== 1n) {
        if ((e & 1n) === 0n) e += 1n;
        let guard=0; while (g(e, tot) !== 1n && guard++ < 5000) e += 2n;
      }
    }
  const inv = modInv(e, tot); if (!inv) return null;
    let d = inv;
    if (d === e) {
      let adj = e + 2n; let guard = 0;
      while (adj < tot && guard++ < 5000) { if (g(adj, tot) === 1n) { const inv2 = modInv(adj, tot); if (inv2 && inv2 !== adj) { e = adj; d = inv2; break; } } adj += 2n; }
    }
    return { e: e.toString(), d: d.toString() };
  },
  map_modexp(e: string, n: string, count: number): Uint32Array {
    const E = bi(e), N = bi(n); const c = Math.max(0, Math.floor(count));
    const out = new Uint32Array(c);
    for (let i=0; i<c; i++) {
      const v = modPow(BigInt(i), E, N);
      out[i] = Number(v % BigInt(c));
    }
    return out;
  },
};

let wasmPromise: Promise<WasmExports> | null = null;

/**
 * Load the WASM module built from the Rust crate. While we haven't packaged the
 * wasm yet, we return a dev stub that mimics the same API for UI prototyping.
 */
export function loadWasm(): Promise<WasmExports> {
  if (!wasmPromise) {
    wasmPromise = (async () => {
      // Try to load real wasm-pack output from public/pkg. Works after running:
      //   wasm-pack build ./rust --target web --out-dir ./web/public/pkg --out-name rsa_wasm
      try {
        const wasmUrl = '/pkg/rsa_wasm_bg.wasm';
        // Hint webpack to not try to bundle this path; let the browser load it at runtime.
        const mod: any = await import(/* webpackIgnore: true */ '/pkg/rsa_wasm.js');
        if (typeof mod?.default === 'function') {
          await mod.default(wasmUrl);
        }
        // After init, the named exports are available on the same module
        const real: Partial<WasmExports> = mod as WasmExports;
        // Basic sanity check
        if (typeof real.rsa_keypair === 'function' && typeof real.mod_pow === 'function') {
          return real as WasmExports;
        }
        console.warn('[wasm] Loaded module but missing expected exports; falling back to dev stub.');
      } catch (err) {
        console.warn('[wasm] Could not load real wasm module, using dev stub instead.', err);
      }
      return devStub;
    })();
  }
  return wasmPromise;
}
