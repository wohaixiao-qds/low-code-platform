<template>
  <a-form-item :label="label">
    <a-slider
      :value="value"
      :min="min"
      :max="max"
      :step="step"
      @update:value="(v: unknown) => emit('update:value', v)"
    />
  </a-form-item>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ value: unknown; propValues: Record<string, unknown> }>()
const emit = defineEmits<{ (e: 'update:value', v: unknown): void }>()

const label = computed(() => String(props.propValues.label ?? ''))
const min = computed(() => Number(props.propValues.min ?? 0))
const max = computed(() => Number(props.propValues.max ?? 100))
const step = computed(() => Number(props.propValues.step ?? 1))
</script>
