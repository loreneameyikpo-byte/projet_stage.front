<script setup lang="ts">
import { useApi } from '~/Composables/useApi';

definePageMeta({ layout: 'dashboard', middleware: 'role', roles: ['etudiant'] })

const { apiFetch } = useApi()

interface MembreJury { id_utilisateur: string; nom: string; prenom: string; role_jury: string }
interface Presentation {
  date_presentation: string
  heure_presentation: string
  salle: { numero: string; libelle: string | null }
  jury: { membres: MembreJury[] }
}

const { data: mesProjets } = await useAsyncData('mes-projets-soutenance', () => apiFetch<{ projets: { id: string; titre: string; statut: string }[] }>('/projets'))
const projet = computed(() => mesProjets.value?.projets[0])

const { data: presentations } = await useAsyncData('mes-presentations', () => apiFetch<{ presentations: Presentation[] }>('/presentations'))
const presentation = computed(() => presentations.value?.presentations[0])

function labelRole(role: string) {
  return { president: 'Président', rapporteur: 'Rapporteur', membre: 'Membre' }[role] ?? role
}
function badgeRole(role: string) {
  return { president: 'bg-secondary/10 text-secondary', rapporteur: 'bg-accent/10 text-accent', membre: 'bg-warning/10 text-warning' }[role] ?? 'bg-slate-100 text-slate-600'
}

const badgesStatuts: Record<string, { label: string; classe: string }> = {
  en_attente_validation: { label: 'En attente', classe: 'bg-warning/10 text-warning' },
  corrections_demandees: { label: 'Corrections demandées', classe: 'bg-danger/10 text-danger' },
  valide: { label: 'Validé', classe: 'bg-accent/10 text-accent' },
  presentation_planifiee: { label: 'Présentation planifiée', classe: 'bg-secondary/10 text-secondary' },
  presente: { label: 'Présenté', classe: 'bg-slate-200 text-slate-600' },
}
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold text-slate-900">Ma soutenance</h1>
    <p class="text-sm text-ink-light mt-1 mb-6">Consultez les informations concernant votre soutenance de fin de formation.</p>

    <div v-if="!projet" class="bg-card border border-slate-200 rounded-lg p-10 text-center text-sm text-ink-light">
      Aucun projet à ce jour.
    </div>

    <div v-else class="max-w-3xl">
      <div class="bg-card border border-slate-200 rounded-lg p-6 mb-4">
        <div class="flex items-center gap-3">
          <p class="font-semibold text-slate-900">{{ projet.titre }}</p>
          <span class="inline-flex px-2.5 py-1 rounded-full text-xs font-medium" :class="badgesStatuts[projet.statut]?.classe">
            {{ badgesStatuts[projet.statut]?.label }}
          </span>
        </div>
      </div>

      <div v-if="!presentation" class="bg-card border border-slate-200 rounded-lg p-10 text-center">
        <p class="text-sm text-ink-light">Aucune soutenance planifiée pour le moment.</p>
      </div>

      <div v-else class="grid sm:grid-cols-2 gap-4 mb-6">
        <div class="bg-card border border-slate-200 rounded-lg p-5">
          <h2 class="font-semibold text-slate-900 text-sm mb-4">Détails de la séance</h2>
          <div class="space-y-3">
            <div class="flex items-center gap-2.5">
              <span class="w-8 h-8 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </span>
              <div>
                <p class="text-xs text-ink-light">Date</p>
                <p class="text-sm font-medium text-slate-900">{{ presentation.date_presentation }}</p>
              </div>
            </div>
            <div class="flex items-center gap-2.5">
              <span class="w-8 h-8 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              <div>
                <p class="text-xs text-ink-light">Heure</p>
                <p class="text-sm font-medium text-slate-900">{{ presentation.heure_presentation }}</p>
              </div>
            </div>
            <div class="flex items-center gap-2.5">
              <span class="w-8 h-8 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </span>
              <div>
                <p class="text-xs text-ink-light">Salle</p>
                <p class="text-sm font-medium text-slate-900">
                  {{ presentation.salle.numero }}{{ presentation.salle.libelle ? ' — ' + presentation.salle.libelle : '' }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-card border border-slate-200 rounded-lg p-5">
          <h2 class="font-semibold text-slate-900 text-sm mb-4">Composition du jury</h2>
          <div class="space-y-3">
            <div v-for="m in presentation.jury.membres" :key="m.id_utilisateur" class="flex items-center gap-2.5">
              <span class="w-8 h-8 rounded-full bg-secondary/10 text-secondary text-xs font-semibold flex items-center justify-center shrink-0">
                {{ m.prenom.charAt(0) }}{{ m.nom.charAt(0) }}
              </span>
              <div>
                <p class="text-sm font-medium text-slate-900">{{ m.prenom }} {{ m.nom }}</p>
                <span class="inline-flex px-1.5 py-0.5 rounded text-[11px] font-medium" :class="badgeRole(m.role_jury)">
                  {{ labelRole(m.role_jury) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <p v-if="presentation" class="flex items-start gap-2 bg-secondary/5 border border-secondary/20 text-secondary text-sm rounded-lg px-4 py-3">
        <svg class="w-4 h-4 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>
          <strong>Préparez votre présentation.</strong> Préparez un support de présentation clair (PowerPoint/PDF).
          La durée de présentation est de 20 minutes, suivie de 15 minutes de questions.
        </span>
      </p>
    </div>
  </div>
</template>