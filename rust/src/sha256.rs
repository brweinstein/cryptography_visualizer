use serde::Serialize;

#[derive(Serialize, Clone)]
pub struct SHA256Step {
    pub step: u32,
    pub description: String,
    pub a: u32,
    pub b: u32,
    pub c: u32,
    pub d: u32,
    pub e: u32,
    pub f: u32,
    pub g: u32,
    pub h: u32,
    pub w: u32,
    pub k: u32,
    pub temp1: u32,
    pub temp2: u32,
}

#[derive(Serialize)]
pub struct SHA256Visualization {
    pub message: Vec<u8>,
    pub padded_message: Vec<u8>,
    pub hash: [u32; 8],
    pub final_hash: String,
    pub steps: Vec<SHA256Step>,
}

// SHA-256 constants
const K: [u32; 64] = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
];

fn rotr(x: u32, n: u32) -> u32 {
    (x >> n) | (x << (32 - n))
}

fn ch(x: u32, y: u32, z: u32) -> u32 {
    (x & y) ^ (!x & z)
}

fn maj(x: u32, y: u32, z: u32) -> u32 {
    (x & y) ^ (x & z) ^ (y & z)
}

fn sigma0(x: u32) -> u32 {
    rotr(x, 2) ^ rotr(x, 13) ^ rotr(x, 22)
}

fn sigma1(x: u32) -> u32 {
    rotr(x, 6) ^ rotr(x, 11) ^ rotr(x, 25)
}

fn gamma0(x: u32) -> u32 {
    rotr(x, 7) ^ rotr(x, 18) ^ (x >> 3)
}

fn gamma1(x: u32) -> u32 {
    rotr(x, 17) ^ rotr(x, 19) ^ (x >> 10)
}

fn pad_message(message: &[u8]) -> Vec<u8> {
    let mut padded = message.to_vec();
    let original_len = message.len() as u64;
    
    // Append single bit '1' (0x80)
    padded.push(0x80);
    
    // Pad with zeros until (length % 512) == 448
    while (padded.len() * 8) % 512 != 448 {
        padded.push(0x00);
    }
    
    // Append original length as 64-bit big-endian
    let len_bytes = (original_len * 8).to_be_bytes();
    padded.extend_from_slice(&len_bytes);
    
    padded
}

pub fn sha256_with_visualization(message: &[u8]) -> SHA256Visualization {
    let padded_message = pad_message(message);
    let mut steps = Vec::new();
    
    // Initial hash values
    let mut h = [
        0x6a09e667u32, 0xbb67ae85u32, 0x3c6ef372u32, 0xa54ff53au32,
        0x510e527fu32, 0x9b05688cu32, 0x1f83d9abu32, 0x5be0cd19u32
    ];
    
    // Process message in 512-bit (64-byte) blocks
    for chunk_start in (0..padded_message.len()).step_by(64) {
        let chunk = &padded_message[chunk_start..chunk_start + 64];
        
        // Create message schedule array
        let mut w = [0u32; 64];
        
        // Copy chunk into first 16 words of w
        for i in 0..16 {
            w[i] = u32::from_be_bytes([
                chunk[i * 4],
                chunk[i * 4 + 1],
                chunk[i * 4 + 2],
                chunk[i * 4 + 3],
            ]);
        }
        
        // Extend into remaining 48 words
        for i in 16..64 {
            w[i] = gamma1(w[i - 2])
                .wrapping_add(w[i - 7])
                .wrapping_add(gamma0(w[i - 15]))
                .wrapping_add(w[i - 16]);
        }
        
        // Initialize working variables
        let mut a = h[0];
        let mut b = h[1];
        let mut c = h[2];
        let mut d = h[3];
        let mut e = h[4];
        let mut f = h[5];
        let mut g = h[6];
        let mut hash_h = h[7];
        
        // Main loop
        for i in 0..64 {
            let temp1 = hash_h
                .wrapping_add(sigma1(e))
                .wrapping_add(ch(e, f, g))
                .wrapping_add(K[i])
                .wrapping_add(w[i]);
            
            let temp2 = sigma0(a).wrapping_add(maj(a, b, c));
            
            steps.push(SHA256Step {
                step: i as u32,
                description: format!("Round {} compression", i),
                a, b, c, d, e, f, g, h: hash_h,
                w: w[i],
                k: K[i],
                temp1,
                temp2,
            });
            
            hash_h = g;
            g = f;
            f = e;
            e = d.wrapping_add(temp1);
            d = c;
            c = b;
            b = a;
            a = temp1.wrapping_add(temp2);
        }
        
        // Add this chunk's hash to result
        h[0] = h[0].wrapping_add(a);
        h[1] = h[1].wrapping_add(b);
        h[2] = h[2].wrapping_add(c);
        h[3] = h[3].wrapping_add(d);
        h[4] = h[4].wrapping_add(e);
        h[5] = h[5].wrapping_add(f);
        h[6] = h[6].wrapping_add(g);
        h[7] = h[7].wrapping_add(hash_h);
    }
    
    // Convert hash to a 256-bit binary string (each word as 32 bits)
    let final_hash = h.iter()
        .map(|&x| format!("{:032b}", x))
        .collect::<String>();
    
    SHA256Visualization {
        message: message.to_vec(),
        padded_message,
        hash: h,
        final_hash,
        steps,
    }
}