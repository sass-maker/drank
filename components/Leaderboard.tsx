'use client';

import { Sparkline, getDRColor, getFaviconUrl } from '@/lib/utils';
import type { TrackedDomain } from '@/lib/types';

interface LeaderboardEntry extends TrackedDomain {
  currentDR: number | null;
}

interface LeaderboardProps {
  leaderboard: LeaderboardEntry[];
  onOpen: (domain: string) => void;
  onAddPrediction: (domain: string, note?: string) => void;
}

export function Leaderboard({ leaderboard, onOpen, onAddPrediction }: LeaderboardProps) {
  return (
    <div className="mb-8 rounded-3xl border border-white/10 bg-zinc-900/60 overflow-hidden">
      <div className="divide-y divide-white/10 text-sm">
        {leaderboard.slice(0, 15).map((d, idx) => {
          const rank = idx + 1;
          const dr = d.currentDR;
          const isTop3 = rank <= 3;
          return (
            <div
              key={d.domain}
              onClick={() => onOpen(d.domain)}
              className="flex items-center gap-4 px-5 py-3 hover:bg-white/5 cursor-pointer group"
            >
              <div
                className={`w-8 text-right font-mono tabular-nums ${isTop3 ? 'text-2xl font-semibold text-yellow-400' : 'text-white/60'}`}
              >
                #{rank}
              </div>
              <img src={getFaviconUrl(d.domain)} className="h-5 w-5 rounded" alt="" />
              <div className="flex-1 font-mono truncate">{d.domain}</div>

              <div className={`font-semibold tabular-nums w-14 text-right ${getDRColor(dr).text}`}>
                {dr != null ? dr.toFixed(1) : '—'}
              </div>

              <div className="w-24 hidden md:block">
                <Sparkline history={d.history} width={80} height={22} />
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddPrediction(d.domain, 'Predicted top performer');
                }}
                className="text-xs rounded-full border border-white/10 px-3 py-1 opacity-60 group-hover:opacity-100 hover:bg-emerald-950 hover:border-emerald-800 transition"
              >
                + Predict
              </button>
            </div>
          );
        })}
      </div>
      {leaderboard.length > 15 && (
        <div className="px-5 py-2 text-xs text-white/50 text-center border-t border-white/10">
          + {leaderboard.length - 15} more in the full shared set
        </div>
      )}
    </div>
  );
}
