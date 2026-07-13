<template>
  <div class="property-panel">
    <h3>属性</h3>
    <div v-if="!node" class="empty">未选中组件</div>
    <a-collapse v-else v-model:active-key="openKeys" :bordered="false" expand-icon-position="start">
      <a-collapse-panel v-for="g in groups" :key="g.name" :header="g.name">
        <PropsForm
          v-if="g.name !== '数据绑定'"
          :fields="g.fields"
          :model-value="node.props"
          @update:model-value="onUpdate"
        />
        <template v-else>
          <a-input
            :value="node.bindings?.field ?? ''"
            placeholder="字段名，如 name"
            allow-clear
            @update:value="(v: unknown) => store.updateBindings(node!.id, (v as string) ?? '')"
          />
          <div class="binding-hint">提交时该组件的值会写入数据总线的此字段。</div>
        </template>
      </a-collapse-panel>
    </a-collapse>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useEditorStore } from '../store/editor'
import { getMeta, type PropField } from '@/core'
import PropsForm from '@/components/props-panel/PropsForm.vue'

const store = useEditorStore()
const node = computed(() => store.selectedNode)

const GROUP_ORDER = ['基本', '校验', '布局']

interface Group { name: string; fields: PropField[] }
const groups = computed<Group[]>(() => {
  if (!node.value) return []
  const fields = getMeta(node.value.type)?.propsSchema ?? []
  const buckets = new Map<string, PropField[]>()
  const order: string[] = []
  for (const f of fields) {
    const g = f.group ?? '基本'
    if (!buckets.has(g)) { buckets.set(g, []); order.push(g) }
    buckets.get(g)!.push(f)
  }
  const sorted = [...order].sort((a, b) => {
    const ia = GROUP_ORDER.indexOf(a); const ib = GROUP_ORDER.indexOf(b)
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
  })
  const result = sorted.map((name) => ({ name, fields: buckets.get(name)! }))
  result.push({ name: '数据绑定', fields: [] })
  return result
})

const openKeys = ref<string[]>([])
watch(groups, (gs) => { openKeys.value = gs.map((g) => g.name) }, { immediate: true })

function onUpdate(v: Record<string, unknown>) {
  if (node.value) store.updateProps(node.value.id, v)
}
</script>

<style scoped>
.property-panel { padding: 0 4px; }
.empty { color: #999; padding: 16px 0; }
.binding-hint { color: #999; font-size: 12px; margin-top: 4px; }
</style>
