<script setup lang="ts">
defineProps<{ message: string }>()
</script>

<template>
  <div v-if="message" class="flex items-start gap-2 bg-danger/5 border border-danger/20 text-danger text-sm rounded-lg px-3.5 py-2.5">
    <svg class="w-4 h-4 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
    </svg>
    <span>{{ message }}</span>
  </div>
</template>