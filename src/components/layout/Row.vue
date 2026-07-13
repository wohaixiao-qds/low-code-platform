<template>
  <a-row :gutter="16"><slot /></a-row>
</template>

<script setup lang="ts">
// Row 只渲染栅格容器壳；子节点的 a-col 切分由 NodeView (Task 8/10) 处理。
</script>
