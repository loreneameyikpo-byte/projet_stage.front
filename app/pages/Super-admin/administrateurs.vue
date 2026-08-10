<script setup lang="ts">
import { useApi } from '~/Composables/useApi'
import { useRoute, useAsyncData } from '#imports'
import { ref, computed, onMounted } from 'vue'
import { useConfirmation } from '~/Composables/useConfirmation'

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
    <div class="relative mb-4 max-w-sm opacity-0" :class="estMonte ? 'animate-entree' : ''" style="animation-delay: 280ms">
      <BaseIcon name="Search" size="16" class="text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" stroke-width="2" />
      <input
        v-model="recherche"
        type="text"
        placeholder="Rechercher un administrateur..."
        class="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary transition-shadow"
      />
    </div>

    <!-- Tableau -->
    <div class="bg-card border border-slate-200 rounded-lg overflow-hidden opacity-0" :class="estMonte ? 'animate-entree' : ''" style="animation-delay: 340ms">
      <table class="w-full text-sm">
        <thead class="bg-slate-50 border-b border-slate-200">
          <tr class="text-left text-xs font-semibold text-ink-light uppercase tracking-wide">
            <th class="px-5 py-3">Administrateur</th>
            <th class="px-5 py-3">Email</th>
            <th class="px-5 py-3">Téléphone</th>
            <th class="px-5 py-3">Statut</th>
            <th class="px-5 py-3">Créé le</th>
            <th class="px-5 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <TransitionGroup tag="tbody" name="ligne" class="divide-y divide-slate-100">
          <tr v-for="a in administrateursFiltres" :key="a.id" class="hover:bg-slate-50/60">
            <td class="px-5 py-3">
              <div class="flex items-center gap-2.5">
                <span class="w-8 h-8 rounded-full bg-secondary/10 text-secondary text-xs font-semibold flex items-center justify-center shrink-0">
                  {{ initiales(a) }}
                </span>
                <span class="font-medium text-slate-900">{{ a.prenom }} {{ a.nom }}</span>
              </div>
            </td>
            <td class="px-5 py-3 text-secondary">{{ a.email }}</td>
            <td class="px-5 py-3 text-ink-light">{{ a.contacts ?? '—' }}</td>
            <td class="px-5 py-3">
              <button type="button" @click="basculerActif(a)">
                <span
                  class="inline-flex px-2.5 py-1 rounded-full text-xs font-medium"
                  :class="a.actif ? 'bg-accent/10 text-accent' : 'bg-warning/10 text-warning'"
                >
                  {{ a.actif ? 'Actif' : 'Inactif' }}
                </span>
              </button>
            </td>
            <td class="px-5 py-3 text-ink-light">{{ a.created_at }}</td>
            <td class="px-5 py-3">
              <div class="flex items-center justify-end gap-2">
                <button
                  type="button"
                  class="p-1.5 text-ink-light hover:text-secondary hover:scale-110 active:scale-95 transition"
                  @click="ouvrirEdition(a)"
                  title="Modifier"
                >
                  <BaseIcon name="Edit2" size="16" stroke-width="2" />
                </button>
                <button
                  type="button"
                  :disabled="suppressionEnCours === a.id"
                  @click="supprimer(a)"
                  class="p-1.5 text-ink-light hover:text-danger hover:scale-110 active:scale-95 transition disabled:opacity-40"
                  title="Supprimer"
                >
                  <BaseIcon name="Trash2" size="16" stroke-width="2" />
                </button>
                <button
                  type="button"
                  :disabled="renvoiEnCours === a.id"
                  @click="renvoyerIdentifiants(a)"
                  class="p-1.5 text-ink-light hover:text-secondary hover:scale-110 active:scale-95 transition disabled:opacity-40"
                  title="Renvoyer les identifiants"
                >
                  <BaseIcon name="Mail" size="16" stroke-width="2" />
                </button>
              </div>
            </td>
          </tr>

          <tr v-if="!administrateursFiltres.length">
            <td colspan="6" class="px-5 py-10 text-center text-ink-light text-sm">
              Aucun administrateur trouvé.
            </td>
          </tr>
        </TransitionGroup>
      </table>
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

.ligne-enter-active,
.ligne-leave-active {
  transition: opacity 0.25s ease;
}
.ligne-enter-from,
.ligne-leave-to {
  opacity: 0;
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
</style>