<script setup lang="ts">
import { useMasquerChargementGlobal } from '~/Composables/useMasquerChargementGlobal'

// duration : estimation de la durée d'un chargement typique — plus bas = la
// barre "termine" plus vite visuellement, donc elle se cache plus tôt une
// fois la navigation réellement finie.
// throttle : délai avant d'afficher le spinner sur une navigation très rapide
// (évite un flash inutile) — on le réduit pour que ça réagisse plus vite.
const { isLoading } = useLoadingIndicator({ duration: 250, throttle: 50 })
const masquerChargement = useMasquerChargementGlobal()

// Dès que la navigation en cours se termine, on réarme le spinner pour
// la prochaine fois (une page ne peut désactiver que SA transition, pas
// toutes les suivantes).
watch(isLoading, (enCours) => {
  if (!enCours) masquerChargement.value = false
})
</script>

<template>
  <Transition name="fade">
    <div
      v-if="isLoading && !masquerChargement"
      class="fixed inset-0 z-[9999] flex items-center justify-center bg-card/60 backdrop-blur-sm"
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
  transition: opacity 0.1s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>