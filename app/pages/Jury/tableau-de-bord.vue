<script setup lang="ts">
import { useApi } from '~/Composables/useApi'
import { computed, onMounted, ref, watch } from 'vue'

definePageMeta({ layout: 'dashboard', middleware: 'role' })
useRoute().meta.roles = ['jury_externe']

const { apiFetch } = useApi()
const authStore = useAuthStore()

interface PresentationJury {
  id_jury: string
  projet_titre: string
  etudiant: string
  date_presentation: string
  heure_presentation: string
  salle: string
  role_jury: string
  note_saisie: number | null
}
interface StatsDashboard {
  specialite: string | null
  total_soutenances: number
  a_venir: number
  notees: number
  en_attente_notation: number
  presentations: PresentationJury[]
}

const { data: stats } = await useAsyncData('jury-dashboard', () => apiFetch<StatsDashboard>('/stats-jury/dashboard'))

const cartes = computed(() => [
  { label: 'Soutenances', valeur: stats.value?.total_soutenances ?? 0, couleur: 'bg-secondary/10 text-secondary', icone: 'Calendar' },
  { label: 'À venir', valeur: stats.value?.a_venir ?? 0, couleur: 'bg-warning/10 text-warning', icone: 'Clock' },
  { label: 'Notées', valeur: stats.value?.notees ?? 0, couleur: 'bg-accent/10 text-accent', icone: 'CheckCircle' },
  { label: 'En attente de notation', valeur: stats.value?.en_attente_notation ?? 0, couleur: 'bg-danger/10 text-danger', icone: 'FileText' },
])

function labelRole(role: string) {
  return { president: 'Président', rapporteur: 'Rapporteur', membre: 'Membre' }[role] ?? role
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
        <h2 class="font-semibold text-slate-900">Mes soutenances</h2>
        <NuxtLink to="/jury/evaluations" class="text-xs font-medium text-secondary hover:text-primary transition-colors">Voir tout</NuxtLink>
      </div>

      <table class="w-full text-sm">
        <thead class="bg-slate-50 border-b border-slate-200">
          <tr class="text-left text-xs font-semibold text-ink-light uppercase tracking-wide">
            <th class="px-5 py-3">Étudiant</th>
            <th class="px-5 py-3">Projet</th>
            <th class="px-5 py-3">Date</th>
            <th class="px-5 py-3">Rôle</th>
            <th class="px-5 py-3">Note</th>
            <th class="px-5 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr
            v-for="(p, i) in stats?.presentations" :key="p.id_jury"
            class="hover:bg-slate-50/60 transition-colors opacity-0"
            :class="estMonte ? 'animate-entree' : ''"
            :style="{ animationDelay: `${420 + i * 60}ms` }"
          >
            <td class="px-5 py-3 font-medium text-slate-900">{{ p.etudiant }}</td>
            <td class="px-5 py-3 text-ink-light max-w-xs truncate">{{ p.projet_titre }}</td>
            <td class="px-5 py-3 text-ink-light">{{ p.date_presentation }} — {{ p.heure_presentation }}</td>
            <td class="px-5 py-3">
              <span class="inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium bg-secondary/10 text-secondary">{{ labelRole(p.role_jury) }}</span>
            </td>
            <td class="px-5 py-3">
              <span v-if="p.note_saisie !== null" class="font-semibold text-accent">{{ p.note_saisie }}/20</span>
              <span v-else class="text-warning italic">En attente</span>
            </td>
            <td class="px-5 py-3 text-right">
              <NuxtLink :to="`/jury/evaluations/${p.id_jury}`" class="text-xs font-medium text-secondary hover:text-primary transition-colors">
                {{ p.note_saisie !== null ? 'Voir' : 'Évaluer' }}
              </NuxtLink>
            </td>
          </tr>

          <tr v-if="!stats?.presentations.length">
            <td colspan="6" class="px-5 py-10 text-center text-ink-light text-sm">Aucune soutenance assignée.</td>
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