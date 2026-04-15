export type TocItem = { level: 2 | 3; text: string; id: string }

export function slugifyHeading(text: string): string {
  const base = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
  return base || 'heading'
}

export function extractHeadings(content: string): TocItem[] {
  const lines = content.split('\n')
  const items: TocItem[] = []
  const seen = new Map<string, number>()
  let inCodeBlock = false

  for (const raw of lines) {
    const line = raw.trimEnd()
    if (/^```/.test(line)) {
      inCodeBlock = !inCodeBlock
      continue
    }
    if (inCodeBlock) continue

    const match = line.match(/^(#{2,3})\s+(.+?)\s*#*\s*$/)
    if (!match) continue

    const level = match[1].length as 2 | 3
    const text = match[2]
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/`(.+?)`/g, '$1')
      .replace(/\[(.+?)\]\([^)]*\)/g, '$1')
      .trim()
    if (!text) continue

    const baseId = slugifyHeading(text)
    const count = seen.get(baseId) ?? 0
    seen.set(baseId, count + 1)
    const id = count === 0 ? baseId : `${baseId}-${count}`
    items.push({ level, text, id })
  }

  return items
}

export function calcReadingMinutes(content: string): number {
  const plain = content
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]*`/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_~\-]/g, ' ')
  const words = plain.split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}
