'use client'
import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

interface GlobalErrorProps {
  error:  Error & { digest?: string }
  reset:  () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="en">
      <body style={{
        margin: 0, padding: 0,
        minHeight: '100vh',
        background: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        <div style={{ textAlign: 'center', padding: '40px 24px', maxWidth: 480 }}>
          <div style={{
            fontFamily: 'monospace',
            fontSize: 10,
            color: '#f5a623',
            letterSpacing: '0.12em',
            marginBottom: 16,
          }}>
            CONSTRUCTAIQ
          </div>
          <h2 style={{
            color: '#fff',
            fontSize: 22,
            fontWeight: 600,
            margin: '0 0 12px',
          }}>
            Something went wrong
          </h2>
          <p style={{
            color: '#a0a0ab',
            fontSize: 14,
            lineHeight: 1.6,
            margin: '0 0 12px',
          }}>
            A rendering error occurred. The error has been
            logged automatically. Please try again.
          </p>
          {process.env.NODE_ENV === 'production'
            ? error.digest && (
                <p style={{ fontFamily: 'monospace', fontSize: 11, color: '#555', margin: '0 0 16px' }}>
                  Ref: {error.digest}
                </p>
              )
            : (
                <p style={{ fontFamily: 'monospace', fontSize: 11, color: '#e07b54', margin: '0 0 16px', wordBreak: 'break-word' }}>
                  {error.message}
                </p>
              )
          }
          <button
            onClick={reset}
            style={{
              background: '#f5a623',
              color: '#000',
              border: 'none',
              borderRadius: 8,
              padding: '10px 24px',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
