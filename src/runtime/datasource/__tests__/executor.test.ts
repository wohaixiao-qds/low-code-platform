import { describe, it, expect, vi } from 'vitest'
import { exec } from '../executor'

describe('datasource executor', () => {
  it('GET 拼装 url + method', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ a: 1 }), { status: 200 }))
    await exec({ url: '/api/x', method: 'GET' })
    expect(spy).toHaveBeenCalledWith('/api/x', expect.objectContaining({ method: 'GET' }))
    spy.mockRestore()
  })
  it('POST 带 body 且 JSON 序列化', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }))
    await exec({ url: '/api/x', method: 'POST' }, { name: 'a' })
    const [, opts] = spy.mock.calls[0] as [unknown, RequestInit]
    expect(opts.method).toBe('POST')
    expect(opts.body).toBe(JSON.stringify({ name: 'a' }))
    spy.mockRestore()
  })
  it('非 2xx 抛错', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 500 }))
    await expect(exec({ url: '/x', method: 'GET' })).rejects.toThrow()
  })
})
