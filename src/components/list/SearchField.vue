<template>
  <a-form layout="inline">
    <a-form-item v-for="f in fields" :key="f.field" :label="f.label">
      <a-input v-model:value="model[f.field]" :placeholder="f.label" />
    </a-form-item>
    <a-form-item>
      <a-button type="primary" @click="emit('search', model)">查询</a-button>
    </a-form-item>
  </a-form>
</template>

<script setup lang="ts">
import { reactive, computed } from 'vue'

const props = defineProps<{ propValues: Record<string, unknown> }>()
const emit = defineEmits<{ (e: 'search', v: Record<string, unknown>): void }>()

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

const model = reactive<Record<string, unknown>>({})
</script>
