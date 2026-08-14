<script setup lang="ts">
import { useApi } from '~/Composables/useApi'
import { useConfirmation } from '~/Composables/useConfirmation'
import Vue3Datatable from '@bhplugin/vue3-datatable'
import type { IColumnDefinition } from '@bhplugin/vue3-datatable'
import '@bhplugin/vue3-datatable/dist/style.css'

definePageMeta({ layout: 'dashboard', middleware: 'role', roles: ['administrateur', 'super_administrateur'] })

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

const colonnes = ref<IColumnDefinition[]>([
  { field: 'projet', title: 'Projet', filter: false, sort: false },
  { field: 'etudiant', title: 'Étudiant', filter: false, sort: false },
  { field: 'encadreur', title: 'Encadreur', filter: false, sort: false },
  { field: 'statut', title: 'Statut', filter: false, sort: false },
  { field: 'depot', title: 'Dépôt', filter: false, sort: false },
  { field: 'actions', title: 'Actions', filter: false, sort: false, width: '110px' },
])

// Vue3Datatable type ses slots en Record<string, unknown> ; cette fonction
// reconvertit vers notre interface réelle pour retrouver l'autocomplétion
// et satisfaire le vérificateur de types partout dans les slots ci-dessous.
function ligne(v: Record<string, unknown>): Projet {
  return v as unknown as Projet
}

const taillePage = ref(10)
const optionsTaillePage = [
  { value: '10', label: '10 par page' },
  { value: '20', label: '20 par page' },
  { value: '50', label: '50 par page' },
]
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

    <div class="bg-card border border-slate-200 rounded-t-lg overflow-x-auto opacity-0 datatable-projetis" :class="estMonte ? 'animate-entree' : ''" style="animation-delay: 140ms">
      <Vue3Datatable
        :rows="projetsFiltres as unknown as Record<string, unknown>[]"
        :columns="colonnes"
        :pagination="true"
        :page-size="taillePage"
        :show-page-size="false"
        :show-first-page="false"
        :show-last-page="false"
        skin="bh-table-hover"
        pagination-info="{0} à {1} sur {2} projets"
      >
        <template #projet="data">
          <span class="font-medium text-slate-900 max-w-xs truncate block">{{ ligne(data.value).titre }}</span>
        </template>

        <template #etudiant="data">
          <div class="flex items-center gap-2">
            <span class="badge-avatar w-6 h-6 rounded-full bg-secondary/10 text-secondary text-[10px] font-semibold flex items-center justify-center shrink-0">
              {{ ligne(data.value).etudiant.prenom.charAt(0) }}{{ ligne(data.value).etudiant.nom.charAt(0) }}
            </span>
            {{ ligne(data.value).etudiant.prenom }} {{ ligne(data.value).etudiant.nom }}
          </div>
        </template>

        <template #encadreur="data">
          <span v-if="ligne(data.value).encadreur" class="text-slate-900">{{ ligne(data.value).encadreur?.prenom }} {{ ligne(data.value).encadreur?.nom }}</span>
          <span v-else class="text-warning italic">Non affecté</span>
        </template>

        <template #statut="data">
          <span class="badge-filiere inline-flex px-2.5 py-1 rounded-full text-xs font-medium" :class="badgesStatuts[ligne(data.value).statut]?.classe">
            {{ badgesStatuts[ligne(data.value).statut]?.label }}
          </span>
        </template>

        <template #depot="data">
          <span class="text-ink-light whitespace-nowrap">{{ ligne(data.value).derniere_version?.date_depot ?? '—' }}</span>
        </template>

        <template #actions="data">
          <div class="flex items-center justify-end gap-2">
            <NuxtLink
              :to="`/admin/projets/${ligne(data.value).id}`"
              class="p-1.5 text-ink-light hover:text-secondary hover:scale-110 active:scale-95 transition"
              title="Voir le détail"
            >
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </NuxtLink>
            <button type="button" class="p-1.5 text-ink-light hover:text-secondary hover:scale-110 active:scale-95 transition" title="Affecter un encadreur" @click="ouvrirAffectation(ligne(data.value))">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </button>
            <button type="button" class="p-1.5 text-ink-light hover:text-danger hover:scale-110 active:scale-95 transition" title="Supprimer" @click="supprimer(ligne(data.value))">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </template>

        <template #noData>
          <p class="px-5 py-10 text-center text-ink-light text-sm">Aucun projet trouvé.</p>
        </template>

        <template #firstArrow>
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M11 19l-7-7 7-7M20 19l-7-7 7-7" />
          </svg>
        </template>
        <template #previousArrow>
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </template>
        <template #nextArrow>
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </template>
        <template #lastArrow>
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13 5l7 7-7 7M4 5l7 7-7 7" />
          </svg>
        </template>
      </Vue3Datatable>
    </div>

    <div class="flex items-center justify-end gap-2 bg-card border border-t-0 border-slate-200 rounded-b-lg px-5 py-2.5 relative z-10">
      <span class="text-xs text-ink-light">Lignes par page</span>
      <SelectPersonnalise
        :model-value="String(taillePage)"
        @update:model-value="(v) => (taillePage = Number(v))"
        :options="optionsTaillePage"
        trigger-class="w-32 flex items-center justify-between gap-2 px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-card text-slate-900 focus:outline-none focus:ring-2 focus:ring-secondary"
      />
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

