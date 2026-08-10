<script setup lang="ts">
definePageMeta({ layout: false })

import { useApi } from '~/Composables/useApi'

const { apiFetch } = useApi()

const email = ref('')
const chargement = ref(false)
const erreur = ref('')
const succes = ref('')

async function envoyerLien() {
  erreur.value = ''
  succes.value = ''

  if (!email.value.trim()) {
    erreur.value = 'Veuillez saisir votre adresse email.'
    return
  }

  chargement.value = true
  try {
    const res = await apiFetch<{ message: string }>('/mot-de-passe-oublie', {
      method: 'POST',
      body: { email: email.value },
    })
    succes.value = res.message
  } catch (e: any) {
    erreur.value = e?.data?.message || 'Une erreur est survenue.'
  } finally {
    chargement.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-surface px-6 py-12">
    <div class="w-full max-w-sm">
      <div class="text-center mb-8">
        <span class="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4 shadow-lg shadow-secondary/30">
          <svg class="w-7 h-7 text-white" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
          </svg>
        </span>
        <h1 class="text-xl font-bold text-slate-900 mb-1">Mot de passe oublié</h1>
        <p class="text-sm text-ink-light">Recevez un lien pour réinitialiser votre mot de passe</p>
      </div>

      <div class="bg-card border border-slate-200 rounded-xl shadow-sm p-6">
        <form @submit.prevent="envoyerLien" class="space-y-4" novalidate>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">Adresse email</label>
            <input
              v-model="email"
              type="email"
              placeholder="exemple@gmail.com"
              class="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary"
            />
          </div>

          <p v-if="erreur" class="text-sm text-danger">{{ erreur }}</p>
          <p v-if="succes" class="text-sm text-accent">{{ succes }}</p>

          <button
            type="submit"
            :disabled="chargement"
            class="w-full bg-secondary hover:bg-primary text-white text-sm font-medium py-2.5 rounded-lg transition disabled:opacity-50"
          >
            {{ chargement ? 'Envoi...' : 'Envoyer le lien' }}
          </button>
        </form>

        <NuxtLink to="/login" class="block text-center text-sm text-secondary hover:text-primary mt-4">
           Retour à la connexion
        </NuxtLink>
      </div>
    </div>
  </div>
</template>