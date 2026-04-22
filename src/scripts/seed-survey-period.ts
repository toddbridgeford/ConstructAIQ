import 'dotenv/config'
import { supabaseAdmin } from '../lib/supabase'

async function main() {
  const { error } = await supabaseAdmin
    .from('survey_periods')
    .upsert(
      {
        quarter:   '2025-Q2',
        opens_at:  '2025-04-21T00:00:00Z',
        closes_at: '2025-05-21T23:59:59Z',
        status:    'open',
      },
      { onConflict: 'quarter' },
    )

  if (error) {
    console.error('Seed failed:', error.message)
    process.exit(1)
  }
  console.log('Done — survey period 2025-Q2 seeded.')
}

main()
