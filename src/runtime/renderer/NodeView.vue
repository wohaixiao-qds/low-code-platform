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
    <div v-if="design && isRow" class="container-handle" :class="{ 'is-selected': isSelected }" @click.stop="onSelect">
      <span class="grip">⠿</span>
      <span class="handle-label">行 · {{ node.props.columns ?? 1 }} 列</span>
      <div v-if="isSelected" class="handle-actions">
        <button class="tool-btn" title="复制" @click.stop="design!.onDuplicate(node.id)">⧉</button>
        <button class="tool-btn danger" title="删除" @click.stop="design!.onRemove(node.id)">✕</button>
      </div>
    </div>
    <template v-else-if="design">
      <span class="node-name">{{ label }}</span>
      <div class="node-actions">
        <button class="act" title="复制" @click.stop="design!.onDuplicate(node.id)"><CopyOutlined /></button>
        <button class="act danger" title="删除" @click.stop="design!.onRemove(node.id)"><DeleteOutlined /></button>
      </div>
    </template>
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
import { CopyOutlined, DeleteOutlined } from '@ant-design/icons-vue'
import { resolveComponent, getMeta, type ComponentNode } from '@/core'
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
const label = computed(() => getMeta(props.node.type)?.label ?? props.node.type)
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
  border-radius: 4px;
  transition: border-color 0.12s, background 0.12s;
}
.node-wrap:hover {
  border-color: #91caff;
  background: #f5faff;
}
.node-wrap.is-selected {
  border: 1px solid #1677ff;
  background: #eff6ff;
}
.node-wrap.is-container {
  min-height: 40px;
  padding: 4px;
  padding-top: 0;
}
/* 叶子：组件名标签 + 圆形复制/删除，悬浮或选中时浮现 */
.node-name {
  position: absolute;
  top: -9px;
  left: 8px;
  display: none;
  padding: 0 6px;
  font-size: 11px;
  line-height: 16px;
  color: #1677ff;
  background: #fff;
  border: 1px solid #1677ff;
  border-radius: 3px;
  z-index: 6;
  white-space: nowrap;
}
.node-actions {
  position: absolute;
  top: -11px;
  right: 6px;
  display: none;
  gap: 4px;
  z-index: 6;
}
.node-wrap:hover .node-name,
.node-wrap.is-selected .node-name,
.node-wrap:hover .node-actions,
.node-wrap.is-selected .node-actions {
  display: flex;
}
.node-wrap .node-name { display: none; }
.node-wrap:hover .node-name,
.node-wrap.is-selected .node-name { display: block; }
.node-wrap .act {
  width: 20px;
  height: 20px;
  padding: 0;
  font-size: 11px;
  color: #1677ff;
  background: #fff;
  border: 1px solid #1677ff;
  border-radius: 50%;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.12s;
}
.node-wrap .act:hover {
  background: #1677ff;
  color: #fff;
}
.node-wrap .act.danger {
  color: #ff4d4f;
  border-color: #ff4d4f;
}
.node-wrap .act.danger:hover {
  background: #ff4d4f;
  color: #fff;
}
/* 容器（行）手柄 */
.container-handle {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 6px;
  margin: 2px 0 6px;
  font-size: 12px;
  color: #666;
  background: #f0f0f0;
  border: 1px solid #e4e4e4;
  border-radius: 3px;
  cursor: grab;
  user-select: none;
}
.container-handle:hover {
  background: #e6f4ff;
  border-color: #91caff;
}
.container-handle.is-selected {
  background: #1677ff;
  color: #fff;
  border-color: #1677ff;
}
.container-handle .grip {
  cursor: grab;
  opacity: 0.6;
  line-height: 1;
}
.container-handle .handle-label {
  flex: 1;
}
.container-handle .handle-actions {
  display: flex;
  gap: 2px;
}
.node-wrap.drop-target {
  border: 1px dashed #1677ff;
  background: #e6f4ff;
}
.row-empty {
  padding: 14px;
  text-align: center;
  color: #bbb;
  font-size: 12px;
  border: 1px dashed #d9d9d9;
  border-radius: 4px;
  background: #fff;
}
/* 容器手柄上的小按钮 */
.tool-btn {
  background: transparent;
  border: none;
  color: #fff;
  cursor: pointer;
  padding: 0 4px;
  font-size: 12px;
  line-height: 16px;
}
.tool-btn:hover { background: rgba(255,255,255,0.25); }
.tool-btn.danger:hover { background: #ff4d4f; }
</style>
