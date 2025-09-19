use wasm_bindgen::prelude::*;
use num_bigint::{BigInt, BigUint};
use num_traits::{ToPrimitive, Zero};
use js_sys::Uint32Array;
use serde::Serialize;

mod util;
mod number_theory;
mod rsa;

use util::{biguint_to_string, parse_biguint, seeded_rng};
use number_theory::{egcd_big, gcd_big, is_probable_prime, mod_inv_big, mod_pow_big, gen_prime_bits, lcm_big, phi_of_pq, lambda_of_pq};
use rsa::generate_rsa_keypair_internal;

fn pick_small_primes_in_range_internal(n_min: &BigUint, n_max: &BigUint) -> Option<(BigUint, BigUint, BigUint)> {
    let limit = 200u32;
    let mut is_prime = vec![true; (limit + 1) as usize];
    is_prime[0] = false; is_prime[1] = false;
    for i in 2..=((limit as f64).sqrt() as u32) {
        if is_prime[i as usize] {
            let mut j = i * i;
            while j <= limit { is_prime[j as usize] = false; j += i; }
        }
    }
    let primes: Vec<u32> = (2..=limit).filter(|&i| is_prime[i as usize]).collect();
    // Choose product closest to target = midpoint of range if max>0, else >= min
    let target = if n_max.is_zero() { n_min.clone() } else { (n_min + n_max) >> 1u32 };
    let mut best: Option<(BigUint, BigUint, BigUint, BigUint)> = None; // (p,q,prod,diff)
    for (ai, &pp) in primes.iter().enumerate() {
        for &qq in primes.iter().skip(ai + 1) {
            let p_b = BigUint::from(pp);
            let q_b = BigUint::from(qq);
            let prod = &p_b * &q_b;
            if &prod < n_min { continue; }
            if !n_max.is_zero() && &prod > n_max { break; }
            let diff = if prod >= target { &prod - &target } else { &target - &prod };
            match &best {
                None => best = Some((p_b, q_b, prod, diff)),
                Some((_, _, _, bd)) => if &diff < bd { best = Some((p_b, q_b, prod, diff)); },
            }
        }
    }
    best.map(|(p,q,prod,_)| (p,q,prod))
}

#[cfg(feature = "console_error_panic_hook")]
#[wasm_bindgen(start)]
pub fn set_panic_hook() {
    console_error_panic_hook::set_once();
}

fn big_int_tuple_to_js(g: BigInt, x: BigInt, y: BigInt) -> JsValue {
    #[derive(Serialize)]
    struct EGCD { g: String, x: String, y: String }
    let val = EGCD { g: g.to_str_radix(10), x: x.to_str_radix(10), y: y.to_str_radix(10) };
    serde_wasm_bindgen::to_value(&val).unwrap()
}

fn rsa_keypair_to_js(p: BigUint, q: BigUint, n: BigUint, e: BigUint, d: BigUint) -> JsValue {
    #[derive(Serialize)]
    struct KP { p: String, q: String, n: String, e: String, d: String }
    let val = KP {
        p: p.to_str_radix(10),
        q: q.to_str_radix(10),
        n: n.to_str_radix(10),
        e: e.to_str_radix(10),
        d: d.to_str_radix(10),
    };
    serde_wasm_bindgen::to_value(&val).unwrap()
}

#[wasm_bindgen]
pub fn generate_prime(bits: u32) -> String {
    let mut rng = seeded_rng(None);
    let p = gen_prime_bits(bits, &mut rng);
    biguint_to_string(&p)
}

#[wasm_bindgen]
pub fn is_prime(n: &str) -> bool {
    let n = parse_biguint(n);
    is_probable_prime(&n)
}

#[wasm_bindgen]
pub fn mod_pow(base: &str, exp: &str, modulus: &str) -> String {
    let b = parse_biguint(base);
    let e = parse_biguint(exp);
    let m = parse_biguint(modulus);
    biguint_to_string(&mod_pow_big(&b, &e, &m))
}

#[wasm_bindgen]
pub fn gcd(a: &str, b: &str) -> String {
    let a = parse_biguint(a);
    let b = parse_biguint(b);
    biguint_to_string(&gcd_big(&a, &b))
}

#[wasm_bindgen]
pub fn lcm(a: &str, b: &str) -> String {
    let a = parse_biguint(a);
    let b = parse_biguint(b);
    biguint_to_string(&lcm_big(&a, &b))
}

