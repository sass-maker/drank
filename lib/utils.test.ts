import { describe, expect, it } from 'vitest';
import {
  calculateStats,
  computeGainersLosers,
  formatDate,
  formatNextAuto,
  formatRelativeTime,
  getCurrentDR,
  getDRBarColor,
  getDRColor,
  getFaviconUrl,
  getNextAutoRefreshDate,
  getTrend,
  getWeeklyChange,
  normalizeDomain,
  sortDomains,
} from './utils';
import type { TrackedDomain } from './types';

describe('normalizeDomain', () => {
  it('strips protocol and www.', () => {
    expect(normalizeDomain('https://www.example.com')).toBe('example.com');
  });

  it('lowercases and trims', () => {
    expect(normalizeDomain('  Example.COM  ')).toBe('example.com');
  });

  it('returns null for invalid input', () => {
    expect(normalizeDomain('')).toBeNull();
    expect(normalizeDomain('not-a-domain')).toBeNull();
    expect(normalizeDomain('localhost')).toBeNull();
  });

  it('prepends https:// when protocol is missing', () => {
    expect(normalizeDomain('example.com')).toBe('example.com');
  });

  it('strips www. without protocol', () => {
    expect(normalizeDomain('www.example.com')).toBe('example.com');
  });

  it('rejects hostnames that are too short', () => {
    expect(normalizeDomain('a.b')).toBeNull();
  });

  it('rejects hostnames with invalid characters', () => {
    expect(normalizeDomain('exa_mple.com')).toBeNull();
  });
});

describe('getCurrentDR / getTrend', () => {
  const d: TrackedDomain = {
    domain: 'example.com',
    history: [
      { dr: 50, ts: 1 },
      { dr: 55, ts: 2 },
    ],
    lastChecked: 2,
  } as TrackedDomain;

  it('returns latest DR', () => {
    expect(getCurrentDR(d)).toBe(55);
  });

  it('returns null DR for empty history', () => {
    expect(getCurrentDR({ ...d, history: [] })).toBeNull();
  });

  it('computes trend delta', () => {
    expect(getTrend(d)).toEqual({ delta: 5, direction: 'up' });
  });

  it('returns null trend for <2 points', () => {
    expect(getTrend({ ...d, history: [{ dr: 50, ts: 1 }] })).toBeNull();
  });

  it('detects downward trend', () => {
    expect(
      getTrend({
        ...d,
        history: [
          { dr: 60, ts: 1 },
          { dr: 55, ts: 2 },
        ],
      })
    ).toEqual({
      delta: -5,
      direction: 'down',
    });
  });

  it('detects flat trend', () => {
    expect(
      getTrend({
        ...d,
        history: [
          { dr: 55, ts: 1 },
          { dr: 55, ts: 2 },
        ],
      })
    ).toEqual({
      delta: 0,
      direction: 'flat',
    });
  });
});

describe('getDRColor / getDRBarColor', () => {
  it('returns neutral for null', () => {
    expect(getDRColor(null).text).toBe('text-zinc-400');
    expect(getDRBarColor(null)).toBe('#d4d4d8');
  });

  it('returns emerald for >=90', () => {
    expect(getDRColor(95).text).toBe('text-emerald-700');
    expect(getDRBarColor(95)).toBe('#10b981');
  });

  it('returns green for >=70', () => {
    expect(getDRColor(75).text).toBe('text-green-700');
    expect(getDRBarColor(75)).toBe('#22c55e');
  });

  it('returns lime for >=50', () => {
    expect(getDRColor(55).text).toBe('text-lime-700');
    expect(getDRBarColor(55)).toBe('#84cc16');
  });

  it('returns yellow for >=30', () => {
    expect(getDRColor(35).text).toBe('text-yellow-700');
    expect(getDRBarColor(35)).toBe('#eab308');
  });

  it('returns orange for >=10', () => {
    expect(getDRColor(15).text).toBe('text-orange-700');
    expect(getDRBarColor(15)).toBe('#f97316');
  });

  it('returns red for <10', () => {
    expect(getDRColor(5).text).toBe('text-red-700');
    expect(getDRBarColor(5)).toBe('#ef4444');
  });
});

