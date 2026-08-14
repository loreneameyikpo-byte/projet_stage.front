<script setup lang="ts">
import { useInactivite } from '~/Composables/useInactivite'

const { avertissementVisible, secondesRestantes, resterConnecte, deconnexionAutomatique } = useInactivite()
</script>

<template>
  <Transition name="fade">
    <div
      v-if="avertissementVisible"
      class="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 px-4"
    >
      <div class="w-full max-w-sm bg-card rounded-xl shadow-xl p-6 text-center">
        <span class="inline-flex w-12 h-12 rounded-full bg-warning/10 text-warning items-center justify-center mb-4">
          <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </span>
        <h2 class="text-lg font-bold text-slate-900 mb-2">Toujours là ?</h2>
        <p class="text-sm text-ink-light mb-1">
          Par mesure de sécurité, vous allez être déconnecté(e) dans
        </p>
        <p class="text-3xl font-bold text-warning mb-4 tabular-nums">{{ secondesRestantes }}s</p>

        <div class="flex items-center gap-3">
          <button
            type="button"
            @click="deconnexionAutomatique"
            class="flex-1 text-sm font-medium text-ink-light hover:text-slate-700 border border-slate-200 rounded-lg py-2.5 transition"
          >
            Se déconnecter
          </button>
          <button
            type="button"
            @click="resterConnecte"
            class="flex-1 bg-secondary hover:bg-primary text-white text-sm font-medium rounded-lg py-2.5 transition active:scale-95"
          >
            Rester connecté(e)
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>