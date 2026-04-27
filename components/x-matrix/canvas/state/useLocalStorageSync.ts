'use client'

import { useEffect, useRef } from 'react'
import type { Dispatch } from 'react'
import type { CanvasAction, XMatrixCanvasData } from './CanvasContext'

interface UseLocalStorageSyncProps {
  storageKey: string
  data: XMatrixCanvasData
  dispatch: Dispatch<CanvasAction>
  onSaveStatusChange: (status: 'saving' | 'saved' | 'error') => void
}

export function useLocalStorageSync({
  storageKey,
  data,
  dispatch,
  onSaveStatusChange,
}: UseLocalStorageSyncProps) {
  const hasHydrated = useRef(false)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (hasHydrated.current) return
    hasHydrated.current = true

    try {
      const stored = localStorage.getItem(storageKey)
      if (!stored) return

      const parsed = JSON.parse(stored) as XMatrixCanvasData
      if (
        typeof parsed !== 'object' ||
        parsed === null ||
        !Array.isArray(parsed.yearGoals) ||
        !Array.isArray(parsed.hoshins)
      ) {
        return
      }

      dispatch({ type: 'HYDRATE_FROM_STORAGE', payload: parsed })
    } catch (err) {
      console.warn('[Canvas] Failed to hydrate from localStorage:', err)
    }
  }, [storageKey, dispatch])

  useEffect(() => {
    if (!hasHydrated.current) return

    const isEmpty =
      !data.vision.trim() &&
      data.yearGoals.length === 0 &&
      data.hoshins.length === 0
    if (isEmpty) return

    onSaveStatusChange('saving')

    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(data))
        onSaveStatusChange('saved')
      } catch (err) {
        console.error('[Canvas] Failed to save to localStorage:', err)
        onSaveStatusChange('error')
      }
    }, 500)

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [data, storageKey, onSaveStatusChange])
}
