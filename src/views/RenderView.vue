<template>
  <div style="padding:24px">
    <div style="margin-bottom:8px">
      <a-button @click="onExport">导出 JSON</a-button>
    </div>
    <Renderer v-if="schema && ctx" :schema="schema" :ctx="ctx" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { pageStorage, exportSchema } from '@/storage'
import { Renderer, usePageRuntime, type PageRuntimeContext } from '@/runtime'
import type { PageSchema } from '@/core'

const route = useRoute()
const schema = ref<PageSchema | null>(null)
const ctx = ref<PageRuntimeContext | null>(null)

onMounted(async () => {
  const s = await pageStorage.get(route.params.id as string)
  if (s) {
    schema.value = s
    ctx.value = usePageRuntime(s)
    // 自动触发一次加载（list/detail/form-edit 页面在挂载后立即拉取数据）。
    ctx.value.refresh()
  }
})

function onExport() {
  if (schema.value) exportSchema(schema.value)
}
</script>

<!--
  列表/详情页的数据约定（重要）：
  NodeView 通过 node.bindings.field 从 ctx.data 中取值（value = ctx.data[field]），
  表单字段如此，列表/详情亦如此——走同一条字段绑定通路。

  因此 list/detail 的 load 端点必须返回一个【对象】，
  并把承载集合/记录的键名写入对应 Table/Descriptions 节点的 bindings.field：

    例：list 页 load 返回 { rows: [...] }；Table 节点 bindings: { field: 'rows' }；
        NodeView 即以 ctx.data.rows 作为 Table 的 value 渲染。
    例：detail 页 load 返回 { record: {...} }；Descriptions 节点 bindings: { field: 'record' }。

  这不需要改 NodeView 或 usePageRuntime——现有字段绑定路径已经覆盖，
  只需在 schema 里遵守该约定即可。
-->
