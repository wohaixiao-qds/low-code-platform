<template>
  <a-table :columns="columns" :data-source="rows" :pagination="pagination" />
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ value: unknown; propValues: Record<string, unknown> }>()

function parseArray<T = unknown>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[]
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

const columns = computed(() => {
  // 兼容 {label,field,map}（编辑器产出）与 antd 原生 {title,dataIndex} 两种形态
  const arr = parseArray<Record<string, unknown>>(props.propValues.columns)
  return arr.map((c, i) => {
    const dataIndex = String(c.dataIndex ?? c.field ?? '')
    const map = Array.isArray(c.map) ? (c.map as Array<Record<string, unknown>>) : undefined
    return {
      title: String(c.title ?? c.label ?? (dataIndex || `列${i + 1}`)),
      dataIndex,
      key: dataIndex || String(i),
      // 值转义：原值 → 显示名（按字符串比对）
      customRender: map
        ? ({ text }: { text: unknown }) => {
            const hit = map.find((m) => String(m.value) === String(text))
            return hit ? String(hit.label ?? '') : (text as string)
          }
        : undefined,
    }
  })
})
const rows = computed(() => parseArray(props.value))
const pagination = computed(() => ({ pageSize: Number(props.propValues.pageSize ?? 10) }))
</script>
