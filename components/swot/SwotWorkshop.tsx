'use client'

import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { ArrowRight, MessageSquare, Layers } from 'lucide-react'
import { nanoid } from 'nanoid'
import { useSwotStore } from '@/lib/swot/swot-session-store'
import { SwotIngredientPanel } from './SwotIngredientPanel'
import { SwotItemEvidenceDrawer } from './SwotItemEvidenceDrawer'
import { SwotWorkshopChat } from './SwotWorkshopChat'
import { postJson } from '@/lib/http/fetch-json'
import type { SwotIngredient, SwotQuadrant } from '@/lib/swot/types'
import type {
  SwotContextInput,
  SwotDraft,
  SwotDraftItem,
} from '@/lib/swot/coaching-types'

interface SwotWorkshopProps {
  analysisId: string
  orgId: string
  onComplete: () => void
}

type Tab = 'chat' | 'panel'

function toIngredient(item: SwotDraftItem, quadrant: SwotQuadrant): SwotIngredient {
  return {
    id: nanoid(),
    quadrant,
    statement: item.statement,
    source: 'ai_draft',
    evidence: [],
    isSearching: false,
    selected: false,
  }
}

export function SwotWorkshop({ orgId, onComplete }: SwotWorkshopProps) {
  const ingredients = useSwotStore((s) => s.ingredients)
  const contextData = useSwotStore((s) => s.contextData)
  const setIngredients = useSwotStore((s) => s.setIngredients)
  const addIngredient = useSwotStore((s) => s.addIngredient)
  const setWorkshopStep = useSwotStore((s) => s.setWorkshopStep)
  const activeEvidenceItemId = useSwotStore((s) => s.activeEvidenceItemId)
  const setActiveEvidenceItemId = useSwotStore((s) => s.setActiveEvidenceItemId)

  const [tab, setTab] = useState<Tab>('chat')
  const [isDrafting, setIsDrafting] = useState(false)
  const draftedRef = useRef(false)

  const generateDraft = async () => {
    if (!contextData) return
    setIsDrafting(true)
    try {
      const input: SwotContextInput = {
        orgName: 'Doanh nghiệp',
        city: contextData.mainMarket,
        industry: contextData.industry,
        headcount: contextData.headcount,
        topChallenges: contextData.topChallenges,
        currentStrengths: contextData.competitiveAdvantage,
        breakthroughGoal: contextData.yearGoal,
        selectedFrameworks: ['8Ms', '5Forces', 'PESTEL'],
      }
      const draft = await postJson<SwotDraft>(
        '/api/swot/coaching-draft',
        input as unknown as Record<string, unknown>,
      )
      setIngredients([
        ...draft.strengths.map((i) => toIngredient(i, 'S')),
        ...draft.weaknesses.map((i) => toIngredient(i, 'W')),
        ...draft.opportunities.map((i) => toIngredient(i, 'O')),
        ...draft.threats.map((i) => toIngredient(i, 'T')),
      ])
      toast.success('AI đã tạo bản nháp SWOT')
    } catch {
      toast.error('Không thể tạo bản nháp. Hãy tự thêm nguyên liệu.')
    } finally {
      setIsDrafting(false)
    }
  }

  useEffect(() => {
    if (draftedRef.current || ingredients.length > 0 || !contextData) return
    draftedRef.current = true
    generateDraft()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleFinalize = () => {
    if (ingredients.length === 0) return
    setWorkshopStep('finalize')
    onComplete()
  }

  const handleChatAdd = (quadrant: SwotQuadrant, statement: string) => {
    addIngredient({ quadrant, statement, source: 'chat_extract' })
    toast.success('Đã thêm từ chat')
  }

  const canFinalize = ingredients.length > 0

  return (
    <div className="flex flex-col h-full min-h-0">
      <header className="flex items-center justify-between border-b-2 border-ink bg-white px-4 py-3">
        <h1 className="font-body font-black uppercase tracking-wider text-ink text-lg">
          Phân tích SWOT với AI
        </h1>
        <div className="relative group">
          <button
            type="button"
            onClick={handleFinalize}
            disabled={!canFinalize}
            className="inline-flex items-center gap-1 border-2 border-ink bg-accent-brand text-white font-body font-bold uppercase text-xs tracking-wider px-3 py-2 shadow-[3px_3px_0_#2C2B2B] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-[3px_3px_0_#2C2B2B] disabled:hover:translate-x-0 disabled:hover:translate-y-0 transition-all"
          >
            Hoàn thiện <ArrowRight className="w-3 h-3" />
          </button>
          {!canFinalize && (
            <div className="invisible group-hover:visible absolute -bottom-8 right-0 whitespace-nowrap bg-ink text-white text-[11px] px-2 py-1 border-2 border-ink">
              Cần có ít nhất 1 nguyên liệu
            </div>
          )}
        </div>
      </header>

      <div className="lg:hidden flex border-b-2 border-ink">
        {(['chat', 'panel'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 flex items-center justify-center gap-1 py-2 font-body font-bold uppercase text-xs tracking-wider transition-colors ${tab === t ? 'bg-ink text-white' : 'bg-bg-warm text-ink'}`}
          >
            {t === 'chat' ? <MessageSquare className="w-3 h-3" /> : <Layers className="w-3 h-3" />}
            {t === 'chat' ? 'Chat AI' : 'Nguyên liệu'}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 flex overflow-hidden">
        <div className={`min-h-0 lg:w-[45%] lg:flex lg:border-r-2 lg:border-ink ${tab === 'chat' ? 'flex w-full' : 'hidden'}`}>
          <SwotWorkshopChat orgId={orgId} onAddIngredient={handleChatAdd} />
        </div>
        <div className={`min-h-0 lg:w-[55%] lg:block overflow-y-auto p-4 ${tab === 'panel' ? 'block w-full' : 'hidden'}`}>
          {isDrafting && (
            <div className="mb-4 border-2 border-ink bg-bg-warm p-3 shadow-[3px_3px_0_#2C2B2B] font-display text-sm text-text-2 animate-pulse">
              AI đang tạo bản nháp SWOT...
            </div>
          )}
          <SwotIngredientPanel onEvidenceSearch={setActiveEvidenceItemId} />
        </div>
      </div>

      <SwotItemEvidenceDrawer
        ingredientId={activeEvidenceItemId}
        onClose={() => setActiveEvidenceItemId(null)}
      />
    </div>
  )
}
