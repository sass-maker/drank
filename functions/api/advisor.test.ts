import { afterEach, describe, expect, it, vi } from 'vitest';

import { onRequestPost } from './advisor';

const body = {
  domain: 'example.com',
  currentDr: 42,
  trend: { direction: 'up', delta: 2, periodDays: 7 },
  turnstileToken: 'test-token',
};
const turnstileEnv = {
  TURNSTILE_SECRET: 'test-secret',
  TURNSTILE_HOSTNAMES: 'drank.example',
};
const aiEnv = {
  AI_BASE_URL: 'https://direct.test/v1',
  AI_API_KEY: 'test-key',
  AI_MODEL: 'free-model',
};
const turnstileSuccess = () =>
  new Response(
    JSON.stringify({
      success: true,
      action: 'turnstile-spin-v2',
      hostname: 'drank.example',
    }),
    { status: 200 }
  );

function request(payload: unknown = body) {
  return new Request('https://drank.example/api/advisor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

const validAdvice = {
  schemaVersion: 1,
  why: 'The observed DR and upward trend suggest authority is improving, but the cause is unknown.',
  evidenceLimit: 'Only DR and trend were observed; backlinks and site content were not inspected.',
  actions: [
    {
      priority: 1,
      title: 'Publish original research',
      reason: 'Useful original data gives relevant publishers a reason to cite the domain.',
    },
    {
      priority: 2,
      title: 'Reclaim relevant mentions',
      reason: 'Legitimate unlinked mentions may become editorial citations with focused outreach.',
    },
    {
      priority: 3,
      title: 'Strengthen useful resources',
      reason: 'Durable reference pages are more likely to earn relevant links over time.',
    },
  ],
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('POST /api/advisor', () => {
  it('returns validated advice from the configured direct provider', async () => {
    const providerFetch = vi
      .fn()
      .mockResolvedValueOnce(turnstileSuccess())
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ choices: [{ message: { content: JSON.stringify(validAdvice) } }] }),
          { status: 200 }
        )
      );
    vi.stubGlobal('fetch', providerFetch);

    const response = await onRequestPost({
      request: request(),
      env: {
        ...turnstileEnv,
        ...aiEnv,
      },
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ advice: validAdvice });
    expect(providerFetch).toHaveBeenCalledWith(
      'https://direct.test/v1/chat/completions',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('fails closed when direct provider configuration is missing', async () => {
    const providerFetch = vi.fn();
    vi.stubGlobal('fetch', providerFetch);
    const response = await onRequestPost({ request: request(), env: {} });
    expect(response.status).toBe(503);
    expect(providerFetch).not.toHaveBeenCalled();
  });

  it('rejects invalid input before calling the provider', async () => {
    const providerFetch = vi.fn();
    vi.stubGlobal('fetch', providerFetch);
    const response = await onRequestPost({
      request: request({ ...body, currentDr: -1 }),
      env: { ...turnstileEnv, ...aiEnv },
    });
    expect(response.status).toBe(400);
    expect(providerFetch).not.toHaveBeenCalled();
  });

  it('preserves a retryable failure when the provider is unavailable', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(turnstileSuccess())
        .mockResolvedValueOnce(new Response('unavailable', { status: 500 }))
    );
    const response = await onRequestPost({
      request: request(),
      env: { ...turnstileEnv, ...aiEnv },
    });
    expect(response.status).toBe(502);
    expect(await response.json()).toMatchObject({ retryable: true });
  });

  it('rejects invalid provider JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(turnstileSuccess())
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ choices: [{ message: { content: '{"why":"no"}' } }] }), {
            status: 200,
          })
        )
    );
    const response = await onRequestPost({
      request: request(),
      env: { ...turnstileEnv, ...aiEnv },
    });
    expect(response.status).toBe(502);
    expect(await response.json()).toMatchObject({ retryable: true });
  });

  it('fails closed when Turnstile verification is rejected', async () => {
    const providerFetch = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ success: false }), { status: 200 }));
    vi.stubGlobal('fetch', providerFetch);

    const response = await onRequestPost({
      request: request(),
      env: { ...turnstileEnv, ...aiEnv },
    });

    expect(response.status).toBe(403);
    expect(providerFetch).toHaveBeenCalledTimes(1);
  });
});
