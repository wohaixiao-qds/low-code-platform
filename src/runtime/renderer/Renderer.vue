<template>
  <div v-if="!ctx.error" class="renderer">
    <NodeView
      v-for="node in schema.body"
      :key="node.id"
      :node="node"
      :ctx="ctx"
      :design="design"
      @submit="onSubmit"
      @reset="onReset"
      @search="onSearch"
    />
  </div>
  <a-result v-else status="error" title="加载失败" sub-title="点此重试">
    <template #extra>
      <a-button type="primary" @click="ctx.refresh()">重试</a-button>
    </template>
  </a-result>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue'
import type { PageSchema } from '@/core'
import type { PageRuntimeContext } from '../usePageRuntime'
import NodeView, { type DesignContext } from './NodeView.vue'

const props = defineProps<{ schema: PageSchema; ctx: PageRuntimeContext; design?: DesignContext }>()

function onSubmit() {
  void props.ctx.submit()
}

function onReset() {
  props.ctx.reset()
}

function onSearch(v: Record<string, unknown>) {
  message.info('查询条件已收到：' + JSON.stringify(v))
  void props.ctx.refresh(v)
}
</script>
