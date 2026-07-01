import { type ReactNode, useId } from 'react';
import { typo } from '../../../ui/recipes';

type SectionProps = {
  title: string;
  children: ReactNode;
};

export function Section({ title, children }: SectionProps) {
  const titleId = useId();

  return (
    <section className="border border-[var(--border)] bg-[var(--surface)]" aria-labelledby={titleId}>
      <div className="border-b border-[var(--border)] bg-[var(--surface-muted)] px-4 py-2">
        <h2 id={titleId} className={typo.sectionTitle}>
          {title}
        </h2>
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}
