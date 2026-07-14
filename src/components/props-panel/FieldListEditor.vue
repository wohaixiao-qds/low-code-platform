<template>
  <div class="field-list-editor">
    <div v-for="(item, i) in list" :key="i" class="fle-item">
      <div class="fle-row">
        <a-input size="small" :value="item.label" placeholder="显示名" @input="(e: any) => update(i, 'label', onVal(e))" />
        <a-input size="small" :value="item.field" placeholder="字段名" @input="(e: any) => update(i, 'field', onVal(e))" />
        <button v-if="withMap" class="fle-icon-btn" :class="{ on: openMap === i }" title="值转义" @click="toggleMap(i)">⇄</button>
        <button class="fle-del" title="删除" @click="remove(i)">✕</button>
      </div>
      <div v-if="withMap && openMap === i" class="fle-map">
        <div class="fle-map-title">值转义（原值 → 显示名）</div>
        <div v-for="(m, mi) in mapOf(item)" :key="mi" class="fle-row sub">
          <a-input size="small" :value="m.value" placeholder="原值" @input="(e: any) => updateMap(i, mi, 'value', onVal(e))" />
          <span class="arrow">→</span>
          <a-input size="small" :value="m.label" placeholder="显示名" @input="(e: any) => updateMap(i, mi, 'label', onVal(e))" />
          <button class="fle-del" @click="removeMap(i, mi)">✕</button>
        </div>
        <a-button size="small" type="dashed" @click="addMap(i)">+ 添加转义</a-button>
      </div>
    </div>
    <a-button size="small" type="dashed" block @click="add">+ 添加</a-button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

interface MapEntry { value: string; label: string }
interface LF { label: string; field: string; map?: MapEntry[] }

const props = withDefaults(defineProps<{ modelValue: unknown; withMap?: boolean }>(), {
  withMap: false,
})
const emit = defineEmits<{ (e: 'update:modelValue', v: LF[]): void }>()

const openMap = ref<number | null>(null)

// 兼容旧数据：{label,field} / antd {title,dataIndex}，并保留 map
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
    const mapRaw = o.map
    let map: MapEntry[] | undefined
    if (Array.isArray(mapRaw)) {
      map = mapRaw.map((m) => {
        const mo = (m ?? {}) as Record<string, unknown>
        return { value: String(mo.value ?? ''), label: String(mo.label ?? '') }
      })
    } else if (mapRaw && typeof mapRaw === 'object') {
      map = Object.entries(mapRaw as Record<string, unknown>).map(([value, label]) => ({
        value,
        label: String(label ?? ''),
      }))
    }
    return {
      label: String(o.label ?? o.title ?? ''),
      field: String(o.field ?? o.dataIndex ?? o.value ?? ''),
      map,
    }
  })
}

const list = computed(() => normalize(props.modelValue))
function mapOf(item: LF): MapEntry[] {
  return item.map ?? []
}

function emitNext(next: LF[]) {
  emit('update:modelValue', next)
}
function onVal(e: Event) {
  return (e.target as HTMLInputElement).value
}
function update(i: number, key: 'label' | 'field', val: string) {
  const next = list.value.map((x) => ({ ...x, map: x.map ? x.map.map((m) => ({ ...m })) : undefined }))
  next[i] = { ...next[i], [key]: val }
  emitNext(next)
}
function add() {
  emitNext([...list.value, { label: '', field: '' }])
}
function remove(i: number) {
  emitNext(list.value.filter((_, idx) => idx !== i))
}
function toggleMap(i: number) {
  openMap.value = openMap.value === i ? null : i
}
function updateMap(i: number, mi: number, key: 'value' | 'label', val: string) {
  const next = list.value.map((x) => ({
    ...x,
    map: (x.map ?? []).map((m) => ({ ...m })),
  }))
  if (!next[i].map) next[i].map = []
  // 同步已有的 map 项到当前列（其他列的 map 已在上面拷贝）
  if (!next[i].map![mi]) next[i].map![mi] = { value: '', label: '' }
  next[i].map![mi] = { ...next[i].map![mi], [key]: val }
  emitNext(next)
}
function addMap(i: number) {
  const next = list.value.map((x) => ({
    ...x,
    map: (x.map ?? []).map((m) => ({ ...m })),
  }))
  next[i].map = [...(next[i].map ?? []), { value: '', label: '' }]
  emitNext(next)
}
function removeMap(i: number, mi: number) {
  const next = list.value.map((x) => ({
    ...x,
    map: (x.map ?? []).map((m) => ({ ...m })),
  }))
  next[i].map = (next[i].map ?? []).filter((_, idx) => idx !== mi)
  emitNext(next)
}
</script>

<style scoped>
.fle-item { margin-bottom: 4px; }
.fle-row {
  display: flex;
  gap: 4px;
  align-items: center;
}
.fle-row :deep(.ant-input) {
  flex: 1;
}
.fle-row.sub { margin-bottom: 4px; }
.fle-row.sub :deep(.ant-input) { width: 0; }
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
.fle-del:hover { background: #fff1f0; border-color: #ffccc7; }
.fle-icon-btn {
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  border: 1px solid #d9d9d9;
  background: #fff;
  color: #8c8c8c;
  border-radius: 3px;
  cursor: pointer;
  font-size: 11px;
  line-height: 1;
}
.fle-icon-btn:hover { color: #1677ff; border-color: #91caff; }
.fle-icon-btn.on { color: #fff; background: #1677ff; border-color: #1677ff; }
.fle-map {
  margin: 4px 0 6px;
  padding: 6px;
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 3px;
}
.fle-map-title { font-size: 12px; color: #8c8c8c; margin-bottom: 4px; }
.arrow { color: #bbb; font-size: 12px; }
</style>
