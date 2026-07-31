<script setup lang="ts">
import { useApi } from '~/Composables/useApi'
import { computed } from 'vue'
import { useAsyncData, useRoute } from '#imports'

definePageMeta({ layout: 'dashboard', middleware: 'role', roles: ['super_administrateur'] })

const { apiFetch } = useApi()

interface StatsGlobal {
  total_utilisateurs: number
  total_etudiants: number
  total_projets: number
  total_soutenances: number
  total_administrateurs: number
  comparaison_par_promotion: { intitule: string; nb_etudiants: number; nb_projets: number }[]
  repartition_projets: Record<string, number>
}

const { data: stats } = await useAsyncData<StatsGlobal>('stats-admin-global', () =>
  apiFetch<StatsGlobal>('/stats-admin/global')
)

const cartes = computed(() => [
  { label: 'Utilisateurs', valeur: stats.value?.total_utilisateurs ?? 0, couleur: 'bg-secondary/10 text-secondary' },
  { label: 'Étudiants', valeur: stats.value?.total_etudiants ?? 0, couleur: 'bg-accent/10 text-accent' },
  { label: 'Projets', valeur: stats.value?.total_projets ?? 0, couleur: 'bg-warning/10 text-warning' },
  { label: 'Soutenances', valeur: stats.value?.total_soutenances ?? 0, couleur: 'bg-secondary/10 text-secondary' },
  { label: 'Administrateurs', valeur: stats.value?.total_administrateurs ?? 0, couleur: 'bg-primary/10 text-primary' },
])

const libellesStatuts = {
  en_attente: { label: 'En attente', couleur: 'bg-warning' },
  corrections: { label: 'Corrections demandées', couleur: 'bg-danger' },
  valide: { label: 'Validé', couleur: 'bg-accent' },
  presentation_planifiee: { label: 'Présentation planifiée', couleur: 'bg-secondary' },
  presente: { label: 'Présenté', couleur: 'bg-primary' },
} as const

type LibelleStatutKey = keyof typeof libellesStatuts
const statutKeys = Object.keys(libellesStatuts) as LibelleStatutKey[]

function pourcentage(nbProjets: number) {
  const max = Math.max(...(stats.value?.comparaison_par_promotion.map((p: { nb_projets: number }) => p.nb_projets) ?? [1]), 1)
  return Math.round((nbProjets / max) * 100)
}

const accesRapides = [
  { label: 'Administrateurs', chemin: '/super-admin/administrateurs', icone: 'M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a4 4 0 10-4-4' },
  { label: 'Rôles', chemin: '/super-admin/roles', icone: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
  { label: 'Paramètres', chemin: '/super-admin/parametres', icone: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
  { label: 'Rapports', chemin: '/super-admin/rapports', icone: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { label: 'Projets', chemin: '/super-admin/projets', icone: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
]
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold text-slate-900">Tableau de bord global</h1>
    <p class="text-sm text-ink-light mt-1 mb-6">Vue consolidée — toutes promotions et filières</p>

    <!-- Cartes indicateurs -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
      <div
        v-for="c in cartes"
        :key="c.label"
        class="bg-card border border-slate-200 rounded-lg p-4"
      >
        <span :class="['inline-flex w-8 h-8 rounded-md items-center justify-center mb-2', c.couleur]">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a4 4 0 10-4-4" />
          </svg>
        </span>
        <p class="text-2xl font-bold text-slate-900">{{ c.valeur }}</p>
        <p class="text-xs text-ink-light">{{ c.label }}</p>
      </div>
    </div>

    <div class="grid lg:grid-cols-2 gap-6 mb-6">
      <!-- Comparaison par promotion -->
      <div class="bg-card border border-slate-200 rounded-lg p-6">
        <h2 class="font-semibold text-slate-900 mb-4">Comparaison par promotion</h2>

        <div v-if="!stats?.comparaison_par_promotion.length" class="text-sm text-ink-light">
          Aucune promotion avec des étudiants pour l'instant.
        </div>

        <div v-else class="space-y-4">
          <div v-for="p in stats.comparaison_par_promotion" :key="p.intitule">
            <div class="flex items-center justify-between text-sm mb-1.5">
              <span class="font-medium text-slate-900">{{ p.intitule }}</span>
              <span class="text-ink-light">{{ p.nb_projets }} projet(s) · {{ p.nb_etudiants }} étudiant(s)</span>
            </div>
            <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div class="h-full bg-secondary rounded-full" :style="{ width: pourcentage(p.nb_projets) + '%' }"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Répartition des projets -->
      <div class="bg-card border border-slate-200 rounded-lg p-6">
        <h2 class="font-semibold text-slate-900 mb-4">Répartition des projets</h2>

        <ul class="space-y-3">
          <li
            v-for="cle in statutKeys"
            :key="cle"
            class="flex items-center justify-between text-sm"
          >
            <span class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full" :class="libellesStatuts[cle].couleur"></span>
              {{ libellesStatuts[cle].label }}
            </span>
            <span class="font-medium text-slate-900">{{ stats?.repartition_projets?.[cle] ?? 0 }}</span>
          </li>
        </ul>
      </div>
    </div>

    <!-- Accès rapides -->
    <div>
      <h2 class="font-semibold text-slate-900 mb-4">Accès rapides</h2>
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <NuxtLink
          v-for="a in accesRapides"
          :key="a.chemin"
          :to="a.chemin"
          class="bg-card border border-slate-200 rounded-lg p-5 flex flex-col items-center text-center hover:border-secondary/40 hover:shadow-sm transition"
        >
          <span class="w-9 h-9 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center mb-2">
            <svg class="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" :d="a.icone" />
            </svg>
          </span>
          <span class="text-sm font-medium text-slate-900">{{ a.label }}</span>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>