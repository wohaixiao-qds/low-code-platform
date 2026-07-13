<template>
  <div class="canvas" @click="store.selectNode(null)" @dragover.prevent @drop="onDrop">
    <Renderer v-if="store.schema.body.length" :schema="store.schema" :ctx="ctx" :design="design" />
    <div v-else class="empty">把左侧物料拖到这里</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useEditorStore, genNodeId } from '../store/editor'
import { Renderer, usePageRuntime } from '@/runtime'
import { getMeta } from '@/core'
import type { DesignContext } from '@/runtime/renderer/NodeView.vue'

const store = useEditorStore()
const ctx = usePageRuntime(store.schema)

// 设计态交互上下文：selectedId 走 computed 保持响应；点击节点会 stopPropagation，不会冒泡到画布的取消选中
const design = computed<DesignContext>(() => ({
  selectedId: store.selectedId,
  onSelect: (id: string) => store.selectNode(id),
  onDuplicate: (id: string) => store.duplicateNode(id),
  onRemove: (id: string) => store.removeNode(id),
  onDropInto: (parentId: string, type: string) => dropInto(parentId, type),
}))

// 创建一个 type 物料的节点并放入指定父级（'__root__' 为画布根）
function dropInto(parentId: string, type: string) {
  const meta = getMeta(type)
  if (!meta) return
  const id = genNodeId()
  const props: Record<string, unknown> = {}
  for (const p of meta.propsSchema) if (p.default !== undefined) props[p.name] = p.default
  store.addNode(parentId, { id, type, props, ...(meta.isContainer ? { children: [] } : {}) })
  store.selectNode(id)
  // 用完即清，避免误触发
  ;(globalThis as unknown as Record<string, unknown>).__dragType = undefined
}

function onDrop() {
  const type = (globalThis as unknown as Record<string, unknown>).__dragType as string | undefined
  if (!type) return
  dropInto('__root__', type)
}
</script>

<style scoped>
.canvas {
  height: 100%;
  min-height: 100%;
  background-color: #fafafa;
  background-image: radial-gradient(#e0e0e0 1px, transparent 1px);
  background-size: 16px 16px;
}
.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 320px;
  color: #999;
  border: 1px dashed #d9d9d9;
  border-radius: 4px;
  background: #fafafa;
}
</style>
