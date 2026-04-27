'use client'

import { useState } from 'react'
import { useCanvas } from '../state/CanvasContext'
import { EditModalShell } from './EditModalShell'
import { LIMITS, type XMatrixInitiative, type XMatrixKpi } from '@/lib/x-matrix/types'
import { genInitId, genKpiId } from '@/lib/x-matrix/utils'

interface HoshinEditModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  slotIndex: number
}

interface InitiativeFormRow {
  id: string
  title: string
  timeframe: '30d' | '60d' | '90d'
}

interface KpiFormRow {
  id: string
  name: string
  unit: string
  targetValue: number
  frequency: 'weekly' | 'monthly'
}

const TITLE_MAX = 100
const OWNER_MAX = 50

function makeBlankInitiative(
  hoshinIdx: number,
  initIdx: number
): InitiativeFormRow {
  return {
    id: genInitId(hoshinIdx, initIdx),
    title: '',
    timeframe: '30d',
  }
}

function makeBlankKpi(hoshinIdx: number, kpiIdx: number): KpiFormRow {
  return {
    id: genKpiId(hoshinIdx, kpiIdx),
    name: '',
    unit: '',
    targetValue: 0,
    frequency: 'weekly',
  }
}

export function HoshinEditModal(props: HoshinEditModalProps) {
  // Only mount the form while open — local state initializes from
  // context on each open and is discarded on close (no useEffect sync).
  if (!props.open) return null
  return <HoshinEditModalForm {...props} />
}

