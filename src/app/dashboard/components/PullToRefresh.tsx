"use client"
import { useState, useRef, useCallback } from 'react'
import { color } from '@/lib/theme'

interface Props {
  onRefresh: () => Promise<void>
  children: React.ReactNode
}

const THRESHOLD = 72

export function PullToRefresh({ onRefresh, children }: Props) {
  const [pulling,    setPulling]    = useState(false)
  const [distance,   setDistance]   = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const startY = useRef(0)

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY
      setPulling(true)
    }
  }, [])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!pulling) return
    const delta = Math.max(0, e.touches[0].clientY - startY.current)
    setDistance(Math.min(delta * 0.5, THRESHOLD + 20))
  }, [pulling])

  const onTouchEnd = useCallback(async () => {
    if (!pulling) return
    setPulling(false)

    if (distance >= THRESHOLD) {
      setRefreshing(true)
      setDistance(THRESHOLD)
      await onRefresh()
      setRefreshing(false)
    }

    setDistance(0)
  }, [pulling, distance, onRefresh])

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {(pulling || refreshing) && distance > 10 && (
        <div style={{
          height:         distance,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          overflow:       'hidden',
          transition:     'height 0.2s',
        }}>
          <div style={{
            width:           24,
            height:          24,
            borderRadius:    '50%',
            border:          `2px solid ${color.amber}`,
            borderTopColor:  'transparent',
            animation:       refreshing ? 'spin 0.8s linear infinite' : 'none',
            transform:       refreshing ? undefined : `rotate(${(distance / THRESHOLD) * 360}deg)`,
          }} />
        </div>
      )}
      {children}
    </div>
  )
}
