<script setup lang="ts">
import * as lucide from 'lucide-vue-next'
import { computed, type Component } from 'vue'

type LucideIconName = keyof typeof lucide

const props = defineProps<{
  name: LucideIconName | string
  size?: number | string
  strokeWidth?: number | string
  color?: string
  class?: string
}>()

const iconComponent = computed<Component>(() => {
  const icon = (lucide as unknown as Record<string, unknown>)[props.name] as Component | undefined
  return icon ?? (lucide.AlertCircle as Component)
})
const iconSize = computed(() => {
  if (typeof props.size === 'number') return props.size
  const parsed = Number(props.size)
  return Number.isFinite(parsed) ? parsed : 20
})
</script>

<template>
  <component
    :is="iconComponent"
    :size="iconSize"
    :stroke-width="props.strokeWidth ?? 2"
    :color="props.color ?? 'currentColor'"
    :class="props.class"
  />
</template>
