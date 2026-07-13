import { defineStore } from 'pinia'
import type { ComponentNode, DataSourceSchema, PageSchema } from '@/core'

const ROOT = '__root__'

let idSeq = 0
/** 生成不冲突的节点 id（替代易碰撞的 Date.now()） */
export function genNodeId(): string {
  idSeq += 1
  return `n${Date.now().toString(36)}-${idSeq.toString(36)}`
}

/** 深拷贝节点子树并重新生成所有 id（用于复制） */
function cloneWithNewIds(node: ComponentNode): ComponentNode {
  return {
    ...node,
    id: genNodeId(),
    props: { ...node.props },
    bindings: node.bindings ? { ...node.bindings } : undefined,
    children: node.children?.map(cloneWithNewIds),
  }
}

/** targetId 是否在 node 的子孙子树内（防循环：不能把节点移进自己的后代） */
function isDescendant(node: ComponentNode, targetId: string): boolean {
  if (!node.children) return false
  for (const c of node.children) {
    if (c.id === targetId) return true
    if (isDescendant(c, targetId)) return true
  }
  return false
}

function findNode(nodes: ComponentNode[], id: string): ComponentNode | undefined {
  for (const n of nodes) {
    if (n.id === id) return n
    if (n.children) {
      const f = findNode(n.children, id)
      if (f) return f
    }
  }
  return undefined
}

function findParent(
  nodes: ComponentNode[],
  id: string,
): ComponentNode[] | null {
  for (const n of nodes) {
    if (n.id === id) return nodes
    if (n.children) {
      const p = findParent(n.children, id)
      if (p) return p
    }
  }
  return null
}

export const useEditorStore = defineStore('editor', {
  state: () => ({
    schema: {
      version: 1,
      type: 'form' as const,
      id: '',
      name: '未命名',
      body: [],
    } as PageSchema,
    selectedId: null as string | null,
    history: [] as PageSchema[],
  }),
  getters: {
    selectedNode(state): ComponentNode | undefined {
      if (!state.selectedId) return undefined
      return findNode(state.schema.body, state.selectedId)
    },
  },
  actions: {
    setSchema(s: PageSchema) {
      this.schema = JSON.parse(JSON.stringify(s))
      this.history = []
    },
    snapshot() {
      this.history.push(JSON.parse(JSON.stringify(this.schema)))
    },
    selectNode(id: string | null) {
      this.selectedId = id
    },
    addNode(parentId: string, node: ComponentNode) {
      this.snapshot()
      if (parentId === ROOT) {
        this.schema.body.push(node)
        return
      }
      const parent = findNode(this.schema.body, parentId)
      if (parent) {
        parent.children = parent.children ?? []
        parent.children.push(node)
      }
    },
    removeNode(id: string) {
      this.snapshot()
      const parent = findParent(this.schema.body, id)
      if (parent) {
        const i = parent.findIndex((n) => n.id === id)
        if (i >= 0) parent.splice(i, 1)
      }
    },
    duplicateNode(id: string) {
      this.snapshot()
      const parent = findParent(this.schema.body, id)
      if (!parent) return
      const idx = parent.findIndex((n) => n.id === id)
      if (idx < 0) return
      const clone = cloneWithNewIds(parent[idx])
      parent.splice(idx + 1, 0, clone)
      this.selectedId = clone.id
    },
    /** 把 id 节点移到 targetParentId 下（'__root__' 为画布根）。禁止移入自身或自己的后代。 */
    moveNode(id: string, targetParentId: string) {
      if (id === targetParentId) return
      const node = findNode(this.schema.body, id)
      if (!node) return
      // 目标若是本节点的后代 → 会成环，拒绝
      if (targetParentId !== ROOT && isDescendant(node, targetParentId)) return
      this.snapshot()
      const srcParent = findParent(this.schema.body, id)
      if (srcParent) {
        const i = srcParent.findIndex((n) => n.id === id)
        if (i >= 0) srcParent.splice(i, 1)
      }
      if (targetParentId === ROOT) {
        this.schema.body.push(node)
      } else {
        const target = findNode(this.schema.body, targetParentId)
        if (target) {
          target.children = target.children ?? []
          target.children.push(node)
        }
      }
      this.balanceColumns(targetParentId)
      this.selectedId = id
    },
    /** Row 容器按子节点数自动分列（封顶 4）。非容器或根忽略。 */
    balanceColumns(parentId: string) {
      if (parentId === ROOT) return
      const n = findNode(this.schema.body, parentId)
      if (n && n.children && n.type === 'Row') {
        n.props = { ...n.props, columns: Math.min(n.children.length, 4) }
      }
    },
    updateProps(id: string, props: Record<string, unknown>) {
      const n = findNode(this.schema.body, id)
      if (n) n.props = { ...n.props, ...props }
    },
    updateBindings(id: string, field: string) {
      const n = findNode(this.schema.body, id)
      if (n) n.bindings = { ...(n.bindings ?? {}), field }
    },
    setDataSource(ds: DataSourceSchema) {
      this.schema.dataSource = ds
    },
    setName(name: string) {
      this.schema.name = name
    },
    undo() {
      const prev = this.history.pop()
      if (prev) this.schema = prev
    },
  },
})
