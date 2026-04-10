import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  generateCellStrategies,
  synthesizeHoshinCandidates,
  type OrgContext,
} from '@/lib/ai/swot-strategy'
import type {
  ExtendedCellType,
  SwotItem,
} from '@/lib/swot/swot-session-store'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { action } = body as { action: string }

    if (action === 'generate_cell') {
      const { cellType, strengths, weaknesses, opportunities, threats, orgContext } =
        body as {
          cellType: ExtendedCellType
          strengths: SwotItem[]
          weaknesses: SwotItem[]
          opportunities: SwotItem[]
          threats: SwotItem[]
          orgContext: OrgContext
        }

      const strategies = await generateCellStrategies(
        cellType,
        strengths ?? [],
        weaknesses ?? [],
        opportunities ?? [],
        threats ?? [],
        orgContext
      )
      return NextResponse.json({ strategies })
    }

    if (action === 'synthesize_candidates') {
      const { selectedStrategies, allSwotItems, orgContext } = body as {
        selectedStrategies: { SO: string; ST: string; WO: string; WT: string }
        allSwotItems: SwotItem[]
        orgContext: OrgContext
      }

      const candidates = await synthesizeHoshinCandidates(
        selectedStrategies,
        allSwotItems,
        orgContext
      )
      return NextResponse.json({ candidates })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    console.error('[swot/strategy] error:', error)
    const message =
      error instanceof Error ? error.message : 'Không thể xử lý yêu cầu'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
