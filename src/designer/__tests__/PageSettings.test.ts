import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import Antd from 'ant-design-vue'
import { nextTick } from 'vue'
import PageSettings from '../toolbar/PageSettings.vue'
import { useEditorStore } from '../store/editor'

// jsdom 缺少 matchMedia，antd 的 ResponsiveObserve 依赖它。
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

describe('PageSettings', () => {
  let wrapper: VueWrapper | undefined

  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
  })

  it('按钮渲染并可打开弹窗', async () => {
    wrapper = mount(PageSettings, { global: { plugins: [Antd] } })
    // (a) 按钮渲染
    const btn = wrapper.find('button')
    expect(btn.exists()).toBe(true)
    expect(wrapper.text()).toContain('页面设置')

    // (b) 点击后弹窗标题出现（antd Modal 通过 teleport 挂到 document.body）
    await btn.trigger('click')
    await nextTick()
    expect(document.body.textContent).toContain('表单布局')
  })

  it('打开弹窗回显并 OK 后写回 store.schema.dataSource', async () => {
    const store = useEditorStore()
    // 预置已有数据源 -> 触发 watch(visible) 回显路径
    store.setDataSource({
      load: { url: 'https://api.example.com/load', method: 'GET' },
      submit: { url: 'https://api.example.com/submit', method: 'POST' },
    })

    wrapper = mount(PageSettings, { global: { plugins: [Antd] } })
    await wrapper.find('button').trigger('click')
    await nextTick()

    // 弹窗内 input 回显了已有 URL（排除 radio）
    const inputs = document.body.querySelectorAll('.ant-modal input:not([type="radio"])')
    const loadUrlInput = inputs[0] as HTMLInputElement
    const submitUrlInput = inputs[1] as HTMLInputElement
    expect(loadUrlInput.value).toBe('https://api.example.com/load')
    expect(submitUrlInput.value).toBe('https://api.example.com/submit')

    // 清空 store 后点 OK，验证 onOk 把表单值写回 store
    store.setDataSource({})
    const okBtn = document.body.querySelector(
      '.ant-modal-footer .ant-btn-primary',
    ) as HTMLButtonElement
    okBtn.click()
    await nextTick()

    expect(store.schema.dataSource?.load?.url).toBe('https://api.example.com/load')
    expect(store.schema.dataSource?.load?.method).toBe('GET')
    expect(store.schema.dataSource?.submit?.url).toBe('https://api.example.com/submit')
    expect(store.schema.dataSource?.submit?.method).toBe('POST')
  })
})
