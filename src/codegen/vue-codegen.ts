import type { PageSchema } from '@/core'

/**
 * 把 PageSchema 翻译为 .vue 源码。
 *
 * MVP 不实现：此函数仅为接口预留，确保 schema 设计可被静态翻译。
 * 将来实现：遍历 body，按 type 映射到 antd 标签拼模板字符串，
 * Row/colSpan 映射到 a-row/a-col，bindings.field 映射到 v-model。
 *
 * 两条独立路径共享 core：
 *   - 运行时（runtime/renderer）= 解释器：读 schema 动态渲染
 *   - 出码（codegen）           = 编译器：schema → .vue 源码
 */
export function generateVue(_schema: PageSchema): string {
  throw new Error('codegen 尚未实现（MVP 仅预留接口）')
}
