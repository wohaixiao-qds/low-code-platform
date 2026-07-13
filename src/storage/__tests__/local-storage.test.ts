import { describe, it, expect, beforeEach } from 'vitest'
import { LocalStorage } from '../local-storage'
import type { PageSchema } from '@/core'

const page: PageSchema = { version: 1, type: 'form', id: 'p1', name: '测试', body: [] }

function memStorage() {
  const m = new Map<string, string>()
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => { m.set(k, v) },
    removeItem: (k: string) => { m.delete(k) },
  } as unknown as Storage
}

describe('LocalStorage', () => {
  let s: LocalStorage
  beforeEach(() => { s = new LocalStorage(memStorage()) })
  it('save 后 list 能看到，get 能取回', async () => {
    await s.save(page)
    const list = await s.list()
    expect(list).toHaveLength(1)
    expect(list[0].id).toBe('p1')
    const got = await s.get('p1')
    expect(got?.name).toBe('测试')
  })
  it('save 同 id 为更新', async () => {
    await s.save(page)
    await s.save({ ...page, name: '改名' })
    const list = await s.list()
    expect(list).toHaveLength(1)
    expect((await s.get('p1'))?.name).toBe('改名')
  })
  it('remove 后找不到', async () => {
    await s.save(page)
    await s.remove('p1')
    expect(await s.get('p1')).toBeNull()
    expect(await s.list()).toHaveLength(0)
  })
})
