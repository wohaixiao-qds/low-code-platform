<template>
  <div class="outline">
    <h3>大纲</h3>
    <ul>
      <li
        v-for="n in store.schema.body"
        :key="n.id"
        :class="{ active: n.id === store.selectedId }"
        @click="store.selectNode(n.id)"
      >
        {{ n.type }} <span class="muted">{{ n.id }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { useEditorStore } from '../store/editor'

const store = useEditorStore()
</script>

<style scoped>
.outline .active {
  background: #e6f4ff;
}
.muted {
  color: #999;
  font-size: 12px;
}
</style>
