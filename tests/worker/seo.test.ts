import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import type { ArtifactManifestEntry } from '../../src/artifactManifest';
import { injectMeta, type PageMeta, renderRobots, renderSitemap, resolvePage } from '../../worker/seo';

const entries: ArtifactManifestEntry[] = [
  { id: 'message-unescaper', meta: { name: 'Message Unescaper', subtitle: 'Convert escaped messages' } },
  { id: 'example', meta: { name: 'Example Artifact', subtitle: 'Demo of the kit', noindex: true } },
  { id: 'bare' },
];

const at = (path: string) => new URL(`https://tools.rares.blog${path}`);

test('resolvePage: bare / gets the site metadata with a self canonical', () => {
  const page = resolvePage(at('/'), entries);
  assert.ok(page);
  assert.equal(page.title, 'tools.rares.blog — small self-contained web tools');
  assert.equal(page.canonicalPath, '/');
  assert.equal(page.noindex, false);
  assert.equal(page.status, 200);
});

test('resolvePage: valid ?artifact= gets artifact metadata canonicalized to the standalone URL', () => {
  const page = resolvePage(at('/?artifact=message-unescaper'), entries);
  assert.ok(page);
  assert.equal(page.title, 'Message Unescaper · tools.rares.blog');
  assert.equal(page.description, 'Convert escaped messages');
  assert.equal(page.canonicalPath, '/artifact/message-unescaper');
  assert.equal(page.status, 200);
});

test('resolvePage: unknown ?artifact= falls back to the site metadata', () => {
  const page = resolvePage(at('/?artifact=nope'), entries);
  assert.ok(page);
  assert.equal(page.canonicalPath, '/');
  assert.equal(page.status, 200);
});

test('resolvePage: standalone artifact page, with and without trailing slash', () => {
  for (const path of ['/artifact/message-unescaper', '/artifact/message-unescaper/']) {
    const page = resolvePage(at(path), entries);
    assert.ok(page, path);
    assert.equal(page.title, 'Message Unescaper · tools.rares.blog');
    assert.equal(page.canonicalPath, '/artifact/message-unescaper');
    assert.equal(page.status, 200);
  }
});

test('resolvePage: percent-encoded ids are decoded like the client router', () => {
  const page = resolvePage(at('/artifact/message%2Dunescaper'), entries);
  assert.ok(page);
  assert.equal(page.title, 'Message Unescaper · tools.rares.blog');
});

test('resolvePage: manifest entry without meta falls back to id and site description', () => {
  const page = resolvePage(at('/artifact/bare'), entries);
  assert.ok(page);
  assert.equal(page.title, 'bare · tools.rares.blog');
  assert.equal(page.description, 'A small gallery of self-contained web tools built as React artifacts.');
});

test('resolvePage: noindex flag carries through to the page', () => {
  const page = resolvePage(at('/artifact/example'), entries);
  assert.ok(page);
  assert.equal(page.noindex, true);
  assert.equal(page.status, 200);
});

test('resolvePage: unknown artifact id is a noindexed 404 without canonical', () => {
  const page = resolvePage(at('/artifact/nope'), entries);
  assert.ok(page);
  assert.equal(page.status, 404);
  assert.equal(page.noindex, true);
  assert.equal(page.canonicalPath, undefined);
  assert.equal(page.title, 'Artifact not found · tools.rares.blog');
});

test('resolvePage: multi-segment and unrelated paths are not pages', () => {
  assert.equal(resolvePage(at('/artifact/a/b'), entries), undefined);
  assert.equal(resolvePage(at('/artifact/'), entries), undefined);
  assert.equal(resolvePage(at('/other'), entries), undefined);
});

const BASE_HTML = [
  '<!doctype html>',
  '<html>',
  '  <head>',
  '    <title>fallback title</title>',
  '    <meta name="description" content="fallback description" />',
  '  </head>',
  '  <body></body>',
  '</html>',
].join('\n');

const page = (overrides: Partial<PageMeta> = {}): PageMeta => ({
  title: 'Message Unescaper · tools.rares.blog',
  description: 'Convert escaped messages',
  canonicalPath: '/artifact/message-unescaper',
  noindex: false,
  status: 200,
  ...overrides,
});

