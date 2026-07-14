<template>
  <a-form-item :label="label">
    <a-slider
      :value="value"
      v-bind="controlProps"
      @update:value="(v: unknown) => emit('update:value', v)"
    />
  </a-form-item>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ value: unknown; propValues: Record<string, unknown> }>()
const emit = defineEmits<{ (e: 'update:value', v: unknown): void }>()

const label = computed(() => String(props.propValues.label ?? ''))

const numOr = (v: unknown, d: number): number => (typeof v === 'number' && !Number.isNaN(v) ? v : d)

const controlProps = computed(() => {
  const p = props.propValues
  return {
    min: numOr(p.min, 0),
    max: numOr(p.max, 100),
    step: numOr(p.step, 1),
    disabled: !!p.disabled,
  }
})
</script>
