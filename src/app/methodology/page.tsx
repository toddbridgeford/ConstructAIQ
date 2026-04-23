'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { font, color } from '@/lib/theme'

const SECTIONS = [
  { id: 'overview',       label: 'Overview'            },
  { id: 'data-sources',   label: 'Data Sources'        },
  { id: 'forecast-model', label: 'Forecast Model'      },
  { id: 'satellite',      label: 'Satellite BSI'       },
  { id: 'city-permits',   label: 'City Permits'        },
  { id: 'federal',        label: 'Federal Pipeline'    },
  { id: 'leading-index',  label: 'Leading Indicators'  },
  { id: 'cost-benchmark', label: 'Cost Benchmarking'   },
  { id: 'nlq',            label: 'AI Query Engine'     },
  { id: 'accuracy',       label: 'Accuracy & Tracking' },
]

export default function MethodologyPage() {
  const [activeId, setActiveId] = useState('overview')

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) setActiveId(entry.target.id)
        })
      },
      { rootMargin: '-20% 0px -70% 0px' }
    )
    SECTIONS.forEach(s => {
      const el = document.getElementById(s.id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', color: '#111111' }}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0} a{color:inherit;text-decoration:none}`}</style>

      <div style={{
        maxWidth: 1100,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'row',
        gap: 48,
        padding: '48px 40px',
      }}>

        {/* Left nav */}
        <nav style={{
          width: 200,
          flexShrink: 0,
          position: 'sticky',
          top: 32,
          alignSelf: 'flex-start',
          height: 'fit-content',
        }}>
          <div style={{
            fontFamily: font.mono,
            fontSize: 10,
            color: '#888',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: 16,
          }}>
            Contents
          </div>

          {SECTIONS.map(s => (
            <a
              key={s.id}
              href={'#' + s.id}
              style={{
                display: 'block',
                padding: '6px 12px',
                borderRadius: 6,
                fontFamily: font.sys,
                fontSize: 14,
                textDecoration: 'none',
                marginBottom: 2,
                ...(activeId === s.id
                  ? {
                      background: '#f0f4ff',
                      color: '#0044cc',
                      fontWeight: 600,
                      borderLeft: '3px solid #0044cc',
                    }
                  : {
                      color: '#555',
                      fontWeight: 400,
                      borderLeft: '3px solid transparent',
                    }),
              }}
              onClick={e => {
                e.preventDefault()
                document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              {s.label}
            </a>
          ))}
        </nav>

        {/* Right content column */}
        <div style={{ flex: 1, maxWidth: 700 }}>
          {SECTIONS.map(s => (
            <section key={s.id} id={s.id} style={{ marginBottom: 64 }}>
              <h2 style={{
                fontFamily: font.sys,
                fontSize: 24,
                fontWeight: 700,
                color: '#111',
                marginBottom: 16,
                paddingBottom: 12,
                borderBottom: '2px solid #eee',
              }}>
                {s.label}
              </h2>
              <p style={{ fontFamily: font.sys, fontSize: 16, lineHeight: 1.8, color: '#333' }}>
                {/* Content goes in UI6-D */}
                Section content coming in next session.
              </p>
            </section>
          ))}
        </div>

      </div>
    </div>
  )
}
