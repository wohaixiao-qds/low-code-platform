<template>
  <a-form-item :label="label" :required="required">
    <a-input-number
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

const numOrUndef = (v: unknown): number | undefined => (typeof v === 'number' && !Number.isNaN(v) ? v : undefined)

const controlProps = computed(() => {
  const p = props.propValues
  return {
    disabled: !!p.disabled,
    min: numOrUndef(p.min),
    max: numOrUndef(p.max),
    step: numOrUndef(p.step) ?? 1,
    precision: numOrUndef(p.precision),
  }
})
</script>
