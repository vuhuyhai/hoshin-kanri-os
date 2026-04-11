'use client'

import { useState } from 'react'
import {
  LayoutDashboard, Rocket, ScanLine, Compass, Grid2x2,
  BarChart3, FileText, HelpCircle, Shield, ChevronDown, ChevronUp,
} from 'lucide-react'
import { HELP_SECTIONS, type HelpSectionId, type HelpCard } from './help-data'

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard, Rocket, ScanLine, Compass, Grid2x2,
  BarChart3, FileText, HelpCircle, Shield,
}

const CARD_VARIANTS = {
  default: 'bg-white border-2 border-[var(--color-ink)]',
  accent:  'bg-white border-2 border-[var(--color-ink)] border-l-4 border-l-[var(--color-accent-brand)]',
  warning: 'bg-[#fffbe6] border-2 border-[#E6A817]',
  success: 'bg-[#f0fff4] border-2 border-[#2e8b57]',
} as const

function CardItem({ card }: { card: HelpCard }) {
  return (
    <div className={`${CARD_VARIANTS[card.variant]} p-4 mb-3 shadow-[3px_3px_0_var(--color-ink)]`}>
      {card.title && (
        <p className="font-semibold text-sm uppercase tracking-wide text-[var(--color-ink)] mb-2 font-display">
          {card.title}
        </p>
      )}
      <div
        className="text-sm leading-relaxed text-[var(--color-ink)] font-body"
        dangerouslySetInnerHTML={{ __html: card.body }}
      />
      {card.steps && (
        <ol className="mt-3 space-y-2">
          {card.steps.map((step, i) => (
            <li key={i} className="flex gap-3 items-start">
              <span className="min-w-[22px] h-[22px] bg-[var(--color-accent-brand)] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {i + 1}
              </span>
              <span
                className="text-sm leading-relaxed font-body"
                dangerouslySetInnerHTML={{ __html: step.text }}
              />
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

interface HelpPageClientProps {
  isSuperAdmin: boolean
}

export default function HelpPageClient({ isSuperAdmin }: HelpPageClientProps) {
  const [activeSection, setActiveSection] = useState<HelpSectionId>('overview')
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null)
  const visibleSections = HELP_SECTIONS.filter(
    (s) => !s.superAdminOnly || isSuperAdmin
  )
  const currentSection = visibleSections.find(s => s.id === activeSection)!

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <h1 className="font-display text-2xl font-black uppercase tracking-tight text-[var(--color-ink)]">
          Hướng dẫn sử dụng
        </h1>
        <span className="badge-brutal border-[var(--color-ink)] border-2 text-[var(--color-text-3)] text-[10px] px-2 py-0.5">
          v1.0
        </span>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Desktop tab navigation */}
        <div className="hidden md:flex flex-col gap-1 w-52 flex-shrink-0">
          {visibleSections.map(s => {
            const Icon = ICON_MAP[s.icon]
            const isActive = s.id === activeSection
            return (
              <button
                key={s.id}
                onClick={() => { setActiveSection(s.id); setOpenFaqIndex(null) }}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold uppercase tracking-wide border-2 border-[var(--color-ink)] cursor-pointer transition-colors text-left font-display ${
                  isActive
                    ? 'bg-[var(--color-accent-brand)] text-white shadow-[3px_3px_0_var(--color-ink)]'
                    : 'bg-white hover:bg-[var(--color-bg-muted-warm)]'
                }`}
              >
                {Icon && <Icon size={16} className="flex-shrink-0" />}
                <span>{s.label}</span>
                {s.superAdminOnly && (
                  <span className="ml-auto text-[10px] font-bold uppercase tracking-wide bg-[var(--color-ink)] text-white px-1 py-0.5 leading-none">
                    SA
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Mobile select dropdown */}
        <select
          value={activeSection}
          onChange={e => { setActiveSection(e.target.value as HelpSectionId); setOpenFaqIndex(null) }}
          className="w-full border-2 border-[var(--color-ink)] px-3 py-2 text-sm font-semibold uppercase bg-white focus:outline-none mb-4 md:hidden font-display"
        >
          {visibleSections.map(s => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>

        {/* Content area */}
        <div className="flex-1 min-w-0">
          <div className="border-b-2 border-[var(--color-ink)] pb-3 mb-5">
            <h2 className="font-display text-xl font-bold uppercase tracking-tight text-[var(--color-ink)]">
              {currentSection.title}
            </h2>
            {currentSection.subtitle && (
              <p className="text-sm text-[var(--color-text-2)] mt-1 font-body">
                {currentSection.subtitle}
              </p>
            )}
          </div>

          {/* Cards */}
          {currentSection.cards.map((card, i) => (
            <CardItem key={i} card={card} />
          ))}

          {/* FAQ accordion */}
          {currentSection.faqs?.map((faq, i) => (
            <div
              key={i}
              className="border-b-2 border-[var(--color-bg-muted-warm)] py-3 cursor-pointer"
              onClick={() => setOpenFaqIndex(openFaqIndex === i ? null : i)}
            >
              <div className="flex justify-between items-center gap-3">
                <p className="font-semibold text-sm text-[var(--color-ink)] font-display">{faq.question}</p>
                {openFaqIndex === i
                  ? <ChevronUp size={16} className="text-[var(--color-accent-brand)] flex-shrink-0" />
                  : <ChevronDown size={16} className="text-[var(--color-text-3)] flex-shrink-0" />}
              </div>
              {openFaqIndex === i && (
                <div
                  className="mt-2 text-sm text-[var(--color-text-2)] leading-relaxed font-body"
                  dangerouslySetInnerHTML={{ __html: faq.answer }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
