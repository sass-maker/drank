'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  calculateStats,
  exportState,
  fetchDomainRating,
  importState,
  loadState,
  normalizeDomain,
  saveState,
  sortDomains,
} from './utils';
import type {
  HistoryPoint,
  Prediction,
  SortMode,
  StoredState,
  Toast,
  TrackedDomain,
} from './types';
import { useAutoRefresh, REFRESH_DELAY_MS } from './useAutoRefresh';
import { usePredictions } from './usePredictions';
import globalSitesStatic from '@/data/global-sites.json';

const GLOBAL_SITE_SET = new Set(
  (globalSitesStatic as string[]).map((domain) => domain.toLowerCase())
);

interface UseTrackedDomainsReturn {
  domains: TrackedDomain[];
  filteredAndSorted: TrackedDomain[];
  isLoading: boolean;
  updating: Set<string>;
  search: string;
  setSearch: (s: string) => void;
  sortMode: SortMode;
  setSortMode: (m: SortMode) => void;
  toasts: Toast[];
  dismissToast: (id: number) => void;

  addDomain: (input: string) => Promise<void>;
  refreshDomain: (domain: string) => Promise<void>;
  refreshAll: () => Promise<void>;
  removeDomain: (domain: string) => void;
  clearAll: () => void;

  selectedDomain: string | null;
  selectDomain: (domain: string | null) => void;
  getDomain: (domain: string) => TrackedDomain | undefined;

  exportData: () => void;
  importData: (file: File) => Promise<boolean>;

  stats: { count: number; avg: number | null; max: number | null; totalMeasurements: number };

  autoRefreshEnabled: boolean;
  lastAutoRefresh: number | null;
  toggleAutoRefresh: (enabled: boolean) => void;
  runAutoRefreshNow: () => Promise<void>;
  customCount: number;

  predictions: Prediction[];
  addPrediction: (domain: string, note?: string) => void;
  removePrediction: (domain: string) => void;
}

