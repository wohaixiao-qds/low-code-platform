import type { PageSchema, PageType } from './types'

const PAGE_TYPES: PageType[] = ['form', 'list', 'detail']

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

export function validateSchema(input: unknown): ValidationResult {
  const errors: string[] = []
  const s = input as Partial<PageSchema> & Record<string, unknown>
  if (s == null || typeof s !== 'object') return { valid: false, errors: ['schema 必须为对象'] }
  if (s.version !== 1) errors.push('version 必须为 1')
  if (!PAGE_TYPES.includes(s.type as PageType)) errors.push('type 必须为 form/list/detail')
  if (typeof s.id !== 'string' || !s.id) errors.push('id 必须为非空字符串')
  if (typeof s.name !== 'string') errors.push('name 必须为字符串')
  if (!Array.isArray(s.body)) errors.push('body 必须为数组')
  return { valid: errors.length === 0, errors }
}
