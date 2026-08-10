<script setup lang="ts">
import { useApi } from '../../Composables/useApi'
import { computed, onMounted, ref, watch } from 'vue'

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
  { label: 'Étudiants', valeur: stats.value?.total_etudiants ?? 0, couleur: 'bg-secondary/10 text-secondary', icone: 'Users' },
  { label: 'Encadreurs', valeur: stats.value?.total_encadreurs ?? 0, couleur: 'bg-accent/10 text-accent', icone: 'Users' },
  { label: 'Projets', valeur: stats.value?.total_projets ?? 0, couleur: 'bg-warning/10 text-warning', icone: 'FileText' },
  { label: 'Membres de jury', valeur: stats.value?.total_jury_externe ?? 0, couleur: 'bg-secondary/10 text-secondary', icone: 'Users' },
])

const libellesStatuts: Record<string, { label: string; couleur: string; texte: string }> = {
  en_attente: { label: 'En attente', couleur: 'bg-warning', texte: 'text-warning' },
  corrections: { label: 'Corrections demandées', couleur: 'bg-danger', texte: 'text-danger' },
  valide: { label: 'Validé', couleur: 'bg-accent', texte: 'text-accent' },
  presentation_planifiee: { label: 'Présentation planifiée', couleur: 'bg-secondary', texte: 'text-secondary' },
  presente: { label: 'Présenté', couleur: 'bg-primary', texte: 'text-primary' },
}

const badgesStatuts: Record<keyof typeof libellesStatuts, string> = {
  en_attente: 'bg-warning/10 text-warning',
  corrections: 'bg-danger/10 text-danger',
  valide: 'bg-accent/10 text-accent',
  presentation_planifiee: 'bg-secondary/10 text-secondary',
  presente: 'bg-slate-200 text-slate-600',
}

const statutEnregistrements = Object.entries(libellesStatuts) as Array<
  [keyof typeof libellesStatuts, { label: string; couleur: string; texte: string }]
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

const accesRapides = [
  { label: 'Étudiants', chemin: '/admin/etudiants', icone: 'Users' },
  { label: 'Encadreurs', chemin: '/admin/encadreurs', icone: 'Users' },
  { label: 'Jury', chemin: '/admin/jury-externes', icone: 'Users' },
  { label: 'Projets', chemin: '/admin/projets', icone: 'FileText' },
  { label: 'Présentations', chemin: '/admin/presentations', icone: 'Calendar' },
  { label: 'Profil', chemin: '/profil', icone: 'User' },
]

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

/* ---------- Donut : projets par statut ---------- */
const rayon = 54
const circonference = 2 * Math.PI * rayon

const totalProjetsStatut = computed(() =>
  Object.values(repartitionProjets.value).reduce((s, v) => s + v, 0)
)

const segmentsDonut = computed(() => {
  let cumule = 0
  return statutEnregistrements.map(([cle, infos]) => {
    const valeur = repartitionProjets.value[cle] ?? 0
    const part = totalProjetsStatut.value > 0 ? valeur / totalProjetsStatut.value : 0
    const dash = part * circonference
    const segment = { cle, dash, cumuleAvant: cumule, texte: infos.texte }
    cumule += dash
    return segment
  })
})

function pourcentage(cle: string) {
  const valeur = repartitionProjets.value[cle] ?? 0
  return totalProjetsStatut.value > 0 ? Math.round((valeur / totalProjetsStatut.value) * 100) : 0
}
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold text-slate-900">Tableau de bord</h1>
    <p class="text-sm text-ink-light mt-1 mb-6">Vue d'ensemble de la plateforme</p>

    <!-- Cartes -->
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

    <div class="grid lg:grid-cols-2 gap-6 mb-8">
      <!-- Projets par statut -->
      <div class="bg-card border border-slate-200 rounded-lg p-6">
        <h2 class="font-semibold text-slate-900 mb-4">Projets par statut</h2>

        <div class="flex flex-col sm:flex-row items-center gap-6">
          <div class="relative w-32 h-32 shrink-0">
            <svg viewBox="0 0 160 160" class="w-32 h-32 -rotate-90">
              <circle cx="80" cy="80" :r="rayon" fill="none" class="stroke-slate-100" stroke-width="16" />
              <circle
                v-for="(s, i) in segmentsDonut" :key="s.cle"
                cx="80" cy="80" :r="rayon" fill="none"
                :class="['stroke-current', s.texte, 'transition-all duration-[900ms] ease-out']"
                stroke-width="16"
                stroke-linecap="round"
                :style="{
                  strokeDasharray: `${estMonte ? s.dash : 0} ${circonference}`,
                  strokeDashoffset: -s.cumuleAvant,
                  transitionDelay: `${i * 90}ms`,
                }"
              />
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center">
              <span class="text-lg font-bold text-slate-900 tabular-nums">{{ totalProjetsStatut }}</span>
              <span class="text-[11px] text-ink-light">Projets</span>
            </div>
          </div>

          <div class="w-full space-y-3">
            <div
              v-for="([cle, infos], i) in statutEnregistrements" :key="cle"
              class="flex items-center justify-between text-sm opacity-0"
              :class="estMonte ? 'animate-entree' : ''"
              :style="{ animationDelay: `${300 + i * 80}ms` }"
            >
              <span class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full shrink-0" :class="infos.couleur"></span>
                <span class="text-slate-700">{{ infos.label }}</span>
              </span>
              <span class="flex items-center gap-2 shrink-0">
                <span class="text-ink-light text-xs">{{ pourcentage(cle) }}%</span>
                <span class="font-medium text-slate-900">{{ repartitionProjets[cle] ?? 0 }}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Projets récents -->
      <div class="bg-card border border-slate-200 rounded-lg p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-semibold text-slate-900">Projets récents</h2>
          <NuxtLink to="/admin/projets" class="text-xs font-medium text-secondary hover:text-primary transition-colors">Voir tout</NuxtLink>
        </div>

        <div class="space-y-4">
          <div
            v-for="(p, i) in stats?.projets_recents" :key="p.id"
            class="flex items-start justify-between gap-3 opacity-0"
            :class="estMonte ? 'animate-entree' : ''"
            :style="{ animationDelay: `${300 + i * 80}ms` }"
          >
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
          v-for="(a, i) in accesRapides"
          :key="a.chemin"
          :to="a.chemin"
          class="bg-card border border-slate-200 rounded-lg p-5 flex flex-col items-center text-center hover:border-secondary/40 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-300 opacity-0"
          :class="estMonte ? 'animate-entree' : ''"
          :style="{ animationDelay: `${400 + i * 70}ms` }"
        >
          <span class="w-9 h-9 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center mb-2">
            <BaseIcon :name="a.icone" size="18" stroke-width="2" class="w-4.5 h-4.5" />
          </span>
          <span class="text-sm font-medium text-slate-900">{{ a.label }}</span>
        </NuxtLink>
      </div>
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