export function useTrackedDomains(): UseTrackedDomainsReturn {
  const [domains, setDomains] = useState<TrackedDomain[]>(() => {
    const stored = loadState();
    if (stored?.domains?.length) {
      return stored.domains.map((d) => ({
        ...d,
        isCustom: true,
      }));
    }
    return [];
  });
  const domainsRef = useRef<TrackedDomain[]>([]);
  const [lastGlobalRefresh, setLastGlobalRefresh] = useState<number | null>(
    () => loadState()?.lastGlobalRefresh ?? null
  );
  const [search, setSearch] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('dr-desc');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [updating, setUpdating] = useState<Set<string>>(new Set());
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [isLoading] = useState(false);

  const toastIdRef = useRef(1);
  const applyNewPointRef = useRef<(domain: string, dr: number, fetchedAt: number) => void>(
    () => {}
  );

  const showToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = toastIdRef.current++;
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => {
      setToasts((current) => current.filter((tt) => tt.id !== id));
    }, 4200);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((t) => t.filter((tt) => tt.id !== id));
  }, []);

  useEffect(() => {
    domainsRef.current = domains;
    const stored = loadState();
    if (!stored) {
      saveState({
        version: 2,
        domains: [],
        lastGlobalRefresh: null,
        autoRefreshEnabled: true,
        lastAutoRefresh: null,
        predictions: [],
      });
    }
  }, [domains]);

  // Predictions sub-hook (called early so its state is available below)
  const { predictions, setPredictions, addPrediction, removePrediction } = usePredictions({
    initialPredictions: loadState()?.predictions || [],
    domainsRef,
    persistContext: {
      lastGlobalRefresh,
      autoRefreshEnabled: loadState()?.autoRefreshEnabled ?? true,
      lastAutoRefresh: loadState()?.lastAutoRefresh ?? null,
    },
    showToast,
  });

  // Shared refresh logic used by both the hook and the auto-refresh sub-hook.
  // Uses a ref to applyNewPoint to break the circular dependency.
  const refreshDomains = useCallback(
    async (targets: TrackedDomain[]) => {
      for (let i = 0; i < targets.length; i++) {
        const target = targets[i];
        setUpdating((current) => new Set(current).add(target.domain));

        const result = await fetchDomainRating(target.domain);

        setUpdating((current) => {
          const next = new Set(current);
          next.delete(target.domain);
          return next;
        });

        if ('error' in result) {
          showToast(`${target.domain}: ${result.error}`, 'error');
        } else {
          applyNewPointRef.current(target.domain, result.dr, result.fetchedAt);
        }

        if (i < targets.length - 1) {
          await new Promise((resolveDelay) => setTimeout(resolveDelay, REFRESH_DELAY_MS));
        }
      }
    },
    [showToast]
  );

  // Auto-refresh sub-hook
  const {
    autoRefreshEnabled,
    setAutoRefreshEnabled,
    lastAutoRefresh,
    setLastAutoRefresh,
    toggleAutoRefresh,
    runAutoRefreshNow,
    customCount,
  } = useAutoRefresh({
    domainsRef,
    isLoading,
    initial: {
      autoRefreshEnabled: loadState()?.autoRefreshEnabled ?? true,
      lastAutoRefresh: loadState()?.lastAutoRefresh ?? null,
    },
    persistContext: {
      lastGlobalRefresh,
      predictions,
    },
    callbacks: {
      showToast,
      refreshDomains,
    },
  });

  const persist = useCallback(
    (nextDomains: TrackedDomain[], nextLastGlobal?: number | null, nextPreds?: any) => {
      const state: StoredState = {
        version: 2,
        domains: nextDomains,
        lastGlobalRefresh: nextLastGlobal !== undefined ? nextLastGlobal : lastGlobalRefresh,
        autoRefreshEnabled,
        lastAutoRefresh,
        predictions: nextPreds !== undefined ? nextPreds : predictions,
      } as any;
      saveState(state);
    },
    [lastGlobalRefresh, autoRefreshEnabled, lastAutoRefresh, predictions]
  );

  const updateDomains = useCallback(
    (updater: (prev: TrackedDomain[]) => TrackedDomain[]) => {
      setDomains((prev) => {
        const next = updater(prev);
        domainsRef.current = next;
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const applyNewPoint = useCallback(
    (domain: string, dr: number, fetchedAt: number) => {
      updateDomains((prev) =>
        prev.map((d) => {
          if (d.domain !== domain) return d;

          const point: HistoryPoint = { ts: fetchedAt, dr };
          const newHistory = [...d.history.filter((p) => p.ts !== point.ts), point].sort(
            (a, b) => a.ts - b.ts
          );

          return {
            ...d,
            history: newHistory,
            lastChecked: fetchedAt,
          };
        })
      );
    },
    [updateDomains]
  );

  // Keep the ref in sync so refreshDomains (which is stable) can call the latest applyNewPoint
  useEffect(() => {
    applyNewPointRef.current = applyNewPoint;
  }, [applyNewPoint]);

  const refreshDomain = useCallback(
    async (domain: string) => {
      setUpdating((u) => new Set(u).add(domain));

      const result = await fetchDomainRating(domain);

      setUpdating((u) => {
        const next = new Set(u);
        next.delete(domain);
        return next;
      });

      if ('error' in result) {
        showToast(`${domain}: ${result.error}`, 'error');
        return;
      }

      applyNewPoint(domain, result.dr, result.fetchedAt);
    },
    [showToast, applyNewPoint]
  );

  const addDomain = useCallback(
    async (input: string) => {
      const normalized = normalizeDomain(input);
      if (!normalized) {
        showToast('Please enter a valid domain (e.g. example.com)', 'error');
        return;
      }

      if (GLOBAL_SITE_SET.has(normalized)) {
        showToast(`${normalized} is already included in the shared examples`, 'info');
        return;
      }

      const existing = domains.find((d) => d.domain === normalized);
      if (existing) {
        showToast(`${normalized} is already tracked`, 'info');
        setSelectedDomain(normalized);
        await refreshDomain(normalized);
        return;
      }

      const newDomain: TrackedDomain = {
        domain: normalized,
        history: [],
        lastChecked: null,
        isCustom: true,
      };

      updateDomains((prev) => [...prev, newDomain]);
      showToast(`Added ${normalized}`, 'success');

      await refreshDomain(normalized);
      setSelectedDomain(normalized);
    },
    [domains, refreshDomain, updateDomains, showToast]
  );

  const refreshAll = useCallback(async () => {
    if (domains.length === 0) return;

    showToast(
      `Refreshing ${domains.length} domains... (this may take ~${Math.ceil((domains.length * REFRESH_DELAY_MS) / 1000)}s)`,
      'info'
    );

    const sorted = [...domains];
    await refreshDomains(sorted);

    const now = Date.now();
    setLastGlobalRefresh(now);
    persist(domainsRef.current, now, predictions);
    showToast('Refresh complete', 'success');
  }, [domains, persist, showToast, predictions, refreshDomains]);

  const removeDomain = useCallback(
    (domain: string) => {
      updateDomains((prev) => prev.filter((d) => d.domain !== domain));
      if (selectedDomain === domain) {
        setSelectedDomain(null);
      }
      showToast(`Removed ${domain}`, 'info');
    },
    [updateDomains, selectedDomain, showToast]
  );

  const clearAll = useCallback(() => {
    if (!confirm('Clear all tracked domains and their history? This cannot be undone.')) return;
    const empty: TrackedDomain[] = [];
    setDomains(empty);
    domainsRef.current = empty;
    setLastGlobalRefresh(null);
    setLastAutoRefresh(null);
    setSelectedDomain(null);
    setPredictions([]);
    setAutoRefreshEnabled(true);
    saveState({
      version: 2,
      domains: empty,
      lastGlobalRefresh: null,
      autoRefreshEnabled: true,
      lastAutoRefresh: null,
      predictions: [],
    } as any);
    showToast('All data cleared', 'info');
  }, [showToast]);

  const selectDomain = useCallback((domain: string | null) => {
    setSelectedDomain(domain);
  }, []);

  const getDomain = useCallback(
    (domain: string) => domains.find((d) => d.domain === domain),
    [domains]
  );

  const exportData = useCallback(() => {
    const state: StoredState = {
      version: 2,
      domains,
      lastGlobalRefresh,
      autoRefreshEnabled,
      lastAutoRefresh,
      predictions,
    };
    exportState(state);
    showToast('Exported JSON', 'success');
  }, [domains, lastGlobalRefresh, autoRefreshEnabled, lastAutoRefresh, predictions, showToast]);

  const importData = useCallback(
    async (file: File): Promise<boolean> => {
      const parsed = await importState(file);
      if (!parsed) {
        showToast('Invalid or corrupted import file', 'error');
        return false;
      }

      const migrated = (parsed.domains || []).map((d: TrackedDomain) => ({
        ...d,
        isCustom: d.isCustom ?? true,
      }));

      setDomains(migrated);
      domainsRef.current = migrated;
      setLastGlobalRefresh(parsed.lastGlobalRefresh ?? null);
      setAutoRefreshEnabled(parsed.autoRefreshEnabled ?? true);
      setLastAutoRefresh(parsed.lastAutoRefresh ?? null);
      setSelectedDomain(null);
      const importedPreds = (parsed as any).predictions || [];
      setPredictions(importedPreds);

      saveState({
        version: 2,
        domains: migrated,
        lastGlobalRefresh: parsed.lastGlobalRefresh ?? null,
        autoRefreshEnabled: parsed.autoRefreshEnabled ?? true,
        lastAutoRefresh: parsed.lastAutoRefresh ?? null,
        predictions: importedPreds,
      } as any);

      showToast(`Imported ${migrated.length} domains`, 'success');
      return true;
    },
    [showToast]
  );

  const filteredAndSorted = useMemo(() => {
    let result = domains;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((d) => d.domain.includes(q));
    }

    return sortDomains(result, sortMode);
  }, [domains, search, sortMode]);

  const stats = useMemo(() => calculateStats(domains), [domains]);

  return {
    domains,
    filteredAndSorted,
    isLoading,
    updating,
    search,
    setSearch,
    sortMode,
    setSortMode,
    toasts,
    dismissToast,
    addDomain,
    refreshDomain,
    refreshAll,
    removeDomain,
    clearAll,
    selectedDomain,
    selectDomain,
    getDomain,
    exportData,
    importData,
    stats,
    autoRefreshEnabled,
    lastAutoRefresh,
    toggleAutoRefresh,
    runAutoRefreshNow,
    customCount,
    predictions,
    addPrediction,
    removePrediction,
  };
}
