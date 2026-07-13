<template>
  <div class="designer">
    <div class="toolbar">
      <a-select
        :value="store.schema.type"
        style="width:120px"
        :options="[
          { label: '表单', value: 'form' },
          { label: '列表', value: 'list' },
          { label: '详情', value: 'detail' },
        ]"
        @change="(v: unknown) => (store.schema.type = v as PageType)"
      />
      <a-input
        :value="store.schema.name"
        style="width:160px"
        @update:value="(v: unknown) => store.setName(v as string)"
      />
      <a-button @click="store.undo()">撤销</a-button>
      <a-button type="primary" @click="onSave">保存</a-button>
      <PageSettings />
    </div>
    <div class="body">
      <div class="left">
        <MaterialPanel :page-type="store.schema.type" />
        <OutlinePanel />
      </div>
      <div class="center"><Canvas /></div>
      <div class="right"><PropertyPanel /></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useEditorStore } from './store/editor'
import MaterialPanel from './panels/MaterialPanel.vue'
import PropertyPanel from './panels/PropertyPanel.vue'
import OutlinePanel from './panels/OutlinePanel.vue'
import Canvas from './canvas/Canvas.vue'
import PageSettings from './toolbar/PageSettings.vue'
import { pageStorage } from '@/storage'
import { message } from 'ant-design-vue'
import type { PageType } from '@/core'

const store = useEditorStore()

async function onSave() {
  await pageStorage.save(store.schema)
  message.success('已保存')
}
</script>

<style scoped>
.designer {
  display: flex;
  flex-direction: column;
  height: 100vh;
}
.toolbar {
  display: flex;
  gap: 8px;
  padding: 8px;
  border-bottom: 1px solid #eee;
  align-items: center;
}
.body {
  display: flex;
  flex: 1;
}
.left {
  width: 220px;
  border-right: 1px solid #eee;
  overflow: auto;
}
.center {
  flex: 1;
  overflow: auto;
  padding: 16px;
}
.right {
  width: 300px;
  border-left: 1px solid #eee;
  overflow: auto;
  padding: 8px;
}
</style>
