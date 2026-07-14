import type { ComponentNode } from './types'

export interface ValidationRule {
  required?: boolean
  message: string
  pattern?: string // 正则源串
  max?: number // 文本最大长度
}

export function buildRules(node: ComponentNode): ValidationRule[] {
  const p = node.props ?? {}
  const label = String(p.label ?? node.type)
  const rules: ValidationRule[] = []
  if (p.required) rules.push({ required: true, message: `${label}必填` })
  if (typeof p.pattern === 'string' && p.pattern) rules.push({ pattern: p.pattern, message: `${label}格式不正确` })
  const ml = Number(p.maxlength)
  if (p.maxlength != null && p.maxlength !== '' && !Number.isNaN(ml)) {
    rules.push({ max: ml, message: `${label}不超过 ${ml} 个字符` })
  }
  return rules
}
