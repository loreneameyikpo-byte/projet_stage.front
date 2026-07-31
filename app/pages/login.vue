<script setup lang="ts">
definePageMeta({ layout: false })

import { useFormErrors } from '~/Composables/useFormErrors'

const email = ref('')
const password = ref('')
const erreur = ref('')
const chargement = ref(false)

const authStore = useAuthStore()
const { erreurGenerale, traiter, reinitialiser } = useFormErrors()


async function seConnecter() {
  erreur.value = ''
  chargement.value = true

  try {
    await authStore.login(email.value, password.value)
    authStore.redirectionParRole()
  } catch (e: any) {
    traiter(e)
  } finally {
    chargement.value = false
  }
}

const atouts = [
  { label: 'Sécurisé' },
  { label: 'Collaboratif' },
  { label: 'Centralisé' },
]
</script>

<template>
  <div class="min-h-screen flex bg-white font-sans">
    <!-- Panneau gauche -->
<div class="relative hidden lg:flex lg:w-[45%] overflow-hidden">
  <!-- Photo de fond -->
  <div
    class="absolute inset-0 bg-cover bg-center"
    style="background-image: url('/images/login-bg.jpg')"
  ></div>
  <!-- Overlay teal -->
  <div class="absolute inset-0 bg-primary/80"></div>
  <!-- motif de points -->
  <div class="absolute inset-0 opacity-20 [background-image:radial-gradient(rgba(255,255,255,0.35)_1px,transparent_1px)] [background-size:26px_26px]"></div>
  <div class="absolute -top-24 -left-16 w-80 h-80 rounded-full bg-secondary/20 blur-[100px]"></div>

  <div class="relative z-10 flex flex-col items-center justify-center text-center px-14 w-full">
    <span class="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-6 shadow-lg shadow-secondary/30">
      <svg class="w-8 h-8 text-white" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
      </svg>
    </span>

    <h1 class="text-3xl font-bold text-white mb-3">Projetis</h1>
    <p class="text-white/70 text-xs font-semibold tracking-widest uppercase mb-4">
      La plateforme de gestion des projets de fin de formation
    </p>
    <p class="text-sm text-slate-100 leading-relaxed max-w-sm mb-10">
      Soumettez, validez, planifiez et évaluez les projets académiques en toute simplicité.
    </p>

    <div class="flex items-center gap-6">
      <div v-for="a in atouts" :key="a.label" class="flex items-center gap-1.5">
        <svg class="w-4 h-4 text-white" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd" />
        </svg>
        <span class="text-xs text-slate-200 font-medium">{{ a.label }}</span>
      </div>
    </div>
  </div>

   <!-- séparateur en vague -->
  <svg
    class="absolute top-0 h-full w-16 -right-8 z-20"
    viewBox="0 0 100 800"
    preserveAspectRatio="none"
    aria-hidden="true"
  >
    <path
      fill="#F6FAF9"
      d="M50,0
         C20,100 20,150 50,250
         C80,350 80,400 50,500
         C20,600 20,650 50,750
         C65,780 65,790 50,800
         L100,800 L100,0 Z"
    />
  </svg>
</div>

    <!-- Panneau droit : formulaire -->
    <div class="flex-1 flex items-center justify-center px-6 py-12">
      <div class="w-full max-w-sm">
        <h2 class="text-2xl font-bold text-slate-900 mb-1">Connexion</h2>
        <p class="text-sm text-ink-light mb-8">Accédez à votre espace de gestion de projets</p>

        <form @submit.prevent="seConnecter" class="space-y-5">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">Adresse email</label>
            <input
              v-model="email"
              type="email"
              required
              placeholder="exemple@gmail.com"
              class="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary"
            />
          </div>

          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="block text-sm font-medium text-slate-700">Mot de passe</label>
              <NuxtLink to="/mot-de-passe-oublie" class="text-xs font-medium text-secondary hover:text-primary">
                Mot de passe oublié ?
              </NuxtLink>
            </div>
            <input
              v-model="password"
              type="password"
              required
              class="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary"
            />
          </div>

          <p v-if="erreur" class="text-sm text-danger">{{ erreur }}</p>

          <button
            type="submit"
            :disabled="chargement"
            class="w-full bg-secondary hover:bg-primary text-white text-sm font-medium py-2.5 rounded-lg transition disabled:opacity-50"
          >
            {{ chargement ? 'Connexion...' : 'Se connecter' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>