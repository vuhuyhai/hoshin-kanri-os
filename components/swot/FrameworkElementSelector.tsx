'use client'

interface FrameworkElementSelectorProps {
  name: string
  description: string
  elements: string[]
  selectedElements: string[]
  onToggle: (element: string) => void
  focusNote: string
}

export function FrameworkElementSelector({
  name,
  description,
  elements,
  selectedElements,
  onToggle,
  focusNote,
}: FrameworkElementSelectorProps) {
  const count = selectedElements.length

  return (
    <div
      className="border-2 border-ink bg-white p-4"
      style={{ boxShadow: '3px 3px 0 #2C2B2B' }}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="font-display font-bold text-sm text-ink">{name}</span>
        <span
          className={`text-xs font-mono px-1.5 py-0.5 border-2 border-ink ${
            count > 0 ? 'bg-ink text-white' : 'bg-white text-text-3'
          }`}
        >
          {count}/{elements.length}
        </span>
      </div>
      <p className="font-body text-xs text-text-3 mb-3">{description}</p>
      <div className="flex flex-wrap gap-1.5">
        {elements.map((el) => {
          const isSelected = selectedElements.includes(el)
          return (
            <button
              key={el}
              type="button"
              onClick={() => onToggle(el)}
              className={`font-display font-bold text-xs px-2.5 py-1 border-2 transition-colors cursor-pointer ${
                isSelected
                  ? 'border-ink bg-ink text-white'
                  : 'border-ink/30 bg-white text-text-2 hover:border-ink hover:bg-bg-warm'
              }`}
            >
              {el}
            </button>
          )
        })}
      </div>
      <p className="font-body text-[10px] mt-3 italic text-text-3/70">{focusNote}</p>
    </div>
  )
}
