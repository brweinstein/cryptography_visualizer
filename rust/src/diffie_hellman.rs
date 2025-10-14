use num_bigint::BigUint;
use num_traits::One;
use serde::Serialize;
use rand::RngCore;
use crate::util::{biguint_to_string, seeded_rng};
use crate::number_theory::{mod_pow_big, is_probable_prime, gen_prime_bits};

#[derive(Serialize)]
pub struct DiffieHellmanStep {
    pub step: String,
    pub description: String,
    pub value: String,
    pub computation: String,
}

#[derive(Serialize)]
pub struct DiffieHellmanExchange {
    pub p: String,
    pub g: String,
    pub alice_private: String,
    pub bob_private: String,
    pub alice_public: String,
    pub bob_public: String,
    pub alice_shared: String,
    pub bob_shared: String,
    pub steps: Vec<DiffieHellmanStep>,
}

pub fn generate_diffie_hellman_params(bits: u32) -> (BigUint, BigUint) {
    let mut rng = seeded_rng(None);
    
    // Generate a safe prime p = 2q + 1 where q is also prime
    let p = loop {
        let q = gen_prime_bits(bits - 1, &mut rng);
        let p_candidate = (&q << 1) + BigUint::one();
        if is_probable_prime(&p_candidate) {
            break p_candidate;
        }
    };
    
    // Find a generator g
    let two = BigUint::from(2u32);
    let p_minus_one = &p - BigUint::one();
    let q = &p_minus_one >> 1; // (p-1)/2
    
    let g = loop {
        let mut rng = seeded_rng(None);
        let random_val = BigUint::from(rng.next_u32());
        let candidate = BigUint::from(2u32) + (random_val % (&p - &two));
        // Check if g^q mod p != 1 (ensuring g is a generator)
        if mod_pow_big(&candidate, &q, &p) != BigUint::one() {
            break candidate;
        }
    };
    
    (p, g)
}

pub fn diffie_hellman_exchange_internal(p: &BigUint, g: &BigUint, a: &BigUint, b: &BigUint) -> DiffieHellmanExchange {
    let mut steps = Vec::new();
    
    // Step 1: Generate public keys
    let alice_public = mod_pow_big(g, a, p);
    steps.push(DiffieHellmanStep {
        step: "1".to_string(),
        description: "Alice computes her public key".to_string(),
        value: biguint_to_string(&alice_public),
        computation: format!("A = g^a mod p = {}^{} mod {}", biguint_to_string(g), biguint_to_string(a), biguint_to_string(p)),
    });
    
    let bob_public = mod_pow_big(g, b, p);
    steps.push(DiffieHellmanStep {
        step: "2".to_string(),
        description: "Bob computes his public key".to_string(),
        value: biguint_to_string(&bob_public),
        computation: format!("B = g^b mod p = {}^{} mod {}", biguint_to_string(g), biguint_to_string(b), biguint_to_string(p)),
    });
    
    // Step 2: Exchange public keys and compute shared secret
    let alice_shared = mod_pow_big(&bob_public, a, p);
    steps.push(DiffieHellmanStep {
        step: "3".to_string(),
        description: "Alice computes shared secret using Bob's public key".to_string(),
        value: biguint_to_string(&alice_shared),
        computation: format!("K = B^a mod p = {}^{} mod {}", biguint_to_string(&bob_public), biguint_to_string(a), biguint_to_string(p)),
    });
    
    let bob_shared = mod_pow_big(&alice_public, b, p);
    steps.push(DiffieHellmanStep {
        step: "4".to_string(),
        description: "Bob computes shared secret using Alice's public key".to_string(),
        value: biguint_to_string(&bob_shared),
        computation: format!("K = A^b mod p = {}^{} mod {}", biguint_to_string(&alice_public), biguint_to_string(b), biguint_to_string(p)),
    });
    
    DiffieHellmanExchange {
        p: biguint_to_string(p),
        g: biguint_to_string(g),
        alice_private: biguint_to_string(a),
        bob_private: biguint_to_string(b),
        alice_public: biguint_to_string(&alice_public),
        bob_public: biguint_to_string(&bob_public),
        alice_shared: biguint_to_string(&alice_shared),
        bob_shared: biguint_to_string(&bob_shared),
        steps,
    }
}