<template>
  <div class="props-form">
    <div v-for="f in fields" :key="f.name" class="prop-item" :class="{ inline: f.type === 'boolean' }">
      <label>{{ f.label }}</label>
      <a-input
        v-if="f.type === 'string'"
        :value="String(modelValue[f.name] ?? '')"
        :data-prop="f.name"
        size="small"
        @input="onString(f.name, $event)"
      />
      <a-input-number
        v-else-if="f.type === 'number'"
        :value="Number(modelValue[f.name] ?? 0)"
        size="small"
        class="full"
        @change="(v: unknown) => onValue(f.name, v)"
      />
      <a-switch
        v-else-if="f.type === 'boolean'"
        :checked="!!modelValue[f.name]"
        size="small"
        @change="(v: unknown) => onValue(f.name, v)"
      />
      <a-select
        v-else-if="f.type === 'select'"
        :value="modelValue[f.name]"
        :options="f.options"
        size="small"
        class="full"
        @change="(v: unknown) => onValue(f.name, v)"
      />
      <a-textarea
        v-else-if="f.type === 'textarea'"
        :value="String(modelValue[f.name] ?? '')"
        :rows="3"
        size="small"
        @input="(e: unknown) => onString(f.name, e as Event)"
      />
      <FieldListEditor
        v-else-if="f.type === 'fieldList'"
        :model-value="modelValue[f.name]"
        :with-map="!!f.withMap"
        @update:model-value="(v) => onValue(f.name, v)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PropField } from '@/core'
import FieldListEditor from './FieldListEditor.vue'

const props = defineProps<{ fields: PropField[]; modelValue: Record<string, unknown> }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: Record<string, unknown>): void }>()

function onValue(name: string, value: unknown) {
  emit('update:modelValue', { ...props.modelValue, [name]: value })
}

function onString(name: string, e: Event) {
  onValue(name, (e.target as HTMLInputElement).value)
}
</script>

<style scoped>
.props-form .prop-item {
  margin-bottom: 10px;
  display: flex;
  flex-direction: column;
}
.props-form .prop-item:last-child {
  margin-bottom: 0;
}
.props-form .prop-item label {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
  line-height: 18px;
}
.props-form .prop-item.inline {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}
.props-form .prop-item.inline label {
  margin-bottom: 0;
}
.props-form .full,
.props-form :deep(.ant-input),
.props-form :deep(.ant-input-number),
.props-form :deep(.ant-select),
.props-form :deep(.ant-input-affix-wrapper) {
  width: 100%;
}
</style>
