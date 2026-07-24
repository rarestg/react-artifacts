import { artifactManifest } from '../src/artifactManifest';
import { injectMeta, renderRobots, renderSitemap, resolvePage } from './seo';

const textResponse = (body: string, contentType: string, method: string, status = 200): Response =>
  new Response(method === 'HEAD' ? null : body, { status, headers: { 'Content-Type': contentType } });

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api/')) {
      return Response.json({
        name: 'react-artifacts',
        ok: true,
      });
    }

    if (request.method === 'GET' || request.method === 'HEAD') {
      if (url.pathname === '/sitemap.xml') {
        return textResponse(renderSitemap(artifactManifest), 'application/xml; charset=utf-8', request.method);
      }
      if (url.pathname === '/robots.txt') {
        return textResponse(renderRobots(), 'text/plain; charset=utf-8', request.method);
      }

      const page = resolvePage(url, artifactManifest);
      if (page) {
        // Fetch the SPA shell with a fresh, header-free GET: forwarding the incoming request's
        // conditional/range headers could yield a 304 or partial body, which cannot be injected.
        const assetResponse = await env.ASSETS.fetch(new Request(new URL('/', url)));
        if (!assetResponse.ok) return assetResponse;
        const html = await assetResponse.text();
        let body: string;
        try {
          body = injectMeta(html, page);
        } catch (error) {
          // Marker drift in the built HTML: log and serve the SPA untouched instead of failing
          // the page. tests/worker/seo.test.ts guards the markers in the source index.html.
          console.error('SEO metadata injection failed', error);
          body = html;
        }
        const headers: Record<string, string> = { 'Content-Type': 'text/html; charset=utf-8' };
        // Header form survives the injection fallback, so noindex pages can never lose the tag.
        if (page.noindex) headers['X-Robots-Tag'] = 'noindex';
        return new Response(request.method === 'HEAD' ? null : body, { status: page.status, headers });
      }
    }

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
