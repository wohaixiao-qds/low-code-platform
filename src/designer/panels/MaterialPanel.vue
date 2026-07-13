<template>
  <div class="material-panel">
    <h3>物料</h3>
    <a-input
      v-model:value="query"
      placeholder="搜索组件"
      allow-clear
      size="small"
      class="search"
    >
      <template #prefix><span class="search-icon">🔍</span></template>
    </a-input>
    <div v-for="g in groups" :key="g.name" class="group">
      <div class="group-title">{{ g.name }}</div>
      <div
        v-for="m in g.items"
        :key="m.type"
        class="material-item"
        draggable="true"
        :title="m.label"
        @dragstart="onDragStart(m.type)"
      >
        <span class="material-icon">{{ m.icon ?? '◻' }}</span>
        <span class="material-label">{{ m.label }}</span>
      </div>
      <div v-if="!g.items.length" class="no-match">无匹配</div>
    </div>
    <div v-if="!groups.length || totalShown === 0" class="no-match">未找到「{{ query }}」相关组件</div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { listAll, type PageType } from '@/core'

const props = defineProps<{ pageType: PageType }>()
const query = ref('')

const groups = computed(() => {
  const q = query.value.trim().toLowerCase()
  const all = listAll().filter((m) => !m.pageTypes || m.pageTypes.includes(props.pageType))
  const filtered = q
    ? all.filter((m) => m.label.toLowerCase().includes(q) || m.type.toLowerCase().includes(q))
    : all
  const map = new Map<string, typeof all>()
  for (const m of filtered) {
    const arr = map.get(m.group) ?? []
    arr.push(m)
    map.set(m.group, arr)
  }
  return [...map.entries()].map(([name, items]) => ({ name, items }))
})

const totalShown = computed(() => groups.value.reduce((n, g) => n + g.items.length, 0))

function onDragStart(type: string) {
  ;(globalThis as unknown as Record<string, unknown>).__dragType = type
}
</script>

<style scoped>
.material-panel { padding: 0 8px; }
.search { margin-bottom: 8px; }
.search-icon { opacity: 0.5; }
.group { margin-bottom: 8px; }
.group-title {
  font-size: 12px;
  color: #999;
  padding: 4px 0;
}
.material-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 6px;
  border-radius: 4px;
  cursor: grab;
  user-select: none;
  font-size: 13px;
}
.material-item:hover { background: #f0f5ff; }
.material-item:active { cursor: grabbing; }
.material-icon { width: 16px; text-align: center; font-size: 14px; }
.no-match { color: #ccc; font-size: 12px; padding: 4px 6px; }
</style>
