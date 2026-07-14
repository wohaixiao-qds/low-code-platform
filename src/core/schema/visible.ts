import type { VisibleCondition } from './types'

function isEmpty(v: unknown): boolean {
  if (v == null) return true
  if (v === '') return true
  if (Array.isArray(v) && v.length === 0) return true
  return false
}

function match(c: VisibleCondition, data: Record<string, unknown>): boolean {
  const v = data?.[c.field]
  switch (c.op) {
    case '==':
      return v != null && String(v) === String(c.value ?? '')
    case '!=':
      return v == null || String(v) !== String(c.value ?? '')
    case 'contains': {
      const want = String(c.value ?? '')
      if (Array.isArray(v)) return v.some((x) => String(x) === want)
      if (typeof v === 'string') return v.includes(want)
      return false
    }
    case 'empty':
      return isEmpty(v)
    case 'notEmpty':
      return !isEmpty(v)
    default:
      return true
  }
}

export function evaluateVisibleIf(
  conditions: VisibleCondition[] | undefined,
  data: Record<string, unknown>,
): boolean {
  if (!conditions || conditions.length === 0) return true
  return conditions.every((c) => match(c, data))
}
