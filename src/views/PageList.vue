<template>
  <div style="padding:24px">
    <div style="display:flex;justify-content:space-between;align-items:center">
      <h2>页面管理</h2>
      <div>
        <a-upload :show-upload-list="false" :before-upload="onImport">
          <a-button>导入 JSON</a-button>
        </a-upload>
        <a-button type="primary" @click="onNew" style="margin-left:8px">新建页面</a-button>
      </div>
    </div>
    <a-table :columns="cols" :data-source="rows" row-key="id">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <router-link :to="`/designer/${record.id}`">编辑</router-link>
          <a style="margin-left:8px" @click="onPreview(record.id)">预览</a>
          <a-popconfirm title="删除？" @confirm="onRemove(record.id)">
            <a style="margin-left:8px;color:red">删除</a>
          </a-popconfirm>
        </template>
      </template>
    </a-table>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { pageStorage, importSchema } from '@/storage'
import type { PageMeta } from '@/storage'

const router = useRouter()
const rows = ref<PageMeta[]>([])
const cols = [
  { title: '名称', dataIndex: 'name' },
  { title: '类型', dataIndex: 'type' },
  { title: '更新时间', dataIndex: 'updatedAt' },
  { title: '操作', key: 'action' },
]

async function refresh() {
  rows.value = await pageStorage.list()
}
onMounted(refresh)

function onNew() {
  router.push('/designer/new')
}
function onPreview(id: string) {
  router.push(`/render/${id}`)
}
async function onRemove(id: string) {
  await pageStorage.remove(id)
  refresh()
}
async function onImport(file: File) {
  const text = await file.text()
  const schema = await importSchema(text)
  await pageStorage.save(schema)
  refresh()
  return false // 阻止 antd 自动上传
}
</script>
