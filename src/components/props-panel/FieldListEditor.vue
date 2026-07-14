<template>
  <div class="field-list-editor">
    <div v-for="(item, i) in list" :key="i" class="fle-row">
      <a-input size="small" :value="item.label" placeholder="显示名" @input="(e: any) => update(i, 'label', onVal(e))" />
      <a-input size="small" :value="item.field" placeholder="字段名" @input="(e: any) => update(i, 'field', onVal(e))" />
      <button class="fle-del" title="删除" @click="remove(i)">✕</button>
    </div>
    <a-button size="small" type="dashed" block @click="add">+ 添加</a-button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface LF { label: string; field: string }

const props = defineProps<{ modelValue: unknown }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: LF[]): void }>()

// 兼容旧数据：数组项可能是 {label,field} 或 antd 的 {title,dataIndex}，统一成 {label,field}
function normalize(raw: unknown): LF[] {
  let arr: unknown[] = []
  if (Array.isArray(raw)) arr = raw
  else if (typeof raw === 'string') {
    try {
      const p = JSON.parse(raw)
      if (Array.isArray(p)) arr = p
    } catch {
      /* ignore */
    }
  }
  return arr.map((it) => {
    const o = (it ?? {}) as Record<string, unknown>
    return {
      label: String(o.label ?? o.title ?? ''),
      field: String(o.field ?? o.dataIndex ?? o.value ?? ''),
    }
  })
}

const list = computed(() => normalize(props.modelValue))

function emitNext(next: LF[]) {
  emit('update:modelValue', next)
}
function onVal(e: Event) {
  return (e.target as HTMLInputElement).value
}
function update(i: number, key: 'label' | 'field', val: string) {
  const next = list.value.map((x) => ({ ...x }))
  next[i] = { ...next[i], [key]: val }
  emitNext(next)
}
function add() {
  emitNext([...list.value, { label: '', field: '' }])
}
function remove(i: number) {
  emitNext(list.value.filter((_, idx) => idx !== i))
}
</script>

<style scoped>
.fle-row {
  display: flex;
  gap: 4px;
  margin-bottom: 4px;
  align-items: center;
}
.fle-row :deep(.ant-input) {
  flex: 1;
}
.fle-del {
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  border: 1px solid #d9d9d9;
  background: #fff;
  color: #ff4d4f;
  border-radius: 3px;
  cursor: pointer;
  font-size: 11px;
  line-height: 1;
}
.fle-del:hover {
  background: #fff1f0;
  border-color: #ffccc7;
}
</style>
