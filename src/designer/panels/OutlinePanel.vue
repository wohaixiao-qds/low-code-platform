<template>
  <div class="outline">
    <h3>大纲</h3>
    <div v-if="!flat.length" class="empty">暂无组件</div>
    <div
      v-for="f in flat"
      :key="f.node.id"
      class="outline-item"
      :class="{ active: f.node.id === store.selectedId, 'is-container': f.node.type === 'Row' }"
      :style="{ paddingLeft: 6 + f.depth * 14 + 'px' }"
      @click="store.selectNode(f.node.id)"
    >
      <span class="oi-icon"><MaterialIcon :type="f.node.type" /></span>
      <span class="oi-label">{{ labelOf(f.node.type) }}</span>
      <span v-if="f.node.bindings?.field" class="oi-field">· {{ f.node.bindings.field }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useEditorStore } from '../store/editor'
import { getMeta, type ComponentNode } from '@/core'
import MaterialIcon from '@/components/MaterialIcon.vue'

const store = useEditorStore()

interface FlatNode { node: ComponentNode; depth: number }
function flatten(nodes: ComponentNode[], depth = 0, acc: FlatNode[] = []): FlatNode[] {
  for (const n of nodes) {
    acc.push({ node: n, depth })
    if (n.children?.length) flatten(n.children, depth + 1, acc)
  }
  return acc
}
const flat = computed(() => flatten(store.schema.body))

const labelOf = (t: string) => getMeta(t)?.label ?? t
</script>

<style scoped>
.outline { padding: 0 8px; }
.outline h3 { margin: 0 0 6px; }
.empty { color: #bbb; font-size: 12px; padding: 8px 0; }
.outline-item {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 6px;
  margin: 1px 0;
  border-radius: 3px;
  border-left: 2px solid transparent;
  cursor: pointer;
  font-size: 13px;
  color: #555;
  user-select: none;
}
.outline-item:hover { background: #f2f2f2; }
.outline-item.active {
  background: #e6f4ff;
  border-left-color: #1677ff;
  color: #1677ff;
  font-weight: 500;
}
.outline-item.is-container .oi-label { font-weight: 600; }
.oi-icon {
  width: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: #8c8c8c;
}
.outline-item.active .oi-icon { color: #1677ff; }
.oi-label { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.oi-field { color: #999; font-size: 12px; }
.outline-item.active .oi-field { color: #69b1ff; }
</style>
