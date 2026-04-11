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
  name, description, elements, selectedElements, onToggle, focusNote,
}: FrameworkElementSelectorProps) {
  const count = selectedElements.length

  return (
    <div className="border-2 border-black bg-white p-4 shadow-[3px_3px_0px_#000]">
      <div className="flex items-center justify-between mb-1">
        <span className="font-display font-bold text-sm">{name}</span>
        <span className={`text-xs font-mono px-1.5 py-0.5 border-2 ${
          count > 0
            ? 'border-black bg-black text-white'
            : 'border-black/30 text-muted-foreground'
        }`}>
          {count}/{elements.length}
        </span>
      </div>
      <p className="text-xs text-muted-foreground mb-3">{description}</p>
      <div className="flex flex-wrap gap-1.5">
        {elements.map((el) => {
          const isSelected = selectedElements.includes(el)
          return (
            <button
              key={el}
              type="button"
              onClick={() => onToggle(el)}
              className={`text-xs px-2.5 py-1 border-2 transition-all cursor-pointer ${
                isSelected
                  ? 'border-black bg-black text-white'
                  : 'border-gray-300 bg-white text-gray-600 hover:border-black hover:bg-gray-100'
              }`}
            >
              {el}
            </button>
          )
        })}
      </div>
      <p className="text-[10px] mt-3 italic text-muted-foreground/70">
        {focusNote}
      </p>
    </div>
  )
}
