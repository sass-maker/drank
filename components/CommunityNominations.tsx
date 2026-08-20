'use client';

interface CommunityNominationsProps {
  nominations: { domain: string; note?: string }[];
  onOpen: (domain: string) => void;
  onAddPrediction: (domain: string) => void;
}

export function CommunityNominations({
  nominations,
  onOpen,
  onAddPrediction,
}: CommunityNominationsProps) {
  if (nominations.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="text-xs uppercase tracking-widest text-white/50 mb-2">
        Community Nominations (from shared JSON)
      </div>
      <div className="flex flex-wrap gap-2">
        {nominations.map((n) => (
          <div
            key={n.domain}
            onClick={() => onOpen(n.domain)}
            className="cursor-pointer rounded-2xl border border-white/10 bg-white/5 px-3 py-1 text-xs hover:border-emerald-800 flex items-center gap-2"
          >
            {n.domain}
            {n.note ? <span className="text-white/40">— {n.note}</span> : null}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddPrediction(n.domain);
              }}
              className="ml-1 text-emerald-400/70 hover:text-emerald-400"
            >
              +
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
