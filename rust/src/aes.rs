use serde::Serialize;

#[derive(Serialize, Clone)]
pub struct AESRoundState {
    pub round: u32,
    pub step: String,
    pub state: [[u8; 4]; 4],
    pub description: String,
    pub intermediate_values: Vec<String>,
}

#[derive(Serialize)]
pub struct AESVisualization {
    pub plaintext: [u8; 16],
    pub key: [u8; 16],
    pub ciphertext: [u8; 16],
    pub rounds: Vec<AESRoundState>,
}

// S-box for AES
const SBOX: [u8; 256] = [
    0x63, 0x7c, 0x77, 0x7b, 0xf2, 0x6b, 0x6f, 0xc5, 0x30, 0x01, 0x67, 0x2b, 0xfe, 0xd7, 0xab, 0x76,
    0xca, 0x82, 0xc9, 0x7d, 0xfa, 0x59, 0x47, 0xf0, 0xad, 0xd4, 0xa2, 0xaf, 0x9c, 0xa4, 0x72, 0xc0,
    0xb7, 0xfd, 0x93, 0x26, 0x36, 0x3f, 0xf7, 0xcc, 0x34, 0xa5, 0xe5, 0xf1, 0x71, 0xd8, 0x31, 0x15,
    0x04, 0xc7, 0x23, 0xc3, 0x18, 0x96, 0x05, 0x9a, 0x07, 0x12, 0x80, 0xe2, 0xeb, 0x27, 0xb2, 0x75,
    0x09, 0x83, 0x2c, 0x1a, 0x1b, 0x6e, 0x5a, 0xa0, 0x52, 0x3b, 0xd6, 0xb3, 0x29, 0xe3, 0x2f, 0x84,
    0x53, 0xd1, 0x00, 0xed, 0x20, 0xfc, 0xb1, 0x5b, 0x6a, 0xcb, 0xbe, 0x39, 0x4a, 0x4c, 0x58, 0xcf,
    0xd0, 0xef, 0xaa, 0xfb, 0x43, 0x4d, 0x33, 0x85, 0x45, 0xf9, 0x02, 0x7f, 0x50, 0x3c, 0x9f, 0xa8,
    0x51, 0xa3, 0x40, 0x8f, 0x92, 0x9d, 0x38, 0xf5, 0xbc, 0xb6, 0xda, 0x21, 0x10, 0xff, 0xf3, 0xd2,
    0xcd, 0x0c, 0x13, 0xec, 0x5f, 0x97, 0x44, 0x17, 0xc4, 0xa7, 0x7e, 0x3d, 0x64, 0x5d, 0x19, 0x73,
    0x60, 0x81, 0x4f, 0xdc, 0x22, 0x2a, 0x90, 0x88, 0x46, 0xee, 0xb8, 0x14, 0xde, 0x5e, 0x0b, 0xdb,
    0xe0, 0x32, 0x3a, 0x0a, 0x49, 0x06, 0x24, 0x5c, 0xc2, 0xd3, 0xac, 0x62, 0x91, 0x95, 0xe4, 0x79,
    0xe7, 0xc8, 0x37, 0x6d, 0x8d, 0xd5, 0x4e, 0xa9, 0x6c, 0x56, 0xf4, 0xea, 0x65, 0x7a, 0xae, 0x08,
    0xba, 0x78, 0x25, 0x2e, 0x1c, 0xa6, 0xb4, 0xc6, 0xe8, 0xdd, 0x74, 0x1f, 0x4b, 0xbd, 0x8b, 0x8a,
    0x70, 0x3e, 0xb5, 0x66, 0x48, 0x03, 0xf6, 0x0e, 0x61, 0x35, 0x57, 0xb9, 0x86, 0xc1, 0x1d, 0x9e,
    0xe1, 0xf8, 0x98, 0x11, 0x69, 0xd9, 0x8e, 0x94, 0x9b, 0x1e, 0x87, 0xe9, 0xce, 0x55, 0x28, 0xdf,
    0x8c, 0xa1, 0x89, 0x0d, 0xbf, 0xe6, 0x42, 0x68, 0x41, 0x99, 0x2d, 0x0f, 0xb0, 0x54, 0xbb, 0x16
];

