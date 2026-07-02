import type { ReactNode } from 'react';

import { Panel } from '../../../components/Panel';
import { typo } from '../../../ui/recipes';

type StatCardProps = {
  label: string;
  value: ReactNode;
  helper?: string;
};

export function StatCard({ label, value, helper }: StatCardProps) {
  return (
    <Panel className="p-4 space-y-2">
      <div className={typo.sectionTitle}>{label}</div>
      <div className="text-2xl font-semibold text-[var(--text)]">{value}</div>
      {helper && <div className="text-xs text-[var(--text-muted)]">{helper}</div>}
    </Panel>
  );
}
