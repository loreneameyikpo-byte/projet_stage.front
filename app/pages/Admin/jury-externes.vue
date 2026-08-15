<script setup lang="ts">
import { useApi } from '../../Composables/useApi'
import { useConfirmation } from '../../Composables/useConfirmation'
import { useRoles } from '../../Composables/useRoles'
import Vue3Datatable from '@bhplugin/vue3-datatable'
import type { IColumnDefinition } from '@bhplugin/vue3-datatable'
import '@bhplugin/vue3-datatable/dist/style.css'

definePageMeta({ layout: 'dashboard', middleware: 'role', roles: ['administrateur', 'super_administrateur'] })

const { apiFetch } = useApi()
const { demander } = useConfirmation()

interface MembreJury {
  id: string
  nom: string
  prenom: string
  email: string
  contacts: string | null
  specialite: string | null
}

const { data: rolesMap } = await useRoles()
const { data, refresh } = await useAsyncData<{ utilisateurs: MembreJury[] }>('jury-externes', () =>
  apiFetch('/utilisateurs?role=jury_externe')
)
const { data: specialitesData } = await useAsyncData<{ specialites: { id_specialite: string; libelle: string }[] }>('specialites-select', () =>
  apiFetch('/specialites')
)

const optionsSpecialites = computed(
  () => specialitesData.value?.specialites.map((s) => ({ value: s.id_specialite, label: s.libelle })) ?? []
)

const recherche = ref('')
const erreurSuppression = ref('')

const membresFiltres = computed(() => {
  const terme = recherche.value.toLowerCase()
  return (data.value?.utilisateurs ?? []).filter((m) =>
    `${m.nom} ${m.prenom} ${m.email} ${m.specialite ?? ''}`.toLowerCase().includes(terme)
  )
})

function initiales(m: MembreJury) {
  return `${m.prenom.charAt(0)}${m.nom.charAt(0)}`.toUpperCase()
}

const estMonte = ref(false)
onMounted(() => {
  requestAnimationFrame(() => { estMonte.value = true })
})

const modaleOuverte = ref(false)
const membreEnEdition = ref<MembreJury | null>(null)

function ouvrirCreation() {
  membreEnEdition.value = null
  modaleOuverte.value = true
}
function ouvrirEdition(m: MembreJury) {
  membreEnEdition.value = m
  modaleOuverte.value = true
}
function fermerModale() {
  modaleOuverte.value = false
  membreEnEdition.value = null
}

async function supprimer(m: MembreJury) {
  const confirme = await demander({
    titre: 'Supprimer ce membre de jury',
    message: `Supprimer le compte de ${m.prenom} ${m.nom} ? Cette action est irréversible.`,
    texteConfirmer: 'Supprimer',
    dangereux: true,
  })
  if (!confirme) return

  erreurSuppression.value = ''
  try {
    await apiFetch(`/utilisateurs/${m.id}`, { method: 'DELETE' })
    await refresh()
  } catch (err: any) {
    erreurSuppression.value = err?.data?.message || 'Une erreur est survenue.'
  }
}

const colonnes = ref<IColumnDefinition[]>([
  { field: 'membre', title: 'Membre', filter: false, sort: false },
  { field: 'email', title: 'Email', filter: false, sort: false },
  { field: 'specialite', title: 'Spécialité', filter: false, sort: false },
  { field: 'contacts', title: 'Téléphone', filter: false, sort: false },
  { field: 'actions', title: 'Actions', filter: false, sort: false, width: '110px' },
])

// Vue3Datatable type ses slots en Record<string, unknown> ; cette fonction
// reconvertit vers notre interface réelle pour retrouver l'autocomplétion
// et satisfaire le vérificateur de types partout dans les slots ci-dessous.
function ligne(v: Record<string, unknown>): MembreJury {
  return v as unknown as MembreJury
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
    <div class="flex items-start justify-between mb-6 opacity-0" :class="estMonte ? 'animate-entree' : ''">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">Gestion des Jurés </h1>
        <p class="text-sm text-ink-light mt-1">{{ data?.utilisateurs.length ?? 0 }} membres enregistrés</p>
      </div>
      <button
        type="button"
        @click="ouvrirCreation"
        class="inline-flex items-center gap-2 bg-secondary hover:bg-primary text-white text-sm font-medium px-4 py-2.5 rounded-lg transition active:scale-95 shrink-0"
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Ajouter un membre de jury
      </button>
    </div>

    <FormAlerte :message="erreurSuppression" />

    <div class="relative mb-6 max-w-sm opacity-0" :class="estMonte ? 'animate-entree' : ''" style="animation-delay: 80ms">
      <svg class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
      </svg>
      <input
        v-model="recherche"
        type="text"
        placeholder="Rechercher par nom, email ou spécialité..."
        class="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary transition-shadow"
      />
    </div>

    <div class="bg-card border border-slate-200 rounded-t-lg overflow-hidden opacity-0 datatable-projetis" :class="estMonte ? 'animate-entree' : ''" style="animation-delay: 140ms">
      <Vue3Datatable
        :rows="membresFiltres as unknown as Record<string, unknown>[]"
        :columns="colonnes"
        :pagination="true"
        :page-size="taillePage"
        :show-page-size="false"
        :show-first-page="false"
        :show-last-page="false"
        skin="bh-table-hover"
        pagination-info="{0} à {1} sur {2} membres"
      >
        <template #membre="data">
          <div class="flex items-center gap-2.5">
            <span class="badge-avatar w-8 h-8 rounded-full bg-warning/10 text-warning text-xs font-semibold flex items-center justify-center shrink-0">
              {{ initiales(ligne(data.value)) }}
            </span>
            <span class="font-medium text-slate-900">{{ ligne(data.value).prenom }} {{ ligne(data.value).nom }}</span>
          </div>
        </template>

        <template #email="data">
          <span class="lien-email text-secondary">{{ ligne(data.value).email }}</span>
        </template>

        <template #specialite="data">
          <span v-if="ligne(data.value).specialite" class="badge-filiere inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-warning/10 text-warning">
            {{ ligne(data.value).specialite }}
          </span>
          <span v-else class="text-ink-light">—</span>
        </template>

        <template #contacts="data">
          <span class="text-ink-light">{{ ligne(data.value).contacts ?? '—' }}</span>
        </template>

        <template #actions="data">
          <div class="flex items-center justify-end gap-2">
            <button type="button" class="p-1.5 text-ink-light hover:text-secondary hover:scale-110 active:scale-95 transition" @click="ouvrirEdition(ligne(data.value))">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button type="button" class="p-1.5 text-ink-light hover:text-danger hover:scale-110 active:scale-95 transition" @click="supprimer(ligne(data.value))">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </template>

        <template #noData>
          <p class="px-5 py-10 text-center text-ink-light text-sm">Aucun membre trouvé.</p>
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
      <ModaleUtilisateur
        v-if="modaleOuverte"
        type="jury_externe"
        :utilisateur="membreEnEdition"
        :id-role="rolesMap?.jury_externe ?? ''"
        :specialites="optionsSpecialites"
        @close="fermerModale"
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