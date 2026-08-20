import { defineConfig } from 'blume';

/**
 * drank documentation — Blume (AI-ready docs).
 *
 * Static build emits llms.txt, llms-full.txt, per-page .md mirrors,
 * sitemap, robots, and agent-readability.json with zero custom Worker
 * code.
 *
 * Source of truth: the committed Markdown under `../docs` (the repo's
 * canonical docs tree). Blume is only the presentation + search layer; it
 * never owns content. Do not edit `docs-site/docs/` — that path is a
 * build-time scratch dir and is gitignored.
 *
 * Custom domain (recommended): https://docs.domains.sassmaker.com
 */
export default defineConfig({
  title: 'drank docs',
  description:
    'drank — a private, local-first Ahrefs Domain Rating tracker. Product, architecture, decisions, development, operations, and learnings.',
  content: {
    // Point directly at the repo's canonical docs tree so there is exactly
    // one home for every doc. Relative to this config file (docs-site/).
    root: '../docs',
  },
  github: {
    owner: 'High-Signal-App',
    repo: 'drank',
    branch: 'main',
    dir: 'docs',
  },
  search: {
    provider: 'orama',
  },
  theme: {
    // Preserve Blume's default typography while avoiding Google Fonts' brittle
    // build-time URLs in CI. Astro still downloads and self-hosts these fonts.
    fonts: {
      body: { name: 'Inter', provider: 'fontsource' },
      display: { name: 'Inter Tight', provider: 'fontsource' },
      mono: { name: 'IBM Plex Mono', provider: 'fontsource' },
    },
  },
  ai: {
    llmsTxt: true,
  },
  seo: {
    agentReadability: true,
    sitemap: true,
    robots: true,
  },
  deployment: {
    site: 'https://docs.domains.sassmaker.com',
    output: 'static',
  },
});
