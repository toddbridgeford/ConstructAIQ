'use client'
import { KPICard } from '@/app/components/ui/KPICard'
import { Skeleton } from '@/app/components/Skeleton'
import { fmtB, fmtK } from '@/lib/theme'

interface KpiRowProps {
  spendVal:    number
  spendMom:    number
  spendSpark:  number[]
  empVal:      number
  empMom:      number
  empSpark:    number[]
  permitSpark: number[]
  houstSpark:  number[]
  sigCount:    number
  loading:     boolean
}

export function KpiRow({
  spendVal, spendMom, spendSpark,
  empVal, empMom, empSpark,
  permitSpark, houstSpark,
  sigCount, loading,
}: KpiRowProps) {
  if (loading) {
    return (
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 20 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} height={120} style={{ flex: '1 1 160px' }} borderRadius={12} />
        ))}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 20 }}>
      <KPICard
        label="Total Construction Spend"
        value={fmtB(spendVal)}
        change={spendMom}
        changeLabel="MoM"
        spark={spendSpark}
      />
      <KPICard
        label="Permit Volume (units)"
        value="1,482K/yr"
        change={2.8}
        changeLabel="MoM"
        spark={permitSpark}
      />
      <KPICard
        label="Permit Value ($)"
        value="$48.2B"
        change={3.1}
        changeLabel="MoM"
        spark={houstSpark}
      />
      <KPICard
        label="Construction Employment"
        value={`${fmtK(empVal)}M`}
        change={empMom}
        changeLabel="MoM"
        spark={empSpark}
      />
      <KPICard
        label="Materials Cost Index"
        value="318.4"
        change={1.2}
        changeLabel="MoM"
        spark={Array(12).fill(318)}
      />
      <KPICard
        label="Active AI Signals"
        value={String(sigCount || 6)}
        spark={Array(12).fill(sigCount || 6)}
      />
    </div>
  )
}
