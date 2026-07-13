import { reactive } from 'vue'

/**
 * 数据总线上下文（由 Renderer/NodeView 消费）。
 * T10 仅定义接口签名；T11 将用真实实现替换 usePageRuntime 的函数体，
 * 但本接口（PageRuntimeContext）签名必须保持稳定。
 */
export interface PageRuntimeContext {
  data: Record<string, unknown>
  error: Error | null
  refresh(params?: Record<string, unknown>): Promise<void>
  submit(): Promise<void>
  reset(): void
}

/**
 * T10 占位实现：返回最小可用的 PageRuntimeContext。
 * T11 将替换为真实数据加载/提交逻辑。
 */
export function usePageRuntime(): PageRuntimeContext {
  const data = reactive<Record<string, unknown>>({})
  return {
    data,
    error: null,
    async refresh() {
      /* T11: 按 dataSource.load 拉取数据 */
    },
    async submit() {
      /* T11: 按 dataSource.submit 提交 */
    },
    reset() {
      /* T11: 重置为初始值 */
    },
  }
}