describe('calculateStats', () => {
  it('handles empty list', () => {
    expect(calculateStats([])).toEqual({ count: 0, avg: null, max: null, totalMeasurements: 0 });
  });

  it('computes avg, max, and totalMeasurements for non-empty list', () => {
    const domains: TrackedDomain[] = [
      {
        domain: 'a.com',
        history: [
          { dr: 40, ts: 1 },
          { dr: 60, ts: 2 },
        ],
        lastChecked: 2,
      } as TrackedDomain,
      { domain: 'b.com', history: [{ dr: 80, ts: 1 }], lastChecked: 1 } as TrackedDomain,
    ];
    const stats = calculateStats(domains);
    expect(stats.count).toBe(2);
    expect(stats.avg).toBe(70);
    expect(stats.max).toBe(80);
    expect(stats.totalMeasurements).toBe(3);
  });
});

describe('sortDomains', () => {
  const domains: TrackedDomain[] = [
    { domain: 'b.com', history: [{ dr: 30, ts: 1 }], lastChecked: 1 } as TrackedDomain,
    { domain: 'a.com', history: [{ dr: 80, ts: 1 }], lastChecked: 2 } as TrackedDomain,
  ];

  it('sorts by dr-desc', () => {
    const sorted = sortDomains(domains, 'dr-desc');
    expect(sorted[0].domain).toBe('a.com');
  });

  it('sorts by dr-asc', () => {
    const sorted = sortDomains(domains, 'dr-asc');
    expect(sorted[0].domain).toBe('b.com');
  });

  it('sorts by name-asc', () => {
    const sorted = sortDomains(domains, 'name-asc');
    expect(sorted[0].domain).toBe('a.com');
  });

  it('sorts by name-desc', () => {
    const sorted = sortDomains(domains, 'name-desc');
    expect(sorted[0].domain).toBe('b.com');
  });

  it('sorts by updated-desc', () => {
    const sorted = sortDomains(domains, 'updated-desc');
    expect(sorted[0].domain).toBe('a.com');
  });

  it('sorts by updated-asc', () => {
    const sorted = sortDomains(domains, 'updated-asc');
    expect(sorted[0].domain).toBe('b.com');
  });

  it('sorts by trend-desc', () => {
    const withTrend: TrackedDomain[] = [
      {
        domain: 'flat.com',
        history: [
          { dr: 50, ts: 1 },
          { dr: 50, ts: 2 },
        ],
        lastChecked: 2,
      } as TrackedDomain,
      {
        domain: 'up.com',
        history: [
          { dr: 50, ts: 1 },
          { dr: 60, ts: 2 },
        ],
        lastChecked: 2,
      } as TrackedDomain,
    ];
    const sorted = sortDomains(withTrend, 'trend-desc');
    expect(sorted[0].domain).toBe('up.com');
  });

  it('returns copy for unknown mode', () => {
    const sorted = sortDomains(domains, 'unknown' as never);
    expect(sorted).toHaveLength(2);
    expect(sorted[0].domain).toBe('b.com');
  });
});

describe('formatRelativeTime', () => {
  it("returns 'never' for null", () => {
    expect(formatRelativeTime(null)).toBe('never');
  });

  it("returns 'just now' for recent", () => {
    expect(formatRelativeTime(Date.now() - 1000)).toBe('just now');
  });

  it("returns 'Xm ago' for minutes", () => {
    expect(formatRelativeTime(Date.now() - 5 * 60 * 1000)).toBe('5m ago');
  });

  it("returns 'Xh ago' for hours", () => {
    expect(formatRelativeTime(Date.now() - 3 * 60 * 60 * 1000)).toBe('3h ago');
  });

  it("returns 'Xd ago' for days", () => {
    expect(formatRelativeTime(Date.now() - 2 * 24 * 60 * 60 * 1000)).toBe('2d ago');
  });

  it("returns 'Xw ago' for weeks", () => {
    expect(formatRelativeTime(Date.now() - 10 * 24 * 60 * 60 * 1000)).toBe('1w ago');
  });
});

