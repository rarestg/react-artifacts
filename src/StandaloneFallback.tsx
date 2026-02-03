type StandaloneFallbackProps = {
  title: string;
  subtitle?: string;
};

export default function StandaloneFallback({ title, subtitle }: StandaloneFallbackProps) {
  return (
    <div className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <div className="inline-flex items-center gap-2 border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          <span className="h-2 w-2 bg-emerald-500 motion-safe:animate-pulse motion-reduce:animate-none" aria-hidden />
          Loading artifact
        </div>

        <div className="border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 md:text-4xl">
              {title}
            </h1>
            {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
          </div>
        </div>

        <div className="grid gap-3">
          <div className="border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="h-3 w-2/3 bg-slate-200 dark:bg-slate-800" />
          </div>
          <div className="border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="h-3 w-1/2 bg-slate-200 dark:bg-slate-800" />
          </div>
          <div className="border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="h-3 w-3/5 bg-slate-200 dark:bg-slate-800" />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="h-24 border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" />
          <div className="h-24 border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" />
          <div className="h-24 border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" />
        </div>
      </div>
    </div>
  );
}
