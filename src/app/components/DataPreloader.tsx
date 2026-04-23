"use client"
import { useEffect } from 'react'

const CRITICAL_URLS = [
  '/api/forecast?series=TTLCONS',
  '/api/signals',
  '/api/federal',
  '/api/obs?series=TTLCONS&n=12',
]

export function DataPreloader() {
  useEffect(() => {
    if ('serviceWorker' in navigator && navigator.onLine) {
      CRITICAL_URLS.forEach(url => {
        fetch(url).catch(() => {})
      })
    }

    // Register push-specific service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw-push.js', { scope: '/' })
        .catch(err => console.warn('[sw-push] registration failed:', err))
    }
  }, [])
  return null
}
