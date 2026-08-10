<script setup lang="ts">
import { useApi } from '~/Composables/useApi'
import { useConfirmation } from '~/Composables/useConfirmation'

definePageMeta({ layout: 'dashboard', middleware: 'role' })
useRoute().meta.roles = ['administrateur', 'super_administrateur']

const { apiFetch } = useApi()
const { demander } = useConfirmation()

interface Projet {
  id: string
  titre: string
  statut: string
  etudiant: { id: string; nom: string; prenom: string }
  encadreur?: { id: string; nom: string; prenom: string } | null
  derniere_version?: { date_depot: string } | null
  created_at: string
}

const { data, refresh } = await useAsyncData('projets-admin', () =>
  apiFetch<{ projets: Projet[] }>('/projets')
)

const onglets = [
  { valeur: 'tous', label: 'Tous' },
  { valeur: 'en_attente', label: 'En attente' },
  { valeur: 'corrections', label: 'Corrections demandées' },
  { valeur: 'valide', label: 'Validé' },
  { valeur: 'presentation_planifiee', label: 'Présentation planifiée' },
  { valeur: 'presente', label: 'Présenté' },
]

const ongletActif = ref('tous')
const recherche = ref('')
const erreurAction = ref('')

const estMonte = ref(false)
onMounted(() => {
  requestAnimationFrame(() => { estMonte.value = true })
})

function compte(statut: string) {
  if (statut === 'tous') return data.value?.projets.length ?? 0
  return (data.value?.projets ?? []).filter((p) => p.statut === statut).length
}

const projetsFiltres = computed(() => {
  const terme = recherche.value.toLowerCase()
  return (data.value?.projets ?? []).filter((p) => {
    const correspondStatut = ongletActif.value === 'tous' || p.statut === ongletActif.value
    const correspondTerme = `${p.titre} ${p.etudiant.prenom} ${p.etudiant.nom}`.toLowerCase().includes(terme)
    return correspondStatut && correspondTerme
  })
})

const badgesStatuts: Record<string, { label: string; classe: string }> = {
  en_attente: { label: 'En attente', classe: 'bg-warning/10 text-warning' },
  corrections: { label: 'Corrections demandées', classe: 'bg-danger/10 text-danger' },
  valide: { label: 'Validé', classe: 'bg-accent/10 text-accent' },
  presentation_planifiee: { label: 'Présentation planifiée', classe: 'bg-secondary/10 text-secondary' },
  presente: { label: 'Présenté', classe: 'bg-slate-200 text-slate-600' },
}

// --- Affectation encadreur ---
const modaleAffectationOuverte = ref(false)
const projetPourAffectation = ref<Projet | null>(null)

function ouvrirAffectation(p: Projet) {
  projetPourAffectation.value = p
  modaleAffectationOuverte.value = true
}
function fermerAffectation() {
  modaleAffectationOuverte.value = false
  projetPourAffectation.value = null
}

// --- Suppression ---
async function supprimer(p: Projet) {
  const confirme = await demander({
    titre: 'Supprimer ce projet',
    message: `Supprimer "${p.titre}" ? Cette action est irréversible.`,
    texteConfirmer: 'Supprimer',
    dangereux: true,
  })
  if (!confirme) return

  erreurAction.value = ''
  try {
    await apiFetch(`/projets/${p.id}`, { method: 'DELETE' })
    await refresh()
  } catch (e: any) {
    erreurAction.value = e?.data?.message || 'Une erreur est survenue.'
  }
}
</script>