function HoshinEditModalForm({
  open,
  onOpenChange,
  slotIndex,
}: HoshinEditModalProps) {
  const { state, dispatch } = useCanvas()
  const hoshin = state.data.hoshins[slotIndex]

  const [title, setTitle] = useState(hoshin?.title ?? '')
  const [ownerName, setOwnerName] = useState(hoshin?.owner_name ?? '')
  const [initiatives, setInitiatives] = useState<InitiativeFormRow[]>(() =>
    (hoshin?.initiatives ?? []).map((i) => ({
      id: i.id,
      title: i.title,
      timeframe: i.timeframe,
    }))
  )
  const [kpis, setKpis] = useState<KpiFormRow[]>(() =>
    (hoshin?.kpis ?? []).map((k) => ({
      id: k.id,
      name: k.name,
      unit: k.unit,
      targetValue: k.targetValue,
      frequency: k.frequency,
    }))
  )

  const trimmedTitle = title.trim()
  const trimmedOwner = ownerName.trim()
  const saveDisabled = trimmedTitle === '' || trimmedOwner === ''

  const updateInitiative = (idx: number, patch: Partial<InitiativeFormRow>) => {
    setInitiatives((rows) =>
      rows.map((r, i) => (i === idx ? { ...r, ...patch } : r))
    )
  }

  const removeInitiative = (idx: number) => {
    setInitiatives((rows) => rows.filter((_, i) => i !== idx))
  }

  const addInitiative = () => {
    if (initiatives.length >= LIMITS.MAX_INITIATIVES_PER_HOSHIN) return
    setInitiatives((rows) => [
      ...rows,
      makeBlankInitiative(slotIndex, rows.length),
    ])
  }

  const updateKpi = (idx: number, patch: Partial<KpiFormRow>) => {
    setKpis((rows) => rows.map((r, i) => (i === idx ? { ...r, ...patch } : r)))
  }

  const removeKpi = (idx: number) => {
    setKpis((rows) => rows.filter((_, i) => i !== idx))
  }

  const addKpi = () => {
    if (kpis.length >= LIMITS.MAX_KPIS_PER_HOSHIN) return
    setKpis((rows) => [...rows, makeBlankKpi(slotIndex, rows.length)])
  }

  const handleSave = () => {
    if (saveDisabled) return

    const filteredInits: XMatrixInitiative[] = initiatives
      .filter((i) => i.title.trim() !== '')
      .map((i) => ({
        id: i.id,
        title: i.title.trim(),
        timeframe: i.timeframe,
      }))

    const filteredKpis: XMatrixKpi[] = kpis
      .filter((k) => k.name.trim() !== '')
      .map((k) => ({
        id: k.id,
        name: k.name.trim(),
        unit: k.unit.trim(),
        targetValue: Number.isFinite(k.targetValue) ? k.targetValue : 0,
        frequency: k.frequency,
        ownerUserId: null,
        ownerName: trimmedOwner,
        deptLevel: 'company',
      }))

    dispatch({
      type: 'UPDATE_HOSHIN',
      payload: {
        index: slotIndex,
        patch: {
          title: trimmedTitle,
          owner_name: trimmedOwner,
          initiatives: filteredInits,
          kpis: filteredKpis,
        },
      },
    })
    onOpenChange(false)
  }

  const initFull = initiatives.length >= LIMITS.MAX_INITIATIVES_PER_HOSHIN
  const kpiFull = kpis.length >= LIMITS.MAX_KPIS_PER_HOSHIN

  return (
    <EditModalShell
      open={open}
      onOpenChange={onOpenChange}
      title={`Sửa Hoshin H${slotIndex + 1}`}
      description="Một mục tiêu trọng tâm của năm với người chịu trách nhiệm, hành động cụ thể và KPI đo lường."
      onSave={handleSave}
      saveDisabled={saveDisabled}
    >
      <div className="flex flex-col gap-5">
        {/* Section 1: Hoshin info */}
        <details open className="border-2 border-[var(--ink)] bg-[var(--bg)]">
          <summary className="cursor-pointer bg-[var(--bg-muted)] px-3 py-2 font-display text-sm font-bold uppercase tracking-wider text-[var(--ink)]">
            1. Thông tin Hoshin
          </summary>
          <div className="flex flex-col gap-3 p-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="hsh-title" className="field-label">
                Tiêu đề Hoshin <span className="text-[var(--brand)]">*</span>
              </label>
              <input
                id="hsh-title"
                type="text"
                value={title}
                maxLength={TITLE_MAX}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ví dụ: Tăng tỷ lệ giữ chân khách hàng lên 85%"
                className="input-brutal"
                autoFocus
              />
              <div className="text-right font-mono text-[10px] uppercase tracking-wider text-[var(--text-3)]">
                {title.length}/{TITLE_MAX}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="hsh-owner" className="field-label">
                Người chịu trách nhiệm{' '}
                <span className="text-[var(--brand)]">*</span>
              </label>
              <input
                id="hsh-owner"
                type="text"
                value={ownerName}
                maxLength={OWNER_MAX}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="Ví dụ: Anh Tuấn"
                className="input-brutal"
              />
              <div className="text-right font-mono text-[10px] uppercase tracking-wider text-[var(--text-3)]">
                {ownerName.length}/{OWNER_MAX}
              </div>
            </div>
          </div>
        </details>

        {/* Section 2: Initiatives */}
        <details open className="border-2 border-[var(--ink)] bg-[var(--bg)]">
          <summary className="cursor-pointer bg-[var(--bg-muted)] px-3 py-2 font-display text-sm font-bold uppercase tracking-wider text-[var(--ink)]">
            2. Hành động cụ thể (tối đa {LIMITS.MAX_INITIATIVES_PER_HOSHIN})
          </summary>
          <div className="flex flex-col gap-3 p-3">
            {initiatives.length === 0 && (
              <p className="field-hint italic">
                Chưa có hành động nào. Thêm tối đa{' '}
                {LIMITS.MAX_INITIATIVES_PER_HOSHIN} hành động.
              </p>
            )}
            {initiatives.map((init, idx) => (
              <div
                key={init.id}
                className="flex flex-col gap-2 border-2 border-[var(--ink)] bg-[var(--bg)] p-2 sm:flex-row sm:items-end"
              >
                <div className="flex-1">
                  <label
                    htmlFor={`init-${idx}-title`}
                    className="field-label text-[11px]"
                  >
                    Tên hành động #{idx + 1}
                  </label>
                  <input
                    id={`init-${idx}-title`}
                    type="text"
                    value={init.title}
                    onChange={(e) =>
                      updateInitiative(idx, { title: e.target.value })
                    }
                    placeholder="Ví dụ: Triển khai NPS survey hàng tháng"
                    className="input-brutal"
                  />
                </div>
                <div className="sm:w-32">
                  <label
                    htmlFor={`init-${idx}-tf`}
                    className="field-label text-[11px]"
                  >
                    Thời gian
                  </label>
                  <select
                    id={`init-${idx}-tf`}
                    value={init.timeframe}
                    onChange={(e) =>
                      updateInitiative(idx, {
                        timeframe: e.target.value as '30d' | '60d' | '90d',
                      })
                    }
                    className="input-brutal"
                  >
                    <option value="30d">30 ngày</option>
                    <option value="60d">60 ngày</option>
                    <option value="90d">90 ngày</option>
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => removeInitiative(idx)}
                  aria-label={`Xóa hành động ${idx + 1}`}
                  className="self-end border-2 border-[var(--ink)] bg-[var(--bg)] px-3 py-2 font-mono text-sm hover:bg-[var(--brand)] hover:text-white"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addInitiative}
              disabled={initFull}
              className="btn-brutal-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              + Thêm hành động
            </button>
          </div>
        </details>

        {/* Section 3: KPIs */}
        <details open className="border-2 border-[var(--ink)] bg-[var(--bg)]">
          <summary className="cursor-pointer bg-[var(--bg-muted)] px-3 py-2 font-display text-sm font-bold uppercase tracking-wider text-[var(--ink)]">
            3. KPIs đo lường (tối đa {LIMITS.MAX_KPIS_PER_HOSHIN})
          </summary>
          <div className="flex flex-col gap-3 p-3">
            {kpis.length === 0 && (
              <p className="field-hint italic">
                Chưa có KPI nào. Thêm tối đa {LIMITS.MAX_KPIS_PER_HOSHIN} KPI để
                đo lường tiến độ.
              </p>
            )}
            {kpis.map((kpi, idx) => (
              <div
                key={kpi.id}
                className="flex flex-col gap-2 border-2 border-[var(--ink)] bg-[var(--bg)] p-2"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                  <div className="flex-1">
                    <label
                      htmlFor={`kpi-${idx}-name`}
                      className="field-label text-[11px]"
                    >
                      Tên KPI #{idx + 1}
                    </label>
                    <input
                      id={`kpi-${idx}-name`}
                      type="text"
                      value={kpi.name}
                      onChange={(e) => updateKpi(idx, { name: e.target.value })}
                      placeholder="Ví dụ: Tỷ lệ giữ chân"
                      className="input-brutal"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeKpi(idx)}
                    aria-label={`Xóa KPI ${idx + 1}`}
                    className="self-end border-2 border-[var(--ink)] bg-[var(--bg)] px-3 py-2 font-mono text-sm hover:bg-[var(--brand)] hover:text-white"
                  >
                    ✕
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <div>
                    <label
                      htmlFor={`kpi-${idx}-target`}
                      className="field-label text-[11px]"
                    >
                      Mục tiêu
                    </label>
                    <input
                      id={`kpi-${idx}-target`}
                      type="number"
                      value={Number.isFinite(kpi.targetValue) ? kpi.targetValue : 0}
                      onChange={(e) =>
                        updateKpi(idx, {
                          targetValue: e.target.value === '' ? 0 : Number(e.target.value),
                        })
                      }
                      placeholder="85"
                      className="input-brutal"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor={`kpi-${idx}-unit`}
                      className="field-label text-[11px]"
                    >
                      Đơn vị
                    </label>
                    <input
                      id={`kpi-${idx}-unit`}
                      type="text"
                      value={kpi.unit}
                      onChange={(e) => updateKpi(idx, { unit: e.target.value })}
                      placeholder="%, triệu, người"
                      className="input-brutal"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor={`kpi-${idx}-freq`}
                      className="field-label text-[11px]"
                    >
                      Tần suất
                    </label>
                    <select
                      id={`kpi-${idx}-freq`}
                      value={kpi.frequency}
                      onChange={(e) =>
                        updateKpi(idx, {
                          frequency: e.target.value as 'weekly' | 'monthly',
                        })
                      }
                      className="input-brutal"
                    >
                      <option value="weekly">Hàng tuần</option>
                      <option value="monthly">Hàng tháng</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addKpi}
              disabled={kpiFull}
              className="btn-brutal-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              + Thêm KPI
            </button>
          </div>
        </details>
      </div>
    </EditModalShell>
  )
}
