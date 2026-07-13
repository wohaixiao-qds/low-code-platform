<template>
  <!-- 设计态：用选中层包裹 -->
  <div
    v-if="design"
    class="node-wrap"
    :class="{ 'is-selected': isSelected, 'is-container': isRow }"
    @click.stop="onSelect"
  >
    <div v-if="isSelected" class="node-toolbar">
      <span class="node-type">{{ node.type }}</span>
      <button class="tool-btn" title="复制" @click.stop="design!.onDuplicate(node.id)">⧉</button>
      <button class="tool-btn danger" title="删除" @click.stop="design!.onRemove(node.id)">✕</button>
    </div>
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
      <a-col v-for="child in node.children" :key="child.id" :span="colSpan(child)">
        <NodeView :node="child" :ctx="ctx" :design="design" @submit="emit('submit')" @reset="emit('reset')" @search="(v: Record<string, unknown>) => emit('search', v)" />
      </a-col>
    </a-row>
  </div>
  <!-- 运行态：原样渲染（运行时不传 design） -->
  <component
    v-else-if="comp && !isRow"
    :is="comp"
    :prop-values="node.props"
    :value="fieldValue"
    @update:value="onUpdate"
    @submit="emit('submit')"
    @reset="emit('reset')"
    @search="(v: Record<string, unknown>) => emit('search', v)"
  />
  <a-row v-else-if="isRow" :gutter="16">
    <a-col v-for="child in node.children" :key="child.id" :span="colSpan(child)">
      <NodeView :node="child" :ctx="ctx" @submit="emit('submit')" @reset="emit('reset')" @search="(v: Record<string, unknown>) => emit('search', v)" />
    </a-col>
  </a-row>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { resolveComponent, type ComponentNode } from '@/core'
import type { PageRuntimeContext } from '../usePageRuntime'

defineOptions({ name: 'NodeView' })

/** 设计态交互上下文：由 Canvas 注入，运行时不传 */
export interface DesignContext {
  selectedId: string | null
  onSelect: (id: string) => void
  onDuplicate: (id: string) => void
  onRemove: (id: string) => void
}

const props = defineProps<{
  node: ComponentNode
  ctx: PageRuntimeContext
  design?: DesignContext
}>()
const emit = defineEmits<{
  (e: 'submit'): void
  (e: 'reset'): void
  (e: 'search', v: Record<string, unknown>): void
}>()

const comp = computed(() => resolveComponent<any>(props.node.type))
const isRow = computed(() => props.node.type === 'Row')
const isSelected = computed(() => props.design?.selectedId === props.node.id)
const fieldValue = computed(() => {
  const f = props.node.bindings?.field
  return f ? props.ctx.data[f] : undefined
})

function onUpdate(v: unknown) {
  const f = props.node.bindings?.field
  if (f) props.ctx.data[f] = v as unknown
}

function onSelect() {
  props.design?.onSelect(props.node.id)
}

function colSpan(child: ComponentNode): number {
  const columns = Number(props.node.props.columns ?? 1)
  const span = Number(child.props.colSpan ?? 1)
  return Math.floor((24 / columns) * span)
}
</script>

<style scoped>
.node-wrap {
  position: relative;
  border: 1px dashed transparent;
  border-radius: 2px;
  transition: border-color 0.1s;
}
.node-wrap:hover {
  border-color: #91caff;
}
.node-wrap.is-selected {
  border: 1px solid #1677ff;
  outline: 1px solid #1677ff;
}
.node-toolbar {
  position: absolute;
  top: -22px;
  right: 0;
  display: flex;
  align-items: center;
  gap: 2px;
  background: #1677ff;
  color: #fff;
  padding: 1px 4px;
  border-radius: 2px;
  font-size: 12px;
  line-height: 16px;
  z-index: 5;
  white-space: nowrap;
}
.node-toolbar .node-type {
  padding: 0 4px;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
}
.tool-btn {
  background: transparent;
  border: none;
  color: #fff;
  cursor: pointer;
  padding: 0 4px;
  font-size: 12px;
  line-height: 16px;
}
.tool-btn:hover { background: rgba(255,255,255,0.2); }
.tool-btn.danger:hover { background: #ff4d4f; }
</style>
