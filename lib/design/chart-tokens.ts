/**
 * Runtime CSS variable resolver for Recharts integration.
 *
 * Recharts props (stroke, fill, dot.fill, ...) require concrete color strings
 * — they cannot consume `var(--token)`. This module bridges the gap by reading
 * computed styles off `<html>` at render time.
 *
 * SSR-safe: returns fallback when `window` is undefined.
 * Client cache: results memoized in a module-level Map to avoid repeated
 * getComputedStyle reads. Call `clearTokenCache()` if you ever swap themes
 * at runtime (currently unused — dark mode is out of scope for M-Design-3a).
 */

const DEFAULT_FALLBACK = '#000000';

const tokenCache = new Map<string, string>();

/**
 * Normalize a token name to its `--prefixed` form.
 * Accepts both `kpi-healthy` and `--kpi-healthy`.
 */
function normalize(tokenName: string): string {
  return tokenName.startsWith('--') ? tokenName : `--${tokenName}`;
}

/**
 * Resolve a CSS custom property to its computed color value.
 *
 * @param tokenName - CSS variable name with or without `--` prefix
 *                    (e.g. `kpi-healthy` or `--kpi-healthy`)
 * @param fallback  - Fallback color used during SSR or when the token
 *                    is missing / empty. Defaults to `#000000`.
 * @returns Resolved color string (hex / rgb / named)
 *
 * @example
 * resolveToken('kpi-healthy')           // → '#DDE4C5'
 * resolveToken('--kpi-critical', '#000') // → '#c73937'
 */
export function resolveToken(tokenName: string, fallback: string = DEFAULT_FALLBACK): string {
  if (typeof window === 'undefined') return fallback;

  const key = normalize(tokenName);
  const cached = tokenCache.get(key);
  if (cached !== undefined) return cached;

  const raw = getComputedStyle(document.documentElement).getPropertyValue(key);
  const value = raw.trim();
  const resolved = value.length > 0 ? value : fallback;

  tokenCache.set(key, resolved);
  return resolved;
}

/**
 * Clear the resolver cache. Call this if the document theme changes at
 * runtime (e.g. light → dark toggle) so subsequent lookups re-read styles.
 */
export function clearTokenCache(): void {
  tokenCache.clear();
}

/** KPI status tier — escalation scale: healthy → attention → warning → critical. */
export type KpiStatus = 'healthy' | 'attention' | 'warning' | 'critical';

/**
 * Canonical KPI token names. Import this instead of using magic strings
 * so that renames stay type-checked.
 */
export const KPI_TOKEN_NAMES = {
  healthy: 'kpi-healthy',
  attention: 'kpi-attention',
  warning: 'kpi-warning',
  critical: 'kpi-critical',
} as const;

/**
 * Resolve both background and foreground colors for a KPI status.
 * Higher-level API for "I have a status, give me a usable color pair".
 */
export function kpiStatusColor(status: KpiStatus): { bg: string; fg: string } {
  return {
    bg: resolveToken(`kpi-${status}`),
    fg: resolveToken(`kpi-${status}-fg`),
  };
}

/**
 * Build a color array for Recharts multi-series in escalation order.
 * Index mapping: 0=healthy, 1=attention, 2=warning, 3=critical.
 *
 * @example
 * const colors = getKpiSeriesColors();
 * <Line stroke={colors[seriesIndex]} />
 */
export function getKpiSeriesColors(): string[] {
  return [
    resolveToken(KPI_TOKEN_NAMES.healthy),
    resolveToken(KPI_TOKEN_NAMES.attention),
    resolveToken(KPI_TOKEN_NAMES.warning),
    resolveToken(KPI_TOKEN_NAMES.critical),
  ];
}
