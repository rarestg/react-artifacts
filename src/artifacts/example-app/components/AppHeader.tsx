import type { ReactNode } from 'react';

import { Tag } from './Primitives';

type AppHeaderProps = {
  title: string;
  subtitle: string;
  status: ReactNode;
};

export function AppHeader({ title, subtitle, status }: AppHeaderProps) {
  return (
    <div className="border-b border-[var(--border)] bg-[var(--surface)] px-6 py-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[var(--text)]">{title}</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">{subtitle}</p>
        </div>
        <Tag variant="muted" className="font-mono">
          {status}
        </Tag>
      </div>
    </div>
  );
}
