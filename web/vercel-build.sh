#!/usr/bin/env bash
set -euo pipefail

# Ensure rustup and cargo use a consistent HOME inside Vercel builders
export HOME=/root
export RUSTUP_HOME=/root/.rustup
export CARGO_HOME=/root/.cargo

# Install Rust (minimal profile, stable toolchain)
curl https://sh.rustup.rs -sSf | sh -s -- -y --profile minimal --default-toolchain stable
export PATH="${CARGO_HOME}/bin:${PATH}"

# Install wasm-pack via cargo and build the Rust crate to web/public/pkg
cargo install wasm-pack --version 0.12.1
cd ../rust
wasm-pack build --target web --out-dir ../web/public/pkg --out-name crypto_wasm

# Build the Next.js app
cd ../web
npm run build