// Round constants for key expansion
const RCON: [u8; 11] = [0x00, 0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36];

fn sub_bytes(state: &mut [[u8; 4]; 4]) {
    for i in 0..4 {
        for j in 0..4 {
            state[i][j] = SBOX[state[i][j] as usize];
        }
    }
}

fn shift_rows(state: &mut [[u8; 4]; 4]) {
    // Row 1: shift left by 1
    let temp = state[1][0];
    state[1][0] = state[1][1];
    state[1][1] = state[1][2];
    state[1][2] = state[1][3];
    state[1][3] = temp;
    
    // Row 2: shift left by 2
    let temp1 = state[2][0];
    let temp2 = state[2][1];
    state[2][0] = state[2][2];
    state[2][1] = state[2][3];
    state[2][2] = temp1;
    state[2][3] = temp2;
    
    // Row 3: shift left by 3 (or right by 1)
    let temp = state[3][3];
    state[3][3] = state[3][2];
    state[3][2] = state[3][1];
    state[3][1] = state[3][0];
    state[3][0] = temp;
}

fn gmul(a: u8, b: u8) -> u8 {
    let mut result = 0;
    let mut a = a;
    let mut b = b;
    
    for _ in 0..8 {
        if b & 1 != 0 {
            result ^= a;
        }
        let hi_bit_set = a & 0x80 != 0;
        a <<= 1;
        if hi_bit_set {
            a ^= 0x1b; // AES irreducible polynomial
        }
        b >>= 1;
    }
    result
}

fn mix_columns(state: &mut [[u8; 4]; 4]) {
    for c in 0..4 {
        let s0 = state[0][c];
        let s1 = state[1][c];
        let s2 = state[2][c];
        let s3 = state[3][c];
        
        state[0][c] = gmul(2, s0) ^ gmul(3, s1) ^ s2 ^ s3;
        state[1][c] = s0 ^ gmul(2, s1) ^ gmul(3, s2) ^ s3;
        state[2][c] = s0 ^ s1 ^ gmul(2, s2) ^ gmul(3, s3);
        state[3][c] = gmul(3, s0) ^ s1 ^ s2 ^ gmul(2, s3);
    }
}

fn add_round_key(state: &mut [[u8; 4]; 4], round_key: &[[u8; 4]; 4]) {
    for i in 0..4 {
        for j in 0..4 {
            state[i][j] ^= round_key[i][j];
        }
    }
}

fn key_expansion(key: &[u8; 16]) -> [[[u8; 4]; 4]; 11] {
    let mut round_keys = [[[0u8; 4]; 4]; 11];
    
    // First round key is the original key
    for i in 0..4 {
        for j in 0..4 {
            round_keys[0][j][i] = key[i * 4 + j];
        }
    }
    
    let mut w = [[0u8; 4]; 44]; // 11 round keys * 4 words each
    
    // Copy original key
    for i in 0..4 {
        for j in 0..4 {
            w[i][j] = key[i * 4 + j];
        }
    }
    
    // Generate remaining words
    for i in 4..44 {
        let mut temp = w[i - 1];
        
        if i % 4 == 0 {
            // RotWord
            let t = temp[0];
            temp[0] = temp[1];
            temp[1] = temp[2];
            temp[2] = temp[3];
            temp[3] = t;
            
            // SubWord
            for j in 0..4 {
                temp[j] = SBOX[temp[j] as usize];
            }
            
            // XOR with Rcon
            temp[0] ^= RCON[i / 4];
        }
        
        for j in 0..4 {
            w[i][j] = w[i - 4][j] ^ temp[j];
        }
    }
    
    // Convert to round key format
    for round in 0..11 {
        for col in 0..4 {
            for row in 0..4 {
                round_keys[round][row][col] = w[round * 4 + col][row];
            }
        }
    }
    
    round_keys
}

