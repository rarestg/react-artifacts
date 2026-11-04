const EXTERNAL_TOOLS = [
  {
    name: 'BYOBanana',
    domain: 'byobanana.com',
    description: 'Generate and compare Nano Banana images with your own Google key',
  },
  {
    name: 'mdprint',
    domain: 'mdprint.net',
    description: 'Local-first Markdown workspace for clean, print-ready PDFs',
  },
  {
    name: 'Lease PDF',
    domain: 'leasepdf.com',
    description: 'Make a print-ready sublease PDF from a short form, with nothing uploaded',
  },
  {
    name: 'PDF → Split → Markdown',
    domain: 'pdfsplitparse.com',
    description: 'The app behind PDF OCR: PDF to Markdown with your own Gemini key',
  },
] as const;

// Tools that live on their own domains. Rows match IndexEntry, with the domain in the byline
// column so it is clear the link leaves this site. Shown on the desktop and mobile home pages.
export function ExternalTools() {
  return (
    <section className="mt-12">
      <h2 className="border-b border-gray-200 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:border-slate-800 dark:text-slate-400">
        External tools
      </h2>
      <ul className="divide-y divide-gray-200 dark:divide-slate-800">
        {EXTERNAL_TOOLS.map((tool) => (
          <li key={tool.domain} className="@container">
            <a
              href={`https://${tool.domain}`}
              className="group block py-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1 focus-visible:ring-offset-white active:bg-gray-50 dark:focus-visible:ring-offset-slate-950 dark:active:bg-slate-900"
            >
              <div className="@xl:grid @xl:grid-cols-[minmax(0,1fr)_auto] @xl:items-baseline @xl:gap-x-6">
                <span className="block text-[17px] font-medium tracking-tight text-gray-900 decoration-gray-300 underline-offset-4 group-hover:underline @xl:col-start-1 @xl:row-start-1 dark:text-slate-100 dark:decoration-slate-600">
                  {tool.name}
                </span>
                <p className="mt-1 max-w-[62ch] text-[13px] leading-relaxed text-gray-600 @xl:col-start-1 @xl:row-start-2 dark:text-slate-400">
                  {tool.description}
                </p>
                <span className="mt-2 block font-mono text-[11px] text-gray-500 @xl:col-start-2 @xl:row-start-1 @xl:mt-0 dark:text-slate-400">
                  {tool.domain}
                </span>
              </div>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
