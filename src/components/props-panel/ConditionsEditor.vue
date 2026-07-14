<template>
  <div class="cond-editor">
    <div v-for="(c, i) in list" :key="i" class="ce-row">
      <a-input size="small" :value="c.field" data-c="field" placeholder="字段名" @input="(e:any)=>update(i,'field',onVal(e))" />
      <a-select size="small" :value="c.op" data-c="op" :options="opOptions" style="width:96px" @change="(v:any)=>update(i,'op',v)" />
      <a-input v-if="needValue(c.op)" size="small" :value="c.value ?? ''" data-c="value" placeholder="值" @input="(e:any)=>update(i,'value',onVal(e))" />
      <button class="ce-del" @click="remove(i)">✕</button>
    </div>
    <a-button size="small" type="dashed" block data-c="add" @click="add">+ 添加条件</a-button>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import type { VisibleCondition, VisibleOp } from '@/core'
const props = defineProps<{ modelValue: VisibleCondition[] }>()
const emit = defineEmits<{ (e:'update:modelValue', v: VisibleCondition[]): void }>()
const opOptions = [
  { label: '等于', value: '==' }, { label: '不等于', value: '!=' },
  { label: '包含', value: 'contains' }, { label: '为空', value: 'empty' }, { label: '不为空', value: 'notEmpty' },
]
const list = computed(() => Array.isArray(props.modelValue) ? props.modelValue : [])
const needValue = (op: VisibleOp) => op !== 'empty' && op !== 'notEmpty'
function emit_(n: VisibleCondition[]) { emit('update:modelValue', n) }
function onVal(e: Event) { return (e.target as HTMLInputElement).value }
function update(i: number, key: 'field'|'op'|'value', val: string) {
  const next = list.value.map(x => ({ ...x })); (next[i] as any)[key] = val; emit_(next)
}
function add() { emit_([...list.value, { field: '', op: '==' as VisibleOp, value: '' }]) }
function remove(i: number) { emit_(list.value.filter((_, idx) => idx !== i)) }
</script>
<style scoped>
.ce-row { display:flex; gap:4px; margin-bottom:4px; align-items:center; }
.ce-row :deep(.ant-input) { flex:1; }
.ce-del { width:22px;height:22px;border:1px solid #d9d9d9;background:#fff;color:#ff4d4f;border-radius:3px;cursor:pointer;font-size:11px; }
.ce-del:hover { background:#fff1f0; }
</style>
