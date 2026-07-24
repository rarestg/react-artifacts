import assert from 'node:assert/strict';
import test from 'node:test';

import worker from '../../worker/index';

const PAGE_HTML = [
  '<!doctype html>',
  '<html>',
  '  <head>',
  '    <title>fallback title</title>',
  '    <meta name="description" content="fallback description" />',
  '  </head>',
  '  <body></body>',
  '</html>',
].join('\n');

type WorkerEnv = Parameters<typeof worker.fetch>[1];

const createEnv = () => {
  const assetRequests: Request[] = [];
  const env = {
    ASSETS: {
      fetch: async (input: Request | URL | string) => {
        const request = input instanceof Request ? input : new Request(input);
        assetRequests.push(request);
        // Mimic the assets layer honoring conditional requests: a forwarded If-None-Match
        // would produce a bodyless 304 that injection cannot work with.
        if (request.headers.get('if-none-match')) {
          return new Response(null, { status: 304 });
        }
        return new Response(PAGE_HTML, { status: 200, headers: { 'Content-Type': 'text/html', ETag: '"v1"' } });
      },
    },
  } as unknown as WorkerEnv;
  return { env, assetRequests };
};

const dispatch = (request: Request, env: WorkerEnv) =>
  (worker.fetch as (request: Request, env: WorkerEnv) => Promise<Response>)(request, env);

test('GET / serves injected home HTML via a sanitized asset subrequest', async () => {
  const { env, assetRequests } = createEnv();
  const response = await dispatch(new Request('https://tools.rares.blog/'), env);

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Content-Type'), 'text/html; charset=utf-8');
  const html = await response.text();
  assert.ok(html.includes('<title>tools.rares.blog — small self-contained web tools</title>'));
  assert.ok(html.includes('<link rel="canonical" href="https://tools.rares.blog/" />'));

  assert.equal(assetRequests.length, 1);
  assert.equal(assetRequests[0].method, 'GET');
  assert.equal(assetRequests[0].url, 'https://tools.rares.blog/');
});

test('conditional GET is not forwarded to the assets layer', async () => {
  const { env } = createEnv();
  const response = await dispatch(
    new Request('https://tools.rares.blog/', { headers: { 'If-None-Match': '"v1"' } }),
    env,
  );

  assert.equal(response.status, 200);
  const html = await response.text();
  assert.ok(html.includes('<title>tools.rares.blog — small self-contained web tools</title>'));
});

test('HEAD requests get the injected status and headers with an empty body', async () => {
  const { env } = createEnv();
  const response = await dispatch(
    new Request('https://tools.rares.blog/artifact/message-unescaper', { method: 'HEAD' }),
    env,
  );

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Content-Type'), 'text/html; charset=utf-8');
  assert.equal(await response.text(), '');
});

test('GET /artifact/:id injects that artifact metadata from the real manifest', async () => {
  const { env } = createEnv();
  const response = await dispatch(new Request('https://tools.rares.blog/artifact/message-unescaper'), env);

  assert.equal(response.status, 200);
  const html = await response.text();
  assert.ok(html.includes('<title>Message Unescaper · tools.rares.blog</title>'));
  assert.ok(html.includes('<link rel="canonical" href="https://tools.rares.blog/artifact/message-unescaper" />'));
});

test('GET /?artifact=<id> canonicalizes to the standalone URL', async () => {
  const { env } = createEnv();
  const response = await dispatch(new Request('https://tools.rares.blog/?artifact=palette-lab'), env);

  assert.equal(response.status, 200);
  const html = await response.text();
  assert.ok(html.includes('<link rel="canonical" href="https://tools.rares.blog/artifact/palette-lab" />'));
});

test('unknown artifact ids get the SPA HTML with a 404 and a noindex tag', async () => {
  const { env } = createEnv();
  const response = await dispatch(new Request('https://tools.rares.blog/artifact/does-not-exist'), env);

  assert.equal(response.status, 404);
  const html = await response.text();
  assert.ok(html.includes('<meta name="robots" content="noindex" />'));
  assert.ok(html.includes('<title>Artifact not found · tools.rares.blog</title>'));
});

test('example artifacts are served with a robots noindex tag', async () => {
  const { env } = createEnv();
  const response = await dispatch(new Request('https://tools.rares.blog/artifact/example'), env);

  assert.equal(response.status, 200);
  const html = await response.text();
  assert.ok(html.includes('<meta name="robots" content="noindex" />'));
});

test('GET /sitemap.xml lists indexable artifacts and excludes noindexed examples', async () => {
  const { env } = createEnv();
  const response = await dispatch(new Request('https://tools.rares.blog/sitemap.xml'), env);

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Content-Type'), 'application/xml; charset=utf-8');
  const xml = await response.text();
  assert.ok(xml.includes('<loc>https://tools.rares.blog/</loc>'));
  assert.ok(xml.includes('<loc>https://tools.rares.blog/artifact/prompt-library</loc>'));
  assert.ok(xml.includes('<loc>https://tools.rares.blog/artifact/palette-lab</loc>'));
  assert.ok(!xml.includes('<loc>https://tools.rares.blog/artifact/example</loc>'));
  assert.ok(!xml.includes('<loc>https://tools.rares.blog/artifact/example-app</loc>'));
});

test('GET /robots.txt allows crawling and points at the sitemap', async () => {
  const { env } = createEnv();
  const response = await dispatch(new Request('https://tools.rares.blog/robots.txt'), env);

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Content-Type'), 'text/plain; charset=utf-8');
  const robots = await response.text();
  assert.ok(robots.includes('Sitemap: https://tools.rares.blog/sitemap.xml'));
});

test('non-GET requests fall through to the assets layer untouched', async () => {
  const { env, assetRequests } = createEnv();
  const response = await dispatch(new Request('https://tools.rares.blog/', { method: 'POST' }), env);

  assert.equal(assetRequests.length, 1);
  assert.equal(assetRequests[0].method, 'POST');
  assert.ok((await response.text()).includes('<title>fallback title</title>'));
});

test('multi-segment artifact paths fall through to the assets layer', async () => {
  const { env, assetRequests } = createEnv();
  await dispatch(new Request('https://tools.rares.blog/artifact/a/b'), env);

  assert.equal(assetRequests.length, 1);
  assert.equal(assetRequests[0].url, 'https://tools.rares.blog/artifact/a/b');
});

test('GET /api/* keeps the existing JSON response', async () => {
  const { env } = createEnv();
  const response = await dispatch(new Request('https://tools.rares.blog/api/health'), env);

  assert.deepEqual(await response.json(), { name: 'react-artifacts', ok: true });
});
