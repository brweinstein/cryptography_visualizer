use num_bigint::{BigUint, ToBigInt};
use num_traits::One;
use num_integer::Integer;

use crate::number_theory::{gen_prime_bits, mod_inv_big};
use crate::util::seeded_rng;

#[derive(Clone, Debug)]
pub struct KeyPair {
    pub p: BigUint,
    pub q: BigUint,
    pub n: BigUint,
    pub e: BigUint,
    pub d: BigUint,
}

pub fn generate_rsa_keypair_internal(bits: u32, seed: Option<u64>) -> KeyPair {
    let mut rng = seeded_rng(seed);
    let p = gen_prime_bits(bits / 2, &mut rng);
    let mut q = gen_prime_bits(bits / 2, &mut rng);
    while q == p { q = gen_prime_bits(bits / 2, &mut rng); }
    let n = &p * &q;
    let one = BigUint::one();
    let phi = (&p - &one) * (&q - &one);

    let e = BigUint::from(65537u32);
    let g = e.gcd(&phi);
    let e_final = if g == one { e } else { BigUint::from(3u32) };

    let e_i = e_final.to_bigint().unwrap();
    let phi_i = phi.to_bigint().unwrap();
    let d = mod_inv_big(&e_i, &phi_i).expect("e and phi must be coprime");
    let d = d.to_biguint().expect("d should be positive");

    KeyPair { p, q, n, e: e_final, d }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::number_theory::mod_pow_big;

    #[test]
    fn test_rsa_roundtrip_small() {
        let kp = generate_rsa_keypair_internal(32, Some(42));
        let n = kp.n.clone();
        let e = kp.e.clone();
        let d = kp.d.clone();
        let m = BigUint::from(42u32);
        let c = mod_pow_big(&m, &e, &n);
        let m2 = mod_pow_big(&c, &d, &n);
        assert_eq!(m, m2);
    }
}
