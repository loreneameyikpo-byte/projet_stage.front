<script setup lang="ts">
import { useApi } from '~/Composables/useApi'

definePageMeta({ layout: 'dashboard', middleware: 'role' })
useRoute().meta.roles = ['encadreur']

const { apiFetch } = useApi()

interface Presentation {
  id: string
  date_presentation: string
  heure_presentation: string
  note_finale: number | null
  etudiant: { nom: string; prenom: string }
  projet: { titre: string }
  salle: { numero: string; libelle: string | null }
}

const { data } = await useAsyncData('encadreur-presentations', () =>
  apiFetch<{ presentations: Presentation[] }>('/presentations')
)

const presentationsTriees = computed(() =>
  [...(data.value?.presentations ?? [])].sort(
    (a, b) => new Date(a.date_presentation).getTime() - new Date(b.date_presentation).getTime()
  )
)

const aVenir = computed(() => presentationsTriees.value.filter((p) => new Date(p.date_presentation) >= new Date(new Date().toDateString())))
const passees = computed(() => presentationsTriees.value.filter((p) => new Date(p.date_presentation) < new Date(new Date().toDateString())))

// --- Calendrier ---
const moisAffiche = ref(new Date())
const nomsJours = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM']

const nomMoisAnnee = computed(() => moisAffiche.value.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }))

const joursDuMois = computed(() => {
  const annee = moisAffiche.value.getFullYear()
  const mois = moisAffiche.value.getMonth()
  const premierJour = new Date(annee, mois, 1)
  const dernierJour = new Date(annee, mois + 1, 0)
  const decalage = (premierJour.getDay() + 6) % 7

  const jours: (number | null)[] = Array(decalage).fill(null)
  for (let j = 1; j <= dernierJour.getDate(); j++) jours.push(j)
  return jours
})

function presentationsDuJour(jour: number | null) {
  if (!jour) return []
  const annee = moisAffiche.value.getFullYear()
  const mois = String(moisAffiche.value.getMonth() + 1).padStart(2, '0')
  const jourStr = String(jour).padStart(2, '0')
  const dateCible = `${annee}-${mois}-${jourStr}`
  return presentationsTriees.value.filter((p) => p.date_presentation === dateCible)
}

function moisPrecedent() {
  moisAffiche.value = new Date(moisAffiche.value.getFullYear(), moisAffiche.value.getMonth() - 1, 1)
}
function moisSuivant() {
  moisAffiche.value = new Date(moisAffiche.value.getFullYear(), moisAffiche.value.getMonth() + 1, 1)
}

const presentationDetail = ref<Presentation | null>(null)

