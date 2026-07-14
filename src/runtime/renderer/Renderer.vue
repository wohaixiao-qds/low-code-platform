<template>
  <a-form
    v-if="!ctx.error && isForm"
    ref="formRef"
    :model="ctx.data"
    :layout="formProps.layout"
    :label-align="formProps.labelAlign"
    :label-col="formProps.labelCol"
    class="renderer"
    @submit.prevent
  >
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
  </a-form>
  <div v-else-if="!ctx.error" class="renderer">
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
import { ref, computed } from 'vue'
import { message } from 'ant-design-vue'
import type { PageSchema } from '@/core'
import type { PageRuntimeContext } from '../usePageRuntime'
import NodeView, { type DesignContext } from './NodeView.vue'

const props = defineProps<{ schema: PageSchema; ctx: PageRuntimeContext; design?: DesignContext }>()

const formRef = ref<any>(null)
const isForm = computed(() => props.schema.type === 'form')

// 表单级 label 布局（来自 schema.ui）：位置 顶部/左侧、对齐、宽度
const formProps = computed(() => {
  const ui = props.schema.ui
  const pos = ui?.labelPosition ?? 'top'
  return {
    layout: pos === 'left' ? 'horizontal' : ('vertical' as 'horizontal' | 'vertical'),
    labelAlign: (ui?.labelAlign ?? 'right') as 'left' | 'right',
    labelCol:
      pos === 'left' && ui?.labelWidth
        ? { style: { width: `${ui.labelWidth}px` } }
        : undefined,
  }
})

async function onSubmit() {
  if (isForm.value && formRef.value) {
    try {
      await formRef.value.validate()
    } catch {
      return // 校验失败，antd 已显示字段错误
    }
  }
  await props.ctx.submit()
}

function onReset() {
  props.ctx.reset()
}

function onSearch(v: Record<string, unknown>) {
  message.info('查询条件已收到：' + JSON.stringify(v))
  void props.ctx.refresh(v)
}
</script>
