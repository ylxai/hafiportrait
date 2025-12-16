import { describe, it, expect } from 'vitest'
import { hashPassword, verifyPassword, signJWT, verifyJWT, isAdmin, hasRole } from '@/lib/auth'

describe('Auth Functions', () => {
  describe('Password Hashing', () => {
    it('should hash password successfully', async () => {
      const password = 'SecurePassword123!'
      const hash = await hashPassword(password)
      
      expect(hash).toBeDefined()
      expect(hash).not.toBe(password)
      expect(hash.length).toBeGreaterThan(0)
    })

    it('should verify correct password', async () => {
      const password = 'SecurePassword123!'
      const hash = await hashPassword(password)
      
      const isValid = await verifyPassword(password, hash)
      expect(isValid).toBe(true)
    })

    it('should reject incorrect password', async () => {
      const password = 'SecurePassword123!'
      const hash = await hashPassword(password)
      
      const isValid = await verifyPassword('WrongPassword', hash)
      expect(isValid).toBe(false)
    })

    it('should generate different hashes for same password', async () => {
      const password = 'SecurePassword123!'
      const hash1 = await hashPassword(password)
      const hash2 = await hashPassword(password)
      
      expect(hash1).not.toBe(hash2)
      // But both should verify correctly
      expect(await verifyPassword(password, hash1)).toBe(true)
      expect(await verifyPassword(password, hash2)).toBe(true)
    })
  })

  describe('JWT Operations', () => {
    it('should sign JWT token', async () => {
      const payload = {
        userId: 'user-123',
        username: 'testuser',
        role: 'ADMIN',
      }
      
      const token = await signJWT(payload)
      
      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.split('.').length).toBe(3) // JWT has 3 parts
    })

    it('should verify valid JWT token', async () => {
      const payload = {
        userId: 'user-123',
        username: 'testuser',
        role: 'ADMIN',
      }
      
      const token = await signJWT(payload)
      const verified = await verifyJWT(token)
      
      expect(verified).toBeDefined()
      expect(verified?.userId).toBe(payload.userId)
      expect(verified?.username).toBe(payload.username)
      expect(verified?.role).toBe(payload.role)
    })

    it('should reject invalid JWT token', async () => {
      const invalidToken = 'invalid.jwt.token'
      
      const verified = await verifyJWT(invalidToken)
      
      expect(verified).toBeNull()
    })

    it('should reject tampered JWT token', async () => {
      const payload = {
        userId: 'user-123',
        username: 'testuser',
        role: 'ADMIN',
      }
      
      const token = await signJWT(payload)
      const tamperedToken = token + 'tampered'
      
      const verified = await verifyJWT(tamperedToken)
      
      expect(verified).toBeNull()
    })
  })

  describe('Role Checking', () => {
    it('should correctly identify admin role', () => {
      const adminUser = {
        userId: 'user-1',
        username: 'admin',
        role: 'ADMIN',
      }
      
      expect(isAdmin(adminUser)).toBe(true)
      expect(hasRole(adminUser, 'ADMIN')).toBe(true)
    })

    it('should correctly identify non-admin role', () => {
      const clientUser = {
        userId: 'user-2',
        username: 'client',
        role: 'CLIENT',
      }
      
      expect(isAdmin(clientUser)).toBe(false)
      expect(hasRole(clientUser, 'CLIENT')).toBe(true)
    })

    it('should return false for null user', () => {
      expect(isAdmin(null)).toBe(false)
      expect(hasRole(null, 'ADMIN')).toBe(false)
    })
  })
})
