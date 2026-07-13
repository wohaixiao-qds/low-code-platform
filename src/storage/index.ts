import type { PageSchema } from '@/core'
import { IndexedDBStorage } from './indexed-db'
import { validateSchema } from '@/core'

export * from './types'
export { LocalStorage } from './local-storage'
export { IndexedDBStorage } from './indexed-db'

// 默认存储：IndexedDB（容量大、异步、适合大量页面）。需要换回 localStorage 时改这一行即可。
export const pageStorage = new IndexedDBStorage()

// 导出 schema 为 JSON 文件下载
export function exportSchema(schema: PageSchema): void {
  const blob = new Blob([JSON.stringify(schema, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${schema.id}.page.json`
  a.click()
  URL.revokeObjectURL(url)
}

// 导入并校验 schema
export async function importSchema(text: string): Promise<PageSchema> {
  const obj = JSON.parse(text)
  const r = validateSchema(obj)
  if (!r.valid) throw new Error('schema 非法：' + r.errors.join('; '))
  return obj as PageSchema
}
