<script setup lang="ts">
import { useApi } from '~/Composables/useApi'
import { computed, onMounted, ref, watch } from 'vue'
import { useAsyncData, useRoute } from '#imports'

definePageMeta({ layout: 'dashboard', middleware: 'role', roles: ['administrateur', 'super_administrateur'] })

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
  { label: 'Utilisateurs', valeur: stats.value?.total_utilisateurs ?? 0, couleur: 'bg-secondary/10 text-secondary', icone: 'Users' },
  { label: 'Étudiants', valeur: stats.value?.total_etudiants ?? 0, couleur: 'bg-accent/10 text-accent', icone: 'User' },
  { label: 'Projets', valeur: stats.value?.total_projets ?? 0, couleur: 'bg-warning/10 text-warning', icone: 'FileText' },
  { label: 'Soutenances', valeur: stats.value?.total_soutenances ?? 0, couleur: 'bg-secondary/10 text-secondary', icone: 'Calendar' },
  { label: 'Administrateurs', valeur: stats.value?.total_administrateurs ?? 0, couleur: 'bg-primary/10 text-primary', icone: 'Shield' },
])

const libellesStatuts = {
  en_attente: { label: 'En attente', couleur: 'bg-warning', texte: 'text-warning' },
  corrections: { label: 'Corrections demandées', couleur: 'bg-danger', texte: 'text-danger' },
  valide: { label: 'Validé', couleur: 'bg-accent', texte: 'text-accent' },
  presentation_planifiee: { label: 'Présentation planifiée', couleur: 'bg-secondary', texte: 'text-secondary' },
  presente: { label: 'Présenté', couleur: 'bg-primary', texte: 'text-primary' },
} as const

type LibelleStatutKey = keyof typeof libellesStatuts
const statutKeys = Object.keys(libellesStatuts) as LibelleStatutKey[]

const accesRapides = [
  { label: 'Administrateurs', chemin: '/super-admin/administrateurs', icone: 'Users' },
  { label: 'Rôles', chemin: '/super-admin/roles', icone: 'Shield' },
  { label: 'Paramètres', chemin: '/super-admin/parametres', icone: 'Settings' },
  { label: 'Rapports', chemin: '/super-admin/rapports', icone: 'BarChart2' },
  { label: 'Projets', chemin: '/super-admin/projets', icone: 'FileText' },
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

/* ---------- Graphe : comparaison par promotion (courbe lissée) ---------- */
const largeur = 560
const hauteur = 180
const padX = 16
const padY = 16

const donneesPromo = computed(() => stats.value?.comparaison_par_promotion ?? [])

const maxValeur = computed(() => {
  const vals = donneesPromo.value.flatMap(p => [p.nb_projets, p.nb_etudiants])
  return Math.max(...vals, 1)
})

function pointsPour(cle: 'nb_projets' | 'nb_etudiants') {
  const n = donneesPromo.value.length
  if (n === 0) return []
  const step = n > 1 ? (largeur - padX * 2) / (n - 1) : 0
  return donneesPromo.value.map((p, i) => ({
    x: n > 1 ? padX + step * i : largeur / 2,
    y: hauteur - padY - (p[cle] / maxValeur.value) * (hauteur - padY * 2),
  }))
}

function lisser(points: { x: number; y: number }[]) {
  if (points.length === 0) return ''
  if (points.length === 1) {
    const p = points[0]!
    return `M${p.x},${p.y}`
  }
  const first = points[0]!
  let d = `M${first.x},${first.y}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1]!
    const p1 = points[i]!
    const p2 = points[i + 1]!
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1]!
    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6
    d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`
  }
  return d
}

const pointsProjets = computed(() => pointsPour('nb_projets'))
const pointsEtudiants = computed(() => pointsPour('nb_etudiants'))
const cheminProjets = computed(() => lisser(pointsProjets.value))
const cheminEtudiants = computed(() => lisser(pointsEtudiants.value))
const aireProjets = computed(() => {
  const points = pointsProjets.value
  if (!points.length) return ''
  const dernier = points[points.length - 1]!
  const premier = points[0]!
  return `${cheminProjets.value} L${dernier.x},${hauteur - padY} L${premier.x},${hauteur - padY} Z`
})

/* ---------- Graphe : répartition des projets (donut) ---------- */
const rayon = 54
const circonference = 2 * Math.PI * rayon

const totalRepartition = computed(() =>
  statutKeys.reduce((s, k) => s + (stats.value?.repartition_projets?.[k] ?? 0), 0)
)

const segmentsDonut = computed(() => {
  let cumule = 0
  return statutKeys.map((cle) => {
    const valeur = stats.value?.repartition_projets?.[cle] ?? 0
    const part = totalRepartition.value > 0 ? valeur / totalRepartition.value : 0
    const dash = part * circonference
    const segment = { cle, dash, cumuleAvant: cumule, texte: libellesStatuts[cle].texte }
    cumule += dash
    return segment
  })
})

