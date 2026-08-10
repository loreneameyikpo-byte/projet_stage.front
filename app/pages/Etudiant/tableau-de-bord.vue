<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useAsyncData } from '#imports'
import { useApi } from '../../Composables/useApi'
import { useAuthStore } from '../../stores/auth'

definePageMeta({ layout: 'dashboard', middleware: 'role', roles: ['etudiant'] })

const { apiFetch } = useApi()
const authStore = useAuthStore()

interface ProjetDashboard {
  id: string
  titre: string
  description: string
  statut: string
  depot_github: boolean
  nb_versions: number
  presentation: { date_presentation: string; heure_presentation: string; salle: string; salle_libelle: string | null; jury_noms: string } | null
  paiement: { statut: string; montant: number }
}

const { data } = await useAsyncData('etudiant-dashboard', () =>
  apiFetch<{ promotion: string | null; projet: ProjetDashboard | null }>('/stats-etudiant/dashboard')
)

const projet = computed(() => data.value?.projet ?? null)

const badgesStatuts: Record<string, { label: string; classe: string }> = {
  en_attente: { label: 'En attente', classe: 'bg-warning/10 text-warning' },
  corrections: { label: 'Corrections demandées', classe: 'bg-danger/10 text-danger' },
  valide: { label: 'Validé', classe: 'bg-accent/10 text-accent' },
  presentation_planifiee: { label: 'Présentation planifiée', classe: 'bg-secondary/10 text-secondary' },
  presente: { label: 'Présenté', classe: 'bg-slate-200 text-slate-600' },
}

function formaterMontant(m: number) {
  return new Intl.NumberFormat('fr-FR').format(m)
}

