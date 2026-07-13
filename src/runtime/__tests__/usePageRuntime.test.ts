import { describe, it, expect, vi } from 'vitest'
import { usePageRuntime } from '../usePageRuntime'
import type { PageSchema } from '@/core'

const schema: PageSchema = {
  version: 1, type: 'form', id: 'p1', name: 't',
  dataSource: { submit: { url: '/api/x', method: 'POST' } },
  body: [{ id: 'n1', type: 'Input', props: {}, bindings: { field: 'name' } }],
}

describe('usePageRuntime', () => {
  it('submit 把数据总线内容 POST 出去', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }))
    const ctx = usePageRuntime(schema)
    ctx.data.name = '张三'
    await ctx.submit()
    const [, opts] = spy.mock.calls[0] as [unknown, RequestInit]
    expect(opts.body).toBe(JSON.stringify({ name: '张三' }))
    spy.mockRestore()
  })
  it('reset 清空数据总线', () => {
    const ctx = usePageRuntime(schema)
    ctx.data.name = 'x'
    ctx.reset()
    expect(ctx.data.name).toBeUndefined()
  })
})
