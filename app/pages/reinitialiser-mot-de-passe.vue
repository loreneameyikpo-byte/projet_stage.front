<script setup lang="ts">
definePageMeta({ layout: false })

import { useApi } from '~/Composables/useApi'

const { apiFetch } = useApi()
const route = useRoute()

const email = ref((route.query.email as string) ?? '')
const token = ref((route.query.token as string) ?? '')
const password = ref('')
const passwordConfirmation = ref('')
const chargement = ref(false)
const erreur = ref('')
const succes = ref('')

async function reinitialiser() {
  erreur.value = ''
  succes.value = ''

  if (!password.value.trim() || !passwordConfirmation.value.trim()) {
    erreur.value = 'Veuillez remplir tous les champs.'
    return
  }

  if (password.value !== passwordConfirmation.value) {
    erreur.value = 'Les mots de passe ne correspondent pas.'
    return
  }

  chargement.value = true
  try {
    const res = await apiFetch<{ message: string }>('/reinitialiser-mot-de-passe', {
      method: 'POST',
      body: {
        token: token.value,
        email: email.value,
        password: password.value,
        password_confirmation: passwordConfirmation.value,
      },
    })
    succes.value = res.message
    setTimeout(() => navigateTo('/login'), 1500)
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
          <svg class="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </span>
        <h1 class="text-xl font-bold text-slate-900 mb-1">Nouveau mot de passe</h1>
        <p class="text-sm text-ink-light">Choisissez un nouveau mot de passe</p>
      </div>

      <div class="bg-card border border-slate-200 rounded-xl shadow-sm p-6">
        <form @submit.prevent="reinitialiser" class="space-y-4" novalidate>
          <FormInput v-model="password" label="Nouveau mot de passe" type="password" requis />
          <FormInput v-model="passwordConfirmation" label="Confirmer le mot de passe" type="password" requis />

          <p v-if="erreur" class="text-sm text-danger">{{ erreur }}</p>
          <p v-if="succes" class="text-sm text-accent">{{ succes }}</p>

          <button
            type="submit"
            :disabled="chargement"
            class="w-full bg-secondary hover:bg-primary text-white text-sm font-medium py-2.5 rounded-lg transition disabled:opacity-50"
          >
            {{ chargement ? 'Réinitialisation...' : 'Réinitialiser le mot de passe' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>