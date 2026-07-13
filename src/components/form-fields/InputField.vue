<template>
  <a-form-item :label="label" :required="required">
    <a-input
      :value="value"
      :placeholder="placeholder"
      :maxlength="maxLength"
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
const maxLength = computed(() => Number(props.propValues.maxLength ?? undefined))
</script>
