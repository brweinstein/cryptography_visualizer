"use client";
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

// Static image imports (you placed these under web/src/app/images)
// Images now live in public/images; use root-absolute paths
const imageSrc = (id: string) => `/images/${id}.png`;

const algorithms = [
  { id: 'rsa', title: 'RSA Encryption', desc: 'Visualize RSA key generation and modular exponentiation.', href: '/rsa' },
  { id: 'dh', title: 'Diffie–Hellman Key Exchange', desc: 'Interactive Diffie–Hellman key exchange protocol.', href: '/diffie-hellman' },
  { id: 'aes', title: 'AES Round Visualization', desc: 'Step-by-step AES round visualization.', href: '/aes' },
  { id: 'sha256', title: 'SHA‑256 (Hash)', desc: 'Visualize the SHA‑256 compression and message schedule.', href: '/sha256' },
  { id: 'dlog', title: 'Discrete Log Visualization', desc: 'Explore discrete logs and baby-step giant-step.', href: '/discrete-log' },
];

export default function HomePage() {
  return (
    <main style={{ padding: "48px", maxWidth: 1100, margin: "0 auto" }}>
      <header style={{ textAlign: "center", marginBottom: 40 }}>
        <h1 style={{ fontSize: 44, margin: 0, color: "var(--text)" }}>Cryptography Visualizer</h1>
        <p style={{ color: "var(--muted)", marginTop: 12, maxWidth: 820, marginLeft: "auto", marginRight: "auto" }}>
          Interactive visualizations of cryptographic algorithms. All math runs in Rust/WebAssembly
        </p>
      </header>

      <section>
        {algorithms.map((alg) => (
          <article key={alg.id} className="alg-row">
            <div className="alg-image" aria-hidden>
              <Image
                src={imageSrc(alg.id)}
                alt={alg.title}
                width={360}
                height={200}
                style={{ borderRadius: 10, objectFit: 'cover' }}
                priority={alg.id === 'rsa'}
              />
            </div>

            <div className="alg-content">
              <div className="alg-title">{alg.title}</div>
              <div className="alg-desc">{alg.desc}</div>
              <Link className="alg-cta" href={alg.href}>Explore →</Link>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
