<script setup lang="ts">
import { useApi } from '../../Composables/useApi'

definePageMeta({ layout: 'dashboard', middleware: 'role', roles: ['administrateur', 'super_administrateur'] })

const { apiFetch } = useApi()

interface ProjetRecent {
  id: string
  titre: string
  etudiant: string
  promotion: string | null
  statut: string
}

interface StatsDashboard {
  total_etudiants: number
  total_encadreurs: number
  total_projets: number
  total_jury_externe: number
  repartition_projets: Record<string, number>
  projets_recents: ProjetRecent[]
}

const { data: stats } = await useAsyncData<StatsDashboard>('stats-admin-dashboard', () =>
  apiFetch('/stats-admin/dashboard')
)

const cartes = computed(() => [
  { label: 'Étudiants', valeur: stats.value?.total_etudiants ?? 0, couleur: 'bg-secondary/10 text-secondary', icone: 'M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z' },
  { label: 'Encadreurs', valeur: stats.value?.total_encadreurs ?? 0, couleur: 'bg-accent/10 text-accent', icone: 'M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z' },
  { label: 'Projets', valeur: stats.value?.total_projets ?? 0, couleur: 'bg-warning/10 text-warning', icone: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { label: 'Membres de jury', valeur: stats.value?.total_jury_externe ?? 0, couleur: 'bg-secondary/10 text-secondary', icone: 'M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a4 4 0 10-4-4' },
])

const libellesStatuts: Record<string, { label: string; couleur: string }> = {
  en_attente: { label: 'En attente', couleur: 'bg-warning' },
  corrections: { label: 'Corrections demandées', couleur: 'bg-danger' },
  valide: { label: 'Validé', couleur: 'bg-accent' },
  presentation_planifiee: { label: 'Présentation planifiée', couleur: 'bg-secondary' },
  presente: { label: 'Présenté', couleur: 'bg-primary' },
}

const badgesStatuts: Record<keyof typeof libellesStatuts, string> = {
  en_attente: 'bg-warning/10 text-warning',
  corrections: 'bg-danger/10 text-danger',
  valide: 'bg-accent/10 text-accent',
  presentation_planifiee: 'bg-secondary/10 text-secondary',
  presente: 'bg-slate-200 text-slate-600',
}

const statutEnregistrements = Object.entries(libellesStatuts) as Array<
  [keyof typeof libellesStatuts, { label: string; couleur: string }]
>

const repartitionProjets = computed(() =>
  stats.value?.repartition_projets ?? {
    en_attente: 0,
    corrections: 0,
    valide: 0,
    presentation_planifiee: 0,
    presente: 0,
  }
)

function pourcentage(valeur: number) {
  const valeurs = Object.values(repartitionProjets.value)
  const max = Math.max(...valeurs, 1)
  return Math.round((valeur / max) * 100)
}

const accesRapides = [
  { label: 'Étudiants', chemin: '/admin/etudiants', icone: 'M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z' },
  { label: 'Encadreurs', chemin: '/admin/encadreurs', icone: 'M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z' },
  { label: 'Jury', chemin: '/admin/jury-externes', icone: 'M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a4 4 0 10-4-4' },
  { label: 'Projets', chemin: '/admin/projets', icone: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { label: 'Présentations', chemin: '/admin/presentations', icone: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { label: 'Profil', chemin: '/profil', icone: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },

]
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold text-slate-900">Tableau de bord</h1>
    <p class="text-sm text-ink-light mt-1 mb-6">Vue d'ensemble de la plateforme</p>

    <!-- Cartes -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div v-for="c in cartes" :key="c.label" class="bg-card border border-slate-200 rounded-lg p-4">
        <span :class="['inline-flex w-9 h-9 rounded-lg items-center justify-center mb-3', c.couleur]">
          <svg class="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" :d="c.icone" />
          </svg>
        </span>
        <p class="text-2xl font-bold text-slate-900">{{ c.valeur }}</p>
        <p class="text-xs text-ink-light">{{ c.label }}</p>
      </div>
    </div>

    <div class="grid lg:grid-cols-2 gap-6 mb-8">
      <!-- Projets par statut -->
      <div class="bg-card border border-slate-200 rounded-lg p-6">
        <h2 class="font-semibold text-slate-900 mb-4">Projets par statut</h2>
        <div class="space-y-3">
          <div v-for="([cle, valeur]) in statutEnregistrements" :key="cle" class="flex items-center gap-3">
            <span class="w-2 h-2 rounded-full shrink-0" :class="valeur.couleur"></span>
            <span class="text-sm text-slate-700 w-40 shrink-0">{{ valeur.label }}</span>
            <div class="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div class="h-full rounded-full" :class="valeur.couleur" :style="{ width: pourcentage(repartitionProjets[cle] ?? 0) + '%' }"></div>
            </div>
            <span class="text-sm font-medium text-slate-900 w-6 text-right">{{ repartitionProjets[cle] ?? 0 }}</span>
          </div>
        </div>
      </div>

      <!-- Projets récents -->
      <div class="bg-card border border-slate-200 rounded-lg p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-semibold text-slate-900">Projets récents</h2>
          <NuxtLink to="/admin/projets" class="text-xs font-medium text-secondary hover:text-primary">Voir tout</NuxtLink>
        </div>

        <div class="space-y-4">
          <div v-for="p in stats?.projets_recents" :key="p.id" class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="text-sm font-medium text-slate-900 truncate">{{ p.titre }}</p>
              <p class="text-xs text-ink-light">{{ p.etudiant }} — {{ p.promotion }}</p>
            </div>
            <span
              class="shrink-0 inline-flex px-2.5 py-1 rounded-full text-xs font-medium"
              :class="badgesStatuts[p.statut]"
            >
              {{ libellesStatuts[p.statut]?.label }}
            </span>
          </div>

          <p v-if="!stats?.projets_recents.length" class="text-sm text-ink-light text-center py-6">
            Aucun projet pour l'instant.
          </p>
        </div>
      </div>
    </div>

    <!-- Accès rapides -->
    <div>
      <h2 class="font-semibold text-slate-900 mb-4">Accès rapides</h2>
      <div class="grid grid-cols-3 sm:grid-cols-6 gap-4">
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