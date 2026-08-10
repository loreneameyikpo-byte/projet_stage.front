<script setup lang="ts">
import { useConfirmation } from '~/Composables/useConfirmation';

const { etatConfirmation, confirmer, annuler } = useConfirmation()
</script>

<template>
  <Transition name="fade">
    <div
      v-if="etatConfirmation.ouverte"
      class="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 px-4"
      @click.self="annuler"
    >
      <div class="w-full max-w-sm bg-card rounded-xl shadow-xl p-6">
        <div class="flex items-start gap-3 mb-4">
          <span
            class="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            :class="etatConfirmation.dangereux ? 'bg-danger/10 text-danger' : 'bg-secondary/10 text-secondary'"
          >
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </span>
          <div>
            <h2 class="text-base font-bold text-slate-900">{{ etatConfirmation.titre }}</h2>
            <p class="text-sm text-ink-light mt-1">{{ etatConfirmation.message }}</p>
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 mt-6">
          <button
            type="button"
            @click="annuler"
            class="text-sm font-medium text-secondary hover:text-primary px-4 py-2"
          >
            {{ etatConfirmation.texteAnnuler }}
          </button>
          <button
            type="button"
            @click="confirmer"
            class="text-sm font-medium text-white px-4 py-2 rounded-lg transition"
            :class="etatConfirmation.dangereux ? 'bg-danger hover:bg-red-600' : 'bg-secondary hover:bg-primary'"
          >
            {{ etatConfirmation.texteConfirmer }}
          </button>
        </div>
      </div>
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