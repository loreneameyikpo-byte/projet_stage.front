<script setup lang="ts">
import { useApi } from '~/Composables/useApi';
import { useFormErrors } from '~/Composables/useFormErrors';

definePageMeta({ layout: 'dashboard', middleware: 'role' })
useRoute().meta.roles = ['etudiant']

const { apiFetch } = useApi()

interface MembreJury { id: string; nom: string; prenom: string; role_jury: string }
interface Version { id: string; numero_version: number; rapport_pdf: string | null; date_depot: string; statut_version: string;  depot_github: string | null
 }
interface Observation { id: string; contenu: string; date: string; auteur: { nom: string; prenom: string } }
interface ProjetDetail {
  id: string
  titre: string
  description: string
  statut: string
  depot_github: string | null
  encadreur?: { nom: string; prenom: string } | null
  versions: Version[]
  derniere_version?: Version | null
  observations: Observation[]
  presentation?: {
    date_presentation: string
    heure_presentation: string
    salle: string
    salle_libelle: string | null
    jury: MembreJury[]
  } | null
  created_at: string
}

const { data: mesProjets } = await useAsyncData('mes-projets', () => apiFetch<{ projets: { id: string }[] }>('/projets'))
const idProjet = computed(() => mesProjets.value?.projets[0]?.id)

const { data, refresh } = await useAsyncData(
  'projets-detail',
  () => (idProjet.value ? apiFetch<{ projet: ProjetDetail }>(`/projets/${idProjet.value}`) : Promise.resolve(null)),
  { watch: [idProjet] }
)

const badgesStatuts: Record<string, { label: string; classe: string }> = {
  en_attente: { label: 'En attente', classe: 'bg-warning/10 text-warning' },
  corrections: { label: 'Corrections demandées', classe: 'bg-danger/10 text-danger' },
  valide: { label: 'Validé', classe: 'bg-accent/10 text-accent' },
  presentation_planifiee: { label: 'Présentation planifiée', classe: 'bg-secondary/10 text-secondary' },
  presente: { label: 'Présenté', classe: 'bg-slate-200 text-slate-600' },
}

function labelRole(role: string) {
  return { president: 'Président', rapporteur: 'Rapporteur', membre: 'Membre' }[role] ?? role
}

function initiales(nom: string, prenom: string) {
  return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase()
}

// --- Dépôt nouvelle version ---
const { erreurGenerale, traiter, reinitialiser, champ } = useFormErrors()
const depotGithub = ref('')
const fichier = ref<File | null>(null)
const chargement = ref(false)
const modaleOuverte = ref(false)

function selectionnerFichier(e: Event) {
  fichier.value = (e.target as HTMLInputElement).files?.[0] ?? null
}

async function deposerNouvelleVersion() {
  reinitialiser()
  if (!fichier.value || !idProjet.value) return

  chargement.value = true
  const formData = new FormData()
  formData.append('rapport_pdf', fichier.value)
  if (depotGithub.value) formData.append('depot_github', depotGithub.value)

  try {
    await apiFetch(`/projets/${idProjet.value}/nouvelle-version`, { method: 'POST', body: formData })
    modaleOuverte.value = false
    fichier.value = null
    depotGithub.value = ''
    await refresh()
  } catch (e: any) {
    traiter(e)
  } finally {
    chargement.value = false
  }
}
</script>

<template>
  <div>
    <div v-if="!idProjet" class="bg-card border border-slate-200 rounded-lg p-10 text-center">
      <p class="text-sm text-ink-light mb-4">Vous n'avez pas encore soumis de projet.</p>
      <NuxtLink
  to="/etudiant/soumettre-projet"
  class="inline-flex items-center gap-2 bg-secondary hover:bg-primary text-white text-sm font-medium px-5 py-2.5 rounded-lg transition"
>
  Soumettre mon projet
  <span aria-hidden="true">→</span>
