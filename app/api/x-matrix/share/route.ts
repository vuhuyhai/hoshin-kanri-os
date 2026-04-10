import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')

    if (!slug) {
      return NextResponse.json({ error: 'Missing slug' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: xMatrix, error } = await supabase
      .from('x_matrices')
      .select('id, year, title, vision_json, status, organizations(name, industry)')
      .eq('id', slug)
      .eq('status', 'active')
      .single()

    if (error || !xMatrix) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ xMatrix })
  } catch (error) {
    console.error('Share error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
