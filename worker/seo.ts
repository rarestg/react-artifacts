import type { ArtifactManifestEntry } from '../src/artifactManifest';
import { formatPageTitle, HOME_TITLE, NOT_FOUND_TITLE, SITE_DESCRIPTION, SITE_ORIGIN, SITE_TITLE } from '../src/site';

export type PageMeta = {
  title: string;
  description: string;
  canonicalPath?: string;
  noindex: boolean;
  status: number;
};

const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

const escapeHtml = (value: string): string => value.replace(/[&<>"']/g, (char) => ESCAPES[char] ?? char);

const artifactPage = (entry: ArtifactManifestEntry): PageMeta => ({
  title: formatPageTitle(entry.meta?.name ?? entry.id),
  description: entry.meta?.subtitle ?? SITE_DESCRIPTION,
  canonicalPath: `/artifact/${encodeURIComponent(entry.id)}`,
  noindex: entry.meta?.noindex === true,
  status: 200,
});

// Same grammar as the client router in src/main.tsx: one path segment, optional trailing slash.
const STANDALONE_PATH = /^\/artifact\/([^/]+)\/?$/;

export const resolvePage = (url: URL, entries: readonly ArtifactManifestEntry[]): PageMeta | undefined => {
  if (url.pathname === '/') {
    const requested = url.searchParams.get('artifact');
    const entry = requested ? entries.find((candidate) => candidate.id === requested) : undefined;
    // A valid ?artifact= workbench URL is a duplicate of the standalone page: serve that
    // artifact's metadata with a canonical pointing at /artifact/<id>.
    if (entry) return artifactPage(entry);
    return { title: HOME_TITLE, description: SITE_DESCRIPTION, canonicalPath: '/', noindex: false, status: 200 };
  }

  const match = url.pathname.match(STANDALONE_PATH);
  if (!match) return undefined;

  let id = match[1];
  try {
    id = decodeURIComponent(id);
  } catch {
    // keep the raw segment, same as the client router
  }
  const entry = entries.find((candidate) => candidate.id === id);
  if (entry) return artifactPage(entry);
  return { title: NOT_FOUND_TITLE, description: SITE_DESCRIPTION, noindex: true, status: 404 };
};

const TITLE_TAG = /<title>[^<]*<\/title>/g;
const DESCRIPTION_TAG = /<meta name="description" content="[^"]*"\s*\/?>/g;

/**
 * Rewrites the SPA index.html for one page: replaces the fallback <title> and meta description,
 * and inserts canonical/robots/Open Graph/Twitter tags before </head>. Throws when the HTML does
 * not contain exactly the expected markers, so drift cannot silently ship stale metadata.
 */
export const injectMeta = (html: string, page: PageMeta): string => {
  if ((html.match(TITLE_TAG) ?? []).length !== 1) {
    throw new Error('injectMeta: expected exactly one <title> tag');
  }
  if ((html.match(DESCRIPTION_TAG) ?? []).length !== 1) {
    throw new Error('injectMeta: expected exactly one meta description tag');
  }
  if (!html.includes('</head>')) {
    throw new Error('injectMeta: missing </head>');
  }

  const title = escapeHtml(page.title);
  const description = escapeHtml(page.description);
  const canonicalUrl = page.canonicalPath ? `${SITE_ORIGIN}${page.canonicalPath}` : undefined;

  const tags = [
    ...(canonicalUrl ? [`<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />`] : []),
    ...(page.noindex ? ['<meta name="robots" content="noindex" />'] : []),
    '<meta property="og:type" content="website" />',
    `<meta property="og:site_name" content="${escapeHtml(SITE_TITLE)}" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    ...(canonicalUrl ? [`<meta property="og:url" content="${escapeHtml(canonicalUrl)}" />`] : []),
    '<meta name="twitter:card" content="summary" />',
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${description}" />`,
  ];

  return html
    .replace(TITLE_TAG, `<title>${title}</title>`)
    .replace(DESCRIPTION_TAG, `<meta name="description" content="${description}" />`)
    .replace('</head>', `${tags.map((tag) => `    ${tag}`).join('\n')}\n  </head>`);
};

export const renderSitemap = (entries: readonly ArtifactManifestEntry[]): string => {
  const urls = [
    `${SITE_ORIGIN}/`,
    ...entries
      .filter((entry) => entry.meta?.noindex !== true)
      .map((entry) => `${SITE_ORIGIN}/artifact/${encodeURIComponent(entry.id)}`),
  ];
  const body = urls.map((loc) => `  <url><loc>${escapeHtml(loc)}</loc></url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
};

export const renderRobots = (): string => `User-agent: *\nAllow: /\n\nSitemap: ${SITE_ORIGIN}/sitemap.xml\n`;