</NuxtLink>
    </div>

    <div v-else-if="data?.projet">
      <div class="flex items-start justify-between mb-1">
        <h1 class="text-xl font-bold text-slate-900">{{ data.projet.titre }}</h1>
        <span class="inline-flex px-3 py-1.5 rounded-full text-xs font-medium shrink-0" :class="badgesStatuts[data.projet.statut]?.classe">
          {{ badgesStatuts[data.projet.statut]?.label }}
        </span>
      </div>
      <p class="text-sm text-secondary mb-6">Déposé le {{ data.projet.created_at }}</p>

      <div class="grid lg:grid-cols-3 gap-6">
        <!-- Colonne principale-->
        <div class="lg:col-span-2 space-y-6">
          <!-- Informations générales -->
          <div class="bg-card border border-slate-200 rounded-lg p-6">
            <h2 class="flex items-center gap-2 font-semibold text-slate-900 mb-5">
              <svg class="w-4 h-4 text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Informations générales
            </h2>

            <div class="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p class="text-xs text-secondary mb-1">Titre</p>
                <p class="text-sm text-slate-900">{{ data.projet.titre }}</p>
              </div>
              <div>
                <p class="text-xs text-secondary mb-1">Statut</p>
                <span class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium" :class="badgesStatuts[data.projet.statut]?.classe">
                  {{ badgesStatuts[data.projet.statut]?.label }}
                </span>
              </div>
              <div>
                <p class="text-xs text-secondary mb-1">Promotion</p>
                <p class="text-sm text-slate-900">{{ useAuthStore().utilisateur?.promotion?.intitule ?? '—' }}</p>
              </div>
              <div>
                <p class="text-xs text-secondary mb-1">Encadreur</p>
                <p class="text-sm text-slate-900">{{ data.projet.encadreur ? `${data.projet.encadreur.prenom} ${data.projet.encadreur.nom}` : 'Non affecté' }}</p>
              </div>
            </div>

            <div v-if="data.projet.derniere_version?.depot_github" class="mb-4">
              <p class="text-xs text-secondary mb-1">Dépôt GitHub</p>
              <a :href="data.projet.derniere_version.depot_github" target="_blank" class="text-sm text-secondary hover:text-primary inline-flex items-center gap-1">
                {{ data.projet.derniere_version.depot_github }}
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>

            <div>
              <p class="text-xs text-secondary mb-1">Description</p>
              <p class="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{{ data.projet.description }}</p>
            </div>
          </div>

          <!-- Historique des versions -->
          <div class="bg-card border border-slate-200 rounded-lg p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="flex items-center gap-2 font-semibold text-slate-900">
                <svg class="w-4 h-4 text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 8v8m0 0l4-4m-4 4l-4-4" />
                </svg>
                Historique des versions
              </h2>
              <button
                v-if="data.projet.statut === 'corrections_demandees'"
                type="button"
                @click="modaleOuverte = true"
                class="text-xs font-medium text-secondary hover:text-primary"
              >
                + Nouvelle version
              </button>
            </div>

            <div class="space-y-4">
              <div v-for="v in data.projet.versions" :key="v.id" class="flex items-start gap-3">
                <span class="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0" :class="v.statut_version === 'validee' ? 'bg-accent' : v.statut_version === 'corrections_demandees' ? 'bg-warning' : 'bg-slate-300'"></span>
                <div>
                  <div class="flex items-center gap-2">
                    <p class="text-sm font-medium text-slate-900">Version {{ v.numero_version }}</p>
                    <span
                      class="inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium"
                      :class="v.statut_version === 'validee' ? 'bg-accent/10 text-accent' : v.statut_version === 'corrections_demandees' ? 'bg-warning/10 text-warning' : 'bg-slate-100 text-slate-600'"
                    >
                      {{ v.statut_version === 'validee' ? 'Validé' : v.statut_version === 'corrections' ? 'Corrections demandées' : 'En attente' }}
                    </span>
                  </div>
                  <p class="text-xs text-ink-light mb-1">Déposée le {{ v.date_depot }}</p>
                  <a v-if="v.rapport_pdf" :href="v.rapport_pdf" target="_blank" class="text-xs text-secondary hover:text-primary inline-flex items-center gap-1">
                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {{ v.rapport_pdf.split('/').pop() }}
                  </a>
                </div>
              </div>
            </div>
          </div>

          <!-- Observations -->
          <div class="bg-card border border-slate-200 rounded-lg p-6">
            <h2 class="flex items-center gap-2 font-semibold text-slate-900 mb-4">
              <svg class="w-4 h-4 text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Observations de l'encadreur
            </h2>

            <div class="space-y-4">
              <div v-for="o in data.projet.observations" :key="o.id" class="bg-slate-50 rounded-lg p-4">
                <div class="flex items-center gap-2 mb-1.5">
                  <span class="text-sm font-medium text-slate-900">{{ o.auteur.prenom }} {{ o.auteur.nom }}</span>
                  <span class="text-xs px-1.5 py-0.5 bg-secondary/10 text-secondary rounded">Encadreur</span>
                  <span class="text-xs text-ink-light">{{ o.date }}</span>
                </div>
                <p class="text-sm text-slate-700 leading-relaxed">{{ o.contenu }}</p>
              </div>
              <p v-if="!data.projet.observations.length" class="text-sm text-ink-light text-center py-6">
                Aucune observation pour l'instant.
              </p>
            </div>
          </div>
        </div>

        <!-- Colonne latérale  -->
        <div class="space-y-6">
          <!-- Soutenance -->
          <div class="bg-card border border-slate-200 rounded-lg p-5">
            <h3 class="flex items-center gap-2 font-semibold text-slate-900 text-sm mb-4">
              <svg class="w-4 h-4 text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Soutenance
            </h3>

            <div v-if="data.projet.presentation" class="space-y-3">
              <div class="flex items-center gap-2 text-sm">
                <svg class="w-4 h-4 text-secondary shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span class="text-slate-900 capitalize">{{ data.projet.presentation.date_presentation }}</span>
              </div>
              <div class="flex items-center gap-2 text-sm">
                <svg class="w-4 h-4 text-secondary shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span class="text-slate-900">{{ data.projet.presentation.heure_presentation }}</span>
              </div>
              <div class="flex items-center gap-2 text-sm">
                <svg class="w-4 h-4 text-secondary shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span class="text-slate-900">
                  {{ data.projet.presentation.salle }}{{ data.projet.presentation.salle_libelle ? ' — ' + data.projet.presentation.salle_libelle : '' }}
                </span>
              </div>

              <div class="pt-3 border-t border-slate-100">
                <p class="text-xs text-secondary uppercase font-semibold mb-2">Composition du jury</p>
                <div class="space-y-2.5">
                  <div v-for="m in data.projet.presentation.jury" :key="m.id" class="flex items-center gap-2">
                    <span class="w-7 h-7 rounded-full bg-secondary/10 text-secondary text-[11px] font-semibold flex items-center justify-center shrink-0">
                      {{ initiales(m.nom, m.prenom) }}
                    </span>
                    <div>
                      <p class="text-sm text-slate-900 leading-tight">{{ m.prenom }} {{ m.nom }}</p>
                      <p class="text-xs text-ink-light leading-tight">{{ labelRole(m.role_jury) }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <p v-else class="text-sm text-ink-light">Aucune soutenance planifiée pour le moment.</p>
          </div>

          <!-- Encadrement -->
          <div class="bg-card border border-slate-200 rounded-lg p-5">
            <h3 class="flex items-center gap-2 font-semibold text-slate-900 text-sm mb-4">
              <svg class="w-4 h-4 text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Encadrement
            </h3>

            <div v-if="data.projet.encadreur" class="flex items-center gap-2.5">
              <span class="w-9 h-9 rounded-full bg-secondary/10 text-secondary text-xs font-semibold flex items-center justify-center shrink-0">
                {{ initiales(data.projet.encadreur.nom, data.projet.encadreur.prenom) }}
              </span>
              <div>
                <p class="text-sm font-medium text-slate-900">{{ data.projet.encadreur.prenom }} {{ data.projet.encadreur.nom }}</p>
                <p class="text-xs text-ink-light">Encadreur</p>
              </div>
            </div>
            <p v-else class="text-sm text-warning italic">Non affecté pour l'instant</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Modale nouvelle version -->
    <div v-if="modaleOuverte" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div class="w-full max-w-md bg-white rounded-xl shadow-xl">
        <div class="px-6 pt-6 pb-2">
          <h2 class="text-lg font-bold text-slate-900">Déposer une nouvelle version</h2>
        </div>
        <form @submit.prevent="deposerNouvelleVersion" class="px-6 py-4 space-y-4">
          <FormAlerte :message="erreurGenerale" />

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">Nouveau fichier PDF</label>
            <input type="file" accept="application/pdf" required @change="selectionnerFichier" class="w-full text-sm" />
            <p v-if="champ('rapport_pdf')" class="text-xs text-danger mt-1">{{ champ('rapport_pdf') }}</p>
          </div>

          <FormInput v-model="depotGithub" label="Lien GitHub (optionnel)" :erreur="champ('depot_github')" />

          <div class="flex items-center justify-end gap-4 pt-3 border-t border-slate-100">
            <button type="button" @click="modaleOuverte = false" class="text-sm font-medium text-secondary hover:text-primary">
              Annuler
            </button>
            <button type="submit" :disabled="chargement" class="bg-secondary hover:bg-primary text-white text-sm font-medium px-5 py-2 rounded-lg transition disabled:opacity-50">
              {{ chargement ? 'Envoi...' : 'Déposer' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>