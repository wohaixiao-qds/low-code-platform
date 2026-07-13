<template>
  <div class="property-panel">
    <h3>属性</h3>
    <div v-if="!node" class="empty">未选中组件</div>
    <PropsForm
      v-else
      :fields="fields"
      :model-value="node.props"
      @update:model-value="onUpdate"
    />
    <div v-if="node">
      <h4>数据绑定</h4>
      <a-input
        :value="node.bindings?.field ?? ''"
        placeholder="字段名"
        @update:value="(v: unknown) => store.updateBindings(node!.id, v as string)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useEditorStore } from '../store/editor'
import { getMeta } from '@/core'
import PropsForm from '@/components/props-panel/PropsForm.vue'

const store = useEditorStore()
const node = computed(() => store.selectedNode)
const fields = computed(() => (node.value ? getMeta(node.value.type)?.propsSchema ?? [] : []))

function onUpdate(v: Record<string, unknown>) {
  if (node.value) store.updateProps(node.value.id, v)
}
</script>
