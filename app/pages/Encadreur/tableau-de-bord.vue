<script setup lang="ts">
import { useApi } from '~/Composables/useApi'
import { computed, onMounted, ref, watch } from 'vue'

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
  { label: 'Projets encadrés', valeur: stats.value?.total_projets ?? 0, couleur: 'bg-secondary/10 text-secondary', icone: 'FileText' },
  { label: 'En attente de revue', valeur: stats.value?.en_attente ?? 0, couleur: 'bg-warning/10 text-warning', icone: 'Clock' },
  { label: 'Projets validés', valeur: stats.value?.valides ?? 0, couleur: 'bg-accent/10 text-accent', icone: 'Check' },
  { label: 'Soutenances à venir', valeur: stats.value?.soutenances_a_venir ?? 0, couleur: 'bg-secondary/10 text-secondary', icone: 'Calendar' },
])

const badgesStatuts: Record<string, { label: string; classe: string }> = {
  en_attente: { label: 'En attente', classe: 'bg-warning/10 text-warning' },
  corrections: { label: 'Corrections demandées', classe: 'bg-danger/10 text-danger' },
  valide: { label: 'Validé', classe: 'bg-accent/10 text-accent' },
  presentation_planifiee: { label: 'Présentation planifiée', classe: 'bg-secondary/10 text-secondary' },
  presente: { label: 'Présenté', classe: 'bg-slate-200 text-slate-600' },
}

/* ---------- Animations d'entrée + compteurs ---------- */
const estMonte = ref(false)
const valeursAnimees = ref<number[]>(cartes.value.map(() => 0))

function animerCompteurs() {
  cartes.value.forEach((c, i) => {
    const duree = 900
    const debut = performance.now()
    const cible = c.valeur
    const jouerFrame = (t: number) => {
      const progres = Math.min((t - debut) / duree, 1)
      const ease = 1 - Math.pow(1 - progres, 3)
      valeursAnimees.value[i] = Math.round(cible * ease)
      if (progres < 1) requestAnimationFrame(jouerFrame)
    }
    setTimeout(() => requestAnimationFrame(jouerFrame), i * 90)
  })
}

onMounted(() => {
  requestAnimationFrame(() => { estMonte.value = true })
  animerCompteurs()
})

watch(stats, () => {
  valeursAnimees.value = cartes.value.map(() => 0)
  animerCompteurs()
})
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold text-slate-900">Tableau de bord</h1>
    <p class="text-sm text-secondary mt-1 mb-6">
      Bienvenue, {{ authStore.utilisateur?.prenom }} {{ authStore.utilisateur?.nom }}{{ stats?.specialite ? ' — ' + stats.specialite : '' }}
    </p>

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div
        v-for="(c, i) in cartes"
        :key="c.label"
        class="bg-card border border-slate-200 rounded-lg p-4 opacity-0 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300"
        :class="estMonte ? 'animate-entree' : ''"
        :style="{ animationDelay: `${i * 80}ms` }"
      >
        <span :class="['inline-flex w-9 h-9 rounded-lg items-center justify-center mb-3', c.couleur]">
          <BaseIcon :name="c.icone" size="18" stroke-width="2" class="w-4.5 h-4.5" />
        </span>
        <p class="text-2xl font-bold text-slate-900 tabular-nums">{{ valeursAnimees[i] }}</p>
        <p class="text-xs text-ink-light">{{ c.label }}</p>
      </div>
    </div>

    <div
      class="bg-card border border-slate-200 rounded-lg overflow-hidden opacity-0"
      :class="estMonte ? 'animate-entree' : ''"
      :style="{ animationDelay: '340ms' }"
    >
      <div class="flex items-center justify-between px-5 py-4 border-b border-slate-200">
        <h2 class="font-semibold text-slate-900">Mes projets encadrés</h2>
        <NuxtLink to="/encadreur/projets-a-encadrer" class="text-xs font-medium text-secondary hover:text-primary transition-colors">
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
          <tr
            v-for="(p, i) in stats?.projets_recents"
            :key="p.id"
            class="hover:bg-slate-50/60 transition-colors opacity-0"
            :class="estMonte ? 'animate-entree' : ''"
            :style="{ animationDelay: `${420 + i * 60}ms` }"
          >
            <td class="px-5 py-3 font-medium text-slate-900">{{ p.etudiant }}</td>
            <td class="px-5 py-3 text-ink-light max-w-xs truncate">{{ p.titre }}</td>
            <td class="px-5 py-3">
              <span class="inline-flex px-2.5 py-1 rounded-full text-xs font-medium" :class="badgesStatuts[p.statut]?.classe">
                {{ badgesStatuts[p.statut]?.label }}
              </span>
            </td>
            <td class="px-5 py-3 text-ink-light">V{{ p.derniere_version ?? '—' }}</td>
            <td class="px-5 py-3 text-right">
              <NuxtLink :to="`/encadreur/projets/${p.id}`" class="text-xs font-medium text-secondary hover:text-primary transition-colors">
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