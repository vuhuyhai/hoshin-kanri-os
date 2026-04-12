import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { findConceptById, HK_SYSTEM_PROMPT } from '@/lib/admin/hoshin-explorer-data'
import { AI_MODELS } from '@/lib/ai/models'

export interface HKExplorerContent {
  level1: string
  level2: string
  level3: string
  application_ladysfit: string
  application_consulting: string
  critical_point: string
  connections: string[]
}

export async function POST(request: NextRequest) {
  try {
    // Verify super admin
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()
    const { data: profile } = await admin
      .from('profiles' as 'organizations')
      .select('is_super_admin' as 'id')
      .eq('id' as 'id', user.id)
      .single()
    const isSuperAdmin = (profile as unknown as { is_super_admin: boolean } | null)?.is_super_admin === true
    if (!isSuperAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const { conceptId, conceptName, conceptKanji, conceptDesc, books, layer } = body as {
      conceptId: string; conceptName: string; conceptKanji: string
      conceptDesc: string; books: string; layer: string
    }

    if (!findConceptById(conceptId)) {
      return NextResponse.json({ error: 'Concept không tồn tại' }, { status: 400 })
    }

    const client = new Anthropic()
    const message = await client.messages.create({
      model: AI_MODELS.reasoning,
      max_tokens: 1500,
      system: HK_SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: `Giải thích khái niệm Hoshin Kanri: ${conceptName} (${conceptKanji})\nMô tả: ${conceptDesc}\nNguồn: ${books}\nTầng HK: ${layer}`,
      }],
    })

    const raw = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('')

    const clean = raw.replace(/```json|```/g, '').trim()
    const parsed: HKExplorerContent = JSON.parse(clean)

    return NextResponse.json(parsed)
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'AI trả về JSON không hợp lệ' }, { status: 422 })
    }
    console.error('[hoshin-explorer]', error)
    return NextResponse.json(
      { error: 'Không thể phân tích khái niệm. Vui lòng thử lại.' },
      { status: 500 },
    )
  }
}
