import Link from 'next/link';

interface NavigationProps {
  title: string;
  showBackButton?: boolean;
}

export function Navigation({ title, showBackButton = false }: NavigationProps) {
  return (
    <nav className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--ui-border)]">
      <div className="flex items-center gap-4">
        {showBackButton && (
          <Link 
            href="/" 
            className="flex items-center gap-2 text-[var(--ui-muted)] hover:text-[var(--ui-text)] transition-colors"
          >
            <span className="text-lg">←</span>
            <span className="text-sm">Back to Algorithms</span>
          </Link>
        )}
        <h1 className="text-2xl font-bold text-[var(--ui-text)]">{title}</h1>
      </div>
      
      <div className="flex items-center gap-4">
        <Link 
          href="/" 
          className="text-sm text-[var(--ui-muted)] hover:text-[var(--ui-text)] transition-colors"
        >
          All Algorithms
        </Link>
        <Link 
          href="/rsa" 
          className="text-sm text-[var(--ui-muted)] hover:text-[var(--ui-text)] transition-colors"
        >
          RSA
        </Link>
        <Link 
          href="/diffie-hellman" 
          className="text-sm text-[var(--ui-muted)] hover:text-[var(--ui-text)] transition-colors"
        >
          Diffie-Hellman
        </Link>
        <Link 
          href="/aes" 
          className="text-sm text-[var(--ui-muted)] hover:text-[var(--ui-text)] transition-colors"
        >
          AES
        </Link>
        <Link 
          href="/sha256" 
          className="text-sm text-[var(--ui-muted)] hover:text-[var(--ui-text)] transition-colors"
        >
          SHA-256
        </Link>
        <Link 
          href="/discrete-log" 
          className="text-sm text-[var(--ui-muted)] hover:text-[var(--ui-text)] transition-colors"
        >
          Discrete Log
        </Link>
      </div>
    </nav>
  );
}