<template>
  <div>
    <div class="mb-6 opacity-0" :class="estMonte ? 'animate-entree' : ''">
      <h1 class="text-2xl font-bold text-slate-900">Gestion des projets</h1>
      <p class="text-sm text-ink-light mt-1">Vue globale, affectation des encadreurs et suivi</p>
    </div>

    <FormAlerte :message="erreurAction" />

    <div class="flex flex-wrap items-center justify-between gap-3 mb-6 opacity-0" :class="estMonte ? 'animate-entree' : ''" style="animation-delay: 80ms">
      <div class="flex flex-wrap gap-2">
        <button
          v-for="o in onglets"
          :key="o.valeur"
          type="button"
          @click="ongletActif = o.valeur"
          class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium transition active:scale-95"
          :class="ongletActif === o.valeur ? 'bg-primary text-white' : 'bg-slate-100 text-ink-light hover:bg-slate-200'"
        >
          {{ o.label }}
          <span
            class="text-xs px-1.5 rounded-full transition-transform"
            :class="ongletActif === o.valeur ? 'bg-white/20 scale-105' : 'bg-card'"
          >
            {{ compte(o.valeur) }}
          </span>
        </button>
      </div>

      <div class="relative w-72">
        <svg class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
        </svg>
        <input
          v-model="recherche"
          type="text"
          placeholder="Rechercher un projet ou un étudiant..."
          class="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary transition-shadow"
        />
      </div>
    </div>

    <div class="bg-card border border-slate-200 rounded-lg overflow-x-auto opacity-0" :class="estMonte ? 'animate-entree' : ''" style="animation-delay: 140ms">
      <table class="w-full text-sm">
        <thead class="bg-slate-50 border-b border-slate-200">
          <tr class="text-left text-xs font-semibold text-ink-light uppercase tracking-wide">
            <th class="px-5 py-3">Projet</th>
            <th class="px-5 py-3">Étudiant</th>
            <th class="px-5 py-3">Encadreur</th>
            <th class="px-5 py-3">Statut</th>
            <th class="px-5 py-3">Dépôt</th>
            <th class="px-5 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <TransitionGroup tag="tbody" name="ligne" class="divide-y divide-slate-100">
          <tr v-for="p in projetsFiltres" :key="p.id" class="hover:bg-slate-50/60">
            <td class="px-5 py-3 font-medium text-slate-900 max-w-xs truncate">{{ p.titre }}</td>
            <td class="px-5 py-3">
              <div class="flex items-center gap-2">
                <span class="w-6 h-6 rounded-full bg-secondary/10 text-secondary text-[10px] font-semibold flex items-center justify-center shrink-0">
                  {{ p.etudiant.prenom.charAt(0) }}{{ p.etudiant.nom.charAt(0) }}
                </span>
                {{ p.etudiant.prenom }} {{ p.etudiant.nom }}
              </div>
            </td>
            <td class="px-5 py-3">
              <span v-if="p.encadreur" class="text-slate-900">{{ p.encadreur.prenom }} {{ p.encadreur.nom }}</span>
              <span v-else class="text-warning italic">Non affecté</span>
            </td>
            <td class="px-5 py-3">
              <span class="inline-flex px-2.5 py-1 rounded-full text-xs font-medium" :class="badgesStatuts[p.statut]?.classe">
                {{ badgesStatuts[p.statut]?.label }}
              </span>
            </td>
            <td class="px-5 py-3 text-ink-light whitespace-nowrap">
              {{ p.derniere_version?.date_depot ?? '—' }}
            </td>
            <td class="px-5 py-3">
              <div class="flex items-center justify-end gap-2">
                <NuxtLink
      :to="`/admin/projets/${p.id}`"
      class="p-1.5 text-ink-light hover:text-secondary hover:scale-110 active:scale-95 transition"
      title="Voir le détail"
    >
      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    </NuxtLink>
                <button type="button" class="p-1.5 text-ink-light hover:text-secondary hover:scale-110 active:scale-95 transition" title="Affecter un encadreur" @click="ouvrirAffectation(p)">
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </button>
                <button type="button" class="p-1.5 text-ink-light hover:text-danger hover:scale-110 active:scale-95 transition" title="Supprimer" @click="supprimer(p)">
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </td>
          </tr>

          <tr v-if="!projetsFiltres.length">
            <td colspan="6" class="px-5 py-10 text-center text-ink-light text-sm">Aucun projet trouvé.</td>
          </tr>
        </TransitionGroup>
      </table>
    </div>

    <Transition name="modale-fondu">
      <ModaleAffecterEncadreur
        v-if="modaleAffectationOuverte && projetPourAffectation"
        :projet="projetPourAffectation"
        @close="fermerAffectation"
        @saved="refresh"
      />
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
</style>