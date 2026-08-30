import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { generateText } from 'ai';
import { createWorkersAI, type WorkersAISettings } from 'workers-ai-provider';

import {
  parseDrAdvisorAdvice,
  parseDrAdvisorRequest,
  type DrAdvisorAdvice,
  type DrAdvisorRequest,
} from '../../lib/dr-advisor';
import { verifyTurnstile } from '../lib/turnstile';

type WorkersAiBinding = Extract<WorkersAISettings, { binding: unknown }>['binding'];
const DEFAULT_WORKERS_AI_MODEL = '@cf/meta/llama-3.1-8b-instruct';

type AdvisorEnv = {
  AI?: WorkersAiBinding;
  AI_BASE_URL?: string;
  AI_API_KEY?: string;
  AI_MODEL?: string;
  TURNSTILE_HOSTNAMES?: string;
  TURNSTILE_SECRET?: string;
};

type AdvisorContext = {
  request: Request;
  env: AdvisorEnv;
};

const SYSTEM_PROMPT = `You are drank's conservative Domain Rating advisor.
You receive only a domain name, its observed Ahrefs Domain Rating, and a bounded trend.
You do not have backlink counts, referring-domain data, page content, traffic, or paid Ahrefs metrics.
Never invent site-specific causes or claim you inspected the site.
Return strict JSON only: {"schemaVersion":1,"why":string,"evidenceLimit":string,"actions":[{"priority":1,"title":string,"reason":string}, ...]}.
Return 3-5 actions ordered by likely leverage. Explain the observed score/trend conditionally and make the evidence limit explicit.`;

export async function onRequestPost(context: AdvisorContext): Promise<Response> {
  const baseUrl = context.env.AI_BASE_URL?.replace(/\/$/, '');
  const apiKey = context.env.AI_API_KEY;
  const model = context.env.AI_MODEL;
  if (!context.env.AI && (!baseUrl || !apiKey || !model)) {
    return json(
      {
        error: 'DR Advisor is not configured. Add the AI binding or direct endpoint config.',
        retryable: true,
      },
      503
    );
  }

  let input: DrAdvisorRequest;
  let turnstileToken: unknown;
  try {
    const payload = (await context.request.json()) as Record<string, unknown>;
    input = parseDrAdvisorRequest(payload);
    turnstileToken = payload.turnstileToken;
  } catch {
    return json({ error: 'A valid domain, DR, and bounded trend are required.' }, 400);
  }

  const remoteIp =
    context.request.headers.get('CF-Connecting-IP') ??
    context.request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ??
    'unknown';
  const verified = await verifyTurnstile({
    token: turnstileToken,
    action: 'turnstile-spin-v2',
    remoteIp,
    secret: context.env.TURNSTILE_SECRET,
    hostnameList: context.env.TURNSTILE_HOSTNAMES,
  });
  if (!verified) {
    return json({ error: 'Verification failed. Please try again.' }, 403);
  }

  try {
    const languageModel = context.env.AI
      ? createWorkersAI({ binding: context.env.AI })(DEFAULT_WORKERS_AI_MODEL)
      : createOpenAICompatible({
          name: 'drank-direct',
          baseURL: baseUrl as string,
          apiKey: apiKey as string,
        }).chatModel(model as string);
    const result = await generateText({
      model: languageModel,
      system: SYSTEM_PROMPT,
      prompt: JSON.stringify({
        observed: input,
        instruction:
          'Explain only what this measurement can support, then give prioritized general actions.',
      }),
      temperature: 0.2,
      maxOutputTokens: 900,
      maxRetries: 0,
      timeout: { totalMs: 20_000 },
    });
    const advice: DrAdvisorAdvice = parseDrAdvisorAdvice(result.text);
    return json({ advice, generatedAt: Date.now() }, 200);
  } catch (error) {
    console.error('DR Advisor generation failed', error);
    const status =
      error && typeof error === 'object' && 'statusCode' in error && error.statusCode === 429
        ? 429
        : 502;
    return json(
      {
        error:
          status === 429
            ? 'Advisor generation is rate-limited. Try again shortly.'
            : 'Advisor generation failed or returned invalid guidance. Your DR history is safe.',
        retryable: true,
      },
      status
    );
  }
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
