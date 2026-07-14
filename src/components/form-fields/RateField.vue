<template>
  <a-form-item :label="label">
    <a-rate
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

const controlProps = computed(() => {
  const p = props.propValues
  const count = p.count
  return {
    count: typeof count === 'number' ? count : 5,
    allowHalf: !!p.allowHalf,
    disabled: !!p.disabled,
  }
})
</script>
