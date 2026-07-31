<script setup lang="ts">
import { useApi } from '~/Composables/useApi'
import { useRoute, useAsyncData } from '#imports'
import { ref, reactive, computed } from 'vue'

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

const ongletActif = ref<'administrateur' | 'super_administrateur'>('administrateur')

// état local modifiable, initialisé depuis la matrice serveur
const selections = reactive<Record<string, Set<string>>>({
  administrateur: new Set(data.value?.matrice.administrateur ?? []),
  super_administrateur: new Set(data.value?.matrice.super_administrateur ?? []),
})

const enregistrement = ref(false)
const message = ref('')

function getSelection(role: 'administrateur' | 'super_administrateur') {
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
  selections.administrateur = new Set(data.value?.matrice?.administrateur ?? [])
  selections.super_administrateur = new Set(data.value?.matrice?.super_administrateur ?? [])
  message.value = ''
}

const nbPermissions = computed(() => ({
  administrateur: getSelection('administrateur').size,
  super_administrateur: getSelection('super_administrateur').size,
}))

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
  } finally {
    enregistrement.value = false
  }
}
</script>

<template>
  <div>
    <div class="flex items-start justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">Rôles et permissions</h1>
        <p class="text-sm text-ink-light mt-1">Configurez les permissions accordées à chaque rôle de la plateforme</p>
      </div>
      <div class="flex items-center gap-3 shrink-0">
        <button
          type="button"
          @click="reinitialiser"
          class="inline-flex items-center gap-1.5 text-sm font-medium text-secondary hover:text-primary"
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
          class="inline-flex items-center gap-1.5 bg-secondary hover:bg-primary text-white text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-50"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1-4l-4 4m0 0L8 3m4 4V1" />
          </svg>
          {{ enregistrement ? 'Sauvegarde...' : 'Sauvegarder' }}
        </button>
      </div>
    </div>

    <p v-if="message" class="text-sm text-green-800 mb-4">{{ message }}</p>

    <!-- Onglets -->
    <div class="flex items-center gap-2 mb-6">
      <button
        type="button"
        @click="ongletActif = 'administrateur'"
        class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition"
        :class="ongletActif === 'administrateur' ? 'bg-primary text-white' : 'bg-slate-100 text-ink-light hover:bg-slate-200'"
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        Administrateur
      </button>
      <button
        type="button"
        @click="ongletActif = 'super_administrateur'"
        class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition"
        :class="ongletActif === 'super_administrateur' ? 'bg-primary text-white' : 'bg-slate-100 text-ink-light hover:bg-slate-200'"
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
        Super Administrateur
      </button>
    </div>

    <!-- Tableau des permissions -->
    <div class="bg-card border border-slate-200 rounded-lg overflow-hidden mb-6">
      <table class="w-full text-sm">
        <thead class="bg-slate-50 border-b border-slate-200">
          <tr class="text-left text-xs font-semibold text-ink-light uppercase tracking-wide">
            <th class="px-5 py-3">Permission</th>
            <th class="px-5 py-3">Description</th>
            <th class="px-5 py-3 text-right w-32">
              {{ ongletActif === 'administrateur' ? 'Administrateur' : 'Super Administrateur' }}
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="p in data?.permissions" :key="p.id_permission" class="hover:bg-slate-50/60">
            <td class="px-5 py-3.5">
              <p class="font-medium text-slate-900">{{ p.libelle }}</p>
              <code class="text-[11px] text-secondary bg-secondary/5 px-1.5 py-0.5 rounded">{{ p.code }}</code>
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

    <!-- Résumé -->
    <div class="grid sm:grid-cols-2 gap-4">
      <div class="bg-card border-l-4 border-secondary rounded-lg p-4 flex items-center justify-between">
        <div>
          <p class="font-semibold text-slate-900">Administrateur</p>
          <p class="text-sm text-ink-light">{{ nbPermissions.administrateur }} permissions accordées</p>
        </div>
        <span class="w-9 h-9 rounded-full bg-secondary/10 text-secondary flex items-center justify-center">
          <svg class="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </span>
      </div>
      <div class="bg-card border-l-4 border-s-orange-50 rounded-lg p-4 flex items-center justify-between">
        <div>
          <p class="font-semibold text-slate-900">Super Administrateur</p>
          <p class="text-sm text-ink-light">{{ nbPermissions.super_administrateur }} permissions accordées</p>
        </div>
        <span class="w-9 h-9 rounded-full bg-warning/10 text-warning flex items-center justify-center">
          <svg class="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        </span>
      </div>
    </div>
  </div>
</template>