<script setup lang="ts">
import { useApi } from '~/Composables/useApi'
import { useRoute, useAsyncData } from '#imports'
import { ref, computed, onMounted } from 'vue'
import { useConfirmation } from '~/Composables/useConfirmation'
import Vue3Datatable from '@bhplugin/vue3-datatable'
import type { IColumnDefinition } from '@bhplugin/vue3-datatable'
import '@bhplugin/vue3-datatable/dist/style.css'

definePageMeta({ layout: 'dashboard', middleware: 'role', roles: ['super_administrateur'] })

const { apiFetch } = useApi()
const{ demander } = useConfirmation() 

interface Administrateur {
  id: string
  nom: string
  prenom: string
  email: string
  contacts: string | null
  actif: boolean
  created_at: string
}

interface ReponseListe {
  administrateurs: Administrateur[]
  stats: { total: number; actifs: number; inactifs: number; recents: number }
}

const { data, refresh } = await useAsyncData<ReponseListe>('administrateurs', () =>
  apiFetch<ReponseListe>('/administrateurs')
)

const recherche = ref('')

const administrateursFiltres = computed(() => {
  if (!data.value) return []
  const terme = recherche.value.toLowerCase()

  return data.value.administrateurs.filter(
    (a: Administrateur) =>
      a.nom.toLowerCase().includes(terme) ||
      a.prenom.toLowerCase().includes(terme) ||
      a.email.toLowerCase().includes(terme)
  )
})

function initiales(a: Administrateur) {
  return `${a.prenom.charAt(0)}${a.nom.charAt(0)}`.toUpperCase()
}

const modaleOuverte = ref(false)
const suppressionEnCours = ref<string | null>(null)
const administrateurEnEdition = ref<Administrateur | null>(null)

function ouvrirCreation() {
  administrateurEnEdition.value = null
  modaleOuverte.value = true
}

function ouvrirEdition(a: Administrateur) {
  administrateurEnEdition.value = a
  modaleOuverte.value = true
}

function fermerModale() {
  modaleOuverte.value = false
  administrateurEnEdition.value = null
}

async function apresCreation() {
  await refresh()
}

const renvoiEnCours = ref<string | null>(null)
const messageRenvoi = ref('')
const messageErreur = ref('')
let timerMessageRenvoi: ReturnType<typeof setTimeout> | null = null
let timerMessageErreur: ReturnType<typeof setTimeout> | null = null

const estMonte = ref(false)
onMounted(() => {
  requestAnimationFrame(() => { estMonte.value = true })
})

function afficherErreur(texte: string) {
  messageErreur.value = texte
  if (timerMessageErreur) clearTimeout(timerMessageErreur)
  timerMessageErreur = setTimeout(() => {
    messageErreur.value = ''
    timerMessageErreur = null
  }, 5000)
}

async function basculerActif(a: Administrateur) {
  try {
    await apiFetch(`/administrateurs/${a.id}/toggle-actif`, { method: 'PATCH' })
    await refresh()
  } catch {
    afficherErreur(`Impossible de modifier le statut de ${a.prenom} ${a.nom}.`)
  }
}

async function supprimer(a: Administrateur) {
  const confirme = await demander({
    titre: 'Confirmer la suppression',
    message: `Supprimer le compte de ${a.prenom} ${a.nom} ? Cette action est irréversible.`,
    texteConfirmer: 'Supprimer',
    dangereux: true,
  })
  if (!confirme) return

  suppressionEnCours.value = a.id
  try {
    await apiFetch(`/administrateurs/${a.id}`, { method: 'DELETE' })
    await refresh()
  } catch {
    afficherErreur(`Échec de la suppression du compte de ${a.prenom} ${a.nom}.`)
  } finally {
    suppressionEnCours.value = null
  }
}

async function renvoyerIdentifiants(a: Administrateur) {
  const confirme = await demander({
    titre: 'Renvoyer les identifiants',
    message: `Renvoyer un nouveau mot de passe temporaire à ${a.prenom} ${a.nom} ?`,
    texteConfirmer: 'Renvoyer',
  })
  if (!confirme) return

  renvoiEnCours.value = a.id
  messageRenvoi.value = ''
  if (timerMessageRenvoi) {
    clearTimeout(timerMessageRenvoi)
    timerMessageRenvoi = null
  }

  try {
    await apiFetch(`/administrateurs/${a.id}/renvoyer-identifiants`, { method: 'POST' })
    messageRenvoi.value = `Identifiants renvoyés à ${a.email}.`
    timerMessageRenvoi = setTimeout(() => {
      messageRenvoi.value = ''
      timerMessageRenvoi = null
    }, 4000)
  } catch {
    afficherErreur(`Échec de l'envoi des identifiants à ${a.email}.`)
  } finally {
    renvoiEnCours.value = null
  }
}

const colonnes = ref<IColumnDefinition[]>([
  { field: 'administrateur', title: 'Administrateur', filter: false, sort: false },
  { field: 'email', title: 'Email', filter: false, sort: false },
  { field: 'contacts', title: 'Téléphone', filter: false, sort: false },
  { field: 'statut', title: 'Statut', filter: false, sort: false },
  { field: 'created_at', title: 'Créé le', filter: false, sort: false },
  { field: 'actions', title: 'Actions', filter: false, sort: false, width: '130px' },
])

