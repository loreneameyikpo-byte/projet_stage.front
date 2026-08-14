<script setup lang="ts">
import { useApi } from '~/Composables/useApi'

definePageMeta({ layout: false })

const { apiFetch } = useApi()
const authStore = useAuthStore()

const motDePasseActuel = ref('')
const nouveauMotDePasse = ref('')
const confirmation = ref('')
const erreur = ref('')
const chargement = ref(false)

async function changer() {
  erreur.value = ''
  chargement.value = true

  try {
    await apiFetch('/me/mot-de-passe', {
      method: 'PUT',
      body: {
        mot_de_passe_actuel: motDePasseActuel.value,
        mot_de_passe: nouveauMotDePasse.value,
        mot_de_passe_confirmation: confirmation.value,
      },
    })

    await authStore.fetchMe()
    authStore.redirectionParRole()
  } catch (e: any) {
    erreur.value =
      (Object.values(e?.data?.errors ?? {}) as string[][])[0]?.[0] ??
      e?.data?.message ??
      'Une erreur est survenue.'
  } finally {
    chargement.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-surface px-4">
    <div class="w-full max-w-sm bg-card border border-slate-200 rounded-xl shadow-sm p-8">
      <span class="inline-flex w-12 h-12 rounded-full bg-warning/10 text-warning items-center justify-center mb-4">
        <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </span>

      <h1 class="text-lg font-bold text-slate-900 mb-1">Changement de mot de passe requis</h1>
      <p class="text-sm text-ink-light mb-6">
        Pour des raisons de sécurité, vous devez définir un nouveau mot de passe avant de continuer.
      </p>

      <form @submit.prevent="changer" class="space-y-4">
        <FormInput v-model="motDePasseActuel" label="Mot de passe temporaire" type="password" requis />
        <FormInput v-model="nouveauMotDePasse" label="Nouveau mot de passe" type="password" requis />
        <FormInput v-model="confirmation" label="Confirmer le nouveau mot de passe" type="password" requis />

        <p v-if="erreur" class="text-sm text-danger">{{ erreur }}</p>

        <button
          type="submit"
          :disabled="chargement"
          class="w-full bg-secondary hover:bg-primary text-white text-sm font-medium py-2.5 rounded-lg transition disabled:opacity-50"
        >
          {{ chargement ? 'Enregistrement...' : 'Changer le mot de passe' }}
        </button>
      </form>
    </div>
  </div>
</template>