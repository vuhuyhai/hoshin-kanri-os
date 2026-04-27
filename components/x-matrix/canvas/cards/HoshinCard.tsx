'use client'

import { useState } from 'react'
import { useCanvas, type XMatrixHoshinExtended } from '../state/CanvasContext'
import { HoshinEditModal } from '../modals/HoshinEditModal'

interface HoshinCardProps {
  hoshin: XMatrixHoshinExtended | null
  slotIndex: number
}

const PASTEL_CLASSES = [
  'card-yellow',
  'card-cyan',
  'card-pink',
  'card-lime',
  'card-peach',
] as const

export function HoshinCard({ hoshin, slotIndex }: HoshinCardProps) {
  const { dispatch } = useCanvas()
  const pastel = PASTEL_CLASSES[slotIndex % PASTEL_CLASSES.length]
  const [modalOpen, setModalOpen] = useState(false)

  const handleEmptyClick = () => {
    dispatch({
      type: 'ADD_HOSHIN',
      payload: {
        hoshin: {
          title: '',
          description: '',
          initiatives: [],
          kpis: [],
          status: 'manual',
        },
      },
    })
  }

  const handleFilledClick = () => {
    setModalOpen(true)
  }

  if (!hoshin) {
    return (
      <button
        type="button"
        onClick={handleEmptyClick}
        className="flex h-[110px] w-full items-center justify-center border-2 border-dashed border-[var(--text-3)] bg-[var(--bg)]/40 p-2 transition-colors hover:bg-[var(--bg)]/70"
      >
        <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-3)]">
          + Hoshin #{slotIndex + 1}
        </span>
      </button>
    )
  }

  const initCount = hoshin.initiatives.length
  const kpiCount = hoshin.kpis.length
  const hasTitle = !!hoshin.title?.trim()

  return (
    <>
      <button
        type="button"
        onClick={handleFilledClick}
        className={`${pastel} flex h-[110px] w-full cursor-pointer flex-col gap-1 p-2 text-left transition-shadow hover:shadow-[var(--shadow-lg)]`}
      >
        <div className="flex items-center justify-between gap-1">
          <span className="font-mono text-[10px] uppercase tracking-wider text-ink">
            H{slotIndex + 1}
          </span>
          {hoshin.owner_name && (
            <span className="badge-brutal tag-brand text-[10px]">
              {hoshin.owner_name}
            </span>
          )}
        </div>
        {hasTitle ? (
          <h3 className="line-clamp-2 text-sm font-semibold leading-tight text-ink">
            {hoshin.title}
          </h3>
        ) : (
          <span className="line-clamp-2 text-sm italic text-[var(--text-3)]">
            (Chưa đặt tên — click để sửa)
          </span>
        )}
        <div className="mt-auto font-mono text-[10px] uppercase tracking-wider text-[var(--text-2)]">
          {initCount} INI · {kpiCount} KPI
        </div>
      </button>
      <HoshinEditModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        slotIndex={slotIndex}
      />
    </>
  )
}
