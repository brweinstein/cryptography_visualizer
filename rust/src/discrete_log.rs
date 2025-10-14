use num_bigint::BigUint;
use num_traits::{Zero, One};
use serde::Serialize;
use crate::util::biguint_to_string;
use crate::number_theory::{mod_pow_big, gcd_big, is_probable_prime};

#[derive(Serialize)]
pub struct DiscreteLogStep {
    pub step: u32,
    pub method: String,
    pub description: String,
    pub current_value: String,
    pub exponent: String,
    pub found: bool,
}

#[derive(Serialize)]
pub struct DiscreteLogVisualization {
    pub base: String,
    pub target: String,
    pub modulus: String,
    pub solution: Option<String>,
    pub steps: Vec<DiscreteLogStep>,
    pub method_used: String,
    pub warnings: Vec<String>,
    pub truncated: bool,
}

// Baby-step Giant-step algorithm for discrete logarithm
pub fn baby_step_giant_step(base: &BigUint, target: &BigUint, modulus: &BigUint, max_steps: u32) -> DiscreteLogVisualization {
    let mut steps = Vec::new();
    let mut warnings: Vec<String> = Vec::new();

    // Reduce inputs modulo modulus for consistency
    let b_norm = if modulus.is_zero() { base.clone() } else { base % modulus };
    let t_norm = if modulus.is_zero() { target.clone() } else { target % modulus };

    if &b_norm != base { warnings.push("Base reduced modulo modulus".to_string()); }
    if &t_norm != target { warnings.push("Target reduced modulo modulus".to_string()); }

    // Validation hints
    if !modulus.is_zero() && gcd_big(&b_norm, modulus) != BigUint::one() {
        warnings.push("gcd(base, modulus) != 1; discrete log may not exist or be non-unique".to_string());
    }
    if !is_probable_prime(modulus) {
        warnings.push("Modulus is not prime; BSGS works best with prime modulus.".to_string());
    }

    let base_str = biguint_to_string(&b_norm);
    let target_str = biguint_to_string(&t_norm);
    let modulus_str = biguint_to_string(modulus);
    
    // Choose m = ceil(sqrt(p-1)) for efficiency
    let p_minus_1 = if modulus > &BigUint::zero() { modulus - BigUint::one() } else { BigUint::zero() };
    let ideal_m = &p_minus_1.sqrt() + BigUint::one();
    let m = ideal_m.clone().min(BigUint::from(max_steps));
    let mut truncated = false;
    if m < ideal_m {
        truncated = true;
        warnings.push(format!(
            "Search truncated by max_steps. Recommended m≈ceil(sqrt(p-1))={}, but max_steps={}.",
            biguint_to_string(&ideal_m), max_steps
        ));
    }
    
    steps.push(DiscreteLogStep {
        step: 0,
        method: "Baby-step Giant-step".to_string(),
        description: format!("Computing baby steps: base^i mod p for i = 0 to {}", biguint_to_string(&m)),
        current_value: "1".to_string(),
        exponent: "0".to_string(),
        found: false,
    });
    
    // Baby steps: compute base^i mod p for i = 0, 1, ..., m-1
    let mut baby_steps = std::collections::HashMap::new();
    let mut current = BigUint::one();
    
    let m_val = *m.to_u32_digits().first().unwrap_or(&max_steps).min(&max_steps);
    for i in 0u32..m_val {
        baby_steps.insert(current.clone(), i);
        
        steps.push(DiscreteLogStep {
            step: i + 1,
            method: "Baby-step".to_string(),
            description: format!("Baby step {}: {}^{} ≡ {} (mod {})", i, base_str, i, biguint_to_string(&current), modulus_str),
            current_value: biguint_to_string(&current),
            exponent: i.to_string(),
            found: false,
        });
        
        if &current == &t_norm {
            steps.push(DiscreteLogStep {
                step: i + 1,
                method: "Solution Found".to_string(),
                description: format!("Found solution: {} = {}", target_str, i),
                current_value: biguint_to_string(&current),
                exponent: i.to_string(),
                found: true,
            });
            
            return DiscreteLogVisualization {
                base: base_str,
                target: target_str,
                modulus: modulus_str,
                solution: Some(i.to_string()),
                steps,
                method_used: "Baby-step Giant-step".to_string(),
                warnings,
                truncated,
            };
        }
        
        current = (&current * &b_norm) % modulus;
    }
    
    // Giant steps: compute target * (base^(-m))^j for j = 0, 1, 2, ...
    let base_inv_m = match mod_inverse_big(&mod_pow_big(&b_norm, &m, modulus), modulus) {
        Some(inv) => inv,
        None => {
            return DiscreteLogVisualization {
                base: base_str,
                target: target_str,
                modulus: modulus_str,
                solution: None,
                steps,
                method_used: "Baby-step Giant-step (failed - no inverse)".to_string(),
                warnings,
                truncated,
            };
        }
    };
    
    let mut gamma = t_norm.clone();
    let m_val = *m.to_u32_digits().first().unwrap_or(&max_steps).min(&max_steps);
    
    for j in 0u32..m_val {
        steps.push(DiscreteLogStep {
            step: m_val + j + 1,
            method: "Giant-step".to_string(),
            description: format!("Giant step {}: checking if {} is in baby steps", j, biguint_to_string(&gamma)),
            current_value: biguint_to_string(&gamma),
            exponent: format!("{}*{} + ?", j, m_val),
            found: false,
        });
        
        if let Some(&i) = baby_steps.get(&gamma) {
            let solution = BigUint::from(j) * BigUint::from(m_val) + BigUint::from(i);
            
            steps.push(DiscreteLogStep {
                step: m_val + j + 2,
                method: "Solution Found".to_string(),
                description: format!("Found solution: {} = {}*{} + {} = {}", 
                    target_str, j, m_val, i, biguint_to_string(&solution)),
                current_value: biguint_to_string(&gamma),
                exponent: biguint_to_string(&solution),
                found: true,
            });
            
            return DiscreteLogVisualization {
                base: base_str,
                target: target_str,
                modulus: modulus_str,
                solution: Some(biguint_to_string(&solution)),
                steps,
                method_used: "Baby-step Giant-step".to_string(),
                warnings,
                truncated,
            };
        }
        
        gamma = (&gamma * &base_inv_m) % modulus;
    }
    
    DiscreteLogVisualization {
        base: base_str,
        target: target_str,
        modulus: modulus_str,
        solution: None,
        steps,
        method_used: "Baby-step Giant-step (no solution found)".to_string(),
        warnings,
        truncated,
    }
}

