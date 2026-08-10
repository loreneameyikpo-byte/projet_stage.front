<script setup lang="ts">
import { useApi } from '~/Composables/useApi'

definePageMeta({ layout: 'dashboard', middleware: 'role' })
useRoute().meta.roles = ['encadreur']

const { apiFetch } = useApi()

interface Projet {
  id: string
  titre: string
  statut: string
  etudiant: { nom: string; prenom: string; promotion?: string | null }
  derniere_version?: { date_depot: string } | null
}

const { data } = await useAsyncData('projets-a-encadrer', () => apiFetch<{ projets: Projet[] }>('/projets'))

const onglets = [
  { valeur: 'tous', label: 'Tous' },
  { valeur: 'en_attente', label: 'En attente' },
  { valeur: 'corrections', label: 'Corrections' },
  { valeur: 'valide', label: 'Validés' },
  { valeur: 'presentation_planifiee', label: 'Planifiés' },
  { valeur: 'presente', label: 'Présentés' },
]
const ongletActif = ref('tous')
const recherche = ref('')

const estMonte = ref(false)
onMounted(() => {
  requestAnimationFrame(() => { estMonte.value = true })
})

function compte(statut: string) {
  if (statut === 'tous') return data.value?.projets.length ?? 0
  return (data.value?.projets ?? []).filter((p) => p.statut === statut).length
}

const projetsFiltres = computed(() => {
  const terme = recherche.value.toLowerCase()
  return (data.value?.projets ?? []).filter((p) => {
    const correspondStatut = ongletActif.value === 'tous' || p.statut === ongletActif.value
    const correspondTerme = `${p.titre} ${p.etudiant.prenom} ${p.etudiant.nom}`.toLowerCase().includes(terme)
    return correspondStatut && correspondTerme
  })
})

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
    <div class="mb-6 opacity-0" :class="estMonte ? 'animate-entree' : ''">
      <h1 class="text-2xl font-bold text-slate-900">Projets à encadrer</h1>
      <p class="text-sm text-ink-light mt-1">{{ data?.projets.length ?? 0 }} projets assignés</p>
    </div>

    <div class="flex flex-wrap items-center justify-between gap-3 mb-6 opacity-0" :class="estMonte ? 'animate-entree' : ''" style="animation-delay: 80ms">
      <div class="flex flex-wrap gap-2">
        <button
          v-for="o in onglets"
          :key="o.valeur"
          type="button"
          @click="ongletActif = o.valeur"
          class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium transition active:scale-95"
          :class="ongletActif === o.valeur ? 'bg-primary text-white' : 'bg-slate-100 text-ink-light hover:bg-slate-200'"
        >
          {{ o.label }}
          <span class="text-xs px-1.5 rounded-full transition-transform" :class="ongletActif === o.valeur ? 'bg-white/20 scale-105' : 'bg-card'">
            {{ compte(o.valeur) }}
          </span>
        </button>
      </div>

      <div class="relative w-72">
        <svg class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
        </svg>
        <input
          v-model="recherche"
          type="text"
          placeholder="Rechercher un projet ou un étudiant..."
          class="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary transition-shadow"
        />
      </div>
    </div>

    <div class="bg-card border border-slate-200 rounded-lg overflow-x-auto opacity-0" :class="estMonte ? 'animate-entree' : ''" style="animation-delay: 140ms">
      <table class="w-full text-sm">
        <thead class="bg-slate-50 border-b border-slate-200">
          <tr class="text-left text-xs font-semibold text-ink-light uppercase tracking-wide">
            <th class="px-5 py-3">Étudiant</th>
            <th class="px-5 py-3">Projet</th>
            <th class="px-5 py-3">Promotion</th>
            <th class="px-5 py-3">Statut</th>
            <th class="px-5 py-3">Dépôt</th>
            <th class="px-5 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <TransitionGroup tag="tbody" name="ligne" class="divide-y divide-slate-100">
          <tr v-for="p in projetsFiltres" :key="p.id" class="hover:bg-slate-50/60">
            <td class="px-5 py-3">
              <div class="flex items-center gap-2">
                <span class="w-6 h-6 rounded-full bg-secondary/10 text-secondary text-[10px] font-semibold flex items-center justify-center shrink-0">
                  {{ p.etudiant.prenom.charAt(0) }}{{ p.etudiant.nom.charAt(0) }}
                </span>
                {{ p.etudiant.prenom }} {{ p.etudiant.nom }}
              </div>
            </td>
            <td class="px-5 py-3 text-slate-900 max-w-xs truncate">{{ p.titre }}</td>
            <td class="px-5 py-3 text-secondary">{{ p.etudiant.promotion ?? '—' }}</td>
            <td class="px-5 py-3">
              <span class="inline-flex px-2.5 py-1 rounded-full text-xs font-medium" :class="badgesStatuts[p.statut]?.classe">
                {{ badgesStatuts[p.statut]?.label }}
              </span>
            </td>
            <td class="px-5 py-3 text-ink-light whitespace-nowrap">{{ p.derniere_version?.date_depot ?? '—' }}</td>
            <td class="px-5 py-3 text-right">
              <NuxtLink :to="`/encadreur/projets/${p.id}`" class="inline-flex items-center gap-1 text-xs font-medium text-secondary hover:text-primary transition-all group">
                Voir le détail
                <span aria-hidden="true" class="transition-transform group-hover:translate-x-0.5">→</span>
              </NuxtLink>
            </td>
          </tr>

          <tr v-if="!projetsFiltres.length">
            <td colspan="6" class="px-5 py-10 text-center text-ink-light text-sm">Aucun projet trouvé.</td>
          </tr>
        </TransitionGroup>
      </table>
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

.ligne-enter-active,
.ligne-leave-active {
  transition: opacity 0.25s ease;
}
.ligne-enter-from,
.ligne-leave-to {
  opacity: 0;
}
</style>