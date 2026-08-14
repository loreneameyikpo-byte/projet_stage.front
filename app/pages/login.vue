<script setup lang="ts">
definePageMeta({ layout: false })

import { useFormErrors } from '~/Composables/useFormErrors'
import { useMasquerChargementGlobal } from '~/Composables/useMasquerChargementGlobal'
import { useAlerte } from '~/Composables/useAlerte'
import { onMounted, ref } from 'vue'

const email = ref('')
const password = ref('')
const erreur = ref('')
const succes = ref('')
const chargement = ref(false)

const authStore = useAuthStore()
const { erreurGenerale, traiter, reinitialiser } = useFormErrors()
const masquerChargement = useMasquerChargementGlobal()
const { alerter } = useAlerte()

async function seConnecter() {
  erreur.value = ''
  succes.value = ''

  if (!email.value.trim() || !password.value.trim()) {
    erreur.value = 'Veuillez remplir tous les champs.'
    return
  }

  chargement.value = true

  try {
    await authStore.login(email.value, password.value)
    succes.value = 'Connexion réussie. Redirection en cours...'
    masquerChargement.value = true

    // Petite pause pour laisser le temps au cookie auth_token de bien
    // s'installer avant la navigation suivante — sans ça, la première
    // requête de la page suivante (middleware auth.global.ts -> fetchMe)
    // peut partir sans le token, échouer en 401, et nous renvoyer à /login.
    await new Promise((resolve) => setTimeout(resolve, 80))

    authStore.redirectionParRole()
  } catch (e: any) {
    if (e?.status === 429 || e?.statusCode === 429) {
      await alerter({
        titre: 'Compte temporairement bloqué',
        message: e?.data?.message || 'Trop de tentatives échouées. Veuillez réessayer dans 15 minutes.',
      })
    } else {
      erreur.value = e?.data?.message || 'Identifiants incorrects. Veuillez réessayer.'
      traiter(e)
    }
    chargement.value = false
  }
}

const atouts = [
  { label: 'Sécurisé' },
  { label: 'Collaboratif' },
  { label: 'Centralisé' },
]

/* ---------- Animation d'entrée ---------- */
const estMonte = ref(false)
onMounted(() => {
  requestAnimationFrame(() => { estMonte.value = true })
})
</script>

