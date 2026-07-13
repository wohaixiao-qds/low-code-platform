<template>
  <component
    v-if="comp && !isRow"
    :is="comp"
    :prop-values="node.props"
    :value="fieldValue"
    @update:value="onUpdate"
    @submit="emit('submit')"
    @reset="emit('reset')"
    @search="(v: Record<string, unknown>) => emit('search', v)"
  />
  <a-row v-else-if="isRow" :gutter="16">
    <a-col
      v-for="child in node.children"
      :key="child.id"
      :span="colSpan(child)"
    >
      <NodeView
        :node="child"
        :ctx="ctx"
        @submit="emit('submit')"
        @reset="emit('reset')"
        @search="(v: Record<string, unknown>) => emit('search', v)"
      />
    </a-col>
  </a-row>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { resolveComponent, type ComponentNode } from '@/core'
import type { PageRuntimeContext } from '../usePageRuntime'

defineOptions({ name: 'NodeView' })

const props = defineProps<{
  node: ComponentNode
  ctx: PageRuntimeContext
}>()
const emit = defineEmits<{
  (e: 'submit'): void
  (e: 'reset'): void
  (e: 'search', v: Record<string, unknown>): void
}>()

const comp = computed(() => resolveComponent<any>(props.node.type))
const isRow = computed(() => props.node.type === 'Row')
const fieldValue = computed(() => {
  const f = props.node.bindings?.field
  return f ? props.ctx.data[f] : undefined
})

function onUpdate(v: unknown) {
  const f = props.node.bindings?.field
  if (f) props.ctx.data[f] = v as unknown
}

function colSpan(child: ComponentNode): number {
  const columns = Number(props.node.props.columns ?? 1)
  const span = Number(child.props.colSpan ?? 1)
  return Math.floor((24 / columns) * span)
}
</script>
