<template>
  <!-- 设计态：用选中层包裹 -->
  <div
    v-if="design"
    class="node-wrap"
    :class="{ 'is-selected': isSelected, 'is-container': isRow, 'drop-target': isRow && dragOver }"
    draggable="true"
    @click.stop="onSelect"
    @dragstart.stop="onDragStart"
    @dragover.prevent.stop="isRow ? (dragOver = true) : undefined"
    @dragleave.stop="isRow ? (dragOver = false) : undefined"
    @drop.stop="onRowDrop"
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
    <div v-if="isRow && !node.children?.length" class="row-empty">把字段拖到这里放入此行</div>
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
import { computed, ref } from 'vue'
import { resolveComponent, type ComponentNode } from '@/core'
import type { PageRuntimeContext } from '../usePageRuntime'

defineOptions({ name: 'NodeView' })

/** 设计态交互上下文：由 Canvas 注入，运行时不传 */
export interface DesignContext {
  selectedId: string | null
  onSelect: (id: string) => void
  onDuplicate: (id: string) => void
  onRemove: (id: string) => void
  /** 拖拽落到 parentId 上：Canvas 依据全局标记区分「新建(__dragType)」或「移动(__dragNodeId)」 */
  onDropAt: (parentId: string) => void
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
const dragOver = ref(false)
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

// 拖起已有节点 → 标记为「移动」拖拽，清掉物料拖拽标记
function onDragStart() {
  const g = globalThis as unknown as Record<string, unknown>
  g.__dragNodeId = props.node.id
  g.__dragType = undefined
}

// Row 作为放置目标：交给 Canvas 的 onDropAt 统一处理（新建 or 移动）
function onRowDrop() {
  if (!isRow.value || !props.design) {
    dragOver.value = false
    return
  }
  dragOver.value = false
  props.design.onDropAt(props.node.id)
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
.node-wrap.is-container {
  min-height: 40px;
  padding: 4px;
}
.node-wrap.drop-target {
  border: 1px dashed #1677ff;
  background: #e6f4ff;
}
.row-empty {
  padding: 12px;
  text-align: center;
  color: #bbb;
  font-size: 12px;
  border: 1px dashed #d9d9d9;
  border-radius: 4px;
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
