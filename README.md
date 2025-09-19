# Corsa

An educational RSA visualizer with a Rust/WASM core and a modern Next.js UI. All number theory and RSA math runs in Rust; the frontend is just UI and drawing.

## Tech stack
- Core math: Rust, compiled to WebAssembly with wasm-bindgen
- Web app: Next.js (App Router) + React + TypeScript
- Styling: Tailwind + small set of CSS custom properties
- Tests: `cargo test` for Rust; Vitest/RTL for the web

## What it shows
- Choose primes p and q (or auto-generate tiny ones). The app computes n = p·q and an RSA pair (e, d).
- The visualizer maps residues i ↦ i^e mod n using a line-based view.
- To keep it smooth, the visualizer only renders when n ≤ 323 (e.g., p=17 and q=19). You can still enter larger numbers to explore values in the panels.

## Quick start
1) Build the Rust → WASM module (one-time setup):
	- Install wasm-pack:
	  - Linux/macOS: `cargo install wasm-pack`
	- Build to the web public folder:
	  - From `web/`: `npm run -s wasm:build` (falls back to `wasm-pack build ../rust --target web --out-dir ./public/pkg --out-name rsa_wasm`)
2) Install and run the web app:
	- `cd web && npm install && npm run dev`
3) Open http://localhost:3000

If the WASM package isn’t present, the UI falls back to a tiny JS stub so you can still load the page.

## RSA in a nutshell (math)
1. Pick primes p ≠ q and define

	$n = p\,q$.

2. Compute a totient-like modulus (two common choices):

	$\varphi(n) = (p-1)(q-1)$, or

	$\lambda(n) = \operatorname{lcm}(p-1, q-1)$.

3. Choose $e$ with $\gcd(e, T) = 1$ where $T \in \{\varphi(n),\lambda(n)\}$, and compute

	$d \equiv e^{-1} \pmod{T}$.

4. Encryption and decryption for a message $m \in \{0,\dots,n-1\}$ are

	$c \equiv m^{e} \pmod{n}$,\quad $m \equiv c^{d} \pmod{n}$.

The equalities follow from Euler’s/Fermat’s theorems and the Chinese Remainder Theorem.

FAQ: Is $\gcd(e,\varphi(n))$ (or $\gcd(e,\lambda(n))$) always 1?
- No. You must choose $e$ so that it is coprime to the totient modulus (either $\varphi(n)$ or $\lambda(n)$). The app (Rust core) enforces this by adjusting $e$ or computing a valid pair $(e,d)$ when you enter $p,q$.

## Notes
- This is for learning and visualization only. The parameters are intentionally tiny and insecure.
- The visualizers auto‑pause when a sweep finishes; use Play to run again.

## License
Apache-2.0
