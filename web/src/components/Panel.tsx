import React, { ReactNode } from 'react';

type PanelProps = {
  title?: ReactNode;
  subtitle?: ReactNode;
  headerRight?: ReactNode;
  children?: ReactNode;
  className?: string;
  collapsible?: boolean;
  collapsed?: boolean;
  onToggle?: () => void;
};

export function Panel({ title, subtitle, headerRight, children, className = '', collapsible = false, collapsed = false, onToggle }: PanelProps) {
  return (
    <section
      className={[
        'rounded-xl border bg-[var(--ui-surface)] text-[var(--ui-text)]',
        'border-[var(--ui-border)]',
        'shadow-sm',
        'transition-colors',
        className,
      ].join(' ')}
    >
      {(title || headerRight || subtitle) && (
        <div className="px-4 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                {collapsible && (
                  <button
                    type="button"
                    aria-label={collapsed ? 'Expand' : 'Collapse'}
                    onClick={onToggle}
                    className="px-2 py-1 text-xs rounded border border-[var(--ui-border)] bg-[var(--ui-surface-2)] text-[var(--ui-text)] hover:bg-[var(--ui-surface)]"
                  >{collapsed ? 'Show' : 'Hide'}</button>
                )}
                {title && <h2 className="font-medium tracking-tight">{title}</h2>}
              </div>
              {subtitle && (
                <div
                  className={[
                    'mt-1 text-sm leading-relaxed text-[var(--ui-muted)]',
                    collapsed ? 'opacity-90' : '',
                  ].join(' ')}
                >
                  {subtitle}
                </div>
              )}
            </div>
            {headerRight}
          </div>
        </div>
      )}
      {!collapsed && (
        <div className="p-4">
          {children}
        </div>
      )}
    </section>
  );
}

export default Panel;
