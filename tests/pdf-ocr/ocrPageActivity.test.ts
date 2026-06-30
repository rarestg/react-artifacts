import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

import { GeminiFatalError, ocrPage } from '../../src/artifacts/pdf-ocr/core/gemini';

// ocrPage's onActivity is telemetry only, but its counters MUST balance back to 0 on every exit
// path (PR4 invariant). These tests stub global fetch and assert request/retry return to 0.

const baseParams = {
  apiKey: 'test-key',
  model: 'gemini-2.5-flash',
  prompt: 'ocr please',
  mediaResolution: 'low' as const,
  retries: 3,
  timeoutMs: 30_000,
};

const page = { pageNumber: 1, pdfBytes: new Uint8Array([1, 2, 3]) };

/** A minimal Response-like object good enough for postJson (ok/json) and readHttpError (text). */
function fakeResponse(opts: { ok: boolean; status: number; statusText?: string; body: unknown }) {
  return {
    ok: opts.ok,
    status: opts.status,
    statusText: opts.statusText ?? '',
    json: async () => opts.body,
    text: async () => JSON.stringify(opts.body),
  };
}

/** Track request/retry transitions: live counts plus their peaks, so we can prove the loop entered
 *  in-flight (and back-off) and still returned both to 0. */
function makeTracker() {
  let inFlight = 0;
  let retrying = 0;
  let peakInFlight = 0;
  let peakRetrying = 0;
  const onActivity = (kind: 'request' | 'retry', delta: 1 | -1): void => {
    if (kind === 'request') {
      inFlight += delta;
      peakInFlight = Math.max(peakInFlight, inFlight);
    } else {
      retrying += delta;
      peakRetrying = Math.max(peakRetrying, retrying);
    }
  };
  return {
    onActivity,
    get inFlight() {
      return inFlight;
    },
    get retrying() {
      return retrying;
    },
    get peakInFlight() {
      return peakInFlight;
    },
    get peakRetrying() {
      return peakRetrying;
    },
  };
}

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

test('ocrPage: a 503 back-off then success balances request and retry counters to 0', async () => {
  let calls = 0;
  globalThis.fetch = (async () => {
    calls += 1;
    if (calls === 1) {
      // 503 with retryDelay "0s" → backoffMs == 0, so the test doesn't actually wait.
      return fakeResponse({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        body: { error: { status: 'UNAVAILABLE', message: 'overloaded', details: [{ retryDelay: '0s' }] } },
      });
    }
    return fakeResponse({
      ok: true,
      status: 200,
      body: {
        candidates: [{ content: { parts: [{ text: 'OCR TEXT' }] } }],
        usageMetadata: { promptTokenCount: 5, candidatesTokenCount: 7 },
      },
    });
  }) as typeof fetch;

  const tracker = makeTracker();
  const result = await ocrPage(page, { ...baseParams, onActivity: tracker.onActivity });

  assert.equal(result.text, 'OCR TEXT');
  assert.equal(result.attempts, 2); // one back-off, then the success
  assert.equal(tracker.inFlight, 0, 'request counter must return to 0');
  assert.equal(tracker.retrying, 0, 'retry counter must return to 0');
  assert.ok(tracker.peakInFlight >= 1, 'page must have been counted in flight');
  assert.ok(tracker.peakRetrying >= 1, 'page must have been counted as backing off');
});

test('ocrPage: a fatal (401) throw still balances counters via the finally', async () => {
  globalThis.fetch = (async () =>
    fakeResponse({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      body: { error: { status: 'UNAUTHENTICATED', message: 'API key not valid' } },
    })) as typeof fetch;

  const tracker = makeTracker();
  await assert.rejects(() => ocrPage(page, { ...baseParams, onActivity: tracker.onActivity }), GeminiFatalError);

  assert.equal(tracker.inFlight, 0, 'request counter must return to 0 even on a fatal throw');
  assert.equal(tracker.retrying, 0, 'a fatal error never enters back-off');
  assert.equal(tracker.peakRetrying, 0, 'fatal is not a retry');
});

test('ocrPage: a non-backoff failure (500) balances the request counter, no retry signal', async () => {
  globalThis.fetch = (async () =>
    fakeResponse({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      body: { error: { status: 'INTERNAL', message: 'boom' } },
    })) as typeof fetch;

  const tracker = makeTracker();
  const result = await ocrPage(page, { ...baseParams, onActivity: tracker.onActivity });

  assert.ok(result.error, 'a 500 fails the page (no auto-retry)');
  assert.equal(result.attempts, 1, 'a fail is not retried');
  assert.equal(tracker.inFlight, 0, 'request counter must return to 0');
  assert.equal(tracker.retrying, 0, 'a fail never enters back-off');
  assert.equal(tracker.peakRetrying, 0);
});