.modale-fondu-enter-active,
.modale-fondu-leave-active {
  transition: opacity 0.2s ease;
}
.modale-fondu-enter-from,
.modale-fondu-leave-to {
  opacity: 0;
}

.datatable-projetis :deep(.bh-datatable) {
  @apply !text-ink !bg-transparent;
}
.datatable-projetis :deep(table) {
  background-color: transparent !important;
}
.datatable-projetis :deep(thead),
.datatable-projetis :deep(th) {
  @apply !bg-slate-50 !border-b !border-slate-200 !text-ink-light;
}
.datatable-projetis :deep(thead th) {
  @apply !text-ink-light !text-xs !font-semibold uppercase tracking-wide !px-5 !py-3;
}
.datatable-projetis :deep(tbody td) {
  @apply !px-5 !py-3 !text-sm !border-slate-100 !text-slate-700 !bg-card;
}
.datatable-projetis :deep(tbody tr),
.datatable-projetis :deep(tbody tr td),
.datatable-projetis :deep(tbody tr:nth-child(odd)),
.datatable-projetis :deep(tbody tr:nth-child(odd) td),
.datatable-projetis :deep(tbody tr:nth-child(even)),
.datatable-projetis :deep(tbody tr:nth-child(even) td) {
  @apply !bg-card;
}
.datatable-projetis :deep(tbody tr:hover),
.datatable-projetis :deep(tbody tr:hover td),
.datatable-projetis :deep(tbody tr:nth-child(odd):hover),
.datatable-projetis :deep(tbody tr:nth-child(odd):hover td),
.datatable-projetis :deep(tbody tr:nth-child(even):hover),
.datatable-projetis :deep(tbody tr:nth-child(even):hover td) {
  @apply !bg-secondary !text-white;
}
.datatable-projetis :deep(tbody tr:hover) .badge-avatar,
.datatable-projetis :deep(tbody tr:hover) .badge-filiere {
  @apply !bg-white/20 !text-white;
}
.datatable-projetis :deep(tbody tr:hover) .lien-email {
  @apply !text-white;
}
.datatable-projetis :deep(select) {
  display: none !important;
}

.datatable-projetis :deep(.bh-pagination) {
  @apply !bg-card !border-slate-100 !px-5 !py-3 !text-sm !text-ink-light;
}
.datatable-projetis :deep(.bh-pagination button) {
  @apply !w-8 !h-8 !min-w-0 !flex !items-center !justify-center !rounded-full !text-secondary !bg-transparent !border-0 !font-medium transition-all duration-150;
}
.datatable-projetis :deep(.bh-pagination button:hover:not(:disabled)) {
  @apply !bg-slate-100 !text-primary;
}
.datatable-projetis :deep(.bh-pagination button:disabled) {
  @apply !opacity-30 !cursor-not-allowed;
}
.datatable-projetis :deep(.bh-pagination button[aria-current="true"]),
.datatable-projetis :deep(.bh-pagination .bh-active),
.datatable-projetis :deep(.bh-pagination button.bh-bg-primary) {
  @apply !bg-secondary !text-white;
}
</style>