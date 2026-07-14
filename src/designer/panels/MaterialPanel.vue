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
    <div v-for="g in groups" :key="g.name" class="m-group">
      <div class="m-group-title">{{ g.name }}</div>
      <div class="m-grid">
        <div
          v-for="m in g.items"
          :key="m.type"
          class="m-tile"
          :title="m.label"
          draggable="true"
          @dragstart="onDragStart(m.type)"
        >
          <span class="m-icon">{{ m.icon ?? '◻' }}</span>
          <span class="m-label">{{ m.label }}</span>
        </div>
      </div>
    </div>
    <div v-if="totalShown === 0" class="no-match">未找到「{{ query }}」相关组件</div>
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
  const g = globalThis as unknown as Record<string, unknown>
  g.__dragType = type
  g.__dragNodeId = undefined // 物料拖拽 = 新建，清掉移动标记
}
</script>

<style scoped>
.material-panel { padding: 0 8px; }
.material-panel h3 { margin: 0 0 8px; }
.search { margin-bottom: 10px; }
.search-icon { opacity: 0.5; }

.m-group {
  background: #fff;
  border-radius: 4px;
  padding: 8px;
  margin-bottom: 10px;
  border: 1px solid #f0f0f0;
}
.m-group-title {
  font-size: 13px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}
.m-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}
.m-tile {
  display: flex;
  align-items: center;
  gap: 5px;
  height: 32px;
  padding: 0 8px;
  font-size: 12px;
  color: #595959;
  background: #f5f9ff;
  border: 1px solid #f0f6ff;
  border-radius: 3px;
  cursor: grab;
  user-select: none;
  transition: all 0.15s;
}
.m-tile:hover {
  border-color: #1677ff;
  color: #1677ff;
  background: #e6f4ff;
}
.m-tile:active { cursor: grabbing; }
.m-icon { width: 14px; text-align: center; font-size: 13px; }
.m-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.no-match { color: #bbb; font-size: 12px; padding: 8px; text-align: center; }
</style>
