<script setup lang="ts">
import { useApi } from '~/Composables/useApi'

definePageMeta({ layout: 'dashboard', middleware: 'role' })
useRoute().meta.roles = ['encadreur']

const { apiFetch } = useApi()
const authStore = useAuthStore()

interface ProjetRecent {
  id: string
  etudiant: string
  titre: string
  statut: string
  derniere_version: number | null
}
interface StatsDashboard {
  specialite: string | null
  total_projets: number
  en_attente: number
  valides: number
  soutenances_a_venir: number
  projets_recents: ProjetRecent[]
}

const { data: stats } = await useAsyncData('encadreur-dashboard', () =>
  apiFetch<StatsDashboard>('/stats-encadreur/dashboard')
)

const cartes = computed(() => [
  { label: 'Projets encadrés', valeur: stats.value?.total_projets ?? 0, couleur: 'bg-secondary/10 text-secondary', icone: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { label: 'En attente de revue', valeur: stats.value?.en_attente ?? 0, couleur: 'bg-warning/10 text-warning', icone: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  { label: 'Projets validés', valeur: stats.value?.valides ?? 0, couleur: 'bg-accent/10 text-accent', icone: 'M5 13l4 4L19 7' },
  { label: 'Soutenances à venir', valeur: stats.value?.soutenances_a_venir ?? 0, couleur: 'bg-secondary/10 text-secondary', icone: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
])

const badgesStatuts: Record<string, { label: string; classe: string }> = {
  en_attente: { label: 'En attente', classe: 'bg-warning/10 text-warning' },
  corrections: { label: 'Corrections demandées', classe: 'bg-danger/10 text-danger' },
  valide: { label: 'Validé', classe: 'bg-accent/10 text-accent' },
  presentation_planifiee: { label: 'Présentation planifiée', classe: 'bg-secondary/10 text-secondary' },
  presente: { label: 'Présenté', classe: 'bg-slate-200 text-slate-600' },
}
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold text-slate-900">Tableau de bord</h1>
    <p class="text-sm text-secondary mt-1 mb-6">
      Bienvenue, {{ authStore.utilisateur?.prenom }} {{ authStore.utilisateur?.nom }}{{ stats?.specialite ? ' — ' + stats.specialite : '' }}
    </p>

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

    <div class="bg-card border border-slate-200 rounded-lg overflow-hidden">
      <div class="flex items-center justify-between px-5 py-4 border-b border-slate-200">
        <h2 class="font-semibold text-slate-900">Mes projets encadrés</h2>
        <NuxtLink to="/encadreur/projets-a-encadrer" class="text-xs font-medium text-secondary hover:text-primary">
          Voir tout
        </NuxtLink>
      </div>

      <table class="w-full text-sm">
        <thead class="bg-slate-50 border-b border-slate-200">
          <tr class="text-left text-xs font-semibold text-ink-light uppercase tracking-wide">
            <th class="px-5 py-3">Étudiant</th>
            <th class="px-5 py-3">Titre du projet</th>
            <th class="px-5 py-3">Statut</th>
            <th class="px-5 py-3">Dernière version</th>
            <th class="px-5 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="p in stats?.projets_recents" :key="p.id" class="hover:bg-slate-50/60">
            <td class="px-5 py-3 font-medium text-slate-900">{{ p.etudiant }}</td>
            <td class="px-5 py-3 text-ink-light max-w-xs truncate">{{ p.titre }}</td>
            <td class="px-5 py-3">
              <span class="inline-flex px-2.5 py-1 rounded-full text-xs font-medium" :class="badgesStatuts[p.statut]?.classe">
                {{ badgesStatuts[p.statut]?.label }}
              </span>
            </td>
            <td class="px-5 py-3 text-ink-light">V{{ p.derniere_version ?? '—' }}</td>
            <td class="px-5 py-3 text-right">
              <NuxtLink :to="`/encadreur/projets/${p.id}`" class="text-xs font-medium text-secondary hover:text-primary">
                Examiner
              </NuxtLink>
            </td>
          </tr>

          <tr v-if="!stats?.projets_recents.length">
            <td colspan="5" class="px-5 py-10 text-center text-ink-light text-sm">Aucun projet encadré pour l'instant.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>