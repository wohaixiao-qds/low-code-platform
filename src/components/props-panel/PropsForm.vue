<template>
  <div class="props-form">
    <div v-for="f in fields" :key="f.name" class="prop-item">
      <label>{{ f.label }}</label>
      <a-input
        v-if="f.type === 'string'"
        :value="String(modelValue[f.name] ?? '')"
        :data-prop="f.name"
        @input="onString(f.name, $event)"
      />
      <a-input-number
        v-else-if="f.type === 'number'"
        :value="Number(modelValue[f.name] ?? 0)"
        @change="(v: unknown) => onValue(f.name, v)"
      />
      <a-switch
        v-else-if="f.type === 'boolean'"
        :checked="!!modelValue[f.name]"
        @change="(v: unknown) => onValue(f.name, v)"
      />
      <a-select
        v-else-if="f.type === 'select'"
        :value="modelValue[f.name]"
        :options="f.options"
        style="width:100%"
        @change="(v: unknown) => onValue(f.name, v)"
      />
      <a-textarea
        v-else-if="f.type === 'textarea'"
        :value="String(modelValue[f.name] ?? '')"
        @input="(e: unknown) => onString(f.name, e as Event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PropField } from '@/core'

const props = defineProps<{ fields: PropField[]; modelValue: Record<string, unknown> }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: Record<string, unknown>): void }>()

function onValue(name: string, value: unknown) {
  emit('update:modelValue', { ...props.modelValue, [name]: value })
}

function onString(name: string, e: Event) {
  onValue(name, (e.target as HTMLInputElement).value)
}
</script>
