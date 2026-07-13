import type { PageSchema } from '@/core'
import { LocalStorage } from './local-storage'
import { validateSchema } from '@/core'

export * from './types'
export const pageStorage: LocalStorage = new LocalStorage()

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
