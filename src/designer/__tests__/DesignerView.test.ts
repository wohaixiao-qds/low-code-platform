import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import Antd from 'ant-design-vue'
import { clearRegistry } from '@/core'
import { registerAll } from '@/components'
import DesignerView from '../DesignerView.vue'

// jsdom 缺少 matchMedia，antd 的 ResponsiveObserve（a-select / a-row 等）依赖它。
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

describe('DesignerView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    clearRegistry()
    registerAll()
  })
  it('三栏渲染：物料面板 + 画布 + 属性面板', () => {
    const w = mount(DesignerView, {
      global: { plugins: [Antd], stubs: ['router-link'] },
    })
    expect(w.text()).toContain('物料')
    expect(w.text()).toContain('属性')
  })
})
