<script setup lang="ts">
import { useApi } from '../../Composables/useApi'
import { useConfirmation } from '../../Composables/useConfirmation'
import { useRoles } from '../../Composables/useRoles'

definePageMeta({ layout: 'dashboard', middleware: 'role', roles: ['administrateur', 'super_administrateur'] })

const { apiFetch } = useApi()
const { demander } = useConfirmation()

interface Etudiant {
  id: string
  nom: string
  prenom: string
  email: string
  contacts: string | null
  promotion?: { id: string; intitule: string } | null
  specialite: string | null
}

const { data: rolesMap } = await useRoles()
const { data, refresh } = await useAsyncData<{ utilisateurs: Etudiant[] }>('etudiants', () =>
  apiFetch('/utilisateurs?role=etudiant')
)
const { data: promotionsData } = await useAsyncData<{ promotions: { id: string; intitule: string }[] }>('promotions-select', () =>
  apiFetch('/promotions')
)
const { data: specialitesData } = await useAsyncData<{ specialites: { id_specialite: string; libelle: string }[] }>('specialites-select', () =>
  apiFetch('/specialites')
)

const optionsPromotions = computed(
  () => promotionsData.value?.promotions.map((p) => ({ value: p.id, label: p.intitule })) ?? []
)
const optionsSpecialites = computed(
  () => specialitesData.value?.specialites.map((s) => ({ value: s.id_specialite, label: s.libelle })) ?? []
)

const recherche = ref('')
const promotionFiltre = ref('')
const erreurSuppression = ref('')

const etudiantsFiltres = computed(() => {
  const terme = recherche.value.toLowerCase()
  return (data.value?.utilisateurs ?? []).filter((e) => {
    const correspondTerme = `${e.nom} ${e.prenom} ${e.email}`.toLowerCase().includes(terme)
    const correspondPromo = !promotionFiltre.value || e.promotion?.id === promotionFiltre.value
    return correspondTerme && correspondPromo
  })
})

function initiales(e: Etudiant) {
  return `${e.prenom.charAt(0)}${e.nom.charAt(0)}`.toUpperCase()
}

const modaleOuverte = ref(false)
const etudiantEnEdition = ref<Etudiant | null>(null)

function ouvrirCreation() {
  etudiantEnEdition.value = null
  modaleOuverte.value = true
}
function ouvrirEdition(e: Etudiant) {
  etudiantEnEdition.value = e
  modaleOuverte.value = true
}
function fermerModale() {
  modaleOuverte.value = false
  etudiantEnEdition.value = null
}

async function supprimer(e: Etudiant) {
  const confirme = await demander({
    titre: "Supprimer cet étudiant",
    message: `Supprimer le compte de ${e.prenom} ${e.nom} ? Cette action est irréversible.`,
    texteConfirmer: 'Supprimer',
    dangereux: true,
  })
  if (!confirme) return

  erreurSuppression.value = ''
  try {
    await apiFetch(`/utilisateurs/${e.id}`, { method: 'DELETE' })
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
        <h1 class="text-2xl font-bold text-slate-900">Gestion des étudiants</h1>
        <p class="text-sm text-ink-light mt-1">{{ data?.utilisateurs.length ?? 0 }} étudiants enregistrés</p>
      </div>
      <button
        type="button"
        @click="ouvrirCreation"
        class="inline-flex items-center gap-2 bg-secondary hover:bg-primary text-white text-sm font-medium px-4 py-2.5 rounded-lg transition shrink-0"
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Ajouter un étudiant
      </button>
    </div>

    <FormAlerte :message="erreurSuppression" />

    <div class="flex gap-3 mb-6">
      <div class="relative flex-1 max-w-sm">
        <svg class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
        </svg>
        <input
          v-model="recherche"
          type="text"
          placeholder="Rechercher par nom ou email..."
          class="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
        />
      </div>
      <select
        v-model="promotionFiltre"
        class="px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary bg-white"
      >
        <option value="">Toutes les promotions</option>
        <option v-for="p in promotionsData?.promotions" :key="p.id" :value="p.id">{{ p.intitule }}</option>
      </select>
    </div>

    <div class="bg-card border border-slate-200 rounded-lg overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-slate-50 border-b border-slate-200">
          <tr class="text-left text-xs font-semibold text-ink-light uppercase tracking-wide">
            <th class="px-5 py-3">Étudiant</th>
            <th class="px-5 py-3">Email</th>
            <th class="px-5 py-3">Promotion</th>
            <th class="px-5 py-3">Spécialité</th>
            <th class="px-5 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="e in etudiantsFiltres" :key="e.id" class="hover:bg-slate-50/60">
            <td class="px-5 py-3">
              <div class="flex items-center gap-2.5">
                <span class="w-8 h-8 rounded-full bg-secondary/10 text-secondary text-xs font-semibold flex items-center justify-center shrink-0">
                  {{ initiales(e) }}
                </span>
                <span class="font-medium text-slate-900">{{ e.prenom }} {{ e.nom }}</span>
              </div>
            </td>
            <td class="px-5 py-3 text-secondary">{{ e.email }}</td>
            <td class="px-5 py-3 text-ink-light">{{ e.promotion?.intitule ?? '—' }}</td>
            <td class="px-5 py-3">
              <span v-if="e.specialite" class="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-secondary/10 text-secondary">
                {{ e.specialite }}
              </span>
              <span v-else class="text-ink-light">—</span>
            </td>
            <td class="px-5 py-3">
              <div class="flex items-center justify-end gap-2">
                <button type="button" class="p-1.5 text-ink-light hover:text-secondary transition" @click="ouvrirEdition(e)">
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button type="button" class="p-1.5 text-ink-light hover:text-danger transition" @click="supprimer(e)">
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </td>
          </tr>

          <tr v-if="!etudiantsFiltres.length">
            <td colspan="5" class="px-5 py-10 text-center text-ink-light text-sm">Aucun étudiant trouvé.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <ModaleUtilisateur
      v-if="modaleOuverte"
      type="etudiant"
      :utilisateur="etudiantEnEdition"
      :id-role="rolesMap?.etudiant ?? ''"
      :promotions="optionsPromotions"
      :specialites="optionsSpecialites"
      @close="fermerModale"
      @saved="refresh"
    />
  </div>
</template>