<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'role', roles: ['administrateur', 'super_administrateur'] })
import { useApi } from '../../Composables/useApi'
import { useConfirmation } from '../../Composables/useConfirmation'

const { apiFetch } = useApi()
const { demander } = useConfirmation()

interface Item { id_filiere?: string; id_specialite?: string; libelle: string }

const erreurSuppression = ref('')

const estMonte = ref(false)
onMounted(() => {
  requestAnimationFrame(() => { estMonte.value = true })
})


// --- Filières ---
const { data: filieresData, refresh: refreshFilieres } = await useAsyncData<{ filieres: Item[] }>('filieres', () =>
  apiFetch('/filieres')
)
const nouvelleFiliere = ref('')
const rechercheFiliere = ref('')
const filiereEnEdition = ref<Item | null>(null)
const libelleEditionFiliere = ref('')

const filieresFiltrees = computed(() =>
  (filieresData.value?.filieres ?? []).filter((f) =>
    f.libelle.toLowerCase().includes(rechercheFiliere.value.toLowerCase())
  )
)

async function ajouterFiliere() {
  if (!nouvelleFiliere.value.trim()) return
  await apiFetch('/filieres', { method: 'POST', body: { libelle: nouvelleFiliere.value.trim() } })
  nouvelleFiliere.value = ''
  await refreshFilieres()
}

function ouvrirEditionFiliere(f: Item) {
  filiereEnEdition.value = f
  libelleEditionFiliere.value = f.libelle
}

async function enregistrerEditionFiliere() {
  if (!filiereEnEdition.value) return
  await apiFetch(`/filieres/${filiereEnEdition.value.id_filiere}`, {
    method: 'PUT',
    body: { libelle: libelleEditionFiliere.value },
  })
  filiereEnEdition.value = null
  await refreshFilieres()
}

async function supprimerFiliere(f: Item) {
  const confirme = await demander({
    titre: 'Supprimer cette filière',
    message: `Supprimer "${f.libelle}" ?`,
    texteConfirmer: 'Supprimer',
    dangereux: true,
  })
  if (!confirme) return
  erreurSuppression.value = ''
  try {
    await apiFetch(`/filieres/${f.id_filiere}`, { method: 'DELETE' })
    await refreshFilieres()
  } catch (e: any) {
    erreurSuppression.value = 'Impossible de supprimer cette filière, elle est utilisée par une ou plusieurs promotions.'
    return
  }
}

// --- Spécialités ---
const { data: specialitesData, refresh: refreshSpecialites } = await useAsyncData<{ specialites: Item[] }>('specialites', () =>
  apiFetch('/specialites')
)
const nouvelleSpecialite = ref('')
const rechercheSpecialite = ref('')
const specialiteEnEdition = ref<Item | null>(null)
const libelleEditionSpecialite = ref('')

const specialitesFiltrees = computed(() =>
  (specialitesData.value?.specialites ?? []).filter((s) =>
    s.libelle.toLowerCase().includes(rechercheSpecialite.value.toLowerCase())
  )
)

async function ajouterSpecialite() {
  if (!nouvelleSpecialite.value.trim()) return
  await apiFetch('/specialites', { method: 'POST', body: { libelle: nouvelleSpecialite.value.trim() } })
  nouvelleSpecialite.value = ''
  await refreshSpecialites()
}

function ouvrirEditionSpecialite(s: Item) {
  specialiteEnEdition.value = s
  libelleEditionSpecialite.value = s.libelle
}

async function enregistrerEditionSpecialite() {
  if (!specialiteEnEdition.value) return
  await apiFetch(`/specialites/${specialiteEnEdition.value.id_specialite}`, {
    method: 'PUT',
    body: { libelle: libelleEditionSpecialite.value },
  })
  specialiteEnEdition.value = null
  await refreshSpecialites()
}

