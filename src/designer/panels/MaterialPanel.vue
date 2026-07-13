<template>
  <div class="material-panel">
    <h3>物料</h3>
    <div v-for="g in groups" :key="g.name" class="group">
      <div class="group-title">{{ g.name }}</div>
      <div
        v-for="m in g.items"
        :key="m.type"
        class="material-item"
        draggable="true"
        @dragstart="onDragStart(m.type)"
      >{{ m.label }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { listAll, type PageType } from '@/core'

const props = defineProps<{ pageType: PageType }>()

const groups = computed(() => {
  const all = listAll().filter((m) => !m.pageTypes || m.pageTypes.includes(props.pageType))
  const map = new Map<string, typeof all>()
  for (const m of all) {
    const arr = map.get(m.group) ?? []
    arr.push(m)
    map.set(m.group, arr)
  }
  return [...map.entries()].map(([name, items]) => ({ name, items }))
})

function onDragStart(type: string) {
  // MVP 拖拽传输：用 globalThis.__dragType 作为载体（见 Canvas.onDrop 读取）
  ;(globalThis as unknown as Record<string, unknown>).__dragType = type
}
</script>