/* ---------- Animation d'entrée ---------- */
const estMonte = ref(false)
onMounted(() => {
  requestAnimationFrame(() => { estMonte.value = true })
})
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold text-slate-900">Tableau de bord</h1>
    <p class="text-sm text-secondary mt-1 mb-6">
      Bienvenue, {{ authStore.utilisateur?.prenom }}{{ data?.promotion ? ' — ' + data.promotion : '' }}
    </p>

    <!-- Aucun projet -->
    <div
      v-if="!projet"
      class="bg-card border border-slate-200 rounded-lg p-10 text-center opacity-0"
      :class="estMonte ? 'animate-entree' : ''"
    >
      <p class="text-sm text-ink-light mb-4">Vous n'avez pas encore soumis de projet.</p>
      <NuxtLink
        to="/etudiant/soumettre-projet"
        class="inline-flex items-center gap-2 bg-secondary hover:bg-primary text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-all hover:-translate-y-0.5 hover:shadow-md"
      >
        Soumettre mon projet
        <span aria-hidden="true" class="transition-transform group-hover:translate-x-0.5">→</span>
      </NuxtLink>
    </div>

    <template v-else>
      <div class="grid lg:grid-cols-2 gap-6 mb-6">
        <!-- Projet en cours -->
        <div
          class="bg-card border border-slate-200 rounded-lg p-6 opacity-0 hover:shadow-md transition-all duration-300"
          :class="estMonte ? 'animate-entree' : ''"
          :style="{ animationDelay: '0ms' }"
        >
          <div class="flex items-start justify-between mb-3">
            <h2 class="font-semibold text-slate-900">Projet en cours</h2>
            <span class="inline-flex px-2.5 py-1 rounded-full text-xs font-medium shrink-0" :class="badgesStatuts[projet.statut]?.classe">
              {{ badgesStatuts[projet.statut]?.label }}
            </span>
          </div>

          <p class="font-medium text-slate-900 mb-2">{{ projet.titre }}</p>
          <p class="text-sm text-ink-light leading-relaxed mb-4 line-clamp-2">{{ projet.description }}</p>

          <div class="flex items-center gap-4 mb-4 text-xs text-ink-light">
            <span v-if="projet.depot_github" class="inline-flex items-center gap-1">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 5.77 5.07 5.07 0 0019.91 2S18.73 1.65 16 3.48a13.38 13.38 0 00-7 0C6.27 1.65 5.09 2 5.09 2A5.07 5.07 0 005 5.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 19.13V22" />
              </svg>
              Dépôt GitHub lié
            </span>
            <span class="inline-flex items-center gap-1">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {{ projet.nb_versions }} version{{ projet.nb_versions > 1 ? 's' : '' }}
            </span>
          </div>

          <NuxtLink
            to="/etudiant/mon-projet"
            class="inline-flex items-center gap-2 bg-secondary hover:bg-primary text-white text-sm font-medium px-4 py-2 rounded-lg transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Voir le détail
          </NuxtLink>
        </div>

        <!-- Ma soutenance -->
        <div
          class="bg-card border border-slate-200 rounded-lg p-6 opacity-0 hover:shadow-md transition-all duration-300"
          :class="estMonte ? 'animate-entree' : ''"
          :style="{ animationDelay: '100ms' }"
        >
          <h2 class="font-semibold text-slate-900 mb-4">Ma soutenance</h2>

          <div v-if="projet.presentation" class="space-y-4">
            <div class="flex items-start gap-3">
              <span class="w-9 h-9 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
                <svg class="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </span>
              <div>
                <p class="text-sm font-medium text-slate-900">{{ projet.presentation.date_presentation }}</p>
                <p class="text-xs text-ink-light">
                  {{ projet.presentation.heure_presentation }} — {{ projet.presentation.salle }}{{ projet.presentation.salle_libelle ? ' — ' + projet.presentation.salle_libelle : '' }}
                </p>
              </div>
            </div>

            <div class="flex items-start gap-3">
              <span class="w-9 h-9 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
                <svg class="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a4 4 0 10-4-4" />
                </svg>
              </span>
              <div>
                <p class="text-sm font-medium text-slate-900">Jury composé</p>
                <p class="text-xs text-ink-light">{{ projet.presentation.jury_noms }}</p>
              </div>
            </div>
          </div>

          <p v-else class="text-sm text-ink-light">Aucune soutenance planifiée pour le moment.</p>
        </div>
      </div>

      <!-- Frais d'encadrement 
      <div
        class="bg-card border border-slate-200 rounded-lg p-6 opacity-0 hover:shadow-md transition-all duration-300"
        :class="estMonte ? 'animate-entree' : ''"
        :style="{ animationDelay: '200ms' }"
      >
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-semibold text-slate-900">Frais d'encadrement</h2>
          <span
            class="inline-flex px-2.5 py-1 rounded-full text-xs font-medium"
            :class="projet.paiement.statut === 'reussi' ? 'bg-accent/10 text-accent' : 'bg-warning/10 text-warning'"
          >
            {{ projet.paiement.statut === 'reussi' ? 'Payé' : 'En attente' }}
          </span>
        </div>

        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="w-9 h-9 rounded-lg bg-warning/10 text-warning flex items-center justify-center shrink-0">
              <svg class="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            <div>
              <p class="font-semibold text-slate-900">{{ formaterMontant(projet.paiement.montant) }} FCFA</p>
              <p class="text-xs text-ink-light">Frais d'encadrement{{ data?.promotion ? ' — ' + data.promotion : '' }}</p>
            </div>
          </div>

          <NuxtLink
            v-if="projet.paiement.statut !== 'reussi'"
            to="/etudiant/paiement"
            class="inline-flex items-center gap-2 bg-secondary hover:bg-primary text-white text-sm font-medium px-4 py-2 rounded-lg transition-all hover:-translate-y-0.5 hover:shadow-md shrink-0"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Effectuer le paiement
          </NuxtLink>
        </div>
      </div>-->
    </template>
  </div>
</template>

<style scoped>
@keyframes entree {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-entree {
  animation: entree 0.5s ease-out forwards;
}
</style>