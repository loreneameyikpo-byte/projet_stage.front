<script setup lang="ts">
import { useApi } from '../../Composables/useApi'
import { useConfirmation } from '../../Composables/useConfirmation'
import { useFormErrors } from '../../Composables/useFormErrors'

definePageMeta({ layout: 'dashboard', middleware: 'role', roles: ['administrateur', 'super_administrateur'] })

const { apiFetch } = useApi()
const { demander } = useConfirmation()
const { erreurGenerale, traiter, reinitialiser, champ } = useFormErrors()

interface Salle {
  id_salle: string
  numero: string
  libelle: string | null
  capacite: number
}

const { data, refresh } = await useAsyncData<{ salles: Salle[]; stats: { total: number; places_totales: number; moyenne_places: number } }>('salles', () =>
  apiFetch('/salles')
)

const recherche = ref('')
const erreurSuppression = ref('')

const estMonte = ref(false)
onMounted(() => {
  requestAnimationFrame(() => { estMonte.value = true })
})

const sallesFiltrees = computed(() => {
  const terme = recherche.value.toLowerCase()
  return (data.value?.salles ?? []).filter(
    (s) => s.numero.toLowerCase().includes(terme) || (s.libelle ?? '').toLowerCase().includes(terme)
  )
})

const capaciteMax = computed(() => Math.max(...(data.value?.salles.map((s) => s.capacite) ?? [1]), 1))

function pourcentage(capacite: number) {
  return Math.round((capacite / capaciteMax.value) * 100)
}

// --- Modale ---
const modaleOuverte = ref(false)
const salleEnEdition = ref<Salle | null>(null)
const numero = ref('')
const libelle = ref('')
const capacite = ref<number | ''>('')
const chargement = ref(false)

function ouvrirCreation() {
  salleEnEdition.value = null
  numero.value = ''
  libelle.value = ''
  capacite.value = ''
  reinitialiser()
  modaleOuverte.value = true
}

function ouvrirEdition(s: Salle) {
  salleEnEdition.value = s
  numero.value = s.numero
  libelle.value = s.libelle ?? ''
  capacite.value = s.capacite
  reinitialiser()
  modaleOuverte.value = true
}

async function enregistrer() {
  reinitialiser()
  chargement.value = true

  try {
    const body = { numero: numero.value, libelle: libelle.value || null, capacite: capacite.value }

    if (salleEnEdition.value) {
      await apiFetch(`/salles/${salleEnEdition.value.id_salle}`, { method: 'PUT', body })
    } else {
      await apiFetch('/salles', { method: 'POST', body })
    }

    modaleOuverte.value = false
    await refresh()
  } catch (e: any) {
    traiter(e)
  } finally {
    chargement.value = false
  }
}

async function supprimer(s: Salle) {
  const confirme = await demander({
    titre: 'Supprimer cette salle',
    message: `Supprimer "${s.numero}" ?`,
    texteConfirmer: 'Supprimer',
    dangereux: true,
  })
  if (!confirme) return

  erreurSuppression.value = ''
  try {
    await apiFetch(`/salles/${s.id_salle}`, { method: 'DELETE' })
    await refresh()
  } catch (e: any) {
    erreurSuppression.value = e?.data?.message || 'Une erreur est survenue.'
  }
}
</script>

