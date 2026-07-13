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
import { getMeta, type ComponentNode } from '@/core'
import type { DesignContext } from '@/runtime/renderer/NodeView.vue'

const store = useEditorStore()
const ctx = usePageRuntime(store.schema)

// 设计态交互上下文：selectedId 走 computed 保持响应；点击节点会 stopPropagation，不会冒泡到画布的取消选中
const design = computed<DesignContext>(() => ({
  selectedId: store.selectedId,
  onSelect: (id: string) => store.selectNode(id),
  onDuplicate: (id: string) => store.duplicateNode(id),
  onRemove: (id: string) => store.removeNode(id),
  onDropAt: (parentId: string) => handleDropAt(parentId),
}))

// 根据 meta 构建一个新节点（填默认值；容器初始化 children）
function createNode(type: string): ComponentNode | null {
  const meta = getMeta(type)
  if (!meta) return null
  const id = genNodeId()
  const props: Record<string, unknown> = {}
  for (const p of meta.propsSchema) if (p.default !== undefined) props[p.name] = p.default
  const node: ComponentNode = { id, type, props }
  if (meta.isContainer) node.children = []
  return node
}

// 把 type 物料放入指定父级（'__root__' 为画布根）
function dropInto(parentId: string, type: string) {
  const meta = getMeta(type)
  if (!meta) return
  const node = createNode(type)
  if (!node) return
  // 表单字段落到画布根：自动包一层 Row，让列布局/跨列天然可调
  if (parentId === '__root__' && meta.group === '表单字段') {
    const row = createNode('Row')
    if (row) {
      row.children = [node]
      store.addNode('__root__', row)
    } else {
      store.addNode('__root__', node)
    }
  } else {
    store.addNode(parentId, node)
    // 拖进已有 Row：按子节点数自动分列
    if (parentId !== '__root__') store.balanceColumns(parentId)
  }
  store.selectNode(node.id)
}

// 统一放置入口：区分「移动已有节点」和「新建物料」
function handleDropAt(parentId: string) {
  const g = globalThis as unknown as Record<string, unknown>
  const dragNodeId = g.__dragNodeId as string | undefined
  const dragType = g.__dragType as string | undefined
  if (dragNodeId) {
    store.moveNode(dragNodeId, parentId)
  } else if (dragType) {
    dropInto(parentId, dragType)
  }
  // 用完即清，避免误触发
  g.__dragNodeId = undefined
  g.__dragType = undefined
}

function onDrop() {
  handleDropAt('__root__')
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
