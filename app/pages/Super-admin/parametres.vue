<script setup lang="ts">
import { useApi } from '~/Composables/useApi'

definePageMeta({ layout: 'dashboard', middleware: 'role' })
useRoute().meta.roles = ['super_administrateur']

const { apiFetch } = useApi()

const { data } = await useAsyncData('parametres', () =>
  apiFetch<{ parametres: Record<string, string> }>('/parametres')
)

const p = reactive<Record<string, string>>({ ...(data.value?.parametres ?? {}) })

function estActif(cle: string) {
  return p[cle] === 'true'
}
function basculer(cle: string) {
  p[cle] = estActif(cle) ? 'false' : 'true'
}

const onglets = [
  { id: 'generaux', label: 'Paramètres généraux', icone: 'Settings' },
  { id: 'soutenance', label: 'Paramètres de soutenance', icone: 'Calendar' },
  { id: 'notifications', label: 'Notifications', icone: 'Bell' },
  { id: 'email', label: 'Configuration Email', icone: 'Mail' },
]

const notifications = [
  ['notif_nouvelle_soumission', 'Nouvelle soumission de projet'],
  ['notif_projet_valide', "Projet validé par l'encadreur"],
  ['notif_soutenance_planifiee', 'Soutenance planifiée'],
  ['notif_note_publiee', 'Note publiée'],
  ['notif_paiement_recu', 'Paiement reçu'],
] as const

const ongletActif = ref('generaux')
const enregistrement = ref(false)
const message = ref('')

const estMonte = ref(false)
onMounted(() => {
  requestAnimationFrame(() => { estMonte.value = true })
})

