<template>
  <a-form-item :label="label" :required="required">
    <a-time-picker
      :value="value"
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
  const format = p.format
  return {
    allowClear: p.clearable !== false,
    disabled: !!p.disabled,
    format: typeof format === 'string' ? format : 'HH:mm:ss',
  }
})
</script>
