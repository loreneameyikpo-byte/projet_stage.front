<script setup lang="ts">
import { useApi } from '~/Composables/useApi';
import { useFormErrors } from '~/Composables/useFormErrors';

definePageMeta({ layout: 'dashboard', middleware: 'role' })
useRoute().meta.roles = ['etudiant']

const { apiFetch } = useApi()

interface MembreJury { id_utilisateur: string; nom: string; prenom: string; role_jury: string }
interface Version { id: string; numero_version: number; rapport_pdf: string | null; date_depot: string; statut_version: string }
interface Observation { id: string; contenu: string; date: string; auteur: { nom: string; prenom: string } }
interface ProjetDetail {
  id: string
  titre: string
  description: string
  statut: string
  encadreur?: { nom: string; prenom: string } | null
  versions: Version[]
  derniere_version?: Version | null
  observations: Observation[]
  created_at: string
}

const { data: mesProjets } = await useAsyncData('mes-projets', () => apiFetch<{ projets: { id: string }[] }>('/projets'))
const idProjet = computed(() => mesProjets.value?.projets[0]?.id)

const { data, refresh } = await useAsyncData(
  'projet-detail',
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

// --- Dépôt nouvelle version ---
const { erreurGenerale, traiter, reinitialiser, champ } = useFormErrors()
const depotGithub = ref('')
const fichier = ref<File | null>(null)
const chargement = ref(false)
const modaleOuverte = ref(false)

const estMonte = ref(false)
onMounted(() => {
  requestAnimationFrame(() => { estMonte.value = true })
})

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
    <div v-if="!idProjet" class="bg-card border border-slate-200 rounded-lg p-10 text-center opacity-0" :class="estMonte ? 'animate-entree' : ''">
      <p class="text-sm text-ink-light mb-4">Vous n'avez pas encore soumis de projet.</p>
      <NuxtLink
  to="/etudiant/soumettre-projet"
  class="inline-flex items-center gap-2 bg-secondary hover:bg-primary text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-all hover:-translate-y-0.5 hover:shadow-md"
>
  Soumettre mon projet
  <span aria-hidden="true">→</span>
</NuxtLink>
    </div>

    <div v-else-if="data?.projet">
      <div class="flex items-start justify-between mb-1 opacity-0" :class="estMonte ? 'animate-entree' : ''">
        <h1 class="text-2xl font-bold text-slate-900">{{ data.projet.titre }}</h1>
        <span class="inline-flex px-3 py-1.5 rounded-full text-xs font-medium shrink-0 transition-colors" :class="badgesStatuts[data.projet.statut]?.classe">
          {{ badgesStatuts[data.projet.statut]?.label }}
        </span>
      </div>
      <p class="text-sm text-ink-light mb-6 opacity-0" :class="estMonte ? 'animate-entree' : ''" style="animation-delay: 40ms">Déposé le {{ data.projet.created_at }}</p>

      <div class="grid lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-6">
          <div class="bg-card border border-slate-200 rounded-lg p-6 opacity-0" :class="estMonte ? 'animate-entree' : ''" style="animation-delay: 100ms">
            <h2 class="font-semibold text-slate-900 mb-3">Description</h2>
            <p class="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{{ data.projet.description }}</p>
          </div>

          <div class="bg-card border border-slate-200 rounded-lg p-6 opacity-0" :class="estMonte ? 'animate-entree' : ''" style="animation-delay: 160ms">
            <div class="flex items-center justify-between mb-4">
              <h2 class="font-semibold text-slate-900">Historique des versions</h2>
              <button
                v-if="data.projet.statut === 'corrections'"
                type="button"
                @click="modaleOuverte = true"
                class="text-xs font-medium text-secondary hover:text-primary active:scale-95 transition"
              >
                + Nouvelle version
              </button>
            </div>

            <TransitionGroup tag="div" name="ligne" class="space-y-3">
              <div v-for="v in data.projet.versions" :key="v.id" class="border-l-2 pl-4" :class="v.statut_version === 'validee' ? 'border-accent' : 'border-warning'">
                <div class="flex items-center gap-2 mb-0.5">
                  <p class="text-sm font-medium text-slate-900">Version {{ v.numero_version }}</p>
                  <span class="inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium" :class="v.statut_version === 'validee' ? 'bg-accent/10 text-accent' : 'bg-warning/10 text-warning'">
                    {{ v.statut_version === 'validee' ? 'Validé' : v.statut_version === 'corrections_demandees' ? 'Corrections demandées' : 'En attente' }}
                  </span>
                </div>
                <p class="text-xs text-ink-light mb-1">Déposée le {{ v.date_depot }}</p>
                <a v-if="v.rapport_pdf" :href="v.rapport_pdf" target="_blank" class="text-xs text-secondary hover:text-primary inline-flex items-center gap-1">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Voir le PDF
                </a>
              </div>
            </TransitionGroup>
          </div>

          <div class="bg-card border border-slate-200 rounded-lg p-6 opacity-0" :class="estMonte ? 'animate-entree' : ''" style="animation-delay: 220ms">
            <h2 class="font-semibold text-slate-900 mb-4">Observations de l'encadreur</h2>
            <TransitionGroup tag="div" name="ligne" class="space-y-4">
              <div v-for="o in data.projet.observations" :key="o.id" class="bg-slate-50 rounded-lg p-4 hover:bg-slate-100/70 transition-colors">
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
            </TransitionGroup>
          </div>
        </div>

        <div class="space-y-6">
          <div class="bg-card border border-slate-200 rounded-lg p-5 opacity-0" :class="estMonte ? 'animate-entree' : ''" style="animation-delay: 280ms">
            <h3 class="font-semibold text-slate-900 text-sm mb-3">Encadrement</h3>
            <div v-if="data.projet.encadreur" class="flex items-center gap-2.5">
              <span class="w-8 h-8 rounded-full bg-secondary/10 text-secondary text-xs font-semibold flex items-center justify-center">
                {{ data.projet.encadreur.prenom.charAt(0) }}{{ data.projet.encadreur.nom.charAt(0) }}
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
    <Transition name="modale-fondu">
      <div v-if="modaleOuverte" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
        <Transition name="panneau-zoom" appear>
          <div class="w-full max-w-md bg-card rounded-xl shadow-xl">
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
                <button type="submit" :disabled="chargement" class="bg-secondary hover:bg-primary text-white text-sm font-medium px-5 py-2 rounded-lg transition active:scale-95 disabled:opacity-50">
                  {{ chargement ? 'Envoi...' : 'Déposer' }}
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