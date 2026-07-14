<template>
  <a-button @click="visible = true">页面设置</a-button>
  <a-modal v-model:open="visible" title="页面设置" @ok="onOk">
    <a-form layout="vertical">
      <a-divider>表单布局</a-divider>
      <a-form-item label="标签位置">
        <a-radio-group v-model:value="label.position">
          <a-radio value="top">顶部</a-radio>
          <a-radio value="left">左侧</a-radio>
        </a-radio-group>
      </a-form-item>
      <a-form-item v-if="label.position === 'left'" label="标签对齐">
        <a-radio-group v-model:value="label.align">
          <a-radio value="right">右对齐</a-radio>
          <a-radio value="left">左对齐</a-radio>
        </a-radio-group>
      </a-form-item>
      <a-form-item v-if="label.position === 'left'" label="标签宽度（px）">
        <a-input-number v-model:value="label.width" :min="40" :max="300" style="width:100%" />
      </a-form-item>
      <a-divider>加载（load）</a-divider>
      <a-form-item label="URL"><a-input v-model:value="load.url" /></a-form-item>
      <a-form-item label="Method">
        <a-radio-group v-model:value="load.method">
          <a-radio value="GET">GET</a-radio><a-radio value="POST">POST</a-radio>
        </a-radio-group>
      </a-form-item>
      <a-divider>提交（submit）</a-divider>
      <a-form-item label="URL"><a-input v-model:value="submit.url" /></a-form-item>
      <a-form-item label="Method">
        <a-radio-group v-model:value="submit.method">
          <a-radio value="POST">POST</a-radio><a-radio value="PUT">PUT</a-radio>
        </a-radio-group>
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { useEditorStore } from '../store/editor'
import type { DataSourceSchema } from '@/core'

const store = useEditorStore()
const visible = ref(false)
const load = reactive({ url: '', method: 'GET' as 'GET' | 'POST' })
const submit = reactive({ url: '', method: 'POST' as 'POST' | 'PUT' })
const label = reactive({
  position: 'top' as 'top' | 'left',
  align: 'right' as 'left' | 'right',
  width: 100 as number,
})

watch(visible, (v) => {
  if (!v) return
  load.url = store.schema.dataSource?.load?.url ?? ''
  load.method = store.schema.dataSource?.load?.method ?? 'GET'
  submit.url = store.schema.dataSource?.submit?.url ?? ''
  submit.method = store.schema.dataSource?.submit?.method ?? 'POST'
  label.position = store.schema.ui?.labelPosition ?? 'top'
  label.align = store.schema.ui?.labelAlign ?? 'right'
  label.width = store.schema.ui?.labelWidth ?? 100
})

function onOk() {
  const ds: DataSourceSchema = {}
  if (load.url) ds.load = { ...load }
  if (submit.url) ds.submit = { ...submit }
  store.setDataSource(ds)
  store.setUi({
    labelPosition: label.position,
    labelAlign: label.align,
    labelWidth: label.position === 'left' ? label.width : undefined,
  })
  visible.value = false
}
</script>
