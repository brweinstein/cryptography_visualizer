use num_bigint::BigUint;
use rand::SeedableRng;
use rand_chacha::ChaCha20Rng;

pub fn parse_biguint(s: &str) -> BigUint {
    BigUint::parse_bytes(s.as_bytes(), 10).expect("invalid decimal string")
}

pub fn biguint_to_string(n: &BigUint) -> String {
    n.to_str_radix(10)
}

// Deterministic when `seed` is Some(..), otherwise uses OS entropy.
// Returns a concrete RNG compatible with num_bigint::RandBigInt helpers.
pub fn seeded_rng(seed: Option<u64>) -> ChaCha20Rng {
    match seed {
        Some(s) => {
            let mut bytes = [0u8; 32];
            bytes[..8].copy_from_slice(&s.to_le_bytes());
            ChaCha20Rng::from_seed(bytes)
        }
        None => ChaCha20Rng::from_entropy(),
    }
}