#[wasm_bindgen]
pub fn egcd(a: &str, b: &str) -> JsValue {
    let a = BigInt::parse_bytes(a.as_bytes(), 10).expect("invalid a");
    let b = BigInt::parse_bytes(b.as_bytes(), 10).expect("invalid b");
    let (g, x, y) = egcd_big(&a, &b);
    big_int_tuple_to_js(g, x, y)
}

#[wasm_bindgen]
pub fn mod_inv(a: &str, m: &str) -> Option<String> {
    let a = BigInt::parse_bytes(a.as_bytes(), 10).expect("invalid a");
    let m = BigInt::parse_bytes(m.as_bytes(), 10).expect("invalid m");
    mod_inv_big(&a, &m).map(|x| x.to_str_radix(10))
}

#[wasm_bindgen]
pub fn n_from_pq(p: &str, q: &str) -> String {
    let p = parse_biguint(p);
    let q = parse_biguint(q);
    biguint_to_string(&(p * q))
}

#[wasm_bindgen]
pub fn phi_of(p: &str, q: &str) -> String {
    let p = parse_biguint(p);
    let q = parse_biguint(q);
    biguint_to_string(&phi_of_pq(&p, &q))
}

#[wasm_bindgen]
pub fn lambda_of(p: &str, q: &str) -> String {
    let p = parse_biguint(p);
    let q = parse_biguint(q);
    biguint_to_string(&lambda_of_pq(&p, &q))
}

#[wasm_bindgen]
pub fn d_from_e_pq(e: &str, p: &str, q: &str, use_lambda: bool) -> Option<String> {
    let e = BigInt::parse_bytes(e.as_bytes(), 10)?;
    let p_b = parse_biguint(p);
    let q_b = parse_biguint(q);
    let tot = if use_lambda { lambda_of_pq(&p_b, &q_b) } else { phi_of_pq(&p_b, &q_b) };
    let tot_i = BigInt::parse_bytes(tot.to_str_radix(10).as_bytes(), 10).unwrap();
    mod_inv_big(&e, &tot_i).map(|x| x.to_str_radix(10))
}

#[wasm_bindgen]
pub fn pick_small_primes_in_range(n_min: &str, n_max: &str) -> JsValue {
    // Deterministic scan for p<q primes <=200 with product in [n_min, n_max] (if n_max>0)
    let n_min = BigUint::parse_bytes(n_min.as_bytes(), 10).unwrap_or(BigUint::zero());
    let n_max = BigUint::parse_bytes(n_max.as_bytes(), 10).unwrap_or(BigUint::zero());

    if let Some((p_b, q_b, prod)) = pick_small_primes_in_range_internal(&n_min, &n_max) {
        #[derive(Serialize)]
        struct PQ { p: String, q: String, n: String }
        let val = PQ { p: p_b.to_str_radix(10), q: q_b.to_str_radix(10), n: prod.to_str_radix(10) };
        return serde_wasm_bindgen::to_value(&val).unwrap();
    }
    JsValue::NULL
}

#[wasm_bindgen]
pub fn text_to_big(s: &str) -> String {
    let bytes = s.as_bytes();
    let mut acc = BigUint::zero();
    for &b in bytes.iter() {
        acc = (acc << 8) + BigUint::from(b);
    }
    acc.to_str_radix(10)
}

#[wasm_bindgen]
pub fn big_to_text(n_str: &str) -> Option<String> {
    let mut n = match BigUint::parse_bytes(n_str.as_bytes(), 10) { Some(v) => v, None => return None };
    if n.is_zero() { return Some(String::new()); }
    let mut bytes: Vec<u8> = Vec::new();
    let two_fifty_six = BigUint::from(256u32);
    while !n.is_zero() {
        let low = (&n % &two_fifty_six).to_u64().unwrap_or(0) as u8;
        bytes.push(low);
        n >>= 8;
    }
    bytes.reverse();
    match String::from_utf8(bytes) { Ok(s) => Some(s), Err(_) => None }
}

