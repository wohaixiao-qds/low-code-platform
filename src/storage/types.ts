import type { PageSchema, PageType } from '@/core'

export interface PageMeta {
  id: string
  name: string
  type: PageType
  updatedAt: number
}

export interface PageStorage {
  list(): Promise<PageMeta[]>
  get(id: string): Promise<PageSchema | null>
  save(schema: PageSchema): Promise<void>
  remove(id: string): Promise<void>
}
