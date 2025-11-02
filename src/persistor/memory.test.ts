import { describe, it, expect } from 'vitest'
import { createMemoryPersistor } from './memory'

describe('createMemoryPersistor', () => {
  it('should create a memory persistor', () => {
    const persistor = createMemoryPersistor()

    expect(persistor).toBeDefined()
    expect(typeof persistor.get).toBe('function')
    expect(typeof persistor.set).toBe('function')
    expect(typeof persistor.has).toBe('function')
    expect(typeof persistor.delete).toBe('function')
    expect(typeof persistor.clear).toBe('function')
  })

  describe('set and get', () => {
    it('should store and retrieve values', () => {
      const persistor = createMemoryPersistor<{ username: string; age: number }>()

      persistor.set('username', 'Alice')
      persistor.set('age', 30)

      expect(persistor.get('username')).toBe('Alice')
      expect(persistor.get('age')).toBe(30)
    })

    it('should return undefined for non-existent keys', () => {
      const persistor = createMemoryPersistor<{ name: string }>()

      expect(persistor.get('name')).toBeUndefined()
    })

    it('should overwrite existing values', () => {
      const persistor = createMemoryPersistor<{ counter: number }>()

      persistor.set('counter', 1)
      expect(persistor.get('counter')).toBe(1)

      persistor.set('counter', 2)
      expect(persistor.get('counter')).toBe(2)
    })

    it('should handle complex objects', () => {
      const persistor = createMemoryPersistor<{ user: { name: string; email: string } }>()

      const user = { name: 'Bob', email: 'bob@example.com' }
      persistor.set('user', user)

      expect(persistor.get('user')).toEqual(user)
    })
  })

  describe('has', () => {
    it('should return true for existing keys', () => {
      const persistor = createMemoryPersistor<{ key: string }>()

      persistor.set('key', 'value')

      expect(persistor.has('key')).toBe(true)
    })

    it('should return false for non-existent keys', () => {
      const persistor = createMemoryPersistor<{ key: string }>()

      expect(persistor.has('key')).toBe(false)
    })

    it('should return true even if value is undefined', () => {
      const persistor = createMemoryPersistor<{ key: string | undefined }>()

      persistor.set('key', undefined)

      expect(persistor.has('key')).toBe(true)
    })
  })

  describe('delete', () => {
    it('should remove a key', () => {
      const persistor = createMemoryPersistor<{ key: string }>()

      persistor.set('key', 'value')
      expect(persistor.has('key')).toBe(true)

      persistor.delete('key')

      expect(persistor.has('key')).toBe(false)
      expect(persistor.get('key')).toBeUndefined()
    })

    it('should not throw when deleting non-existent keys', () => {
      const persistor = createMemoryPersistor<{ key: string }>()

      expect(() => persistor.delete('key')).not.toThrow()
    })
  })

  describe('clear', () => {
    it('should remove all keys', () => {
      const persistor = createMemoryPersistor<{ key1: string; key2: number; key3: boolean }>()

      persistor.set('key1', 'value1')
      persistor.set('key2', 42)
      persistor.set('key3', true)

      expect(persistor.has('key1')).toBe(true)
      expect(persistor.has('key2')).toBe(true)
      expect(persistor.has('key3')).toBe(true)

      persistor.clear()

      expect(persistor.has('key1')).toBe(false)
      expect(persistor.has('key2')).toBe(false)
      expect(persistor.has('key3')).toBe(false)
    })

    it('should work on empty persistor', () => {
      const persistor = createMemoryPersistor()

      expect(() => persistor.clear()).not.toThrow()
    })
  })

  describe('isolation', () => {
    it('should maintain separate state for different instances', () => {
      const persistor1 = createMemoryPersistor<{ key: string }>()
      const persistor2 = createMemoryPersistor<{ key: string }>()

      persistor1.set('key', 'value1')
      persistor2.set('key', 'value2')

      expect(persistor1.get('key')).toBe('value1')
      expect(persistor2.get('key')).toBe('value2')
    })
  })

  describe('type safety', () => {
    it('should work with typed persistor', () => {
      type UserCache = {
        '@alice': { publicKey: string; lastSeen: number }
        '@bob': { publicKey: string; lastSeen: number }
      }

      const persistor = createMemoryPersistor<UserCache>()

      persistor.set('@alice', { publicKey: '0x123', lastSeen: Date.now() })
      persistor.set('@bob', { publicKey: '0x456', lastSeen: Date.now() })

      const alice = persistor.get('@alice')
      expect(alice).toBeDefined()
      expect(alice?.publicKey).toBe('0x123')

      const bob = persistor.get('@bob')
      expect(bob).toBeDefined()
      expect(bob?.publicKey).toBe('0x456')
    })
  })

  describe('edge cases', () => {
    it('should handle null values', () => {
      const persistor = createMemoryPersistor<{ key: null }>()

      persistor.set('key', null)

      expect(persistor.has('key')).toBe(true)
      expect(persistor.get('key')).toBeNull()
    })

    it('should handle empty strings', () => {
      const persistor = createMemoryPersistor<{ key: string }>()

      persistor.set('key', '')

      expect(persistor.has('key')).toBe(true)
      expect(persistor.get('key')).toBe('')
    })

    it('should handle arrays', () => {
      const persistor = createMemoryPersistor<{ items: number[] }>()

      const items = [1, 2, 3, 4, 5]
      persistor.set('items', items)

      expect(persistor.get('items')).toEqual(items)
    })
  })
})
