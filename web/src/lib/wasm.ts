/// <reference path="../types/wasm-pack.d.ts" />
// WASM loader with typed bindings. Currently provides a dev-stub implementation
// so the app can run before we wire the actual wasm-pack output.

export interface RsaKeyPair { p: string; q: string; n: string; e: string; d: string }

export interface DiffieHellmanStep {
  step: string;
  description: string;
  value: string;
  computation: string;
}

export interface DiffieHellmanExchange {
  p: string;
  g: string;
  alice_private: string;
  bob_private: string;
  alice_public: string;
  bob_public: string;
  alice_shared: string;
  bob_shared: string;
  steps: DiffieHellmanStep[];
}

export interface AESRoundState {
  round: number;
  step: string;
  state: number[][];
  description: string;
  intermediate_values: string[];
}

export interface AESVisualization {
  plaintext: number[];
  key: number[];
  ciphertext: number[];
  rounds: AESRoundState[];
}

export interface SHA256Step {
  step: number;
  description: string;
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
  g: number;
  h: number;
  w: number;
  k: number;
  temp1: number;
  temp2: number;
}

export interface SHA256Visualization {
  message: number[];
  padded_message: number[];
  hash: number[];
  final_hash: string;
  steps: SHA256Step[];
}

export interface DiscreteLogStep {
  step: number;
  method: string;
  description: string;
  current_value: string;
  exponent: string;
  found: boolean;
}

export interface DiscreteLogVisualization {
  base: string;
  target: string;
  modulus: string;
  solution: string | null;
  steps: DiscreteLogStep[];
  method_used: string;
  warnings?: string[];
  truncated?: boolean;
}

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
  
  // New crypto functions
  generate_dh_params(bits: number): { p: string; g: string };
  dh_exchange(p: string, g: string, alice_private: string, bob_private: string): DiffieHellmanExchange;
  aes_encrypt_visualize(plaintext_hex: string, key_hex: string): AESVisualization;
  sha256_visualize(message: string): SHA256Visualization;
  discrete_log_brute_force(base: string, target: string, modulus: string, max_steps: number): DiscreteLogVisualization;
  discrete_log_bsgs(base: string, target: string, modulus: string, max_steps: number): DiscreteLogVisualization;
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
  
  // New crypto function stubs
  generate_dh_params(bits: number): { p: string; g: string } {
    // Simple stub - not cryptographically secure
    return { p: "23", g: "5" };
  },
  
  dh_exchange(p: string, g: string, alice_private: string, bob_private: string): DiffieHellmanExchange {
    const P = bi(p), G = bi(g), a = bi(alice_private), b = bi(bob_private);
    const A = modPow(G, a, P);
    const B = modPow(G, b, P);
    const sharedA = modPow(B, a, P);
    const sharedB = modPow(A, b, P);
    
    return {
      p, g,
      alice_private, bob_private,
      alice_public: A.toString(),
      bob_public: B.toString(),
      alice_shared: sharedA.toString(),
      bob_shared: sharedB.toString(),
      steps: [
        { step: "1", description: "Alice computes public key", value: A.toString(), computation: `A = g^a mod p = ${g}^${alice_private} mod ${p}` },
        { step: "2", description: "Bob computes public key", value: B.toString(), computation: `B = g^b mod p = ${g}^${bob_private} mod ${p}` },
        { step: "3", description: "Alice computes shared secret", value: sharedA.toString(), computation: `K = B^a mod p = ${B}^${alice_private} mod ${p}` },
        { step: "4", description: "Bob computes shared secret", value: sharedB.toString(), computation: `K = A^b mod p = ${A}^${bob_private} mod ${p}` },
      ]
    };
  },
  
  aes_encrypt_visualize(plaintext_hex: string, key_hex: string): AESVisualization {
    // Stub implementation
    const plaintext = Array.from({length: 16}, (_, i) => i);
    const key = Array.from({length: 16}, (_, i) => i + 16);
    const ciphertext = plaintext.map(x => (x + 1) % 256);
    
    return {
      plaintext,
      key,
      ciphertext,
      rounds: [
        {
          round: 0,
          step: "Initial State",
          state: [[0,1,2,3],[4,5,6,7],[8,9,10,11],[12,13,14,15]],
          description: "Initial plaintext arranged in 4x4 state matrix",
          intermediate_values: ["Plaintext loaded into state matrix"]
        }
      ]
    };
  },
  
  sha256_visualize(message: string): SHA256Visualization {
    // Simple stub - not real SHA-256
    const messageBytes = Array.from(new TextEncoder().encode(message));
    const paddedMessage = [...messageBytes, 0x80]; // Simple padding
    
    return {
      message: messageBytes,
      padded_message: paddedMessage,
      hash: [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19],
      final_hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", // Empty string hash
      steps: [
        {
          step: 0,
          description: "Initialize working variables",
          a: 0x6a09e667, b: 0xbb67ae85, c: 0x3c6ef372, d: 0xa54ff53a,
          e: 0x510e527f, f: 0x9b05688c, g: 0x1f83d9ab, h: 0x5be0cd19,
          w: 0, k: 0x428a2f98, temp1: 0, temp2: 0
        }
      ]
    };
  },
  
  discrete_log_brute_force(base: string, target: string, modulus: string, max_steps: number): DiscreteLogVisualization {
    const G = bi(base), T = bi(target), P = bi(modulus);
    const steps: DiscreteLogStep[] = [];
    
    for (let i = 0; i < Math.min(max_steps, 100); i++) {
      const current = modPow(G, BigInt(i), P);
      steps.push({
        step: i,
        method: "Brute Force",
        description: `Trying exponent ${i}`,
        current_value: current.toString(),
        exponent: i.toString(),
        found: current === T
      });
      
      if (current === T) {
        return {
          base, target, modulus,
          solution: i.toString(),
          steps,
          method_used: "Brute Force"
        };
      }
    }
    
    return {
      base, target, modulus,
      solution: null,
      steps,
      method_used: "Brute Force (no solution found)"
    };
  },
  
  discrete_log_bsgs(base: string, target: string, modulus: string, max_steps: number): DiscreteLogVisualization {
    // Stub - same as brute force for now
    return devStub.discrete_log_brute_force(base, target, modulus, max_steps);
  },
};

let wasmPromise: Promise<WasmExports> | null = null;

// Simplified loader: import the module directly from the public path.
export async function loadWasm(): Promise<WasmExports> {
  if (!wasmPromise) {
    wasmPromise = (async () => {
      // This import path maps to web/public/pkg at runtime in Next.js
      // Ensure you have run the wasm:build script so rsa_wasm.js and rsa_wasm_bg.wasm exist.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wasmJsPath: any = '/pkg/crypto_wasm.js';
      // Tell webpack to ignore bundling this and load it at runtime from the public URL
      const mod: any = await import(/* webpackIgnore: true */ (wasmJsPath as any));
      if (typeof mod?.default === 'function') {
        await mod.default({ module_or_path: '/pkg/crypto_wasm_bg.wasm' });
      }
      return mod as WasmExports;
    })();
  }
  return wasmPromise;
}
