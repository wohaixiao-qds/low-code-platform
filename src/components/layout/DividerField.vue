<template>
  <a-divider :orientation="orientation">{{ text }}</a-divider>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ propValues: Record<string, unknown> }>()

const text = computed(() => String(props.propValues.text ?? ''))
const orientation = computed(() => String(props.propValues.orientation ?? 'center'))
</script>
