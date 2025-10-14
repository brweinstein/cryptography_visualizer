import '../styles/globals.css';
import type { ReactNode } from 'react';
import Link from 'next/link';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[var(--ui-bg)] text-[var(--ui-text)] flex flex-col">
        <main className="mx-auto max-w-6xl px-4 py-6 flex-1 w-full">
          {children}
        </main>
        <footer className="border-t border-[var(--ui-border)] bg-[var(--ui-bg)]/95">
          <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <p>Built by Ben Weinstein</p>
            </div>
            <div>
              <a href="https://github.com/brweinstein" target="_blank" rel="noreferrer" className="px-3 py-1.5 rounded-md bg-[var(--ui-surface-2)] border border-[var(--ui-border)] hover:bg-[var(--ui-surface)] text-sm">GitHub</a>
              <a href="https://bweinstein.me" target="_blank" rel="noreferrer" className="px-3 py-1.5 rounded-md bg-[var(--ui-surface-2)] border border-[var(--ui-border)] hover:bg-[var(--ui-surface)] text-sm">bweinstein.me</a>
              <a href="https://github.com/brweinstein/corsa" target="_blank" rel="noreferrer" className="px-3 py-1.5 rounded-md bg-[var(--ui-accent)] text-[var(--ui-accent-contrast)] hover:opacity-90 text-sm">Star this repo</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
