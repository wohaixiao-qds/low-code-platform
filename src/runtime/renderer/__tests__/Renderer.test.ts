import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { reactive } from 'vue'
import Antd from 'ant-design-vue'
import { clearRegistry } from '@/core'
import { registerAll } from '@/components'
import Renderer from '../Renderer.vue'
import type { PageSchema } from '@/core'
import type { PageRuntimeContext } from '../../usePageRuntime'

// jsdom 缺少 matchMedia，antd 的 a-row/a-col ResponsiveObserve 依赖它。
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  })
}

const schema: PageSchema = {
  version: 1,
  type: 'form',
  id: 'p1',
  name: 't',
  body: [
    { id: 'n1', type: 'Input', props: { label: '客户名' }, bindings: { field: 'name' } },
  ],
}

// Renderer 接收的 ctx 类型由 Task 11 的 usePageRuntime 定义；
// 这里用 PageRuntimeContext 直接构造，校验签名稳定。
describe('Renderer', () => {
  beforeEach(() => {
    clearRegistry()
    registerAll()
  })

  it('渲染 Input 并显示 label', () => {
    const ctx: PageRuntimeContext = {
      data: reactive({}),
      error: null,
      async refresh() {},
      async submit() {},
      reset() {},
    }
    const w = mount(Renderer, {
      props: { schema, ctx },
      global: { plugins: [Antd] },
    })
    expect(w.text()).toContain('客户名')
  })

  it('Row 容器按 columns/colSpan 分配 a-col span', () => {
    const rowSchema: PageSchema = {
      version: 1,
      type: 'form',
      id: 'p2',
      name: 't2',
      body: [
        {
          id: 'r1',
          type: 'Row',
          props: { columns: 2 },
          children: [
            { id: 'c1', type: 'Input', props: { label: '甲', colSpan: 1 }, bindings: { field: 'a' } },
            { id: 'c2', type: 'Input', props: { label: '乙', colSpan: 1 }, bindings: { field: 'b' } },
          ],
        },
      ],
    }
    const ctx: PageRuntimeContext = {
      data: reactive({}),
      error: null,
      async refresh() {},
      async submit() {},
      reset() {},
    }
    const w = mount(Renderer, {
      props: { schema: rowSchema, ctx },
      global: { plugins: [Antd] },
    })
    // columns=2, colSpan=1 → span=12 for each col（antd 把 span 渲染为 class ant-col-12）
    expect(w.html()).toContain('ant-col-12')
    expect(w.text()).toContain('甲')
    expect(w.text()).toContain('乙')
  })

  it('ctx.error 时渲染错误态重试', async () => {
    const ctx: PageRuntimeContext = {
      data: reactive({}),
      error: new Error('boom'),
      async refresh() {},
      async submit() {},
      reset() {},
    }
    const w = mount(Renderer, {
      props: { schema, ctx },
      global: { plugins: [Antd] },
    })
    expect(w.text()).toContain('加载失败')
  })
})
