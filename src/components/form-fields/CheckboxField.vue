<template>
  <a-form-item :label="label" :required="required">
    <a-checkbox-group
      :value="value"
      :class="{ 'dir-vertical': direction === 'vertical' }"
      @update:value="(v: unknown) => emit('update:value', v)"
    >
      <a-checkbox
        v-for="opt in options"
        :key="opt.value"
        :value="opt.value"
        :disabled="disabled"
      >
        {{ opt.label }}
      </a-checkbox>
    </a-checkbox-group>
  </a-form-item>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ value: unknown; propValues: Record<string, unknown> }>()
const emit = defineEmits<{ (e: 'update:value', v: unknown): void }>()

const label = computed(() => String(props.propValues.label ?? ''))
const required = computed(() => !!props.propValues.required)
const disabled = computed(() => !!props.propValues.disabled)
const direction = computed(() => String(props.propValues.direction ?? 'horizontal'))

interface Opt {
  label: string
  value: string | number
}
const options = computed<Opt[]>(() => {
  const raw = props.propValues.options
  if (Array.isArray(raw)) return raw as Opt[]
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? (parsed as Opt[]) : []
    } catch {
      return []
    }
  }
  return []
})
</script>

<style scoped>
.dir-vertical {
  display: flex;
  flex-direction: column;
}
</style>
