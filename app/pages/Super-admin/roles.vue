<script setup lang="ts">
import { useApi } from '~/Composables/useApi'
import { useRoute, useAsyncData } from '#imports'
import { ref, reactive, computed, onMounted } from 'vue'
import { ShieldCheck, Crown, GraduationCap, Briefcase, Scale } from 'lucide-vue-next'

definePageMeta({ layout: 'dashboard', middleware: 'role', roles: ['super_administrateur'] })

const { apiFetch } = useApi()

interface Permission {
  id_permission: string
  code: string
  libelle: string
  description: string
}

interface ReponseMatrice {
  permissions: Permission[]
  roles: { id: string; libelle: string }[]
  matrice: Record<string, string[]>
}

const { data, refresh } = await useAsyncData('roles-permissions', () =>
  apiFetch<ReponseMatrice>('/roles-permissions')
)

// Icône et libellé affiché pour chaque rôle connu — "Scale" (balance) pour le
// jury externe évoque la délibération/le jugement, plus parlant qu'une icône
// générique.
const presentationRoles: Record<string, { label: string; icone: any; couleurBadge: string; couleurTexte: string }> = {
  etudiant: { label: 'Étudiant', icone: GraduationCap, couleurBadge: 'bg-accent/10', couleurTexte: 'text-accent' },
  encadreur: { label: 'Encadreur', icone: Briefcase, couleurBadge: 'bg-secondary/10', couleurTexte: 'text-secondary' },
  administrateur: { label: 'Administrateur', icone: ShieldCheck, couleurBadge: 'bg-secondary/10', couleurTexte: 'text-secondary' },
  super_administrateur: { label: 'Super Administrateur', icone: Crown, couleurBadge: 'bg-warning/10', couleurTexte: 'text-warning' },
  jury_externe: { label: 'Jury externe', icone: Scale, couleurBadge: 'bg-primary/10', couleurTexte: 'text-primary' },
}

function infosRole(libelle: string) {
  return presentationRoles[libelle] ?? { label: libelle, icone: ShieldCheck, couleurBadge: 'bg-slate-100', couleurTexte: 'text-slate-600' }
}

// Liste des rôles réellement gérables, dans l'ordre renvoyé par l'API —
// plus besoin de coder chaque rôle en dur ici.
const rolesGerables = computed(() => data.value?.roles ?? [])

const ongletActif = ref<string>('')

// état local modifiable, initialisé depuis la matrice serveur pour CHAQUE
// rôle renvoyé par l'API (et non plus seulement 2 rôles fixes).
const selections = reactive<Record<string, Set<string>>>({})

function initialiserSelections() {
  for (const role of rolesGerables.value) {
    selections[role.libelle] = new Set(data.value?.matrice?.[role.libelle] ?? [])
  }
  if (!ongletActif.value && rolesGerables.value.length) {
    ongletActif.value = rolesGerables.value[0]!.libelle
  }
}
initialiserSelections()

const enregistrement = ref(false)
const message = ref('')

const estMonte = ref(false)
onMounted(() => {
  requestAnimationFrame(() => { estMonte.value = true })
})

function getSelection(role: string) {
  if (!selections[role]) {
    selections[role] = new Set()
  }
  return selections[role]
}

function estActive(codePermissionId: string) {
  return getSelection(ongletActif.value).has(codePermissionId)
}

function basculer(id: string) {
  const set = getSelection(ongletActif.value)
  if (set.has(id)) set.delete(id)
  else set.add(id)
}

function reinitialiser() {
  initialiserSelections()
  message.value = ''
}

const nbPermissions = computed(() => {
  const resultat: Record<string, number> = {}
  for (const role of rolesGerables.value) {
    resultat[role.libelle] = getSelection(role.libelle).size
  }
  return resultat
})

async function sauvegarder() {
  const role = data.value?.roles?.find((r) => r.libelle === ongletActif.value)
  if (!role) return

  enregistrement.value = true
  message.value = ''

  try {
    await apiFetch(`/roles/${role.id}/permissions`, {
      method: 'PUT',
      body: { permission_ids: Array.from(getSelection(ongletActif.value)) },
    })
    message.value = 'Permissions enregistrées avec succès.'
    await refresh()
    initialiserSelections()
  } finally {
    enregistrement.value = false
  }
}
</script>