<template>
  <div class="min-h-screen flex bg-card font-sans">
    <!-- Panneau gauche -->
    <div class="relative hidden lg:flex lg:w-[45%] overflow-hidden">
      <div
        class="absolute inset-0 bg-cover bg-center scale-105 transition-transform duration-[1500ms]"
        :class="estMonte ? 'scale-100' : 'scale-105'"
        style="background-image: url('/images/login-bg.jpg')"
      ></div>
      <div class="absolute inset-0 bg-[#04121e]/75"></div>

      <!-- Motif Cercles -->
      <svg class="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 620 800" xmlns="http://www.w3.org/2000/svg">
        <circle cx="90" cy="120" r="60" fill="none" stroke="rgba(255,255,255,0.14)" stroke-width="1.5" />
        <circle cx="90" cy="120" r="95" fill="none" stroke="rgba(255,255,255,0.09)" stroke-width="1.5" />
        <circle cx="540" cy="90" r="34" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="1.5" />
        <circle cx="90" cy="700" r="45" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="1.5" />
        <circle cx="520" cy="680" r="80" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1.5" />
        <circle cx="520" cy="680" r="120" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1.5" />
        <circle cx="300" cy="60" r="18" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1.5" />
      </svg>

      <div class="absolute -top-24 -left-16 w-80 h-80 rounded-full bg-secondary/20 blur-[100px]"></div>

      <div class="relative z-10 flex flex-col items-center justify-center text-center px-14 w-full">
        <span
          class="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-6 shadow-lg shadow-secondary/30 opacity-0 transition-all duration-700"
          :class="estMonte ? 'opacity-100 scale-100' : 'scale-75'"
        >
          <svg class="w-8 h-8 text-white" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
          </svg>
        </span>

        <h1
          class="text-3xl font-bold text-white mb-3 opacity-0 transition-all duration-700"
          :class="estMonte ? 'opacity-100 translate-y-0' : 'translate-y-3'"
          style="transition-delay: 80ms"
        >
          Projetis
        </h1>
        <p
          class="text-white/70 text-xs font-semibold tracking-widest uppercase mb-4 opacity-0 transition-all duration-700"
          :class="estMonte ? 'opacity-100 translate-y-0' : 'translate-y-3'"
          style="transition-delay: 140ms"
        >
          La plateforme de gestion des projets de fin de formation
        </p>
        <p
          class="text-sm text-white/80 leading-relaxed max-w-sm mb-10 opacity-0 transition-all duration-700"
          :class="estMonte ? 'opacity-100 translate-y-0' : 'translate-y-3'"
          style="transition-delay: 200ms"
        >
          Soumettez, validez, planifiez et évaluez les projets académiques en toute simplicité.
        </p>

        <div class="flex items-center gap-6">
          <div
            v-for="(a, i) in atouts" :key="a.label"
            class="flex items-center gap-1.5 opacity-0 transition-all duration-500"
            :class="estMonte ? 'opacity-100 translate-y-0' : 'translate-y-2'"
            :style="{ transitionDelay: `${280 + i * 90}ms` }"
          >
            <svg class="w-4 h-4 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd" />
            </svg>
            <span class="text-xs text-white/80 font-medium">{{ a.label }}</span>
          </div>
        </div>
      </div>

      <svg class="absolute top-0 h-full w-16 -right-8 z-20" viewBox="0 0 100 800" preserveAspectRatio="none" aria-hidden="true">
        <path fill="rgb(var(--color-card))" d="M50,0 C20,100 20,150 50,250 C80,350 80,400 50,500 C20,600 20,650 50,750 C65,780 65,790 50,800 L100,800 L100,0 Z" />
      </svg>
    </div>

    <!-- Panneau droit : formulaire -->
    <div class="flex-1 flex items-center justify-center px-6 py-12">
      <div
        class="w-full max-w-sm opacity-0 transition-all duration-700"
        :class="estMonte ? 'opacity-100 translate-y-0' : 'translate-y-4'"
        style="transition-delay: 120ms"
      >
        <h2 class="text-2xl font-bold text-slate-900 mb-1">Connexion</h2>
        <p class="text-sm text-ink-light mb-8">Accédez à votre espace de gestion de projets</p>

        <form @submit.prevent="seConnecter" class="space-y-5" novalidate>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">Adresse email</label>
            <div class="relative">
              <svg class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <input
                v-model="email"
                type="email"
                placeholder="exemple@gmail.com"
                class="w-full rounded-lg border border-slate-300 pl-10 pr-3.5 py-2.5 text-sm placeholder:text-slate-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary"
              />
            </div>
          </div>

          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="block text-sm font-medium text-slate-700">Mot de passe</label>
              <NuxtLink to="/mot-de-passe-oublie" class="text-xs font-medium text-secondary hover:text-primary transition-colors">
                Mot de passe oublié ?
              </NuxtLink>
            </div>
            <div class="relative">
              <svg class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <input
                v-model="password"
                type="password"
                class="w-full rounded-lg border border-slate-300 pl-10 pr-3.5 py-2.5 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary"
              />
            </div>
          </div>

          <Transition name="alerte">
            <p v-if="erreur" class="text-sm text-danger">{{ erreur }}</p>
          </Transition>
          <Transition name="alerte">
            <p v-if="succes" class="text-sm text-accent">{{ succes }}</p>
          </Transition>

          <button
            type="submit"
            :disabled="chargement"
            class="w-full flex items-center justify-center gap-2 bg-secondary hover:bg-primary text-white text-sm font-medium py-2.5 rounded-lg transition-all duration-200 disabled:opacity-60 hover:enabled:-translate-y-0.5 hover:enabled:shadow-md"
          >
            <svg v-if="chargement" class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg>
            {{ chargement ? 'Connexion...' : 'Se connecter' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.alerte-enter-active,
.alerte-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.alerte-enter-from,
.alerte-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>