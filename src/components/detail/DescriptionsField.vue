<template>
  <a-descriptions bordered :column="column">
    <a-descriptions-item v-for="f in fields" :key="f.field" :label="f.label">
      {{ (value as any)?.[f.field] ?? '' }}
    </a-descriptions-item>
  </a-descriptions>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ propValues: Record<string, unknown>; value: unknown }>()

const fields = computed(() => {
  const raw = props.propValues.fields
  if (Array.isArray(raw)) return raw as Array<{ field: string; label: string }>
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
})

const column = computed(() => Number(props.propValues.column ?? 1))
</script>
