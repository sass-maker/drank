'use client';

import { useCallback, useState } from 'react';
import { normalizeDomain, saveState } from './utils';
import type { Prediction, StoredState, Toast, TrackedDomain } from './types';

interface UsePredictionsArgs {
  initialPredictions: Prediction[];
  domainsRef: React.RefObject<TrackedDomain[]>;
  persistContext: {
    lastGlobalRefresh: number | null;
    autoRefreshEnabled: boolean;
    lastAutoRefresh: number | null;
  };
  showToast: (message: string, type: Toast['type']) => void;
}

export function usePredictions({
  initialPredictions,
  domainsRef,
  persistContext,
  showToast,
}: UsePredictionsArgs) {
  const { lastGlobalRefresh, autoRefreshEnabled, lastAutoRefresh } = persistContext;
  const [predictions, setPredictions] = useState<Prediction[]>(initialPredictions);

  const persistFullState = useCallback(
    (nextDomains: TrackedDomain[] = domainsRef.current, extra: Partial<StoredState> = {}) => {
      const state: StoredState = {
        version: 2,
        domains: nextDomains,
        lastGlobalRefresh,
        autoRefreshEnabled,
        lastAutoRefresh,
        ...extra,
      } as StoredState;
      saveState(state);
    },
    [lastGlobalRefresh, autoRefreshEnabled, lastAutoRefresh, domainsRef]
  );

  const addPrediction = useCallback(
    (domain: string, note?: string) => {
      const normalized = normalizeDomain(domain);
      if (!normalized) {
        showToast('Invalid domain for prediction', 'error');
        return;
      }
      setPredictions((prev) => {
        if (prev.some((p) => p.domain === normalized)) {
          showToast('Already in your predictions', 'info');
          return prev;
        }
        const next = [...prev, { domain: normalized, note, addedAt: Date.now() }];
        persistFullState(domainsRef.current, { predictions: next });
        showToast(`Added ${normalized} to your top predictions`, 'success');
        return next;
      });
    },
    [showToast, persistFullState, domainsRef]
  );

  const removePrediction = useCallback(
    (domain: string) => {
      setPredictions((prev) => {
        const next = prev.filter((p) => p.domain !== domain);
        persistFullState(domainsRef.current, { predictions: next });
        return next;
      });
    },
    [persistFullState, domainsRef]
  );

  return { predictions, setPredictions, addPrediction, removePrediction };
}