#[wasm_bindgen]
pub fn choose_e_d(p: &str, q: &str, use_lambda: bool, e_hint: Option<String>) -> JsValue {
    let p_b = parse_biguint(p);
    let q_b = parse_biguint(q);
    let tot = if use_lambda { lambda_of_pq(&p_b, &q_b) } else { phi_of_pq(&p_b, &q_b) };
    let one = BigUint::from(1u32);
    if tot <= one { return JsValue::NULL; }
    let mut e_b = match e_hint {
        Some(s) => match BigUint::parse_bytes(s.as_bytes(), 10) { Some(v) => v, None => BigUint::from(65537u32) },
        None => BigUint::from(65537u32),
    };
    if e_b <= one || e_b >= tot || gcd_big(&e_b, &tot) != one {
        // Start from 65537 if invalid
        e_b = BigUint::from(65537u32);
    }
    // ensure gcd(e, tot) = 1
    if gcd_big(&e_b, &tot) != one {
        let two = BigUint::from(2u32);
    if (&e_b & &one).is_zero() { e_b += &one; }
        let mut guard = 0u32;
    while gcd_big(&e_b, &tot) != one && guard < 5000 { e_b += &two; guard += 1; }
    if guard >= 5000 { return JsValue::NULL; }
    }
    // compute d; if d==e, bump e by 2 until differs
    let tot_i = BigInt::parse_bytes(tot.to_str_radix(10).as_bytes(), 10).unwrap();
    let two_i = BigInt::from(2);
    let mut e_i = BigInt::parse_bytes(e_b.to_str_radix(10).as_bytes(), 10).unwrap();
    let mut d_i = match mod_inv_big(&e_i, &tot_i) { Some(v) => v, None => return JsValue::NULL };
    let mut guard = 0u32;
    while d_i == e_i && guard < 5000 {
        e_i += &two_i;
        let e_tmp = e_i.to_str_radix(10);
        let e_tmp_b = BigUint::parse_bytes(e_tmp.as_bytes(), 10).unwrap();
        if e_tmp_b >= tot { break; }
        if gcd_big(&e_tmp_b, &tot) != one { continue; }
        if let Some(inv) = mod_inv_big(&e_i, &tot_i) { d_i = inv; } else { continue; }
        guard += 1;
    }
    #[derive(Serialize)]
    struct ED { e: String, d: String }
    let out = ED { e: e_i.to_str_radix(10), d: d_i.to_str_radix(10) };
    serde_wasm_bindgen::to_value(&out).unwrap()
}

#[wasm_bindgen]
pub fn map_modexp(e: &str, n: &str, count: u32) -> Uint32Array {
    let e_b = parse_biguint(e);
    let n_b = parse_biguint(n);
    let mut out: Vec<u32> = Vec::with_capacity(count as usize);
    let c_b = BigUint::from(count);
    for i in 0..count {
        let v = mod_pow_big(&BigUint::from(i), &e_b, &n_b);
        let j = (&v % &c_b).to_u32_digits();
        let idx = if j.is_empty() { 0u32 } else { j[0] };
        out.push(idx);
    }
    Uint32Array::from(&out[..])
}

#[cfg(test)]
mod wasm_like_tests {
    use super::*;
    use num_traits::One;

    #[test]
    fn test_pick_small_primes_in_range_internal() {
        let min = BigUint::from(30u32);
        let max = BigUint::from(60u32);
        let res = pick_small_primes_in_range_internal(&min, &max).expect("should find primes");
        let (p, q, n) = res;
        assert!(p > BigUint::one());
        assert!(q > BigUint::one());
        assert!(n >= min && n <= max);
    }

    #[test]
    fn test_choose_e_d_properties() {
        // p=61, q=53 -> phi=3120
        let p = "61"; let q = "53";
        let js = choose_e_d(p, q, false, None);
        assert!(js.is_object());
        let map: serde_json::Value = serde_wasm_bindgen::from_value(js).unwrap();
        let e_s = map.get("e").unwrap().as_str().unwrap().to_string();
        let d_s = map.get("d").unwrap().as_str().unwrap().to_string();
        assert_ne!(e_s, d_s);
        let e_b = parse_biguint(&e_s);
        let d_b = parse_biguint(&d_s);
        let phi = phi_of_pq(&parse_biguint(p), &parse_biguint(q));
        // Check (e*d) mod phi == 1
        let ed = (e_b * d_b) % phi;
        assert_eq!(ed, BigUint::one());
    }
}

#[wasm_bindgen]
pub fn rsa_keypair(bits: u32) -> JsValue {
    let kp = generate_rsa_keypair_internal(bits, None);
    rsa_keypair_to_js(kp.p, kp.q, kp.n, kp.e, kp.d)
}

#[wasm_bindgen]
pub fn encrypt(message: &str, e: &str, n: &str) -> String {
    let m = parse_biguint(message);
    let e = parse_biguint(e);
    let n = parse_biguint(n);
    biguint_to_string(&mod_pow_big(&m, &e, &n))
}

#[wasm_bindgen]
pub fn decrypt(ciphertext: &str, d: &str, n: &str) -> String {
    let c = parse_biguint(ciphertext);
    let d = parse_biguint(d);
    let n = parse_biguint(n);
    biguint_to_string(&mod_pow_big(&c, &d, &n))
}

