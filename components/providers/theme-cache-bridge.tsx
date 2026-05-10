'use client'

import { useEffect } from 'react'
import { useTheme } from 'next-themes'
import { clearTokenCache } from '@/lib/design/chart-tokens'

/**
 * Bridge component: clear chart-tokens module-level cache khi theme
 * resolvedTheme change. Wired vào ThemeProvider tree để Recharts +
 * resolveToken() consumers get fresh hex post theme toggle.
 *
 * Pattern §17 M-Design-Dark-1 Q7 α: useEffect listen useTheme()
 * .resolvedTheme → clearTokenCache() side effect.
 *
 * Reactive guaranteed via next-themes hook re-render trigger.
 * KHÔNG render UI (return null) — pure side-effect bridge.
 */
export function ThemeCacheBridge() {
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    clearTokenCache()
  }, [resolvedTheme])

  return null
}