describe('formatDate', () => {
  it('formats a timestamp into a readable date string', () => {
    const result = formatDate(1700000000000);
    expect(result).toMatch(/2023/);
  });
});

describe('getFaviconUrl', () => {
  it('encodes the domain', () => {
    expect(getFaviconUrl('ex ample.com')).toContain('ex%20ample.com');
  });
});

describe('getNextAutoRefreshDate / formatNextAuto', () => {
  it('returns null when disabled', () => {
    expect(getNextAutoRefreshDate(123, false)).toBeNull();
    expect(formatNextAuto(123, false)).toBe('Auto-refresh off');
  });

  it('returns null when no lastAuto', () => {
    expect(getNextAutoRefreshDate(null, true)).toBeNull();
    expect(formatNextAuto(null, true)).toBe('Will run on next visit');
  });

  it('returns due now when the next date has passed', () => {
    const past = Date.now() - 8 * 24 * 60 * 60 * 1000;
    expect(formatNextAuto(past, true)).toBe('Due now (will run on next visit)');
  });

  it('returns days label when more than a day remains', () => {
    const recent = Date.now() - 1 * 24 * 60 * 60 * 1000;
    expect(formatNextAuto(recent, true)).toMatch(/Next in ~\d+d/);
  });

  it('returns hours label when less than a day remains', () => {
    const recent = Date.now() - 7 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000;
    expect(formatNextAuto(recent, true)).toMatch(/Next in ~\d+h/);
  });
});

describe('getWeeklyChange / computeGainersLosers', () => {
  const now = Date.now();
  const d: TrackedDomain = {
    domain: 'example.com',
    history: [
      { dr: 50, ts: now - 8 * 24 * 60 * 60 * 1000 },
      { dr: 60, ts: now },
    ],
    lastChecked: now,
  } as TrackedDomain;

  it('computes weekly change', () => {
    expect(getWeeklyChange(d)?.delta).toBe(10);
  });

  it('returns null for <2 history points', () => {
    expect(getWeeklyChange({ ...d, history: [{ dr: 50, ts: now }] })).toBeNull();
  });

  it('detects downward weekly change', () => {
    const down: TrackedDomain = {
      ...d,
      history: [
        { dr: 60, ts: now - 8 * 24 * 60 * 60 * 1000 },
        { dr: 50, ts: now },
      ],
    };
    expect(getWeeklyChange(down)?.direction).toBe('down');
  });

  it('detects flat weekly change', () => {
    const flat: TrackedDomain = {
      ...d,
      history: [
        { dr: 55, ts: now - 8 * 24 * 60 * 60 * 1000 },
        { dr: 55, ts: now },
      ],
    };
    expect(getWeeklyChange(flat)?.direction).toBe('flat');
  });

  it('computes gainers/losers', () => {
    const { gainers, losers } = computeGainersLosers([d]);
    expect(gainers).toHaveLength(1);
    expect(losers).toHaveLength(0);
  });

  it('computes losers for downward domains', () => {
    const down: TrackedDomain = {
      domain: 'down.com',
      history: [
        { dr: 60, ts: now - 8 * 24 * 60 * 60 * 1000 },
        { dr: 50, ts: now },
      ],
      lastChecked: now,
    } as TrackedDomain;
    const { gainers, losers } = computeGainersLosers([down]);
    expect(gainers).toHaveLength(0);
    expect(losers).toHaveLength(1);
  });
});
