'use client';

import { ArrowDown, TrendingUp } from 'lucide-react';
import type { TrackedDomain } from '@/lib/types';
import { computeGainersLosers } from '@/lib/utils';

interface GainersLosersProps {
  domains: TrackedDomain[];
  onOpen: (domain: string) => void;
}

export function GainersLosers({ domains, onOpen }: GainersLosersProps) {
  const { gainers, losers } = computeGainersLosers(domains);
  if (gainers.length === 0 && losers.length === 0) return null;

  return (
    <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="rounded-3xl border border-white/10 bg-zinc-900/60 p-6">
        <div className="flex items-center gap-2 text-sm font-medium text-emerald-400 mb-4">
          <TrendingUp className="h-4 w-4" /> GLOBAL GAINERS (LAST ~7 DAYS)
        </div>
        <div className="space-y-2 text-sm">
          {gainers.map((g) => (
            <div
              key={g.domain}
              onClick={() => onOpen(g.domain)}
              className="flex justify-between rounded-2xl bg-white/5 px-4 py-2 cursor-pointer hover:bg-white/10"
            >
              <span className="font-mono">{g.domain}</span>
              <span className="font-medium text-emerald-400">+{g.delta}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-3xl border border-white/10 bg-zinc-900/60 p-6">
        <div className="flex items-center gap-2 text-sm font-medium text-red-400 mb-4">
          <ArrowDown className="h-4 w-4" /> GLOBAL LOSERS (LAST ~7 DAYS)
        </div>
        <div className="space-y-2 text-sm">
          {losers.map((l) => (
            <div
              key={l.domain}
              onClick={() => onOpen(l.domain)}
              className="flex justify-between rounded-2xl bg-white/5 px-4 py-2 cursor-pointer hover:bg-white/10"
            >
              <span className="font-mono">{l.domain}</span>
              <span className="font-medium text-red-400">{l.delta}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
