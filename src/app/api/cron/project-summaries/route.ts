import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime     = 'nodejs'
export const dynamic     = 'force-dynamic'
export const maxDuration = 10

const BATCH_SIZE = 10

export async function GET(request: Request) {
  const auth = request.headers.get('authorization')
  const secret = process.env.CRON_SECRET ?? ''
  if (secret && auth !== `Bearer ${secret}`)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey)
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })

  const { data: projects, error } = await supabaseAdmin
    .from('projects')
    .select('id, project_name, building_class, valuation, sqft, city, state_code')
    .is('ai_summary', null)
    .gt('valuation', 0)
    .order('valuation', { ascending: false })
    .limit(BATCH_SIZE)

  if (error) {
    console.error('[project-summaries] fetch error:', error.message)
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
  }

  if (!projects?.length)
    return NextResponse.json({ ok: true, processed: 0, message: 'No projects pending summary' })

  const client = new Anthropic({ apiKey })
  let processed = 0
  let failed = 0

  for (const project of projects) {
    try {
      const prompt = `Write a single sentence describing this construction project. Be specific about size, type, and location. No preamble.
Project: ${project.project_name}, ${project.building_class}, $${Number(project.valuation).toLocaleString()}, ${project.sqft ? `${Number(project.sqft).toLocaleString()} sq ft, ` : ''}${project.city} ${project.state_code}.`

      const message = await client.messages.create({
        model:      'claude-haiku-4-5-20251001',
        max_tokens: 120,
        messages:   [{ role: 'user', content: prompt }],
      })

      const summary = message.content[0].type === 'text'
        ? message.content[0].text.trim()
        : null

      if (summary) {
        await supabaseAdmin
          .from('projects')
          .update({ ai_summary: summary, ai_generated_at: new Date().toISOString() })
          .eq('id', project.id)
        processed++
      }
    } catch (err) {
      console.error(`[project-summaries] failed for project ${project.id}:`, err)
      failed++
    }
  }

  return NextResponse.json({ ok: true, processed, failed, total_eligible: projects.length })
}
