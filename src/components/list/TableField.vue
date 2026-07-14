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
  // 兼容 {label,field}（fieldList 编辑器产出）与 antd 原生 {title,dataIndex} 两种形态
  const arr = parseArray<Record<string, unknown>>(props.propValues.columns)
  return arr.map((c, i) => ({
    title: String(c.title ?? c.label ?? c.field ?? `列${i + 1}`),
    dataIndex: String(c.dataIndex ?? c.field ?? ''),
    key: String(c.dataIndex ?? c.field ?? i),
  }))
})
const rows = computed(() => parseArray(props.value))
const pagination = computed(() => ({ pageSize: Number(props.propValues.pageSize ?? 10) }))
</script>