pub fn aes_encrypt_with_visualization(plaintext: &[u8; 16], key: &[u8; 16]) -> AESVisualization {
    let mut state = [[0u8; 4]; 4];
    let mut rounds = Vec::new();
    
    // Convert plaintext to state matrix (column-major)
    for i in 0..4 {
        for j in 0..4 {
            state[j][i] = plaintext[i * 4 + j];
        }
    }
    
    let round_keys = key_expansion(key);
    
    // Initial round
    rounds.push(AESRoundState {
        round: 0,
        step: "Initial State".to_string(),
        state,
        description: "Initial plaintext arranged in 4x4 state matrix".to_string(),
        intermediate_values: vec![format!("Plaintext: {:02x?}", plaintext)],
    });
    
    // Initial AddRoundKey
    add_round_key(&mut state, &round_keys[0]);
    rounds.push(AESRoundState {
        round: 0,
        step: "AddRoundKey".to_string(),
        state,
        description: "XOR state with round key 0".to_string(),
        intermediate_values: vec![format!("Round Key 0: {:02x?}", round_keys[0])],
    });
    
    // Main rounds (1-9)
    for round in 1..10 {
        // SubBytes
        sub_bytes(&mut state);
        rounds.push(AESRoundState {
            round,
            step: "SubBytes".to_string(),
            state,
            description: "Substitute bytes using S-box".to_string(),
            intermediate_values: vec!["Each byte replaced by S-box lookup".to_string()],
        });
        
        // ShiftRows
        shift_rows(&mut state);
        rounds.push(AESRoundState {
            round,
            step: "ShiftRows".to_string(),
            state,
            description: "Cyclically shift rows left".to_string(),
            intermediate_values: vec!["Row 0: no shift, Row 1: 1 left, Row 2: 2 left, Row 3: 3 left".to_string()],
        });
        
        // MixColumns
        mix_columns(&mut state);
        rounds.push(AESRoundState {
            round,
            step: "MixColumns".to_string(),
            state,
            description: "Mix columns using GF(2^8) multiplication".to_string(),
            intermediate_values: vec!["Each column multiplied by fixed polynomial".to_string()],
        });
        
        // AddRoundKey
        add_round_key(&mut state, &round_keys[round as usize]);
        rounds.push(AESRoundState {
            round,
            step: "AddRoundKey".to_string(),
            state,
            description: format!("XOR state with round key {}", round),
            intermediate_values: vec![format!("Round Key {}: {:02x?}", round, round_keys[round as usize])],
        });
    }
    
    // Final round (10)
    sub_bytes(&mut state);
    rounds.push(AESRoundState {
        round: 10,
        step: "SubBytes".to_string(),
        state,
        description: "Final SubBytes".to_string(),
        intermediate_values: vec!["Final S-box substitution".to_string()],
    });
    
    shift_rows(&mut state);
    rounds.push(AESRoundState {
        round: 10,
        step: "ShiftRows".to_string(),
        state,
        description: "Final ShiftRows".to_string(),
        intermediate_values: vec!["Final row shifting".to_string()],
    });
    
    add_round_key(&mut state, &round_keys[10]);
    rounds.push(AESRoundState {
        round: 10,
        step: "AddRoundKey".to_string(),
        state,
        description: "Final AddRoundKey".to_string(),
        intermediate_values: vec![format!("Final Round Key: {:02x?}", round_keys[10])],
    });
    
    // Convert state back to ciphertext (column-major)
    let mut ciphertext = [0u8; 16];
    for i in 0..4 {
        for j in 0..4 {
            ciphertext[i * 4 + j] = state[j][i];
        }
    }
    
    AESVisualization {
        plaintext: *plaintext,
        key: *key,
        ciphertext,
        rounds,
    }
}