async function sauvegarder() {
  enregistrement.value = true
  message.value = ''

  try {
    await apiFetch('/parametres', {
      method: 'PUT',
      body: { parametres: { ...p } },
    })
    message.value = 'Paramètres enregistrés avec succès.'
  } finally {
    enregistrement.value = false
  }
}
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold text-slate-900 opacity-0" :class="estMonte ? 'animate-entree' : ''">Paramètres système</h1>
    <p class="text-sm text-ink-light mt-1 mb-6 opacity-0" :class="estMonte ? 'animate-entree' : ''" style="animation-delay: 40ms">Configuration générale de la plateforme {{ p.nom_plateforme }}</p>

    <div class="grid lg:grid-cols-[240px_1fr] gap-6">
      <!-- Sous-navigation -->
      <nav class="space-y-1 opacity-0" :class="estMonte ? 'animate-entree' : ''" style="animation-delay: 100ms">
        <button
          v-for="o in onglets"
          :key="o.id"
          type="button"
          @click="ongletActif = o.id"
          class="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-sm font-medium text-left transition active:scale-[0.98]"
          :class="ongletActif === o.id ? 'bg-secondary/10 text-secondary' : 'text-ink-light hover:bg-slate-100'"
        >
          <BaseIcon :name="o.icone" size="18" stroke-width="2" class="w-4.5 h-4.5 shrink-0" />
          {{ o.label }}
        </button>
      </nav>

      <!-- Contenu -->
      <div class="bg-card border border-slate-200 rounded-lg p-6 opacity-0" :class="estMonte ? 'animate-entree' : ''" style="animation-delay: 160ms">
        <Transition name="onglet" mode="out-in">
        <!-- Généraux -->
        <div v-if="ongletActif === 'generaux'" key="generaux">
          <h2 class="flex items-center gap-2 font-semibold text-slate-900 mb-6 pb-4 border-b border-slate-100">
            <span class="w-8 h-8 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center">
              <BaseIcon name="Settings" size="16" stroke-width="2" class="w-4 h-4" />
            </span>
            Paramètres généraux
          </h2>

          <div class="space-y-5 max-w-lg">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">Nom de la plateforme</label>
              <input v-model="p.nom_plateforme" type="text" class="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-secondary" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">Année académique par défaut</label>
              <input v-model="p.annee_academique_defaut" type="text" class="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-secondary" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700">Taille max des fichiers PDF (Mo)</label>
              <p class="text-xs text-ink-light mb-1.5">Taille maximale autorisée pour l'upload des documents</p>
              <input v-model="p.taille_max_pdf_mo" type="number" min="1" class="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-secondary" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700">Délai d'inactivité (minutes)</label>
              <p class="text-xs text-ink-light mb-1.5">Déconnexion automatique après inactivité</p>
              <input v-model="p.delai_inactivite_minutes" type="number" min="1" class="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-secondary" />
            </div>
          </div>
        </div>

        <!-- Soutenance -->
        <div v-else-if="ongletActif === 'soutenance'" key="soutenance">
          <h2 class="flex items-center gap-2 font-semibold text-slate-900 mb-6 pb-4 border-b border-slate-100">
            <span class="w-8 h-8 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center">
              <BaseIcon name="Calendar" size="16" stroke-width="2" class="w-4 h-4" />
            </span>
            Paramètres de soutenance
          </h2>

          <div class="space-y-5 max-w-lg">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">Durée d'une soutenance (minutes)</label>
              <input v-model="p.duree_soutenance_minutes" type="number" min="15" class="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-secondary" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">Nombre minimum de membres du jury</label>
              <input v-model="p.jury_membres_min" type="number" min="1" class="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-secondary" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">Nombre maximum de membres du jury</label>
              <input v-model="p.jury_membres_max" type="number" min="1" class="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-secondary" />
            </div>
            <div class="flex items-center justify-between">
              <label class="text-sm font-medium text-slate-700">Autoriser les soutenances à distance</label>
              <button
                type="button"
                role="switch"
                :aria-checked="estActif('soutenances_a_distance')"
                @click="basculer('soutenances_a_distance')"
                class="relative inline-flex h-6 w-11 items-center rounded-full transition"
                :class="estActif('soutenances_a_distance') ? 'bg-accent' : 'bg-slate-300'"
              >
                <span class="inline-block h-4 w-4 transform rounded-full bg-white transition" :class="estActif('soutenances_a_distance') ? 'translate-x-6' : 'translate-x-1'" />
              </button>
            </div>
          </div>
        </div>

        <!-- Notifications -->
        <div v-else-if="ongletActif === 'notifications'" key="notifications">
          <h2 class="flex items-center gap-2 font-semibold text-slate-900 mb-6 pb-4 border-b border-slate-100">
            <span class="w-8 h-8 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center">
              <BaseIcon name="Bell" size="16" stroke-width="2" class="w-4 h-4" />
            </span>
            Notifications
          </h2>

          <div class="space-y-4 max-w-lg">
            <div
              v-for="[cle, label] in notifications"
              :key="cle"
              class="flex items-center justify-between py-1"
            >
              <label class="text-sm font-medium text-slate-700">
                {{ label }}
              </label>
              <button
                type="button"
                role="switch"
                :aria-checked="estActif(cle)"
                @click="basculer(cle)"
                class="relative inline-flex h-6 w-11 items-center rounded-full transition"
                :class="estActif(cle) ? 'bg-accent' : 'bg-slate-300'"
              >
                <span class="inline-block h-4 w-4 transform rounded-full bg-white transition" :class="estActif(cle) ? 'translate-x-6' : 'translate-x-1'" />
              </button>
            </div>
          </div>
        </div>

        <!-- Email -->
        <div v-else-if="ongletActif === 'email'" key="email">
          <h2 class="flex items-center gap-2 font-semibold text-slate-900 mb-6 pb-4 border-b border-slate-100">
            <span class="w-8 h-8 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center">
              <BaseIcon name="Mail" size="16" stroke-width="2" class="w-4 h-4" />
            </span>
            Configuration Email
          </h2>

          <div class="space-y-5 max-w-lg">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">Serveur SMTP</label>
              <input v-model="p.smtp_host" type="text" class="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-secondary" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">Port SMTP</label>
              <input v-model="p.smtp_port" type="number" class="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-secondary" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">Email expéditeur</label>
              <input v-model="p.mail_from_address" type="email" class="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-secondary" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">Nom expéditeur</label>
              <input v-model="p.mail_from_name" type="text" class="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-secondary" />
            </div>
          </div>
        </div>
        </Transition>

        <Transition name="fondu">
          <p v-if="message" class="text-sm text-accent mt-6">{{ message }}</p>
        </Transition>

        <button
          type="button"
          :disabled="enregistrement"
          @click="sauvegarder"
          class="inline-flex items-center gap-2 bg-secondary hover:bg-primary text-white text-sm font-medium px-5 py-2.5 rounded-lg transition active:scale-95 disabled:opacity-50 mt-6"
        >
          <BaseIcon name="Save" size="16" stroke-width="2" class="w-4 h-4" />
          {{ enregistrement ? 'Enregistrement...' : 'Sauvegarder les paramètres' }}
        </button>
      </div>
    </div>
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

.onglet-enter-active,
.onglet-leave-active {
  transition: opacity 0.18s ease;
}
.onglet-enter-from,
.onglet-leave-to {
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
</style>