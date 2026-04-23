"use client"
import { useState, useCallback, useEffect } from "react"
import { NationalPermitSummary } from "../components/NationalPermitSummary"
import { CityPermitMap, type PermitApiResponse } from "../components/CityPermitMap"
import { ProjectFeed, type Project } from "../components/ProjectFeed"
import { ProjectMap } from "../components/ProjectMap"
import { SectionHeader } from "../components/SectionHeader"
import { SectionVerdict } from "../components/SectionVerdict"
import { Skeleton } from "@/app/components/Skeleton"
import { color, font, radius } from "@/lib/theme"

interface BenchmarkSnippet {
  percentile:     number
  classification: string
  yoy_change_pct: number | null
}

const SYS  = font.sys
const MONO = font.mono

interface Props {
  data: PermitApiResponse | null
}

type TabKey = 'activity' | 'projects' | 'detail'

interface ProjectsApiResponse {
  projects: Project[]
  total:    number
}

const TABS: { key: TabKey; label: string }[] = [
  { key: 'activity', label: 'Permit Activity' },
  { key: 'projects', label: 'Active Projects' },
  { key: 'detail',   label: 'City Detail'     },
]

export function PermitsSection({ data }: Props) {
  const [selectedCity, setSelectedCity] = useState<string | null>(null)
  const [activeTab, setActiveTab]         = useState<TabKey>('activity')
  const [projectsData, setProjectsData]   = useState<ProjectsApiResponse | null>(null)
  const [projectsLoaded, setProjectsLoaded] = useState(false)
  const [projectsLoading, setProjectsLoading] = useState(false)
  const [projectView, setProjectView]     = useState<'list' | 'map'>('list')
  const [permitBench, setPermitBench]     = useState<BenchmarkSnippet | null>(null)

  useEffect(() => {
    const latestCount = data?.national_total?.latest_month_count
    if (!latestCount) return
    fetch(`/api/benchmark?series=PERMIT&value=${latestCount}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d && !d.error) setPermitBench(d) })
      .catch(() => {})
  }, [data?.national_total?.latest_month_count])

  const handleTabChange = useCallback((tab: TabKey) => {
    setActiveTab(tab)
    if (tab === 'projects' && !projectsLoaded && !projectsLoading) {
      setProjectsLoading(true)
      fetch('/api/projects?limit=50&sort=valuation&min_value=1000000')
        .then(r => r.json())
        .then((d: ProjectsApiResponse) => {
          setProjectsData(d)
          setProjectsLoaded(true)
        })
        .catch(() => { setProjectsLoaded(true) })
        .finally(() => setProjectsLoading(false))
    }
  }, [projectsLoaded, projectsLoading])

  return (
    <section id="permits" style={{ paddingTop: 48, paddingBottom: 8 }}>
      <SectionHeader
        sectionId="06"
        title="City Permit Intelligence"
        subtitle="Building permit activity across 40 major US cities"
        badge="40 CITIES"
        live
      />

      {/* Tab bar */}
      <div style={{
        display: 'flex',
        gap: 2,
        marginBottom: 24,
        borderBottom: `1px solid ${color.bd1}`,
        paddingBottom: 0,
      }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => handleTabChange(t.key)}
            style={{
              fontFamily:    SYS,
              fontSize:      13,
              fontWeight:    activeTab === t.key ? 600 : 400,
              color:         activeTab === t.key ? color.t1 : color.t4,
              background:    'transparent',
              border:        'none',
              borderBottom:  activeTab === t.key ? `2px solid ${color.blue}` : '2px solid transparent',
              padding:       '8px 16px',
              cursor:        'pointer',
              marginBottom:  -1,
              transition:    'color 0.15s, border-color 0.15s',
              minHeight:     40,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Permit Activity */}
      {activeTab === 'activity' && (
        !data ? (
          <Skeleton height={480} borderRadius={16} />
        ) : (
          <>
            <NationalPermitSummary national={data.national_total} />
            {permitBench && (() => {
              const yoy = data.national_total?.yoy_change_pct ?? permitBench.yoy_change_pct
              const pipeline = (yoy ?? 0) > 3 ? 'Expanding'
                : (yoy ?? 0) < -3 ? 'Contracting' : 'Stable'
              return (
                <SectionVerdict
                  text={`Current permit issuance is at the ${permitBench.percentile}th percentile of the historical range. ${pipeline} construction pipeline.`}
                />
              )
            })()}
            <div style={{ marginTop: 20 }}>
              <CityPermitMap
                data={data}
                selectedCity={selectedCity}
                onCitySelect={setSelectedCity}
              />
            </div>
          </>
        )
      )}

      {/* Tab 2: Active Projects */}
      {activeTab === 'projects' && (
        <div>
          {/* Map / List toggle */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 16,
          }}>
            <div style={{ fontFamily: MONO, fontSize: 11, color: color.t4 }}>
              {projectsData ? `${projectsData.total.toLocaleString()} projects · $1M+ valuation` : ''}
            </div>
            <div style={{
              display: 'flex',
              gap: 2,
              background: color.bg2,
              borderRadius: radius.md,
              padding: 3,
            }}>
              {(['list', 'map'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setProjectView(v)}
                  style={{
                    fontFamily:   MONO,
                    fontSize:     11,
                    fontWeight:   600,
                    letterSpacing:'0.06em',
                    padding:      '5px 14px',
                    borderRadius: radius.sm,
                    border:       'none',
                    background:   projectView === v ? color.bg4 : 'transparent',
                    color:        projectView === v ? color.t1 : color.t4,
                    cursor:       'pointer',
                    minHeight:    32,
                    transition:   'all 0.15s',
                  }}
                >
                  {v === 'list' ? 'List View' : 'Map View'}
                </button>
              ))}
            </div>
          </div>

          {projectView === 'list' ? (
            <ProjectFeed
              projects={projectsData?.projects ?? null}
              total={projectsData?.total}
              loading={projectsLoading || (!projectsLoaded)}
            />
          ) : (
            <ProjectMap projects={projectsData?.projects ?? null} />
          )}
        </div>
      )}

      {/* Tab 3: City Detail — full-width CityPermitMap */}
      {activeTab === 'detail' && (
        !data ? (
          <Skeleton height={480} borderRadius={16} />
        ) : (
          <CityPermitMap
            data={data}
            selectedCity={selectedCity}
            onCitySelect={setSelectedCity}
          />
        )
      )}
    </section>
  )
}
