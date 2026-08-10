<script setup lang="ts">
const { isLoading } = useLoadingIndicator()
</script>

<template>
  <Transition name="fade">
    <div
      v-if="isLoading"
      class="fixed inset-0 z-[9999] flex items-center justify-center bg-white/60 backdrop-blur-sm"
    >
      <svg class="w-10 h-10 text-secondary animate-spin" viewBox="0 0 24 24" fill="none">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>