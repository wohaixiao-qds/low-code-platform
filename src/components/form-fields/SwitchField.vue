<template>
  <a-form-item :label="label" :required="required">
    <a-switch
      :checked="!!value"
      @change="(v: unknown) => emit('update:value', v)"
    />
  </a-form-item>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ value: unknown; propValues: Record<string, unknown> }>()
const emit = defineEmits<{ (e: 'update:value', v: unknown): void }>()

const label = computed(() => String(props.propValues.label ?? ''))
const required = computed(() => !!props.propValues.required)
</script>
