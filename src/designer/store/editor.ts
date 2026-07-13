import { defineStore } from 'pinia'
import type { ComponentNode, DataSourceSchema, PageSchema } from '@/core'

const ROOT = '__root__'

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
