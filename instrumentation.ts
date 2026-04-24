import * as Sentry from '@sentry/nextjs'

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}

// Required by @sentry/nextjs ≥ 9 / Next.js App Router for RSC error capture.
export const onRequestError = Sentry.captureRequestError
