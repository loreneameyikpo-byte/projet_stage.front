<script setup lang="ts">
import { useApi } from '~/Composables/useApi';
import { useFormErrors } from '~/Composables/useFormErrors';

definePageMeta({ layout: 'dashboard', middleware: 'role' })
useRoute().meta.roles = ['encadreur']

const route = useRoute()
const { apiFetch } = useApi()

interface Version { id: string; numero_version: number; rapport_pdf: string | null; depot_github: string | null; date_depot: string; statut_version: string }interface Observation { id: string; contenu: string; date: string; auteur: { nom: string; prenom: string } }
interface ProjetDetail {
  id: string
  titre: string
  description: string
  statut: string
  etudiant: { nom: string; prenom: string; promotion: string | null }
  versions: Version[]
  derniere_version?: Version | null
  observations: Observation[]
  presentation?: { date_presentation: string; heure_presentation: string; salle: string; salle_libelle: string | null } | null
  created_at: string
}

const { data, refresh } = await useAsyncData(`projet-encadreur-${route.params.id}`, () =>
  apiFetch<{ projet: ProjetDetail }>(`/projets/${route.params.id}`)
)

const badgesStatuts: Record<string, { label: string; classe: string }> = {
  en_attente_validation: { label: 'En attente', classe: 'bg-warning/10 text-warning' },
  corrections_demandees: { label: 'Corrections demandées', classe: 'bg-danger/10 text-danger' },
  valide: { label: 'Validé', classe: 'bg-accent/10 text-accent' },
  presentation_planifiee: { label: 'Présentation planifiée', classe: 'bg-secondary/10 text-secondary' },
  presente: { label: 'Présenté', classe: 'bg-slate-200 text-slate-600' },
}

const decisionInfo = computed(() => {
  const s = data.value?.projet.statut
  if (s === 'valide') return { texte: 'Ce projet a été validé. En attente de planification de la soutenance.', classe: 'bg-accent/5 text-accent border-accent/20' }
  if (s === 'corrections_demandees') return { texte: 'Des corrections ont été demandées. En attente d\'une nouvelle version.', classe: 'bg-warning/5 text-warning border-warning/20' }
  if (s === 'presentation_planifiee' || s === 'presente') return { texte: 'Ce projet est déjà planifié ou soutenu. Aucune action n\'est plus possible.', classe: 'bg-slate-50 text-slate-600 border-slate-200' }
  return { texte: 'En attente de votre décision.', classe: 'bg-secondary/5 text-secondary border-secondary/20' }
})

const peutStatuer = computed(() =>
  ['en_attente_validation', 'corrections_demandees'].includes(data.value?.projet.statut ?? '')
)

function initiales(nom: string, prenom: string) {
  return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase()
}

// --- Ajout d'observation + décision ---
const { erreurGenerale, traiter, reinitialiser } = useFormErrors()
const observation = ref('')
const chargement = ref(false)

async function statuer(decision: 'valider' | 'corriger') {
  reinitialiser()
  if (!observation.value.trim()) {
    erreurGenerale.value = 'Une observation est obligatoire pour valider ou demander des corrections.'
    return
  }

  chargement.value = true
  try {
    await apiFetch(`/projets/${route.params.id}/valider`, {
      method: 'POST',
      body: { decision, observation: observation.value },
    })
    observation.value = ''
    await refresh()
  } catch (e: any) {
    traiter(e)
  } finally {
    chargement.value = false
  }
}
</script>

