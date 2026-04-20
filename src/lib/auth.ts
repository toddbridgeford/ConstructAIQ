export interface KeyInfo {
  valid: boolean
  plan?: string
  rpm_limit?: number
  rpd_limit?: number
  key_hash?: string
  error?: string
}

async function sha256Hex(input: string): Promise<string> {
  const encoded = new TextEncoder().encode(input)
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded)
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function validateApiKey(key: string): Promise<KeyInfo> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return { valid: false, error: 'Auth service misconfigured' }
  }

  const keyHash = await sha256Hex(key)

  const url = `${supabaseUrl}/rest/v1/api_keys?key_hash=eq.${keyHash}&select=plan,rpm_limit,rpd_limit,active&limit=1`

  const res = await fetch(url, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
    },
  })

  if (!res.ok) {
    return { valid: false, error: 'Auth lookup failed' }
  }

  const rows: Array<{ plan: string; rpm_limit: number; rpd_limit: number; active: boolean }> =
    await res.json()

  if (!rows.length) {
    return { valid: false, error: 'Invalid key' }
  }

  const row = rows[0]

  if (!row.active) {
    return { valid: false, error: 'Key inactive' }
  }

  return {
    valid: true,
    plan: row.plan,
    rpm_limit: row.rpm_limit,
    rpd_limit: row.rpd_limit,
    key_hash: keyHash,
  }
}
