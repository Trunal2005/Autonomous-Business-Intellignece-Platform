import { describe, expect, it } from 'vitest'
import { resolveApiBase } from '@/services/base'

describe('production API origin', () => {
  it('uses same origin for production and keeps the local development default', () => {
    expect(resolveApiBase(undefined, true)).toBe('')
    expect(resolveApiBase('', true)).toBe('')
    expect(resolveApiBase(undefined, false)).toBe('http://localhost:8000')
    expect(resolveApiBase('http://localhost:8002/', false)).toBe('http://localhost:8002')
  })
  it('rejects localhost/insecure overrides while allowing an explicit HTTPS backend', () => {
    for (const base of ['http://localhost:8000', 'https://localhost', 'https://127.0.0.1', 'http://example.com']) {
      expect(() => resolveApiBase(base, true)).toThrow()
    }
    expect(resolveApiBase('https://api.example.com/', true)).toBe('https://api.example.com')
  })
})