<template>
  <div>
    <div class="flex items-start justify-between mb-6 opacity-0" :class="estMonte ? 'animate-entree' : ''">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">Rôles et permissions</h1>
        <p class="text-sm text-ink-light mt-1">Configurez les permissions accordées à chaque rôle de la plateforme</p>
      </div>
      <div class="flex items-center gap-3 shrink-0">
        <button
          type="button"
          @click="reinitialiser"
          class="inline-flex items-center gap-1.5 text-sm font-medium text-secondary hover:text-primary active:scale-95 transition"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Réinitialiser
        </button>
        <button
          type="button"
          :disabled="enregistrement"
          @click="sauvegarder"
          class="inline-flex items-center gap-1.5 bg-secondary hover:bg-primary text-white text-sm font-medium px-4 py-2 rounded-lg transition active:scale-95 disabled:opacity-50"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1-4l-4 4m0 0L8 3m4 4V1" />
          </svg>
          {{ enregistrement ? 'Sauvegarde...' : 'Sauvegarder' }}
        </button>
      </div>
    </div>

    <Transition name="fondu">
      <p v-if="message" class="text-sm text-green-800 mb-4">{{ message }}</p>
    </Transition>

    <!-- Onglets : un par rôle réellement renvoyé par l'API -->
    <div class="flex items-center gap-2 mb-6 flex-wrap opacity-0" :class="estMonte ? 'animate-entree' : ''" style="animation-delay: 80ms">
      <button
        v-for="role in rolesGerables"
        :key="role.id"
        type="button"
        @click="ongletActif = role.libelle"
        class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition active:scale-95"
        :class="ongletActif === role.libelle ? 'bg-primary text-white' : 'bg-slate-100 text-ink-light hover:bg-slate-200'"
      >
        <component :is="infosRole(role.libelle).icone" class="w-4 h-4" />
        {{ infosRole(role.libelle).label }}
      </button>
    </div>

    <!-- Tableau des permissions -->
    <div class="bg-card border border-slate-200 rounded-lg overflow-hidden mb-6 opacity-0" :class="estMonte ? 'animate-entree' : ''" style="animation-delay: 140ms">
      <table class="w-full text-sm">
        <thead class="bg-slate-50 border-b border-slate-200">
          <tr class="text-left text-xs font-semibold text-ink-light uppercase tracking-wide">
            <th class="px-5 py-3">Permission</th>
            <th class="px-5 py-3">Description</th>
            <th class="px-5 py-3 text-right w-40">
              <Transition name="fondu" mode="out-in">
                <span :key="ongletActif">{{ infosRole(ongletActif).label }}</span>
              </Transition>
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="p in data?.permissions" :key="p.id_permission" class="hover:bg-slate-50/60">
            <td class="px-5 py-3.5">
              <p class="font-medium text-slate-900">{{ p.libelle }}</p>
             <!-- <code class="text-[11px] text-secondary bg-secondary/5 px-1.5 py-0.5 rounded">{{ p.code }}</code>-->
            </td>
            <td class="px-5 py-3.5 text-secondary">{{ p.description }}</td>
            <td class="px-5 py-3.5 text-right">
              <button
                type="button"
                role="switch"
                :aria-checked="estActive(p.id_permission)"
                @click="basculer(p.id_permission)"
                class="relative inline-flex h-6 w-11 items-center rounded-full transition"
                :class="estActive(p.id_permission) ? 'bg-yellow-300' : 'bg-slate-300'"
              >
                <span
                  class="inline-block h-4 w-4 transform rounded-full bg-white transition"
                  :class="estActive(p.id_permission) ? 'translate-x-6' : 'translate-x-1'"
                />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Résumé : une carte par rôle -->
    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="(role, i) in rolesGerables"
        :key="role.id"
        class="bg-card rounded-lg p-4 flex items-center gap-4 opacity-0 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300"
        :class="estMonte ? 'animate-entree' : ''"
        :style="{ animationDelay: `${200 + i * 60}ms` }"
      >
        <span
          class="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          :class="[infosRole(role.libelle).couleurBadge, infosRole(role.libelle).couleurTexte]"
        >
          <component :is="infosRole(role.libelle).icone" class="w-5.5 h-5.5" />
        </span>
        <div>
          <p class="font-semibold text-slate-900">{{ infosRole(role.libelle).label }}</p>
          <p class="text-sm text-ink-light tabular-nums">{{ nbPermissions[role.libelle] ?? 0 }} permissions accordées</p>
        </div>
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

.fondu-enter-active,
.fondu-leave-active {
  transition: opacity 0.2s ease;
}
.fondu-enter-from,
.fondu-leave-to {
  opacity: 0;
}
</style>