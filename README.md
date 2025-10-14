## Cryptography Visualizer

Small, interactive cryptography demos powered by Rust + WebAssembly and a Next.js UI.

Features include:
- RSA key generation and residue mapping visualizer
- Diffie–Hellman key exchange walkthrough
- AES round breakdown (toy), SHA‑256 stepper, and Discrete Log exploration

![usage](./corsa.gif)

### Tech
- Rust core compiled to WASM (wasm-bindgen)
- Next.js 14, React 18, TypeScript, Tailwind CSS
- Tests: `cargo test` (Rust), Vitest (web)

### Quick start
1) Build the WASM bundle into the web app’s public path:
	- Prereq: `cargo install wasm-pack`
	- From `web/`: `npm run wasm:build`
	  - Outputs to `web/public/pkg/`
2) Start the web app:
	- `cd web && npm install && npm run dev`
	- Open http://localhost:3000

### Repository layout
```
.
├── LICENSE-APACHE              # Apache 2.0 license
├── README.md                   # Project overview and setup
├── rust/                       # Rust crate (compiled to WebAssembly)
│   ├── Cargo.toml              # Crate manifest
│   └── src/
│       ├── aes.rs              # AES (toy) visualization logic
│       ├── diffie_hellman.rs   # Diffie–Hellman primitives
│       ├── discrete_log.rs     # Discrete log (brute force, BSGS)
│       ├── number_theory.rs    # GCD, modular arithmetic helpers
│       ├── rsa.rs              # RSA helpers and small utilities
│       ├── sha256.rs           # SHA-256 step visualization
│       └── lib.rs              # wasm-bindgen exports and module wiring
├── web/                        # Next.js app (UI)
│   ├── package.json            # Web app scripts (wasm:build, dev, build)
│   ├── public/
│   │   ├── images/             # Static images used by the homepage
│   │   └── pkg/                # wasm-pack output (ignored by git)
│   └── src/
│       ├── app/                # App Router pages
│       │   ├── rsa/            # RSA page
│       │   ├── diffie-hellman/ # DH page
│       │   ├── aes/            # AES page
│       │   ├── sha256/         # SHA-256 page
│       │   └── discrete-log/   # Discrete log page
│       ├── components/         # Shared UI (Panel, Navigation, visualizers)
│       ├── lib/                # WASM loader (`wasm.ts`) and helpers
│       ├── styles/             # Global styles (Tailwind + CSS vars)
│       └── types/              # Type shims for wasm-pack bundle
└── corsa.gif
```

Notes:
- WASM artifacts belong in `web/public/pkg/` and are git-ignored.
- The app dynamically loads `/pkg/rsa_wasm.js` and `/pkg/rsa_wasm_bg.wasm` from that folder at runtime.

### License
Apache-2.0
