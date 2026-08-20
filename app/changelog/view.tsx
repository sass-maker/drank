'use client';

import { useEffect } from 'react';
import { BarChart3, ExternalLink } from 'lucide-react';

const SOURCE_URL = 'https://github.com/sass-maker/drank';
const ROADMAP_URL = 'https://github.com/sass-maker/drank/issues';

const entries = [
  {
    date: '2026-07-13',
    label: 'July 13, 2026',
    title: 'DR Advisor shipped',
    body: 'Every explanation is requested explicitly, grounded only in the selected domain’s observed rating and trend, and cached in the browser. Missing gateway configuration or provider failures leave normal tracking available.',
    tags: ['Advisor', 'Local cache'],
  },
  {
    date: '2026-07-02',
    label: 'July 2, 2026',
    title: 'Failure recovery became part of the app',
    body: 'Route-level and global error boundaries now keep unexpected rendering failures contained. Dead web-vitals code was removed at the same time.',
    tags: ['Reliability', 'Cleanup'],
  },
  {
    date: '2026-06-16',
    label: 'June 2026',
    title: 'Private weekly tracking and shared comparisons',
    body: 'Browser-local domains gained opportunistic weekly refresh, while the shared example set, leaderboard, nominations, predictions, and High Signal integration established the public comparison layer.',
    tags: ['Tracking', 'Shared data'],
  },
] as const;

export function ChangelogView() {
  useEffect(() => {
    document.getElementById('drank-lcp-shell')?.remove();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200">
      <header className="border-b border-white/10 bg-zinc-950/95">
        <div className="mx-auto flex min-h-20 max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <a href="/" className="flex min-h-11 items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-zinc-950">
              <BarChart3 className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-xl font-semibold tracking-[-1px] text-white">drank</span>
              <span className="block font-mono text-[10px] text-zinc-500">DOMAIN RATING WATCH</span>
            </span>
          </a>
          <nav
            className="flex flex-wrap items-center justify-end gap-2"
            aria-label="Project navigation"
          >
            <a
              href="/"
              className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm text-zinc-400 hover:text-white"
            >
              Dashboard
            </a>
            <a
              href="/changelog"
              aria-current="page"
              className="inline-flex min-h-11 items-center rounded-xl bg-white/10 px-3 text-sm text-white"
            >
              Changelog
            </a>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-6 py-16">
        <section className="max-w-3xl">
          <p className="font-mono text-xs font-medium uppercase tracking-[0.16em] text-emerald-400">
            Product history, maintained here
          </p>
          <h1 className="mt-5 text-5xl font-semibold tracking-[-2.5px] text-white sm:text-7xl">
            What changed in drank.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-400">
            Verified improvements to local tracking, shared data, and explanation quality. Planned
            work remains in GitHub Issues.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={ROADMAP_URL}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm font-medium text-zinc-950"
            >
              Roadmap <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <a
              href={SOURCE_URL}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/10 px-4 text-sm font-medium text-zinc-300 hover:border-white/25"
            >
              Source <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </section>

        <section className="mt-16" aria-label="drank releases">
          {entries.map((entry) => (
            <article
              key={entry.date}
              className="grid gap-4 border-t border-white/10 py-8 sm:grid-cols-[140px_minmax(0,1fr)] sm:gap-8"
            >
              <time dateTime={entry.date} className="text-sm font-medium text-zinc-500">
                {entry.label}
              </time>
              <div>
                <h2 className="text-2xl font-semibold tracking-[-0.5px] text-white">
                  {entry.title}
                </h2>
                <p className="mt-3 max-w-[70ch] leading-7 text-zinc-400">{entry.body}</p>
                <ul className="mt-5 flex flex-wrap gap-2" aria-label="Update categories">
                  {entry.tags.map((tag) => (
                    <li
                      key={tag}
                      className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300"
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </section>
      </main>

      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-5xl flex-col justify-between gap-4 px-6 py-8 text-sm text-zinc-500 sm:flex-row">
          <span>No account. No personal-domain database.</span>
          <div className="flex flex-wrap gap-5">
            <a href={ROADMAP_URL} className="hover:text-white">
              Roadmap
            </a>
            <a href={SOURCE_URL} className="hover:text-white">
              Source
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
