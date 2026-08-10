<script setup lang="ts">
import { useTheme } from '~/Composables/useTheme';

const { theme, basculer, initialiser } = useTheme()

onMounted(() => {
  initialiser()
})
</script>

<template>
  <button
    type="button"
    @click="basculer"
    class="relative inline-flex items-center justify-center w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 bg-card text-ink-light hover:text-secondary hover:border-secondary/40 active:scale-90 transition-all duration-200"
    :aria-label="theme === 'dark' ? 'Passer au thème clair' : 'Passer au thème sombre'"
  >
    <Transition name="icone" mode="out-in">
      <svg v-if="theme === 'light'" key="soleil" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="4" />
        <path stroke-linecap="round" d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32l1.41-1.41" />
      </svg>
      <svg v-else key="lune" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
      </svg>
    </Transition>
  </button>
</template>

<style scoped>
.icone-enter-active,
.icone-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.icone-enter-from {
  opacity: 0;
  transform: rotate(-90deg) scale(0.5);
}
.icone-leave-to {
  opacity: 0;
  transform: rotate(90deg) scale(0.5);
}
</style>