#!/usr/bin/env node
/**
 * launch:check — orchestrator for the launch-readiness gates.
 *
 * Runs Gate 5 (build / lint / unit tests) by default. With
 * --include-smoke, also runs Gate 4 (smoke:prod + smoke:www) and
 * fails if either fails. Prints Gates 1–3 as a manual checklist
 * because they require human verification (DNS provider, Vercel
 * UI, environment variables, data-source decisions).
 *
 * Designed to be safe to run locally even without outbound network:
 * the smoke phase is opt-in and produces a clear "skipped" line
 * rather than a failure when omitted.
 *
 * Usage:
 *   npm run launch:check                  # build + lint + test, manual gates printed
 *   npm run launch:check -- --include-smoke
 *   node scripts/launch-check.mjs --include-smoke
 *   node scripts/launch-check.mjs --skip-build  # in case you just ran it
 */

import { spawn } from 'node:child_process'

const args        = process.argv.slice(2)
const INCLUDE_SMOKE = args.includes('--include-smoke')
const SKIP_BUILD    = args.includes('--skip-build')
const SKIP_LINT     = args.includes('--skip-lint')
const SKIP_TEST     = args.includes('--skip-test')

// ── Helpers ────────────────────────────────────────────────────────

function header(text) {
  const bar = '─'.repeat(text.length)
  console.log(`\n${text}\n${bar}`)
}

function run(cmd, argv, label) {
  return new Promise((resolve) => {
    const start = Date.now()
    process.stdout.write(`\n→ ${label}  (${cmd} ${argv.join(' ')})\n`)
    const child = spawn(cmd, argv, {
      stdio: 'inherit',
      shell: process.platform === 'win32',
    })
    child.on('exit', (code) => {
      const ms = Date.now() - start
      const ok = code === 0
      console.log(`\n${ok ? '✓' : '✗'} ${label}  (${(ms / 1000).toFixed(1)}s, exit ${code})`)
      resolve({ ok, code })
    })
    child.on('error', (err) => {
      console.error(`✗ ${label}: ${err.message}`)
      resolve({ ok: false, code: 1 })
    })
  })
}

// ── Step list ──────────────────────────────────────────────────────

const required = []  // { label, ok }
const optional = []  // smoke phase

async function gate5() {
  header('Gate 5 — build / lint / unit tests')

  if (SKIP_BUILD) {
    console.log('— skipped: --skip-build')
  } else {
    const r = await run('npm', ['run', 'build'], 'npm run build')
    required.push({ label: 'build', ok: r.ok })
  }

  if (SKIP_LINT) {
    console.log('— skipped: --skip-lint')
  } else {
    const r = await run('npm', ['run', 'lint'], 'npm run lint')
    required.push({ label: 'lint', ok: r.ok })
  }

  if (SKIP_TEST) {
    console.log('— skipped: --skip-test')
  } else {
    const r = await run('npm', ['test', '--silent'], 'npm test')
    required.push({ label: 'unit tests', ok: r.ok })
  }
}

async function gate4() {
  header('Gate 4 — production smoke (--include-smoke)')

  if (!INCLUDE_SMOKE) {
    console.log(
      '— skipped: not running production smoke without --include-smoke.\n' +
      '            sandboxed CI may not have outbound network to constructaiq.trade.\n' +
      '            Run from a connected workstation:  npm run launch:check -- --include-smoke',
    )
    return
  }

  const prod = await run('npm', ['run', 'smoke:prod'], 'npm run smoke:prod')
  optional.push({ label: 'smoke:prod', ok: prod.ok })

  const www = await run('npm', ['run', 'smoke:www'], 'npm run smoke:www')
  optional.push({ label: 'smoke:www', ok: www.ok })
}

function manualGates() {
  header('Gates 1–3 — manual verification')
  console.log(
    [
      'These cannot be fully automated; check each box in',
      'docs/LAUNCH_CHECKLIST.md against your live environment.',
      '',
      '  1. Domain / DNS',
      '       constructaiq.trade resolves and serves the app.',
      '       www.constructaiq.trade resolves and 30x-redirects to apex.',
      '       Other subdomain behavior is documented (or absent).',
      '',
      '  2. Environment variables (Vercel Production)',
      '       NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,',
      '       SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY, CRON_SECRET.',
      '       Optional: UPSTASH_*, SENTRY_*, data-source keys.',
      '       Verify  curl /api/status | jq  for current configured state.',
      '',
      '  3. Data integrity',
      '       /api/federal  →  dataSource: "usaspending.gov" with',
      '                        contractors and agencies non-empty;',
      '                        any "static-fallback" carries fetchError.',
      '       /api/weekly-brief  →  source="ai", live=true after first run.',
      '       /api/dashboard  →  npm run smoke:prod schema check.',
    ].join('\n'),
  )
}

// ── Main ───────────────────────────────────────────────────────────

;(async () => {
  console.log('\nConstructAIQ launch readiness — running automatable gates')
  console.log('See docs/LAUNCH_CHECKLIST.md for the full walkthrough.')

  await gate5()
  await gate4()
  manualGates()

  // ── Summary ─────────────────────────────────────────────────────
  header('Summary')
  for (const r of required) {
    console.log(`  ${r.ok ? '✓' : '✗'}  ${r.label}`)
  }
  for (const r of optional) {
    console.log(`  ${r.ok ? '✓' : '✗'}  ${r.label}`)
  }
  if (!INCLUDE_SMOKE) {
    console.log('  •  smoke:prod / smoke:www not run (use --include-smoke)')
  }

  const failedRequired = required.filter(r => !r.ok)
  const failedOptional = optional.filter(r => !r.ok)

  if (failedRequired.length > 0) {
    console.error(
      `\n✗ Launch readiness FAILED — required gates: ${failedRequired.map(r => r.label).join(', ')}\n`,
    )
    process.exit(1)
  }
  if (INCLUDE_SMOKE && failedOptional.length > 0) {
    console.error(
      `\n✗ Launch readiness FAILED — smoke gates: ${failedOptional.map(r => r.label).join(', ')}\n`,
    )
    process.exit(1)
  }

  console.log(
    '\n✓ Automatable gates passed. ' +
    'Walk through docs/LAUNCH_CHECKLIST.md Gates 1–3 to sign off.\n',
  )
  process.exit(0)
})()
