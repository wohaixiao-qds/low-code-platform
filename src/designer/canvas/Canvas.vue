<template>
  <div class="canvas" @dragover.prevent @drop="onDrop">
    <Renderer v-if="store.schema.body.length" :schema="store.schema" :ctx="ctx" />
    <div v-else class="empty">把左侧物料拖到这里</div>
  </div>
</template>

<script setup lang="ts">
import { useEditorStore } from '../store/editor'
import { Renderer, usePageRuntime } from '@/runtime'
import { getMeta } from '@/core'

const store = useEditorStore()
const ctx = usePageRuntime(store.schema)

function onDrop() {
  const type = (globalThis as unknown as Record<string, unknown>).__dragType as string | undefined
  if (!type) return
  const meta = getMeta(type)
  if (!meta) return
  // 新节点 id 用计数
  const id = `n${Date.now()}`
  const props: Record<string, unknown> = {}
  for (const p of meta.propsSchema) if (p.default !== undefined) props[p.name] = p.default
  store.addNode('__root__', { id, type, props, ...(meta.isContainer ? { children: [] } : {}) })
  store.selectNode(id)
}
</script>