// Brute force method for small discrete logarithms
pub fn brute_force_discrete_log(base: &BigUint, target: &BigUint, modulus: &BigUint, max_steps: u32) -> DiscreteLogVisualization {
    let mut steps = Vec::new();
    let mut warnings: Vec<String> = Vec::new();

    // Reduce inputs modulo modulus
    let b_norm = if modulus.is_zero() { base.clone() } else { base % modulus };
    let t_norm = if modulus.is_zero() { target.clone() } else { target % modulus };

    if &b_norm != base { warnings.push("Base reduced modulo modulus".to_string()); }
    if &t_norm != target { warnings.push("Target reduced modulo modulus".to_string()); }

    if !modulus.is_zero() && gcd_big(&b_norm, modulus) != BigUint::one() {
        warnings.push("gcd(base, modulus) != 1; discrete log may not exist or be non-unique".to_string());
    }
    if !is_probable_prime(modulus) {
        warnings.push("Modulus is not prime; brute force may not find a solution if target is outside <base>.".to_string());
    }

    let base_str = biguint_to_string(&b_norm);
    let target_str = biguint_to_string(&t_norm);
    let modulus_str = biguint_to_string(modulus);

    let mut current = BigUint::one();
    
    for i in 0..max_steps {
        steps.push(DiscreteLogStep {
            step: i,
            method: "Brute Force".to_string(),
            description: format!("Trying exponent {}: {}^{} ≡ {} (mod {})", i, base_str, i, biguint_to_string(&current), modulus_str),
            current_value: biguint_to_string(&current),
            exponent: i.to_string(),
            found: false,
        });
        
        if &current == &t_norm {
            steps.push(DiscreteLogStep {
                step: i,
                method: "Solution Found".to_string(),
                description: format!("Found solution: {} = {}", target_str, i),
                current_value: biguint_to_string(&current),
                exponent: i.to_string(),
                found: true,
            });
            
            return DiscreteLogVisualization {
                base: base_str,
                target: target_str,
                modulus: modulus_str,
                solution: Some(i.to_string()),
                steps,
                method_used: "Brute Force".to_string(),
                warnings,
                truncated: false,
            };
        }
        
        current = (&current * &b_norm) % modulus;
    }
    
    DiscreteLogVisualization {
        base: base_str,
        target: target_str,
        modulus: modulus_str,
        solution: None,
        steps,
        method_used: "Brute Force (stopped at max_steps; increase to continue)".to_string(),
        warnings,
        truncated: true,
    }
}

// Helper function for modular inverse using extended Euclidean algorithm
fn mod_inverse_big(a: &BigUint, m: &BigUint) -> Option<BigUint> {
    use num_bigint::BigInt;
    
    let a_big = BigInt::from(a.clone());
    let m_big = BigInt::from(m.clone());
    
    fn extended_gcd(a: &BigInt, b: &BigInt) -> (BigInt, BigInt, BigInt) {
        if a.is_zero() {
            (b.clone(), BigInt::zero(), BigInt::one())
        } else {
            let (g, y, x) = extended_gcd(&(b % a), a);
            (g, x - (b / a) * &y, y)
        }
    }
    
    let (g, x, _) = extended_gcd(&a_big, &m_big);
    
    if g != BigInt::one() {
        None // No inverse exists
    } else {
        let result = ((x % &m_big) + &m_big) % &m_big;
        Some(result.to_biguint().unwrap())
    }
}