import { describe, it, expect } from 'vitest'

describe('Security Config', () => {
  it('should validate JWT secret exists', () => {
    expect(process.env.NEXTAUTH_SECRET).toBeDefined()
    expect(process.env.NEXTAUTH_SECRET!.length).toBeGreaterThanOrEqual(32)
  })

  it('should not use default secret', () => {
    expect(process.env.NEXTAUTH_SECRET).not.toBe('default-secret-change-this')
  })

  it('should have proper bcrypt rounds config', () => {
    const rounds = parseInt(process.env.BCRYPT_ROUNDS || '12', 10)
    expect(rounds).toBeGreaterThanOrEqual(12)
    expect(rounds).toBeLessThanOrEqual(15)
  })
})
