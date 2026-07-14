<template>
  <a-alert :message="message" :type="alertType" show-icon />
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ propValues: Record<string, unknown> }>()

const message = computed(() => String(props.propValues.message ?? ''))
const alertType = computed(() => String(props.propValues.type ?? 'info'))
</script>
