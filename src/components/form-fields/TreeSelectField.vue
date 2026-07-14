<template>
  <a-form-item :label="label" :required="required">
    <a-tree-select
      :value="value"
      :tree-data="options"
      :placeholder="placeholder"
      v-bind="controlProps"
      style="width: 100%"
      @update:value="(v: unknown) => emit('update:value', v)"
    />
  </a-form-item>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ value: unknown; propValues: Record<string, unknown> }>()
const emit = defineEmits<{ (e: 'update:value', v: unknown): void }>()

const label = computed(() => String(props.propValues.label ?? ''))
const placeholder = computed(() => String(props.propValues.placeholder ?? ''))
const required = computed(() => !!props.propValues.required)

const controlProps = computed(() => {
  const p = props.propValues
  return {
    allowClear: p.clearable !== false,
    showSearch: !!p.filterable,
    disabled: !!p.disabled,
  }
})

const options = computed(() => {
  const raw = props.propValues.options
  if (Array.isArray(raw)) return raw
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
</script>
