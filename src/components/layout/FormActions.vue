<template>
  <div class="form-actions">
    <a-button type="primary" html-type="submit">{{ submitText }}</a-button>
    <a-button style="margin-left: 8px" @click="emit('reset')">重置</a-button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ propValues: Record<string, unknown> }>()
const emit = defineEmits<{ (e: 'submit'): void; (e: 'reset'): void }>()

const submitText = computed(() => String(props.propValues.submitText ?? '提交'))
</script>
