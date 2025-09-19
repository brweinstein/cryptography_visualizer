import { describe, it, expect } from 'vitest';
import { loadWasm } from '../lib/wasm';

describe('WASM wiring', () => {
  it('exposes required functions', async () => {
    const w = await loadWasm();
    expect(typeof w.gcd).toBe('function');
    expect(typeof w.lcm).toBe('function');
    expect(typeof w.n_from_pq).toBe('function');
    expect(typeof w.phi_of).toBe('function');
    expect(typeof w.lambda_of).toBe('function');
    expect(typeof w.mod_pow).toBe('function');
    expect(typeof w.map_modexp).toBe('function');
    expect(typeof w.text_to_big).toBe('function');
    expect(typeof w.big_to_text).toBe('function');
  });

  it('map_modexp produces consistent mapping', async () => {
    const w = await loadWasm();
    const n = '35'; // 5*7
    const e = '3';
    const count = 10;
    const arr = w.map_modexp(e, n, count);
    expect(arr.length).toBe(count);
    // spot-check first few values match scalar mod_pow
    for (let i = 0; i < 5; i++) {
      const j = Number(BigInt(w.mod_pow(String(i), e, n)) % BigInt(count));
      expect(arr[i]).toBe(j);
    }
  });
});
