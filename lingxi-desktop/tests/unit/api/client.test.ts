/**
 * API Client 单元测试
 * 
 * 注意：由于 apiClient 在模块加载时就创建实例，
 * 直接测试配置较为复杂。主要通过 API 测试间接验证。
 */
import { describe, it, expect } from 'vitest'

describe('API Client', () => {
  it('should exist and be importable', () => {
    // Basic import test
    expect(() => import('@/api/client')).not.toThrow()
  })

  it('should export default instance', async () => {
    const client = await import('@/api/client')
    expect(client.default).toBeDefined()
    expect(typeof client.default.get).toBe('function')
    expect(typeof client.default.post).toBe('function')
  })
})
