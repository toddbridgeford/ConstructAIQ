import { NextResponse } from 'next/server'

export function ok<T>(data: T, headers?: Record<string, string>) {
  return NextResponse.json(data, { headers })
}

export function err(msg: string, status = 500) {
  if (status >= 500) console.error(`[API ${status}]`, msg)
  return NextResponse.json({ error: msg }, { status })
}

export const CACHE_1M  = { 'Cache-Control': 'public, s-maxage=60' }
export const CACHE_1H  = { 'Cache-Control': 'public, s-maxage=3600' }
export const CACHE_4H  = { 'Cache-Control': 'public, s-maxage=14400' }
export const CACHE_24H = { 'Cache-Control': 'public, s-maxage=86400' }
