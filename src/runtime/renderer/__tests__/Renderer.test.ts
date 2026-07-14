import { describe, it, expect, beforeEach, vi } from 'vitest'
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

describe('条件显示', () => {
  beforeEach(() => {
    clearRegistry()
    registerAll()
  })

  it('运行态：visibleIf 不满足则不渲染；满足后出现', async () => {
    const visSchema: PageSchema = {
      version: 1,
      type: 'form',
      id: 'p',
      name: 't',
      body: [
        { id: 'n1', type: 'Input', props: { label: '类型' }, bindings: { field: 'type' } },
        { id: 'n2', type: 'Input', props: { label: '身份证' }, visibleIf: [{ field: 'type', op: '==', value: '个人' }] },
      ],
    }
    const ctx: PageRuntimeContext = {
      data: reactive({ type: '企业' }),
      error: null,
      async refresh() {},
      async submit() {},
      reset() {},
    }
    const w = mount(Renderer, {
      props: { schema: visSchema, ctx },
      global: { plugins: [Antd] },
    })
    expect(w.text()).toContain('类型')
    expect(w.text()).not.toContain('身份证')
    // 切换值后出现
    ;(ctx.data as any).type = '个人'
    await w.vm.$nextTick()
    expect(w.text()).toContain('身份证')
  })
})

describe('表单提交校验', () => {
  beforeEach(() => {
    clearRegistry()
    registerAll()
  })

  it('form 校验失败时不调用 submit', async () => {
    const formSchema: PageSchema = {
      version: 1,
      type: 'form',
      id: 'p',
      name: 't',
      body: [
        { id: 'n1', type: 'Input', props: { label: '姓名', required: true }, bindings: { field: 'name' } },
        { id: 'n2', type: 'FormActions', props: { submitText: '提交' } },
      ],
    }
    const submit = vi.fn()
    const ctx: PageRuntimeContext = {
      data: reactive({}),
      error: null,
      async refresh() {},
      async submit() {
        submit()
      },
      reset() {},
    }
    const w = mount(Renderer, {
      props: { schema: formSchema, ctx },
      global: { plugins: [Antd] },
    })
    // 通过 FormActions 的提交按钮触发 submit 事件链 → Renderer.onSubmit
    // FormActions 第一个按钮（type=primary）即提交按钮
    const buttons = w.findAll('.form-actions button')
    expect(buttons.length).toBeGreaterThan(0)
    await buttons[0].trigger('click')
    await new Promise((r) => setTimeout(r, 0))
    // 姓名 required、data.name 为空 → 校验失败 → submit 不应被调用
    expect(submit).not.toHaveBeenCalled()
  })

  it('form 校验通过时调用 submit', async () => {
    const formSchema: PageSchema = {
      version: 1,
      type: 'form',
      id: 'p2',
      name: 't2',
      body: [
        { id: 'n1', type: 'Input', props: { label: '姓名', required: true }, bindings: { field: 'name' } },
        { id: 'n2', type: 'FormActions', props: { submitText: '提交' } },
      ],
    }
    const submit = vi.fn()
    const ctx: PageRuntimeContext = {
      data: reactive({ name: '张三' }),
      error: null,
      async refresh() {},
      async submit() {
        submit()
      },
      reset() {},
    }
    const w = mount(Renderer, {
      props: { schema: formSchema, ctx },
      global: { plugins: [Antd] },
    })
    const buttons = w.findAll('.form-actions button')
    await buttons[0].trigger('click')
    await new Promise((r) => setTimeout(r, 0))
    expect(submit).toHaveBeenCalled()
  })

  it('list 类型不包 a-form（不校验）', () => {
    const listSchema: PageSchema = {
      version: 1,
      type: 'list',
      id: 'lp',
      name: 'lt',
      body: [{ id: 't1', type: 'Table', props: {} }],
    }
    const ctx: PageRuntimeContext = {
      data: reactive({}),
      error: null,
      async refresh() {},
      async submit() {},
      reset() {},
    }
    const w = mount(Renderer, {
      props: { schema: listSchema, ctx },
      global: { plugins: [Antd] },
    })
    // list 类型不应包 a-form
    expect(w.find('form').exists()).toBe(false)
    expect(w.find('.renderer').exists()).toBe(true)
  })
})
