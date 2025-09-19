use num_bigint::{BigInt, BigUint, RandBigInt};
use num_traits::{One, Zero, Signed};
use num_integer::Integer;
use rand::Rng;

pub fn mod_pow_big(base: &BigUint, exp: &BigUint, modulus: &BigUint) -> BigUint {
    if modulus.is_zero() { return BigUint::zero(); }
    base.modpow(exp, modulus)
}

pub fn gcd_big(a: &BigUint, b: &BigUint) -> BigUint { a.gcd(b) }

pub fn lcm_big(a: &BigUint, b: &BigUint) -> BigUint {
    if a.is_zero() || b.is_zero() { return BigUint::zero(); }
    (a / a.gcd(b)) * b
}

pub fn egcd_big(a: &BigInt, b: &BigInt) -> (BigInt, BigInt, BigInt) {
    if b.is_zero() {
        (a.clone(), BigInt::one(), BigInt::zero())
    } else {
        let (g, x, y) = egcd_big(b, &(a % b));
        (g, y.clone(), x - (a / b) * y)
    }
}

pub fn mod_inv_big(a: &BigInt, m: &BigInt) -> Option<BigInt> {
    let (g, x, _) = egcd_big(a, m);
    if g != BigInt::one() { None } else {
        let mut r = x % m;
        if r.is_negative() { r += m; }
        Some(r)
    }
}

pub fn is_probable_prime(n: &BigUint) -> bool {
    let two = BigUint::from(2u32);
    if *n < two.clone() { return false; }
    if *n == two { return true; }
    if (n % &two).is_zero() { return false; }

    // n - 1 = d * 2^s
    let mut d = n - 1u32;
    let mut s = 0u32;
    while (&d & BigUint::one()).is_zero() { d >>= 1; s += 1; }

    let bases_small: [u64; 3] = [2, 3, 5];
    for &a_u in bases_small.iter() {
        if BigUint::from(a_u) >= *n { continue; }
        let a = BigUint::from(a_u);
        let mut x = a.modpow(&d, n);
        if x == BigUint::one() || x == n - 1u32 { continue; }
        let mut cont = false;
        for _ in 0..(s.saturating_sub(1)) {
            x = (&x * &x) % n;
            if x == n - 1u32 { cont = true; break; }
        }
        if cont { continue; }
        return false;
    }
    true
}

pub fn phi_of_pq(p: &BigUint, q: &BigUint) -> BigUint {
    // φ(n) = (p-1)(q-1)
    let one = BigUint::one();
    (p - &one) * (q - &one)
}

pub fn lambda_of_pq(p: &BigUint, q: &BigUint) -> BigUint {
    // λ(n) = lcm(p-1, q-1)
    let one = BigUint::one();
    lcm_big(&(p - &one), &(q - &one))
}

pub fn gen_prime_bits(bits: u32, rng: &mut impl Rng) -> BigUint {
    assert!(bits >= 2);
    loop {
        let mut candidate = rng.gen_biguint(bits as u64);
        candidate.set_bit((bits - 1) as u64, true);
        candidate.set_bit(0, true);
        if is_probable_prime(&candidate) {
            return candidate;
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use num_bigint::ToBigInt;

    #[test]
    fn test_mod_pow_small() {
        let b = BigUint::from(4u32);
        let e = BigUint::from(13u32);
        let m = BigUint::from(497u32);
        let r = mod_pow_big(&b, &e, &m);
        assert_eq!(r, BigUint::from(445u32));
    }

    #[test]
    fn test_gcd_egcd() {
        let a = BigUint::from(240u32);
        let b = BigUint::from(46u32);
        let g = gcd_big(&a, &b);
        assert_eq!(g, BigUint::from(2u32));
        let (g2, x, y) = egcd_big(&a.to_bigint().unwrap(), &b.to_bigint().unwrap());
        assert_eq!(g2.to_biguint(), Some(g));
        let lhs = a.to_bigint().unwrap() * x + b.to_bigint().unwrap() * y;
        assert_eq!(lhs, g2);
    }

    #[test]
    fn test_mod_inv() {
        let a = BigInt::from(3);
        let m = BigInt::from(11);
        let inv = mod_inv_big(&a, &m).unwrap();
        assert_eq!((a * inv) % m, BigInt::one());
    }

    #[test]
    fn test_is_prime() {
        assert!(is_probable_prime(&BigUint::from(17u32)));
        assert!(!is_probable_prime(&BigUint::from(21u32)));
    }

    #[test]
    fn test_phi_lambda_small() {
        let p = BigUint::from(61u32);
        let q = BigUint::from(53u32);
        let phi = phi_of_pq(&p, &q);
        let lam = lambda_of_pq(&p, &q);
        assert_eq!(phi, BigUint::from(3120u32));
        assert_eq!(lam, BigUint::from(780u32));
    }
}
