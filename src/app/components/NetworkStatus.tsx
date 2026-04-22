"use client"
import { useState, useEffect } from 'react'
import { color, font } from '@/lib/theme'

export function NetworkStatus() {
  const [online, setOnline] = useState(true)

  useEffect(() => {
    setOnline(navigator.onLine)
    const onOnline  = () => setOnline(true)
    const onOffline = () => setOnline(false)
    window.addEventListener('online',  onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online',  onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  if (online) return null

  return (
    <div style={{
      position:    'fixed',
      top:         0,
      left:        0,
      right:       0,
      background:  color.amber,
      color:       '#000',
      fontFamily:  font.sys,
      fontSize:    13,
      fontWeight:  600,
      textAlign:   'center',
      padding:     '8px 16px',
      paddingTop:  'calc(8px + env(safe-area-inset-top, 0px))',
      zIndex:      999,
    }}>
      Offline — showing cached data
    </div>
  )
}
