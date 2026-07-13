import { reactive } from 'vue'
import { message } from 'ant-design-vue'
import type { PageSchema } from '@/core'
import { exec } from './datasource/executor'

/**
 * 数据总线上下文（由 Renderer/NodeView 消费）。
 * 接口签名必须保持稳定：Renderer/NodeView 依赖此类型。
 */
export interface PageRuntimeContext {
  data: Record<string, unknown>
  error: Error | null
  refresh(params?: Record<string, unknown>): Promise<void>
  submit(): Promise<void>
  reset(): void
}

/**
 * 页面运行时：基于 PageSchema 构建数据总线（reactive），
 * 提供 refresh（按 dataSource.load 拉取）、submit（按 dataSource.submit 提交）、
 * reset（清空数据总线）三个生命周期方法。
 */
export function usePageRuntime(schema: PageSchema): PageRuntimeContext {
  const data = reactive<Record<string, unknown>>({})
  const ctx: PageRuntimeContext = {
    data,
    error: null,
    async refresh(params?) {
      const load = schema.dataSource?.load
      if (!load) return
      try {
        ctx.error = null
        const res = (await exec(load, params)) as Record<string, unknown> | null
        // replace, not merge — a fresh load should not leave stale keys from a prior record
        for (const k of Object.keys(data)) delete data[k]
        if (res && typeof res === 'object') Object.assign(data, res)
      } catch (e) {
        ctx.error = e as Error
        message.error('加载失败')
      }
    },
    async submit() {
      const submit = schema.dataSource?.submit
      if (!submit) return
      try {
        await exec(submit, { ...data })
        message.success('提交成功')
      } catch (e) {
        message.error('提交失败：' + (e as Error).message)
      }
    },
    reset() {
      for (const k of Object.keys(data)) delete data[k]
    },
  }
  return ctx
}