function pourcentage(cle: LibelleStatutKey) {
  const valeur = stats.value?.repartition_projets?.[cle] ?? 0
  return totalRepartition.value > 0 ? Math.round((valeur / totalRepartition.value) * 100) : 0
}
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold text-slate-900">Tableau de bord global</h1>
    <p class="text-sm text-ink-light mt-1 mb-6">Vue consolidée - toutes promotions et filières</p>

    <!-- Cartes indicateurs -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
      <div
        v-for="(c, i) in cartes"
        :key="c.label"
        class="bg-card border border-slate-200 rounded-lg p-4 opacity-0 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300"
        :class="estMonte ? 'animate-entree' : ''"
        :style="{ animationDelay: `${i * 80}ms` }"
      >
        <span :class="['inline-flex w-8 h-8 rounded-md items-center justify-center mb-2', c.couleur]">
          <BaseIcon :name="c.icone" size="18" stroke-width="2" class="w-4 h-4" />
        </span>
        <p class="text-2xl font-bold text-slate-900 tabular-nums">{{ valeursAnimees[i] }}</p>
        <p class="text-xs text-ink-light">{{ c.label }}</p>
      </div>
    </div>

    <div class="grid lg:grid-cols-2 gap-6 mb-6">
      <!-- Comparaison par promotion -->
      <div class="bg-card border border-slate-200 rounded-lg p-6 opacity-0" :class="estMonte ? 'animate-entree' : ''" style="animation-delay: 360ms">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-semibold text-slate-900">Comparaison par promotion</h2>
          <div class="flex items-center gap-3 text-xs text-ink-light">
            <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-secondary"></span>Projets</span>
            <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-accent"></span>Étudiants</span>
          </div>
        </div>

        <div v-if="!donneesPromo.length" class="text-sm text-ink-light">
          Aucune promotion avec des étudiants pour l'instant.
        </div>

        <svg v-else :viewBox="`0 0 ${largeur} ${hauteur}`" class="w-full h-44 overflow-visible">
          <defs>
            <linearGradient id="gradProjets" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" class="text-secondary" style="stop-color: currentColor" stop-opacity="0.35" />
              <stop offset="100%" class="text-secondary" style="stop-color: currentColor" stop-opacity="0" />
            </linearGradient>
          </defs>

          <!-- lignes de repère horizontales -->
          <line v-for="n in 3" :key="n" x1="0" :x2="largeur" :y1="padY + (n - 1) * ((hauteur - padY * 2) / 2)" :y2="padY + (n - 1) * ((hauteur - padY * 2) / 2)" class="stroke-slate-100" stroke-width="1" />

          <!-- aire sous la courbe des projets -->
          <path :d="aireProjets" fill="url(#gradProjets)" class="transition-opacity duration-700" :style="{ opacity: estMonte ? 1 : 0, transitionDelay: '250ms' }" />

          <!-- courbe étudiants (dessous, plus discrète) -->
          <path
            :d="cheminEtudiants"
            fill="none"
            class="stroke-current text-accent transition-all duration-[1100ms] ease-out"
            stroke-width="2.5"
            stroke-linecap="round"
            :style="{ strokeDasharray: 1200, strokeDashoffset: estMonte ? 0 : 1200, opacity: 0.85 }"
          />

          <!-- courbe projets -->
          <path
            :d="cheminProjets"
            fill="none"
            class="stroke-current text-secondary transition-all duration-[1100ms] ease-out"
            stroke-width="3"
            stroke-linecap="round"
            :style="{ strokeDasharray: 1200, strokeDashoffset: estMonte ? 0 : 1200 }"
          />

          <!-- points -->
          <g v-for="(p, i) in pointsProjets" :key="i">
            <circle
              :cx="p.x" :cy="p.y" r="4"
              class="fill-current text-secondary transition-all duration-500"
              :style="{ opacity: estMonte ? 1 : 0, transitionDelay: `${700 + i * 70}ms` }"
            >
              <title>{{ donneesPromo[i]?.intitule }} - {{ donneesPromo[i]?.nb_projets ?? 0 }} projet(s)</title>
            </circle>
            <circle :cx="p.x" :cy="p.y" r="8" class="fill-current text-secondary" :style="{ opacity: 0.12 }" />
          </g>
        </svg>

        <div v-if="donneesPromo.length" class="flex justify-between mt-2 text-[11px] text-ink-light">
          <span v-for="p in donneesPromo" :key="p.intitule" class="truncate">{{ p.intitule }}</span>
        </div>
      </div>

      <!-- Répartition des projets -->
      <div class="bg-card border border-slate-200 rounded-lg p-6 opacity-0" :class="estMonte ? 'animate-entree' : ''" style="animation-delay: 400ms">
        <h2 class="font-semibold text-slate-900 mb-4">Répartition des projets</h2>

        <div class="flex flex-col sm:flex-row items-center gap-6">
          <div class="relative w-36 h-36 shrink-0">
            <svg viewBox="0 0 160 160" class="w-36 h-36 -rotate-90">
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
              <span class="text-xl font-bold text-slate-900 tabular-nums">{{ totalRepartition }}</span>
              <span class="text-[11px] text-ink-light">Projets</span>
            </div>
          </div>

          <ul class="w-full space-y-3">
            <li
              v-for="(cle, i) in statutKeys"
              :key="cle"
              class="flex items-center justify-between text-sm opacity-0"
              :class="estMonte ? 'animate-entree' : ''"
              :style="{ animationDelay: `${520 + i * 80}ms` }"
            >
              <span class="flex items-center gap-2 text-slate-900">
                <span class="w-2 h-2 rounded-full" :class="libellesStatuts[cle].couleur"></span>
                {{ libellesStatuts[cle].label }}
              </span>
              <span class="flex items-center gap-2">
                <span class="text-ink-light text-xs">{{ pourcentage(cle) }}%</span>
                <span class="font-medium text-slate-900">{{ stats?.repartition_projets?.[cle] ?? 0 }}</span>
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Accès rapides -->
    <div>
      <h2 class="font-semibold text-slate-900 mb-4">Accès rapides</h2>
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <NuxtLink
          v-for="(a, i) in accesRapides"
          :key="a.chemin"
          :to="a.chemin"
          class="bg-card border border-slate-200 rounded-lg p-5 flex flex-col items-center text-center hover:border-secondary/40 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-300 opacity-0"
          :class="estMonte ? 'animate-entree' : ''"
          :style="{ animationDelay: `${400 + i * 80}ms` }"
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