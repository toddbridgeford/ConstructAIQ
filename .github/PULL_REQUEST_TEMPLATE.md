## What this PR does

<!-- One sentence summary -->

## Type of change

- [ ] Bug fix
- [ ] New feature
- [ ] Data/schema change
- [ ] Configuration / infrastructure
- [ ] Documentation

## Checklist

- [ ] `npx tsc --noEmit` passes (0 errors)
- [ ] `npm test` passes (all tests green)
- [ ] `npm run lint` passes (0 warnings)
- [ ] No synthetic/hardcoded fallback data added
- [ ] If schema changed: new migration file added to supabase/migrations/
- [ ] If new API route: documented in src/app/api/README.md
- [ ] If new env var: added to .env.example with description

## Data impact

<!-- If this PR changes what data is fetched, stored, or displayed,
     describe the impact on existing Supabase data -->

## Cron impact

<!-- If this adds or changes a cron job, confirm:
     - It is in data-refresh.yml (GitHub Actions)
     - maxDuration = 10 (Hobby limit)
     - Batch pagination if processing many rows -->
