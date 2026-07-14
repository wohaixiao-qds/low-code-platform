<template>
  <a-form-item :label="label" :required="required" :name="name" :rules="rules">
    <a-switch
      :checked="!!value"
      v-bind="controlProps"
      @change="(v: unknown) => emit('update:value', v)"
    />
  </a-form-item>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ value: unknown; propValues: Record<string, unknown>; name?: string; rules?: unknown[] }>()
const emit = defineEmits<{ (e: 'update:value', v: unknown): void }>()

const label = computed(() => String(props.propValues.label ?? ''))
const required = computed(() => !!props.propValues.required)

const controlProps = computed(() => {
  const p = props.propValues
  const active = p.activeText
  const inactive = p.inactiveText
  return {
    disabled: !!p.disabled,
    checkedChildren: typeof active === 'string' ? active : undefined,
    unCheckedChildren: typeof inactive === 'string' ? inactive : undefined,
  }
})
</script>
