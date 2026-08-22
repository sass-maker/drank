// Cloudflare Pages Function middleware — adds agent-friendly 404 handling.
//
// Runs for every request that reaches the Pages Functions runtime. Known
// /api/* routes (dr, advisor) are handled by their own files and fall through
// via next(). This middleware only customizes the response when the asset
// lookup returns a 404:
//   1. Unknown /api/* paths get a structured JSON error.
//   2. Unknown paths with Accept: text/markdown get a markdown 404 body.
// All other 404s fall through to the static not-found page (404 status).

const JSON_CONTENT_TYPE = 'application/json; charset=utf-8';
const MARKDOWN_CONTENT_TYPE = 'text/markdown; charset=utf-8';

function wantsMarkdown(request: Request): boolean {
  const accept = request.headers.get('accept') ?? '';
  return accept.includes('text/markdown');
}

function jsonNotFound(path: string): Response {
  const body = JSON.stringify(
    {
      error: {
        code: 'not_found',
        message: `No API endpoint matches '${path}'. See https://domains.sassmaker.com/openapi.json for the public agent surfaces.`,
        path,
      },
    },
    null,
    2
  );
  return new Response(body, {
    status: 404,
    headers: {
      'Content-Type': JSON_CONTENT_TYPE,
      'Cache-Control': 'public, max-age=60, s-maxage=300',
      Vary: 'Accept, Accept-Encoding',
    },
  });
}

function markdownNotFound(path: string): Response {
  const body = [
    `# 404 — Not found: ${path}`,
    '',
    'The page you requested does not exist on domains.sassmaker.com.',
    '',
    '## Discoverable surfaces',
    '',
    '- [Home — Domain Rating tracker](https://domains.sassmaker.com)',
    '- [Public DR dataset](https://domains.sassmaker.com/data)',
    '- [Changelog](https://domains.sassmaker.com/changelog)',
    '- [llms.txt](https://domains.sassmaker.com/llms.txt)',
    '- [Full llms.txt corpus](https://domains.sassmaker.com/llms-full.txt)',
    '- [Machine descriptor (/api/ai)](https://domains.sassmaker.com/api/ai)',
    '- [OpenAPI spec](https://domains.sassmaker.com/openapi.json)',
    '- [Sitemap](https://domains.sassmaker.com/sitemap.xml)',
    '',
    'Every HTML route has a `.md` alternate, e.g. https://domains.sassmaker.com/index.md',
    '',
  ].join('\n');
  return new Response(body, {
    status: 404,
    headers: {
      'Content-Type': MARKDOWN_CONTENT_TYPE,
      'Cache-Control': 'public, max-age=60, s-maxage=300',
      Vary: 'Accept, Accept-Encoding',
    },
  });
}

export async function onRequest(context: {
  request: Request;
  next: () => Promise<Response>;
}): Promise<Response> {
  const { request, next } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  const response = await next();

  // Add Vary: Accept to HTML responses that have markdown alternates.
  if (response.status === 200) {
    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('text/html')) {
      const headers = new Headers(response.headers);
      const vary = headers.get('vary');
      headers.set('vary', vary ? `${vary}, Accept, Accept-Encoding` : 'Accept, Accept-Encoding');
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    }
  }

  // Only customize 404 responses.
  if (response.status !== 404) {
    return response;
  }

  // Unknown /api/* paths get a structured JSON error.
  if (path.startsWith('/api/')) {
    return jsonNotFound(path);
  }

  // Markdown-negotiated 404 for any other unknown path.
  if (wantsMarkdown(request)) {
    return markdownNotFound(path);
  }

  return response;
}
