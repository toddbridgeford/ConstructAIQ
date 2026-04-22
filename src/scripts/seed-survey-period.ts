import 'dotenv/config'
import { supabaseAdmin } from '../lib/supabase'

async function main() {
  const { error } = await supabaseAdmin
    .from('survey_periods')
    .upsert(
      {
        quarter:   'Q2 2025',
        opens_at:  '2025-04-01T00:00:00Z',
        closes_at: '2025-05-21T23:59:59Z',
        is_active: true,
      },
      { onConflict: 'quarter' },
    )

  if (error) {
    console.error('Seed failed:', error.message)
    process.exit(1)
  }
  console.log('Done — survey period Q2 2025 seeded.')
}

main()