const estMonte = ref(false)
onMounted(() => {
  requestAnimationFrame(() => { estMonte.value = true })
})
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold text-slate-900 opacity-0" :class="estMonte ? 'animate-entree' : ''">Calendrier des soutenances</h1>
    <p class="text-sm text-ink-light mt-1 mb-6 opacity-0" :class="estMonte ? 'animate-entree' : ''" style="animation-delay: 40ms">Vos soutenances, comme encadrant ou membre de jury</p>

    <div class="grid lg:grid-cols-3 gap-6">
      <!-- Calendrier -->
      <div class="lg:col-span-2 bg-card border border-slate-200 rounded-lg p-5 opacity-0" :class="estMonte ? 'animate-entree' : ''" style="animation-delay: 100ms">
        <div class="flex items-center justify-between mb-4">
          <button type="button" @click="moisPrecedent" class="p-1.5 text-ink-light hover:text-secondary hover:scale-110 active:scale-95 transition">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <p class="font-semibold text-slate-900 capitalize">{{ nomMoisAnnee }}</p>
          <button type="button" @click="moisSuivant" class="p-1.5 text-ink-light hover:text-secondary hover:scale-110 active:scale-95 transition">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div class="grid grid-cols-7 gap-px bg-slate-100 rounded-lg overflow-hidden text-xs">
          <div v-for="j in nomsJours" :key="j" class="bg-slate-50 text-center py-2 font-semibold text-ink-light">{{ j }}</div>

          <div v-for="(jour, i) in joursDuMois" :key="i" class="bg-card min-h-[80px] p-1.5" :class="!jour ? 'bg-slate-50/50' : ''">
            <p v-if="jour" class="text-slate-500 mb-1">{{ jour }}</p>
            <button
              v-for="p in presentationsDuJour(jour)"
              :key="p.id"
              type="button"
              class="w-full text-left bg-secondary/10 text-secondary text-[10px] rounded px-1.5 py-1 mb-1 truncate hover:bg-secondary/20 active:scale-95 transition"
              @click="presentationDetail = p"
            >
              {{ p.heure_presentation }} — {{ p.etudiant.prenom }}
            </button>
          </div>
        </div>
      </div>

      <!-- Liste latérale -->
      <div class="space-y-6 opacity-0" :class="estMonte ? 'animate-entree' : ''" style="animation-delay: 160ms">
        <div class="bg-card border border-slate-200 rounded-lg p-5">
          <h3 class="font-semibold text-slate-900 text-sm mb-3">À venir</h3>
          <TransitionGroup tag="div" name="ligne" class="space-y-3">
            <button
              v-for="p in aVenir"
              :key="p.id"
              type="button"
              class="w-full text-left border border-slate-100 rounded-lg p-3 hover:border-secondary/40 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98] transition-all"
              @click="presentationDetail = p"
            >
              <p class="text-sm font-medium text-slate-900 truncate">{{ p.etudiant.prenom }} {{ p.etudiant.nom }}</p>
              <p class="text-xs text-ink-light">{{ p.date_presentation }} à {{ p.heure_presentation }} — {{ p.salle.numero }}</p>
            </button>
            <p v-if="!aVenir.length" class="text-xs text-ink-light">Aucune soutenance à venir.</p>
          </TransitionGroup>
        </div>

        <div class="bg-card border border-slate-200 rounded-lg p-5">
          <h3 class="font-semibold text-slate-900 text-sm mb-3">Passées</h3>
          <TransitionGroup tag="div" name="ligne" class="space-y-3">
            <button
              v-for="p in passees"
              :key="p.id"
              type="button"
              class="w-full text-left border border-slate-100 rounded-lg p-3 hover:border-secondary/40 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98] transition-all"
              @click="presentationDetail = p"
            >
              <p class="text-sm font-medium text-slate-900 truncate">{{ p.etudiant.prenom }} {{ p.etudiant.nom }}</p>
              <p class="text-xs text-ink-light">{{ p.date_presentation }}</p>
              <p v-if="p.note_finale !== null" class="text-xs font-semibold text-accent mt-1">{{ p.note_finale }}/20</p>
            </button>
            <p v-if="!passees.length" class="text-xs text-ink-light">Aucune soutenance passée.</p>
          </TransitionGroup>
        </div>
      </div>
    </div>

    <!-- Modale détail -->
    <Transition name="modale-fondu">
      <div v-if="presentationDetail" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
        <Transition name="panneau-zoom" appear>
          <div class="w-full max-w-md bg-card rounded-xl shadow-xl p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-bold text-slate-900">Détail de la soutenance</h2>
              <button type="button" @click="presentationDetail = null" class="text-ink-light hover:text-slate-600 hover:scale-110 active:scale-95 transition">
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div class="space-y-3 text-sm">
              <div>
                <p class="text-xs text-secondary uppercase font-semibold mb-1">Projet</p>
                <p class="text-slate-900 font-medium">{{ presentationDetail.projet.titre }}</p>
              </div>
              <div>
                <p class="text-xs text-secondary uppercase font-semibold mb-1">Étudiant</p>
                <p class="text-slate-900">{{ presentationDetail.etudiant.prenom }} {{ presentationDetail.etudiant.nom }}</p>
              </div>
              <div>
                <p class="text-xs text-secondary uppercase font-semibold mb-1">Date et heure</p>
                <p class="text-slate-900">{{ presentationDetail.date_presentation }} à {{ presentationDetail.heure_presentation }}</p>
              </div>
              <div>
                <p class="text-xs text-secondary uppercase font-semibold mb-1">Salle</p>
                <p class="text-slate-900">{{ presentationDetail.salle.numero }}{{ presentationDetail.salle.libelle ? ' — ' + presentationDetail.salle.libelle : '' }}</p>
              </div>
              <div v-if="presentationDetail.note_finale !== null">
                <p class="text-xs text-secondary uppercase font-semibold mb-1">Note finale</p>
                <p class="text-accent font-semibold">{{ presentationDetail.note_finale }}/20</p>
              </div>
            </div>

            <div class="flex justify-end pt-5 mt-5 border-t border-slate-100">
              <button type="button" @click="presentationDetail = null" class="text-sm font-medium text-secondary hover:text-primary">
                Fermer
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
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

.modale-fondu-enter-active,
.modale-fondu-leave-active {
  transition: opacity 0.2s ease;
}
.modale-fondu-enter-from,
.modale-fondu-leave-to {
  opacity: 0;
}

.panneau-zoom-enter-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.panneau-zoom-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.panneau-zoom-enter-from,
.panneau-zoom-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(6px);
}
</style>