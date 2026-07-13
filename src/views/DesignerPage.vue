<template>
  <DesignerView v-if="loaded" />
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useEditorStore } from '@/designer/store/editor'
import { pageStorage } from '@/storage'
import DesignerView from '@/designer/DesignerView.vue'
import type { PageSchema } from '@/core'

const route = useRoute()
const store = useEditorStore()
const loaded = ref(false)

async function load(id: string) {
  loaded.value = false
  if (id === 'new') {
    const newId = `page_${Date.now()}`
    const blank: PageSchema = {
      version: 1,
      type: 'form',
      id: newId,
      name: '未命名页面',
      body: [],
    }
    store.setSchema(blank)
  } else {
    const s = await pageStorage.get(id)
    if (s) store.setSchema(s)
  }
  loaded.value = true
}

onMounted(() => load(route.params.id as string))
watch(
  () => route.params.id,
  (id) => {
    if (id) load(id as string)
  },
)
</script>
