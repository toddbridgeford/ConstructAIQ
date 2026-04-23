import { describe, it, expect } from 'vitest'
import { ENTITY_TYPES, isEntityType, parseWatchPayload } from '@/lib/watchlist'

describe('isEntityType', () => {
  it('accepts all four declared entity types', () => {
    for (const t of ENTITY_TYPES) expect(isEntityType(t)).toBe(true)
  })
  it('rejects unknown strings and non-strings', () => {
    expect(isEntityType('msa')).toBe(false)
    expect(isEntityType('')).toBe(false)
    expect(isEntityType(42)).toBe(false)
    expect(isEntityType(null)).toBe(false)
    expect(isEntityType(undefined)).toBe(false)
  })
})

describe('parseWatchPayload', () => {
  it('rejects non-object bodies', () => {
    expect(parseWatchPayload(null).ok).toBe(false)
    expect(parseWatchPayload('string').ok).toBe(false)
    expect(parseWatchPayload(42).ok).toBe(false)
  })

  it('rejects unknown entity types', () => {
    const r = parseWatchPayload({ entity_type: 'county', entity_id: 'X', entity_label: 'X' })
    expect(r.ok).toBe(false)
    if (r.ok === false) expect(r.error).toMatch(/entity_type/)
  })

  it('requires non-empty id and label', () => {
    expect(parseWatchPayload({ entity_type: 'metro', entity_id: '',   entity_label: 'Phoenix' }).ok).toBe(false)
    expect(parseWatchPayload({ entity_type: 'metro', entity_id: 'PHX', entity_label: '' }).ok).toBe(false)
  })

  it('uppercases metro/state/federal ids but preserves project ids verbatim', () => {
    const metro = parseWatchPayload({ entity_type: 'metro', entity_id: 'phx', entity_label: 'Phoenix, AZ' })
    expect(metro.ok && metro.payload.entity_id).toBe('PHX')

    const state = parseWatchPayload({ entity_type: 'state', entity_id: 'tx', entity_label: 'Texas' })
    expect(state.ok && state.payload.entity_id).toBe('TX')

    const federal = parseWatchPayload({ entity_type: 'federal', entity_id: 'ca', entity_label: 'California' })
    expect(federal.ok && federal.payload.entity_id).toBe('CA')

    const project = parseWatchPayload({
      entity_type:  'project',
      entity_id:    'a3f9-CamelCase-Id',
      entity_label: 'Some Project',
    })
    expect(project.ok && project.payload.entity_id).toBe('a3f9-CamelCase-Id')
  })

  it('trims surrounding whitespace on id and label', () => {
    const r = parseWatchPayload({
      entity_type:  'metro',
      entity_id:    '  phx  ',
      entity_label: '  Phoenix, AZ  ',
    })
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.payload.entity_id).toBe('PHX')
      expect(r.payload.entity_label).toBe('Phoenix, AZ')
    }
  })

  it('enforces length caps', () => {
    const longId = 'x'.repeat(121)
    expect(parseWatchPayload({ entity_type: 'project', entity_id: longId, entity_label: 'ok' }).ok).toBe(false)
    const longLabel = 'y'.repeat(201)
    expect(parseWatchPayload({ entity_type: 'metro', entity_id: 'PHX', entity_label: longLabel }).ok).toBe(false)
  })
})
