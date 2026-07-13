import { describe, it, expect, beforeEach } from 'vitest'
import { IndexedDBStorage } from '../indexed-db'
import type { PageSchema } from '@/core'

const page: PageSchema = { version: 1, type: 'form', id: 'p1', name: '测试', body: [] }

// 每个用例前清空 lowcode 数据库，保证隔离
async function resetDB(): Promise<void> {
  await new Promise<void>((resolve) => {
    const req = indexedDB.deleteDatabase('lowcode')
    req.onsuccess = () => resolve()
    req.onerror = () => resolve()
    req.onblocked = () => resolve()
  })
}

describe('IndexedDBStorage', () => {
  let s: IndexedDBStorage
  beforeEach(async () => {
    await resetDB()
    s = new IndexedDBStorage()
  })
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
  it('list 按更新时间倒序', async () => {
    await s.save({ ...page, id: 'a', name: 'A' })
    await new Promise((r) => setTimeout(r, 5))
    await s.save({ ...page, id: 'b', name: 'B' })
    const list = await s.list()
    expect(list.map((m) => m.id)).toEqual(['b', 'a'])
  })
})
