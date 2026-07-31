<script setup lang="ts">
import { useApi } from '../../Composables/useApi'
import { useConfirmation } from '../../Composables/useConfirmation'
import { useRoles } from '../../Composables/useRoles'

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
</script>

<template>
  <div>
    <div class="flex items-start justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">Gestion du jury externe</h1>
        <p class="text-sm text-ink-light mt-1">{{ data?.utilisateurs.length ?? 0 }} membres enregistrés</p>
      </div>
      <button
        type="button"
        @click="ouvrirCreation"
        class="inline-flex items-center gap-2 bg-secondary hover:bg-primary text-white text-sm font-medium px-4 py-2.5 rounded-lg transition shrink-0"
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Ajouter un membre de jury
      </button>
    </div>

    <FormAlerte :message="erreurSuppression" />

    <div class="relative mb-6 max-w-sm">
      <svg class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
      </svg>
      <input
        v-model="recherche"
        type="text"
        placeholder="Rechercher par nom, email ou spécialité..."
        class="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
      />
    </div>

    <div class="bg-card border border-slate-200 rounded-lg overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-slate-50 border-b border-slate-200">
          <tr class="text-left text-xs font-semibold text-ink-light uppercase tracking-wide">
            <th class="px-5 py-3">Membre</th>
            <th class="px-5 py-3">Email</th>
            <th class="px-5 py-3">Spécialité</th>
            <th class="px-5 py-3">Téléphone</th>
            <th class="px-5 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="m in membresFiltres" :key="m.id" class="hover:bg-slate-50/60">
            <td class="px-5 py-3">
              <div class="flex items-center gap-2.5">
                <span class="w-8 h-8 rounded-full bg-warning/10 text-warning text-xs font-semibold flex items-center justify-center shrink-0">
                  {{ initiales(m) }}
                </span>
                <span class="font-medium text-slate-900">{{ m.prenom }} {{ m.nom }}</span>
              </div>
            </td>
            <td class="px-5 py-3 text-secondary">{{ m.email }}</td>
            <td class="px-5 py-3">
              <span v-if="m.specialite" class="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-warning/10 text-warning">
                {{ m.specialite }}
              </span>
              <span v-else class="text-ink-light">—</span>
            </td>
            <td class="px-5 py-3 text-ink-light">{{ m.contacts ?? '—' }}</td>
            <td class="px-5 py-3">
              <div class="flex items-center justify-end gap-2">
                <button type="button" class="p-1.5 text-ink-light hover:text-secondary transition" @click="ouvrirEdition(m)">
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button type="button" class="p-1.5 text-ink-light hover:text-danger transition" @click="supprimer(m)">
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </td>
          </tr>

          <tr v-if="!membresFiltres.length">
            <td colspan="5" class="px-5 py-10 text-center text-ink-light text-sm">Aucun membre trouvé.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <ModaleUtilisateur
      v-if="modaleOuverte"
      type="jury_externe"
      :utilisateur="membreEnEdition"
      :id-role="rolesMap?.jury_externe ?? ''"
      :specialites="optionsSpecialites"
      @close="fermerModale"
      @saved="refresh"
    />
  </div>
</template>