<template>
  <div>
    <div class="flex items-start justify-between mb-6 opacity-0" :class="estMonte ? 'animate-entree' : ''">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">Gestion des salles</h1>
        <p class="text-sm text-ink-light mt-1">
          {{ data?.stats.total ?? 0 }} salles — capacité totale : {{ data?.stats.places_totales ?? 0 }} places
        </p>
      </div>
      <button
        type="button"
        @click="ouvrirCreation"
        class="inline-flex items-center gap-2 bg-secondary hover:bg-primary text-white text-sm font-medium px-4 py-2.5 rounded-lg transition active:scale-95 shrink-0"
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Ajouter une salle
      </button>
    </div>

    <FormAlerte :message="erreurSuppression" />

    <div class="grid grid-cols-3 gap-4 mb-6 max-w-xl">
      <div
        v-for="(stat, i) in [
          { valeur: data?.stats.total ?? 0, label: 'Salles', couleur: 'text-slate-900' },
          { valeur: data?.stats.places_totales ?? 0, label: 'Places totales', couleur: 'text-accent' },
          { valeur: data?.stats.moyenne_places ?? 0, label: 'Moy. places/salle', couleur: 'text-warning' },
        ]"
        :key="stat.label"
        class="bg-card border border-slate-200 rounded-lg p-4 opacity-0 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300"
        :class="estMonte ? 'animate-entree' : ''"
        :style="{ animationDelay: `${i * 80}ms` }"
      >
        <p class="text-2xl font-bold" :class="stat.couleur">{{ stat.valeur }}</p>
        <p class="text-xs text-ink-light">{{ stat.label }}</p>
      </div>
    </div>

    <div class="relative mb-6 max-w-sm opacity-0" :class="estMonte ? 'animate-entree' : ''" style="animation-delay: 260ms">
      <svg class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
      </svg>
      <input
        v-model="recherche"
        type="text"
        placeholder="Rechercher par numéro ou libellé..."
        class="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary transition-shadow"
      />
    </div>

    <TransitionGroup tag="div" name="carte" class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="s in sallesFiltrees" :key="s.id_salle" class="bg-card border border-slate-200 rounded-lg p-4 hover:border-secondary/40 hover:shadow-sm transition-all">
        <div class="flex items-start justify-between mb-1">
          <p class="font-semibold text-slate-900">{{ s.numero }}</p>
          <div class="flex items-center gap-1">
            <button type="button" class="p-1 text-ink-light hover:text-secondary hover:scale-110 active:scale-95 transition" @click="ouvrirEdition(s)">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button type="button" class="p-1 text-ink-light hover:text-danger hover:scale-110 active:scale-95 transition" @click="supprimer(s)">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
        <p class="text-xs text-ink-light mb-3">{{ s.libelle ?? '—' }}</p>
        <p class="text-xs text-ink-light mb-1">{{ s.capacite }} places</p>
        <div class="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div class="h-full bg-secondary rounded-full transition-all duration-700 ease-out" :style="{ width: (estMonte ? pourcentage(s.capacite) : 0) + '%' }"></div>
        </div>
      </div>

      <p v-if="!sallesFiltrees.length" class="col-span-full text-sm text-ink-light text-center py-10">
        Aucune salle trouvée.
      </p>
    </TransitionGroup>

    <!-- Modale -->
    <Transition name="modale-fondu">
      <div v-if="modaleOuverte" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
        <Transition name="panneau-zoom" appear>
          <div class="w-full max-w-md bg-card rounded-xl shadow-xl">
            <div class="px-6 pt-6 pb-2">
              <h2 class="text-lg font-bold text-slate-900">{{ salleEnEdition ? 'Modifier la salle' : 'Nouvelle salle' }}</h2>
            </div>

            <form @submit.prevent="enregistrer" class="px-6 py-4 space-y-4">
              <FormAlerte :message="erreurGenerale" />

              <FormInput v-model="numero" label="Numéro" placeholder="ex: A-101" :erreur="champ('numero')" requis />
              <FormInput v-model="libelle" label="Libellé" placeholder="ex: Amphi A — Bâtiment Principal" :erreur="champ('libelle')" />
              <FormInput v-model.number="capacite" label="Capacité (places)" type="number" :erreur="champ('capacite')" requis />

              <div class="flex items-center justify-end gap-4 pt-3 border-t border-slate-100">
                <button type="button" @click="modaleOuverte = false" class="text-sm font-medium text-secondary hover:text-primary">
                  Annuler
                </button>
                <button
                  type="submit"
                  :disabled="chargement"
                  class="bg-secondary hover:bg-primary text-white text-sm font-medium px-5 py-2 rounded-lg transition active:scale-95 disabled:opacity-50"
                >
                  {{ chargement ? 'Enregistrement...' : 'Créer' }}
                </button>
              </div>
            </form>
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

.carte-enter-active,
.carte-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.carte-enter-from,
.carte-leave-to {
  opacity: 0;
  transform: scale(0.96);
}
.carte-leave-active {
  position: absolute;
}
.carte-move {
  transition: transform 0.3s ease;
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