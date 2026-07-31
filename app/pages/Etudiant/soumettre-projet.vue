<script setup lang="ts">
import { useApi } from '~/Composables/useApi'
import { useFormErrors } from '~/Composables/useFormErrors'

definePageMeta({ layout: 'dashboard', middleware: 'role' })
useRoute().meta.roles = ['etudiant']

const { apiFetch } = useApi()
const authStore = useAuthStore()
const { erreurGenerale, traiter, reinitialiser, champ } = useFormErrors()

const titre = ref('')
const description = ref('')
const depotGithub = ref('')
const fichier = ref<File | null>(null)
const enSurvol = ref(false)
const chargement = ref(false)

function selectionnerFichier(e: Event) {
  const input = e.target as HTMLInputElement
  fichier.value = input.files?.[0] ?? null
}

function surDepot(e: DragEvent) {
  enSurvol.value = false
  const f = e.dataTransfer?.files?.[0]
  if (f && f.type === 'application/pdf') fichier.value = f
}

async function soumettre() {
  reinitialiser()

  if (!fichier.value) {
    erreurGenerale.value = 'Veuillez sélectionner un fichier PDF.'
    return
  }

  chargement.value = true
  const formData = new FormData()
  formData.append('titre', titre.value)
  formData.append('description', description.value)
  if (depotGithub.value) formData.append('depot_github', depotGithub.value)
  formData.append('rapport_pdf', fichier.value)

  try {
    await apiFetch('/projets', { method: 'POST', body: formData })
    await navigateTo('/etudiant/projet')
  } catch (e: any) {
    traiter(e)
  } finally {
    chargement.value = false
  }
}
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold text-slate-900">Soumettre un projet de fin de formation</h1>
    <p class="text-sm text-ink-light mt-1 mb-6">
      Remplissez le formulaire ci-dessous pour soumettre votre projet. Tous les champs marqués d'un astérisque sont obligatoires.
    </p>

    <div class="bg-card border border-slate-200 rounded-lg p-6 max-w-2xl">
      <form @submit.prevent="soumettre" class="space-y-5">
        <FormAlerte :message="erreurGenerale" />

        <FormInput
          v-model="titre"
          label="Titre du projet"
          placeholder="Ex: Système intelligent de gestion des emplois du temps"
          :erreur="champ('titre')"
          requis
        />

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">
            Description du projet <span class="text-danger">*</span>
          </label>
          <textarea
            v-model="description"
            rows="5"
            maxlength="1000"
            placeholder="Décrivez votre projet en détail : problématique, objectifs, méthodologie, résultats attendus..."
            class="w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 transition"
            :class="champ('description') ? 'border-danger focus:ring-danger/40' : 'border-slate-300 focus:ring-secondary focus:border-transparent'"
          ></textarea>
          <div class="flex justify-between mt-1">
            <p v-if="champ('description')" class="text-xs text-danger">{{ champ('description') }}</p>
            <p class="text-xs text-ink-light ml-auto">{{ description.length }}/1000</p>
          </div>
        </div>

        <FormInput
          v-model="depotGithub"
          label="Lien du dépôt GitHub"
          placeholder="https://github.com/votre-compte/votre-projet"
          :erreur="champ('depot_github')"
        />

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">
            Document PDF du projet <span class="text-danger">*</span>
          </label>
          <label
            class="flex flex-col items-center justify-center border-2 border-dashed rounded-lg py-10 cursor-pointer transition"
            :class="enSurvol ? 'border-secondary bg-secondary/5' : 'border-slate-300 hover:border-secondary/50'"
            @dragover.prevent="enSurvol = true"
            @dragleave.prevent="enSurvol = false"
            @drop.prevent="surDepot"
          >
            <input type="file" accept="application/pdf" class="hidden" @change="selectionnerFichier" />
            <span class="inline-flex w-10 h-10 rounded-full bg-secondary/10 text-secondary items-center justify-center mb-3">
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </span>
            <p v-if="!fichier" class="text-sm text-slate-700">Glissez-déposez votre fichier PDF ici</p>
            <p v-else class="text-sm font-medium text-secondary">{{ fichier.name }}</p>
            <p class="text-xs text-ink-light mt-1">ou cliquez pour parcourir — Taille max : 20 Mo</p>
          </label>
          <p v-if="champ('rapport_pdf')" class="text-xs text-danger mt-1">{{ champ('rapport_pdf') }}</p>
        </div>

        <div class="bg-slate-50 rounded-lg p-4 text-sm">
          <p class="font-medium text-slate-900 mb-2">Récapitulatif</p>
          <div class="grid grid-cols-2 gap-2 text-xs">
            <span class="text-secondary">Étudiant</span>
            <span class="text-slate-900">{{ authStore.utilisateur?.prenom }} {{ authStore.utilisateur?.nom }}</span>
            <span class="text-secondary">Promotion</span>
            <span class="text-slate-900">{{ authStore.utilisateur?.promotion?.intitule ?? '—' }}</span>
            <span class="text-secondary">Spécialité</span>
            <span class="text-slate-900">{{ authStore.utilisateur?.specialite ?? '—' }}</span>
          </div>
        </div>

        <button
          type="submit"
          :disabled="chargement"
          class="w-full inline-flex items-center justify-center gap-2 bg-secondary hover:bg-primary text-white text-sm font-medium py-2.5 rounded-lg transition disabled:opacity-50"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
          {{ chargement ? 'Soumission...' : 'Soumettre le projet' }}
        </button>
      </form>
    </div>
  </div>
</template>