async function supprimerSpecialite(s: Item) {
  const confirme = await demander({
    titre: 'Supprimer cette spécialité',
    message: `Supprimer "${s.libelle}" ?`,
    texteConfirmer: 'Supprimer',
    dangereux: true,
  })
  if (!confirme) return
  erreurSuppression.value = ''
  try {
    await apiFetch(`/specialites/${s.id_specialite}`, { method: 'DELETE' })
    await refreshSpecialites()
  } catch (e: any) {
    erreurSuppression.value = 'Impossible de supprimer cette spécialité, elle est utilisée par une ou plusieurs promotions.'
    return
  }
}
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold text-slate-900">Gestion des filières & Spécialités</h1>
    <FormAlerte :message="erreurSuppression" />
    <p class="text-sm text-ink-light mt-1 mb-6">
      Filières des étudiants et spécialités des encadreurs — deux référentiels indépendants
    </p>

    <!-- ================= FILIÈRES ================= -->
    <section class="mb-10 opacity-0" :class="estMonte ? 'animate-entree' : ''">
      <div class="flex items-center justify-between mb-3">
        <h2 class="font-semibold text-slate-900">
          Filières <span class="text-ink-light font-normal text-sm">({{ filieresData?.filieres.length ?? 0 }})</span>
        </h2>
      </div>

      <div class="flex gap-3 mb-4">
        <div class="relative flex-1">
          <svg class="w-4 h-4 text-secondary absolute left-3 top-1/2 -translate-y-1/2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <input
            v-model="nouvelleFiliere"
            type="text"
            placeholder="Nom de la nouvelle filière..."
            @keyup.enter="ajouterFiliere"
            class="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary transition-shadow"
          />
        </div>
        <button
          type="button"
          @click="ajouterFiliere"
          class="bg-secondary hover:bg-primary text-white text-sm font-medium px-5 rounded-lg transition active:scale-95"
        >
          Ajouter
        </button>
      </div>

      <input
        v-model="rechercheFiliere"
        type="text"
        placeholder="Rechercher une filière..."
        class="w-full mb-4 px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary transition-shadow"
      />

      <TransitionGroup tag="div" name="carte" class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div
          v-for="f in filieresFiltrees"
          :key="f.id_filiere"
          class="flex items-center justify-between bg-card border border-slate-200 rounded-lg px-4 py-3 hover:border-secondary/40 hover:shadow-sm transition-all"
        >
          <template v-if="filiereEnEdition?.id_filiere === f.id_filiere">
            <input
              v-model="libelleEditionFiliere"
              type="text"
              class="flex-1 text-sm border border-secondary rounded px-2 py-1 mr-2 focus:outline-none"
              @keyup.enter="enregistrerEditionFiliere"
            />
            <button type="button" @click="enregistrerEditionFiliere" class="text-accent text-xs font-medium">OK</button>
          </template>
          <template v-else>
            <span class="text-sm font-medium text-slate-900">{{ f.libelle }}</span>
            <div class="flex items-center gap-2">
              <button type="button" class="text-ink-light hover:text-secondary hover:scale-110 active:scale-95 transition" @click="ouvrirEditionFiliere(f)">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button type="button" class="text-ink-light hover:text-danger hover:scale-110 active:scale-95 transition" @click="supprimerFiliere(f)">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </template>
        </div>

        <p v-if="!filieresFiltrees.length" class="col-span-full text-sm text-ink-light text-center py-6">
          Aucune filière trouvée.
        </p>
      </TransitionGroup>
    </section>

    <!-- ================= SPÉCIALITÉS ================= -->
    <section class="opacity-0" :class="estMonte ? 'animate-entree' : ''" style="animation-delay: 100ms">
      <div class="flex items-center justify-between mb-3">
        <h2 class="font-semibold text-slate-900">
          Spécialités <span class="text-ink-light font-normal text-sm">({{ specialitesData?.specialites.length ?? 0 }})</span>
        </h2>
      </div>

      <div class="flex gap-3 mb-4">
        <div class="relative flex-1">
          <svg class="w-4 h-4 text-secondary absolute left-3 top-1/2 -translate-y-1/2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <input
            v-model="nouvelleSpecialite"
            type="text"
            placeholder="Nom de la nouvelle spécialité..."
            @keyup.enter="ajouterSpecialite"
            class="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary transition-shadow"
          />
        </div>
        <button
          type="button"
          @click="ajouterSpecialite"
          class="bg-secondary hover:bg-primary text-white text-sm font-medium px-5 rounded-lg transition active:scale-95"
        >
          Ajouter
        </button>
      </div>

      <input
        v-model="rechercheSpecialite"
        type="text"
        placeholder="Rechercher une spécialité..."
        class="w-full mb-4 px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary transition-shadow"
      />

      <TransitionGroup tag="div" name="carte" class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div
          v-for="s in specialitesFiltrees"
          :key="s.id_specialite"
          class="flex items-center justify-between bg-card border border-slate-200 rounded-lg px-4 py-3 hover:border-secondary/40 hover:shadow-sm transition-all"
        >
          <template v-if="specialiteEnEdition?.id_specialite === s.id_specialite">
            <input
              v-model="libelleEditionSpecialite"
              type="text"
              class="flex-1 text-sm border border-secondary rounded px-2 py-1 mr-2 focus:outline-none"
              @keyup.enter="enregistrerEditionSpecialite"
            />
            <button type="button" @click="enregistrerEditionSpecialite" class="text-accent text-xs font-medium">OK</button>
          </template>
          <template v-else>
            <span class="text-sm font-medium text-slate-900">{{ s.libelle }}</span>
            <div class="flex items-center gap-2">
              <button type="button" class="text-ink-light hover:text-secondary hover:scale-110 active:scale-95 transition" @click="ouvrirEditionSpecialite(s)">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button type="button" class="text-ink-light hover:text-danger hover:scale-110 active:scale-95 transition" @click="supprimerSpecialite(s)">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </template>
        </div>

        <p v-if="!specialitesFiltrees.length" class="col-span-full text-sm text-ink-light text-center py-6">
          Aucune spécialité trouvée.
        </p>
      </TransitionGroup>
    </section>
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
</style>