test('injectMeta replaces the title and description and adds canonical/OG/Twitter tags', () => {
  const html = injectMeta(BASE_HTML, page());
  assert.ok(html.includes('<title>Message Unescaper · tools.rares.blog</title>'));
  assert.ok(!html.includes('fallback title'));
  assert.ok(html.includes('<meta name="description" content="Convert escaped messages" />'));
  assert.ok(!html.includes('fallback description'));
  assert.ok(html.includes('<link rel="canonical" href="https://tools.rares.blog/artifact/message-unescaper" />'));
  assert.ok(html.includes('<meta property="og:title" content="Message Unescaper · tools.rares.blog" />'));
  assert.ok(html.includes('<meta property="og:description" content="Convert escaped messages" />'));
  assert.ok(html.includes('<meta property="og:url" content="https://tools.rares.blog/artifact/message-unescaper" />'));
  assert.ok(html.includes('<meta property="og:type" content="website" />'));
  assert.ok(html.includes('<meta name="twitter:card" content="summary" />'));
  assert.ok(html.includes('<meta name="twitter:title" content="Message Unescaper · tools.rares.blog" />'));
  assert.ok(!html.includes('name="robots"'));
});

test('injectMeta escapes HTML metacharacters in injected values', () => {
  const html = injectMeta(BASE_HTML, page({ title: 'A & B <tools> "quoted"', description: `it's <b>bold</b>` }));
  assert.ok(html.includes('<title>A &amp; B &lt;tools&gt; &quot;quoted&quot;</title>'));
  assert.ok(html.includes('<meta name="description" content="it&#39;s &lt;b&gt;bold&lt;/b&gt;" />'));
  assert.ok(!html.includes('<tools>'));
  assert.ok(!html.includes('<b>bold</b>'));
});

test('injectMeta adds a robots noindex tag only when flagged', () => {
  const html = injectMeta(BASE_HTML, page({ noindex: true }));
  assert.ok(html.includes('<meta name="robots" content="noindex" />'));
});

test('injectMeta omits canonical and og:url when the page has no canonical path', () => {
  const html = injectMeta(BASE_HTML, page({ canonicalPath: undefined }));
  assert.ok(!html.includes('rel="canonical"'));
  assert.ok(!html.includes('og:url'));
});

test('injectMeta throws when the expected markers are missing or duplicated', () => {
  assert.throws(() => injectMeta(BASE_HTML.replace('<title>fallback title</title>', ''), page()));
  assert.throws(() => injectMeta(BASE_HTML.replace('</head>', '<title>extra</title></head>'), page()));
  assert.throws(() => injectMeta(BASE_HTML.replace(/<meta name="description"[^>]*>/, ''), page()));
  assert.throws(() => injectMeta(BASE_HTML.replace('</head>', ''), page()));
});

test('injectMeta works against the real index.html', () => {
  const html = readFileSync(fileURLToPath(new URL('../../index.html', import.meta.url)), 'utf8');
  const injected = injectMeta(html, page());
  assert.ok(injected.includes('<title>Message Unescaper · tools.rares.blog</title>'));
  assert.ok(injected.includes('<link rel="canonical" href="https://tools.rares.blog/artifact/message-unescaper" />'));
});

test('renderSitemap lists the home page and indexable artifacts as absolute URLs', () => {
  const xml = renderSitemap(entries);
  assert.ok(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
  assert.ok(xml.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'));
  assert.ok(xml.includes('<loc>https://tools.rares.blog/</loc>'));
  assert.ok(xml.includes('<loc>https://tools.rares.blog/artifact/message-unescaper</loc>'));
  assert.ok(xml.includes('<loc>https://tools.rares.blog/artifact/bare</loc>'));
  assert.ok(!xml.includes('<loc>https://tools.rares.blog/artifact/example</loc>'));
});

test('renderRobots allows crawling and points at the sitemap', () => {
  const robots = renderRobots();
  assert.ok(robots.includes('User-agent: *'));
  assert.ok(robots.includes('Allow: /'));
  assert.ok(robots.includes('Sitemap: https://tools.rares.blog/sitemap.xml'));
  assert.ok(!robots.includes('Disallow'));
});
