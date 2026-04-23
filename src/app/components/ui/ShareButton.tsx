'use client'
import { useState } from 'react'
import { Share2 } from 'lucide-react'
import { color, font } from '@/lib/theme'

interface ShareButtonProps {
  section?: string
  title:    string
  url?:     string
}

export function ShareButton({ section, title, url: urlProp }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)

  async function handleShare() {
    const url = urlProp ?? `https://constructaiq.trade/dashboard#${section}`
    if (navigator.share) {
      try {
        await navigator.share({ title, url })
        return
      } catch {
        // user cancelled or not supported — fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard unavailable
    }
  }

  return (
    <button
      onClick={handleShare}
      title={copied ? 'Copied!' : `Share ${title}`}
      style={{
        display:     'inline-flex',
        alignItems:  'center',
        gap:         5,
        background:  copied ? color.green + '22' : 'transparent',
        border:      `1px solid ${copied ? color.green : color.bd1}`,
        borderRadius: 8,
        padding:     '5px 10px',
        cursor:      'pointer',
        fontFamily:  font.mono,
        fontSize:    11,
        color:       copied ? color.green : color.t4,
        minHeight:   32,
        transition:  'all 0.15s ease',
        flexShrink:  0,
      }}
    >
      <Share2 size={12} strokeWidth={2} />
      {copied ? 'Copied!' : 'Share'}
    </button>
  )
}