<template>
  <div v-if="data?.projet">
    <div class="flex items-start justify-between mb-1">
      <div class="flex items-center gap-3">
        <h1 class="text-xl font-bold text-slate-900">{{ data.projet.titre }}</h1>
        <span class="inline-flex px-2.5 py-1 rounded-full text-xs font-medium" :class="badgesStatuts[data.projet.statut]?.classe">
          {{ badgesStatuts[data.projet.statut]?.label }}
        </span>
      </div>
      <NuxtLink to="/encadreur/projets-a-encadrer" class="inline-flex items-center gap-1.5 text-sm text-secondary hover:text-primary shrink-0">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Retour à la liste
      </NuxtLink>
    </div>
    <p class="flex items-center gap-4 text-sm text-secondary mb-6">
      <span class="inline-flex items-center gap-1">
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        {{ data.projet.etudiant.prenom }} {{ data.projet.etudiant.nom }}
      </span>
      <span class="inline-flex items-center gap-1">
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
        </svg>
        {{ data.projet.etudiant.promotion ?? '—' }}
      </span>
      <span class="inline-flex items-center gap-1">
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        Déposé le {{ data.projet.created_at }}
      </span>
    </p>

    <div class="grid lg:grid-cols-3 gap-6">
      <!-- Colonne principale -->
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-card border border-slate-200 rounded-lg p-6">
          <h2 class="flex items-center gap-2 font-semibold text-slate-900 mb-4">
            <svg class="w-4 h-4 text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Document du projet
          </h2>
          <p class="text-sm text-slate-700 leading-relaxed mb-4">{{ data.projet.description }}</p>

          <div class="flex flex-wrap gap-3">
            <a
              v-if="data.projet.derniere_version?.rapport_pdf"
              :href="data.projet.derniere_version.rapport_pdf"
              target="_blank"
              class="inline-flex items-center gap-2 bg-danger/5 hover:bg-danger/10 text-danger text-sm font-medium px-4 py-2 rounded-lg transition"
            >
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H8a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Télécharger le PDF ({{ data.projet.derniere_version.rapport_pdf.split('/').pop() }})
            </a>
            <a       
              v-if="data.projet.derniere_version?.depot_github"
              :href="data.projet.derniere_version?.depot_github"
              target="_blank"
              class="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium px-4 py-2 rounded-lg transition"
            >
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Dépôt GitHub
            </a>
          </div>
        </div>

        <div class="bg-card border border-slate-200 rounded-lg p-6">
          <h2 class="flex items-center gap-2 font-semibold text-slate-900 mb-4">
            <svg class="w-4 h-4 text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 8v8m0 0l4-4m-4 4l-4-4" />
            </svg>
            Historique des versions
          </h2>

          <div class="space-y-4">
            <div v-for="v in data.projet.versions" :key="v.id" class="flex items-start gap-3">
              <span class="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0" :class="v.statut_version === 'validee' ? 'bg-accent' : v.statut_version === 'corrections_demandees' ? 'bg-warning' : 'bg-slate-300'"></span>
              <div>
                <div class="flex items-center gap-2">
                  <p class="text-sm font-medium text-slate-900">Version {{ v.numero_version }}</p>
                  <span class="inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium" :class="v.statut_version === 'validee' ? 'bg-accent/10 text-accent' : v.statut_version === 'corrections_demandees' ? 'bg-warning/10 text-warning' : 'bg-slate-100 text-slate-600'">
                    {{ v.statut_version === 'validee' ? 'Validé' : v.statut_version === 'corrections_demandees' ? 'Corrections demandées' : 'En attente' }}
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

        <!-- Observations + formulaire -->
        <div class="bg-card border border-slate-200 rounded-lg p-6">
          <h2 class="flex items-center gap-2 font-semibold text-slate-900 mb-4">
            <svg class="w-4 h-4 text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Observations
          </h2>

          <div class="space-y-4 mb-6">
            <div v-for="o in data.projet.observations" :key="o.id" class="flex gap-3">
              <span class="w-8 h-8 rounded-full bg-secondary/10 text-secondary text-xs font-semibold flex items-center justify-center shrink-0">
                {{ initiales(o.auteur.nom, o.auteur.prenom) }}
              </span>
              <div class="bg-slate-50 rounded-lg p-3 flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-sm font-medium text-slate-900">{{ o.auteur.prenom }} {{ o.auteur.nom }}</span>
                  <span class="text-xs text-ink-light">{{ o.date }}</span>
                </div>
                <p class="text-sm text-slate-700 leading-relaxed">{{ o.contenu }}</p>
              </div>
            </div>
            <p v-if="!data.projet.observations.length" class="text-sm text-ink-light text-center py-4">
              Aucune observation pour l'instant.
            </p>
          </div>

          <div v-if="peutStatuer">
            <label class="block text-sm font-medium text-slate-700 mb-1.5">Ajouter une observation</label>
            <textarea
              v-model="observation"
              rows="4"
              maxlength="500"
              placeholder="Rédigez votre observation, commentaire ou demande de correction..."
              class="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
            ></textarea>
            <p class="text-xs text-ink-light text-right mt-1">{{ observation.length }}/500</p>

            <FormAlerte :message="erreurGenerale" />

            <div class="flex items-center justify-between gap-3 mt-3">
              <button
                type="button"
                :disabled="chargement"
                @click="statuer('corriger')"
                class="inline-flex items-center gap-2 bg-warning/10 hover:bg-warning/20 text-warning text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-50"
              >
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Demander des corrections
              </button>
              <button
                type="button"
                :disabled="chargement"
                @click="statuer('valider')"
                class="inline-flex items-center gap-2 bg-accent hover:bg-green-600 text-white text-sm font-medium px-5 py-2 rounded-lg transition disabled:opacity-50"
              >
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {{ chargement ? 'Envoi...' : 'Valider le projet' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Colonne latérale -->
      <div class="space-y-6">
        <div class="bg-card border rounded-lg p-4" :class="decisionInfo.classe">
          <p class="flex items-center gap-2 text-xs font-semibold uppercase mb-2">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Décision
          </p>
          <p class="text-sm leading-relaxed">{{ decisionInfo.texte }}</p>
        </div>

        <div class="bg-card border border-slate-200 rounded-lg p-5">
          <h3 class="flex items-center gap-2 font-semibold text-slate-900 text-sm mb-3">
            <svg class="w-4 h-4 text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Étudiant
          </h3>
          <div class="flex items-center gap-2.5">
            <span class="w-9 h-9 rounded-full bg-secondary/10 text-secondary text-xs font-semibold flex items-center justify-center shrink-0">
              {{ initiales(data.projet.etudiant.nom, data.projet.etudiant.prenom) }}
            </span>
            <div>
              <p class="text-sm font-medium text-slate-900">{{ data.projet.etudiant.prenom }} {{ data.projet.etudiant.nom }}</p>
              <p class="text-xs text-ink-light">{{ data.projet.etudiant.promotion }}</p>
            </div>
          </div>
        </div>

        <div v-if="data.projet.presentation" class="bg-card border border-slate-200 rounded-lg p-5">
          <h3 class="flex items-center gap-2 font-semibold text-slate-900 text-sm mb-3">
            <svg class="w-4 h-4 text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Soutenance
          </h3>
          <div class="space-y-2 text-sm">
            <p class="text-slate-900">{{ data.projet.presentation.date_presentation }}</p>
            <p class="text-slate-900">{{ data.projet.presentation.heure_presentation }}</p>
            <p class="text-slate-900">
              {{ data.projet.presentation.salle }}{{ data.projet.presentation.salle_libelle ? ' — ' + data.projet.presentation.salle_libelle : '' }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>