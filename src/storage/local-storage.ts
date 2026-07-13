import type { PageSchema } from '@/core'
import type { PageMeta, PageStorage } from './types'

const INDEX_KEY = 'lowcode:pages:index'
const pageKey = (id: string) => `lowcode:page:${id}`

export class LocalStorage implements PageStorage {
  constructor(private backend: Storage = globalThis.localStorage) {}

  async list(): Promise<PageMeta[]> {
    const raw = this.backend.getItem(INDEX_KEY)
    return raw ? (JSON.parse(raw) as PageMeta[]) : []
  }
  async get(id: string): Promise<PageSchema | null> {
    const raw = this.backend.getItem(pageKey(id))
    return raw ? (JSON.parse(raw) as PageSchema) : null
  }
  async save(schema: PageSchema): Promise<void> {
    this.backend.setItem(pageKey(schema.id), JSON.stringify(schema))
    const list = await this.list()
    const idx = list.findIndex((m) => m.id === schema.id)
    const meta: PageMeta = { id: schema.id, name: schema.name, type: schema.type, updatedAt: Date.now() }
    if (idx >= 0) list[idx] = meta; else list.push(meta)
    this.backend.setItem(INDEX_KEY, JSON.stringify(list))
  }
  async remove(id: string): Promise<void> {
    this.backend.removeItem(pageKey(id))
    const list = (await this.list()).filter((m) => m.id !== id)
    this.backend.setItem(INDEX_KEY, JSON.stringify(list))
  }
}