// Vue3Datatable type ses slots en Record<string, unknown> ; cette fonction
// reconvertit vers notre interface réelle pour retrouver l'autocomplétion
// et satisfaire le vérificateur de types partout dans les slots ci-dessous.
function ligne(v: Record<string, unknown>): Administrateur {
  return v as unknown as Administrateur
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
        <h1 class="text-2xl font-bold text-slate-900">Gestion des administrateurs</h1>
        <p class="text-sm text-ink-light mt-1">Créer, modifier et gérer les comptes administrateur de la plateforme</p>
      </div>
      <button
        type="button"
        @click="ouvrirCreation"
        class="inline-flex items-center gap-2 bg-secondary hover:bg-primary text-white text-sm font-medium px-4 py-2.5 rounded-lg transition active:scale-95 shrink-0"
      >
        <BaseIcon name="Plus" size="16" stroke-width="2" />
        Nouvel admin
      </button>
    </div>

    <!-- Cartes stats -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
      <div
        v-for="(c, i) in [
          { valeur: data?.stats.total ?? 0, label: 'Total administrateurs', couleur: 'text-slate-900' },
          { valeur: data?.stats.actifs ?? 0, label: 'Actifs', couleur: 'text-accent' },
          { valeur: data?.stats.inactifs ?? 0, label: 'Inactifs', couleur: 'text-warning' },
          { valeur: data?.stats.recents ?? 0, label: 'Récents (< 1 an)', couleur: 'text-secondary' },
        ]"
        :key="c.label"
        class="bg-card border border-slate-200 rounded-lg p-4 opacity-0 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300"
        :class="estMonte ? 'animate-entree' : ''"
        :style="{ animationDelay: `${i * 70}ms` }"
      >
        <p class="text-2xl font-bold" :class="c.couleur">{{ c.valeur }}</p>
        <p class="text-xs text-ink-light">{{ c.label }}</p>
      </div>
    </div>

    <Transition name="fondu">
      <p v-if="messageErreur" class="text-sm text-danger mb-4">{{ messageErreur }}</p>
    </Transition>
    <Transition name="fondu">
      <p v-if="messageRenvoi" class="text-sm text-accent mb-4">{{ messageRenvoi }}</p>
    </Transition>

    <!-- Recherche -->
    <div class="relative z-20 mb-4 max-w-sm opacity-0" :class="estMonte ? 'animate-entree' : ''" style="animation-delay: 280ms">
      <BaseIcon name="Search" size="16" class="text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" stroke-width="2" />
      <input
        v-model="recherche"
        type="text"
        placeholder="Rechercher un administrateur..."
        class="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary transition-shadow"
      />
    </div>

    <!-- Tableau -->
    <div class="bg-card border border-slate-200 rounded-t-lg overflow-hidden opacity-0 datatable-projetis" :class="estMonte ? 'animate-entree' : ''" style="animation-delay: 340ms">
      <Vue3Datatable
        :rows="administrateursFiltres as unknown as Record<string, unknown>[]"
        :columns="colonnes"
        :pagination="true"
        :page-size="taillePage"
        :show-page-size="false"
        :show-first-page="false"
        :show-last-page="false"
        skin="bh-table-hover"
        pagination-info="{0} à {1} sur {2} administrateurs"
      >
        <template #administrateur="data">
          <div class="flex items-center gap-2.5">
            <span class="badge-avatar w-8 h-8 rounded-full bg-secondary/10 text-secondary text-xs font-semibold flex items-center justify-center shrink-0">
              {{ initiales(ligne(data.value)) }}
            </span>
            <span class="font-medium text-slate-900">{{ ligne(data.value).prenom }} {{ ligne(data.value).nom }}</span>
          </div>
        </template>

        <template #email="data">
          <span class="lien-email text-secondary">{{ ligne(data.value).email }}</span>
        </template>

        <template #contacts="data">
          <span class="text-ink-light">{{ ligne(data.value).contacts ?? '—' }}</span>
        </template>

        <template #statut="data">
          <button type="button" @click="basculerActif(ligne(data.value))">
            <span
              class="badge-filiere inline-flex px-2.5 py-1 rounded-full text-xs font-medium"
              :class="ligne(data.value).actif ? 'bg-accent/10 text-accent' : 'bg-warning/10 text-warning'"
            >
              {{ ligne(data.value).actif ? 'Actif' : 'Inactif' }}
            </span>
          </button>
        </template>

        <template #created_at="data">
          <span class="text-ink-light">{{ ligne(data.value).created_at }}</span>
        </template>

        <template #actions="data">
          <div class="flex items-center justify-end gap-2">
            <button
              type="button"
              class="p-1.5 text-ink-light hover:text-secondary hover:scale-110 active:scale-95 transition"
              @click="ouvrirEdition(ligne(data.value))"
              title="Modifier"
            >
              <BaseIcon name="Edit2" size="16" stroke-width="2" />
            </button>
            <button
              type="button"
              :disabled="suppressionEnCours === ligne(data.value).id"
              @click="supprimer(ligne(data.value))"
              class="p-1.5 text-ink-light hover:text-danger hover:scale-110 active:scale-95 transition disabled:opacity-40"
              title="Supprimer"
            >
              <BaseIcon name="Trash2" size="16" stroke-width="2" />
            </button>
            <button
              type="button"
              :disabled="renvoiEnCours === ligne(data.value).id"
              @click="renvoyerIdentifiants(ligne(data.value))"
              class="p-1.5 text-ink-light hover:text-secondary hover:scale-110 active:scale-95 transition disabled:opacity-40"
              title="Renvoyer les identifiants"
            >
              <BaseIcon name="Mail" size="16" stroke-width="2" />
            </button>
          </div>
        </template>

        <template #noData>
          <p class="px-5 py-10 text-center text-ink-light text-sm">Aucun administrateur trouvé.</p>
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
      <ModaleNouvelAdmin
        v-if="modaleOuverte"
        :administrateur="administrateurEnEdition"
        @close="fermerModale"
        @saved="apresCreation"
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

.fondu-enter-active,
.fondu-leave-active {
  transition: opacity 0.2s ease;
}
.fondu-enter-from,
.fondu-leave-to {
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