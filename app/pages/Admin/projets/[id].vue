<script setup lang="ts">
import { useApi } from '../../../Composables/useApi'

definePageMeta({ layout: 'dashboard', middleware: 'role', roles: ['administrateur', 'super_administrateur'] })

const route = useRoute()
const { apiFetch } = useApi()

interface Version {
  id: string
  numero_version: number
  rapport_pdf: string | null
  depot_github: string | null
  date_depot: string
  statut_version: string
}
interface Observation {
  id: string
  contenu: string
  date: string
  auteur: { id: string; nom: string; prenom: string }
}
interface ProjetDetail {
  id: string
  titre: string
  description: string
  statut: string
  etudiant: { id: string; nom: string; prenom: string }
  encadreur?: { id: string; nom: string; prenom: string } | null
  derniere_version?: Version | null
  versions: Version[]
  observations: Observation[]
  created_at: string
}

const { data, pending, error } = await useAsyncData<{ projet: ProjetDetail }>(`projet-${route.params.id}`, () =>
  apiFetch(`/projets/${route.params.id}`)
)

const badgesStatuts: Record<string, { label: string; classe: string }> = {
  en_attente: { label: 'En attente', classe: 'bg-warning/10 text-warning' },
  corrections: { label: 'Corrections demandées', classe: 'bg-danger/10 text-danger' },
  valide: { label: 'Validé', classe: 'bg-accent/10 text-accent' },
  presentation_planifiee: { label: 'Présentation planifiée', classe: 'bg-secondary/10 text-secondary' },
  presente: { label: 'Présenté', classe: 'bg-slate-200 text-slate-600' },
}

const badgesVersion: Record<string, { label: string; classe: string }> = {
  en_attente: { label: 'En attente', classe: 'bg-warning/10 text-warning' },
  validee: { label: 'Validée', classe: 'bg-accent/10 text-accent' },
  corrections_demandees: { label: 'Corrections demandées', classe: 'bg-danger/10 text-danger' },
  remplacee: { label: 'Remplacée', classe: 'bg-slate-200 text-slate-600' },
}

function initiales(nom: string, prenom: string) {
  return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase()
}
</script>

<template>
  <div>
    <NuxtLink to="/admin/projets" class="inline-flex items-center gap-1.5 text-sm text-secondary hover:text-primary mb-4">
      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
      Retour aux projets
    </NuxtLink>

    <div v-if="pending" class="text-sm text-ink-light">Chargement...</div>
    <div v-else-if="error" class="text-sm text-danger">Projet introuvable.</div>

    <div v-else-if="data?.projet">
      <div class="flex items-start justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-slate-900">{{ data.projet.titre }}</h1>
          <p class="text-sm text-ink-light mt-1">
            {{ data.projet.etudiant.prenom }} {{ data.projet.etudiant.nom }}
          </p>
        </div>
        <span class="inline-flex px-3 py-1.5 rounded-full text-xs font-medium" :class="badgesStatuts[data.projet.statut]?.classe">
          {{ badgesStatuts[data.projet.statut]?.label }}
        </span>
      </div>

      <div class="grid lg:grid-cols-3 gap-6">
        <!-- Colonne principale -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Description -->
          <div class="bg-card border border-slate-200 rounded-lg p-6">
            <h2 class="font-semibold text-slate-900 mb-3">Description</h2>
            <p class="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{{ data.projet.description }}</p>
          </div>

          <!-- Historique des versions -->
          <div class="bg-card border border-slate-200 rounded-lg p-6">
            <h2 class="font-semibold text-slate-900 mb-4">Historique des versions</h2>

            <div class="space-y-3">
              <div
                v-for="v in data.projet.versions"
                :key="v.id"
                class="flex items-center justify-between border border-slate-100 rounded-lg px-4 py-3"
              >
                <div>
                  <p class="text-sm font-medium text-slate-900">Version {{ v.numero_version }}</p>
                  <p class="text-xs text-ink-light">{{ v.date_depot }}</p>
                </div>
                <div class="flex items-center gap-3">
                  <a
                    v-if="v.rapport_pdf"
                    :href="v.rapport_pdf"
                    target="_blank"
                    class="text-xs font-medium text-secondary hover:text-primary inline-flex items-center gap-1"
                  >
                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    PDF
                  </a>
                  <a
                    v-if="v.depot_github"
                    :href="v.depot_github"
                    target="_blank"
                    class="text-xs font-medium text-secondary hover:text-primary inline-flex items-center gap-1"
                  >
                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 5.77 5.07 5.07 0 0019.91 2S18.73 1.65 16 3.48a13.38 13.38 0 00-7 0C6.27 1.65 5.09 2 5.09 2A5.07 5.07 0 005 5.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 19.13V22" />
                    </svg>
                    GitHub
                  </a>
                  <span
                    class="inline-flex px-2.5 py-1 rounded-full text-xs font-medium"
                    :class="badgesVersion[v.statut_version]?.classe"
                  >
                    {{ badgesVersion[v.statut_version]?.label }}
                  </span>
                </div>
              </div>

              <p v-if="!data.projet.versions.length" class="text-sm text-ink-light text-center py-6">
                Aucune version déposée.
              </p>
            </div>
          </div>

          <!-- Observations -->
          <div class="bg-card border border-slate-200 rounded-lg p-6">
            <h2 class="font-semibold text-slate-900 mb-4">Observations de l'encadreur</h2>

            <div class="space-y-4">
              <div v-for="o in data.projet.observations" :key="o.id" class="flex gap-3">
                <span class="w-8 h-8 rounded-full bg-secondary/10 text-secondary text-xs font-semibold flex items-center justify-center shrink-0">
                  {{ initiales(o.auteur.nom, o.auteur.prenom) }}
                </span>
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="text-sm font-medium text-slate-900">{{ o.auteur.prenom }} {{ o.auteur.nom }}</span>
                    <span class="text-xs text-ink-light">{{ o.date }}</span>
                  </div>
                  <p class="text-sm text-slate-700 leading-relaxed">{{ o.contenu }}</p>
                </div>
              </div>

              <p v-if="!data.projet.observations.length" class="text-sm text-ink-light text-center py-6">
                Aucune observation pour l'instant.
              </p>
            </div>
          </div>
        </div>

        <!-- Colonne latérale -->
        <div class="space-y-6">
          <div class="bg-card border border-slate-200 rounded-lg p-5">
            <h2 class="font-semibold text-slate-900 mb-4 text-sm">Informations</h2>

            <div class="space-y-3 text-sm">
              <div>
                <p class="text-xs text-ink-light mb-0.5">Étudiant</p>
                <p class="text-slate-900 font-medium">{{ data.projet.etudiant.prenom }} {{ data.projet.etudiant.nom }}</p>
              </div>
              <div>
                <p class="text-xs text-ink-light mb-0.5">Encadreur</p>
                <p v-if="data.projet.encadreur" class="text-slate-900 font-medium">
                  {{ data.projet.encadreur.prenom }} {{ data.projet.encadreur.nom }}
                </p>
                <p v-else class="text-warning italic">Non affecté</p>
              </div>
              <div>
                <p class="text-xs text-ink-light mb-0.5">Soumis le</p>
                <p class="text-slate-900">{{ data.projet.created_at }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>