import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import Antd from 'ant-design-vue'
import { createRouter, createMemoryHistory } from 'vue-router'
import { h } from 'vue'
import { clearRegistry } from '@/core'
import { registerAll } from '@/components'
import { pageStorage } from '@/storage'
import type { PageSchema } from '@/core'
import RenderView from '../RenderView.vue'

// jsdom 缺少 matchMedia，antd 的 ResponsiveObserve（a-row/a-col 等）依赖它。
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
  id: 'p-render-1',
  name: '集成测试表单',
  body: [
    { id: 'n1', type: 'Input', props: { label: '客户名' }, bindings: { field: 'name' } },
  ],
}

describe('RenderView 集成（Task 16）', () => {
  beforeEach(async () => {
    clearRegistry()
    registerAll()
    localStorage.clear()
    await pageStorage.save(schema)
  })

  it('从 pageStorage 载入 schema 后渲染绑定字段', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/render/:id', component: { render: () => h(RenderView) } },
      ],
    })
    await router.push('/render/p-render-1')
    await router.isReady()

    const wrapper = mount(
      { render: () => h(RenderView) },
      { global: { plugins: [Antd, router] } },
    )

    // 等待 onMounted 里的异步 pageStorage.get + refresh 完成。
    await new Promise((r) => setTimeout(r, 10))
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('客户名')
    expect(wrapper.text()).toContain('导出 JSON')
    wrapper.unmount()
  })
})
