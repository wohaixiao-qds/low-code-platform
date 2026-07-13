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

const columns = computed(() => parseArray(props.propValues.columns))
const rows = computed(() => parseArray(props.value))
const pagination = computed(() => ({ pageSize: Number(props.propValues.pageSize ?? 10) }))
</script>
