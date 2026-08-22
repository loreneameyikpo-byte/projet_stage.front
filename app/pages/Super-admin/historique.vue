<script setup lang="ts">
import { useApi } from '~/Composables/useApi'

definePageMeta({ layout: 'dashboard', middleware: 'role', roles: ['super_administrateur'] })

const { apiFetch } = useApi()

interface EntreeHistorique {
  id: number
  type: string
  description: string
  sujet_type: string
  sujet_id: string
  auteur: string
  modifications: Record<string, any>
  date: string
}

const page = ref(1)
const typeFiltre = ref('')
const recherche = ref('')
const chargement = ref(false)

const { data, refresh } = await useAsyncData(
  'historique',
  () => apiFetch<{ historique: EntreeHistorique[]; pagination: { page_actuelle: number; nb_pages: number; total: number } }>(
    '/historique',
    { query: { page: page.value, type: typeFiltre.value || undefined, recherche: recherche.value || undefined } }
  ),
  { watch: [page] }
)

const optionsType = [
  { value: '', label: 'Tous les types' },
  { value: 'utilisateur', label: 'Utilisateurs' },
  { value: 'projet', label: 'Projets' },
  { value: 'presentation', label: 'Soutenances' },
]

async function appliquerFiltres() {
  page.value = 1
  chargement.value = true
  await refresh()
  chargement.value = false
}

function labelType(type: string) {
  return { utilisateur: 'Utilisateur', projet: 'Projet', presentation: 'Soutenance' }[type] ?? type
}

function couleurType(type: string) {
  return {
    utilisateur: 'bg-secondary/10 text-secondary',
    projet: 'bg-accent/10 text-accent',
    presentation: 'bg-warning/10 text-warning',
  }[type] ?? 'bg-slate-100 text-slate-600'
}

const estMonte = ref(false)
onMounted(() => {
  requestAnimationFrame(() => { estMonte.value = true })
})
</script>

<template>
  <div>
    <div class="mb-6 opacity-0" :class="estMonte ? 'animate-entree' : ''">
      <h1 class="text-2xl font-bold text-slate-900">Historique d'activité</h1>
      <p class="text-sm text-ink-light mt-1">
        {{ data?.pagination.total ?? 0 }} action(s) enregistrée(s) sur la plateforme
      </p>
    </div>

    <!-- Filtres -->
    <div class="relative z-20 flex flex-wrap items-center gap-3 mb-6 opacity-0" :class="estMonte ? 'animate-entree' : ''" style="animation-delay: 80ms">
      <SelectPersonnalise
        v-model="typeFiltre"
        :options="optionsType"
        placeholder="Type"
        trigger-class="w-48 flex items-center justify-between gap-2 px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-card text-slate-900 focus:outline-none focus:ring-2 focus:ring-secondary"
        @update:model-value="appliquerFiltres"
      />
      <div class="relative flex-1 max-w-sm">
        <svg class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
        </svg>
        <input
          v-model="recherche"
          type="text"
          placeholder="Rechercher dans les descriptions..."
          class="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
          @keyup.enter="appliquerFiltres"
        />
      </div>
      <button
        type="button"
        @click="appliquerFiltres"
        class="bg-secondary hover:bg-primary text-white text-sm font-medium px-4 py-2.5 rounded-lg transition active:scale-95"
      >
        Filtrer
      </button>
    </div>

    <!-- Liste -->
    <div class="bg-card border border-slate-200 rounded-lg overflow-hidden opacity-0" :class="estMonte ? 'animate-entree' : ''" style="animation-delay: 140ms">
      <table class="w-full text-sm">
        <thead class="bg-slate-50 border-b border-slate-200">
          <tr class="text-left text-xs font-semibold text-ink-light uppercase tracking-wide">
            <th class="px-5 py-3">Date et heure</th>
            <th class="px-5 py-3">Type</th>
            <th class="px-5 py-3">Description</th>
            <th class="px-5 py-3">Auteur</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="entree in data?.historique" :key="entree.id" class="hover:bg-slate-50/60">
            <td class="px-5 py-3 text-ink-light whitespace-nowrap">{{ entree.date }}</td>
            <td class="px-5 py-3">
              <span class="inline-flex px-2.5 py-1 rounded-full text-xs font-medium" :class="couleurType(entree.type)">
                {{ labelType(entree.type) }}
              </span>
            </td>
            <td class="px-5 py-3 text-slate-900">{{ entree.description }}</td>
            <td class="px-5 py-3 text-ink-light">{{ entree.auteur }}</td>
          </tr>
        </tbody>
      </table>

      <p v-if="!data?.historique.length" class="text-sm text-ink-light text-center py-10">
        Aucune activité enregistrée pour ces filtres.
      </p>
    </div>

    <!-- Pagination -->
    <div v-if="data && data.pagination.nb_pages > 1" class="flex items-center justify-center gap-2 mt-5">
      <button
        type="button"
        :disabled="page <= 1"
        @click="page--"
        class="p-2 rounded-lg text-ink-light hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <span class="text-sm text-ink-light">
        Page {{ data.pagination.page_actuelle }} / {{ data.pagination.nb_pages }}
      </span>
      <button
        type="button"
        :disabled="page >= data.pagination.nb_pages"
        @click="page++"
        class="p-2 rounded-lg text-ink-light hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
@keyframes entree {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-entree {
  animation: entree 0.5s ease-out forwards;
}
</style>