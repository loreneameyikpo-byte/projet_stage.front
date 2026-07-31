<script setup lang="ts">
import { useApi } from '~/Composables/useApi'
import { useFormErrors } from '~/Composables/useFormErrors'
import { useConfirmation } from '../../Composables/useConfirmation'

definePageMeta({ layout: 'dashboard', middleware: 'role', roles: ['administrateur', 'super_administrateur'] })

const { apiFetch } = useApi()
const { demander } = useConfirmation()

const erreurSuppression = ref('')

interface Promotion {
  id: string
  annee: string
  niveau: string
  id_niveau: string
  intitule: string
  nb_etudiants: number
}
interface Niveau { id_niveau: string; libelle: string }

const { data, refresh } = await useAsyncData('promotions', () =>
  apiFetch<{ promotions: Promotion[]; niveaux: Niveau[] }>('/promotions')
)

const recherche = ref('')

const promotionsFiltrees = computed(() => {
  if (!data.value) return []
  const terme = recherche.value.toLowerCase()
  return data.value.promotions.filter(
    (p) => p.intitule.toLowerCase().includes(terme) || p.niveau.toLowerCase().includes(terme)
  )
})

const groupesParNiveau = computed(() => {
  const groupes: Record<string, Promotion[]> = {}
  for (const p of promotionsFiltrees.value) {
    ;(groupes[p.niveau] ??= []).push(p)
  }
  return groupes
})

// --- Modale création/édition ---
const modaleOuverte = ref(false)
const promotionEnEdition = ref<Promotion | null>(null)
const intitule = ref('')
const annee = ref('')
const idNiveau = ref('')
const { erreurGenerale, traiter, reinitialiser, champ } = useFormErrors()
const chargement = ref(false)

function ouvrirCreation() {
  promotionEnEdition.value = null
  intitule.value = ''
  annee.value = ''
  idNiveau.value = ''
  reinitialiser()
  modaleOuverte.value = true
}

function ouvrirEdition(p: Promotion) {
  promotionEnEdition.value = p
  intitule.value = p.intitule
  annee.value = p.annee
  idNiveau.value = p.id_niveau
  reinitialiser()
  modaleOuverte.value = true
}

async function enregistrer() {
  reinitialiser()
  chargement.value = true

  try {
    const body = { annee: annee.value, id_niveau: idNiveau.value }

    if (promotionEnEdition.value) {
      await apiFetch(`/promotions/${promotionEnEdition.value.id}`, { method: 'PUT', body })
    } else {
      await apiFetch('/promotions', { method: 'POST', body })
    }

    modaleOuverte.value = false
    await refresh()
  } catch (e: any) {
    traiter(e)
  } finally {
    chargement.value = false
  }
}

async function supprimer(p: Promotion) {
  const confirme = await demander({
    titre: 'Supprimer cette promotion',
    message: `Supprimer "${p.intitule}" ? Cette action est irréversible.`,
    texteConfirmer: 'Supprimer',
    dangereux: true,
  })
  if (!confirme) return
  erreurSuppression.value = ''
  try {
    await apiFetch(`/promotions/${p.id}`, { method: 'DELETE' })
    await refresh()
  } catch (e: any) {
    erreurSuppression.value = 'Impossible de supprimer cette promotion, elle est utilisée par un ou plusieurs étudiants.'
    return
  }
}
</script>

<template>
  <div>
    <div class="flex items-start justify-between mb-6">
      <div>
        <FormAlerte :message="erreurSuppression"  class="mb-4"/>
        <div>
            <h1 class="text-2xl font-bold text-slate-900">Gestion des promotions</h1>
             <p class="text-sm text-ink-light mt-1">{{ data?.promotions.length ?? 0 }} promotions enregistrées</p>
        </div>
      </div>
      <button
        type="button"
        @click="ouvrirCreation"
        class="inline-flex items-center gap-2 bg-secondary hover:bg-primary text-white text-sm font-medium px-4 py-2.5 rounded-lg transition shrink-0"
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Nouvelle promotion
      </button>
    </div>

    <div class="relative mb-6 max-w-sm">
      <svg class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
      </svg>
      <input
        v-model="recherche"
        type="text"
        placeholder="Rechercher par nom, niveau ou année..."
        class="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
      />
    </div>

    <div class="space-y-6">
      <div v-for="(promos, niveau) in groupesParNiveau" :key="niveau">
        <h2 class="text-sm font-semibold text-slate-900 mb-2">
          {{ niveau }} <span class="text-ink-light font-normal">({{ promos.length }})</span>
        </h2>

        <div class="bg-card border border-slate-200 rounded-lg overflow-hidden">
          <table class="w-full text-sm">
            <thead class="bg-slate-50 border-b border-slate-200">
              <tr class="text-left text-xs font-semibold text-ink-light uppercase tracking-wide">
                <th class="px-5 py-3">Promotion</th>
                <th class="px-5 py-3">Année</th>
                <th class="px-5 py-3">Étudiants</th>
                <th class="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="p in promos" :key="p.id" class="hover:bg-slate-50/60">
                <td class="px-5 py-3 font-medium text-slate-900">{{ p.intitule }}</td>
                <td class="px-5 py-3">
                  <span class="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-secondary/10 text-secondary">
                    {{ p.annee }}
                  </span>
                </td>
                <td class="px-5 py-3 text-ink-light">{{ p.nb_etudiants }}</td>
                <td class="px-5 py-3">
                  <div class="flex items-center justify-end gap-2">
                    <button type="button" class="p-1.5 text-ink-light hover:text-secondary transition" @click="ouvrirEdition(p)">
                      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button type="button" class="p-1.5 text-ink-light hover:text-danger transition" @click="supprimer(p)">
                      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <p v-if="!promotionsFiltrees.length" class="text-sm text-ink-light text-center py-10">
        Aucune promotion trouvée.
      </p>
    </div>

    <!-- Modale -->
    <div v-if="modaleOuverte" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div class="w-full max-w-md bg-white rounded-xl shadow-xl">
        <div class="px-6 pt-6 pb-2">
          <h2 class="text-lg font-bold text-slate-900">
            {{ promotionEnEdition ? 'Modifier la promotion' : 'Nouvelle promotion' }}
          </h2>
        </div>

        <form @submit.prevent="enregistrer" class="px-6 py-4 space-y-4">
          <FormAlerte :message="erreurGenerale" />

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">
              Niveau <span class="text-danger">*</span>
            </label>
            <select
              v-model="idNiveau"
              required
              class="w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2"
              :class="champ('id_niveau') ? 'border-danger focus:ring-danger/40' : 'border-slate-300 focus:ring-secondary'"
            >
              <option value="" disabled>Sélectionner un niveau</option>
              <option v-for="n in data?.niveaux" :key="n.id_niveau" :value="n.id_niveau">{{ n.libelle }}</option>
            </select>
            <p v-if="champ('id_niveau')" class="text-xs text-danger mt-1">{{ champ('id_niveau') }}</p>
          </div>

          <FormInput v-model="annee" label="Année académique" placeholder="2025-2026" :erreur="champ('annee')" requis />

          <div class="flex items-center justify-end gap-4 pt-3 border-t border-slate-100">
            <button type="button" @click="modaleOuverte = false" class="text-sm font-medium text-secondary hover:text-primary">
              Annuler
            </button>
            <button
              type="submit"
              :disabled="chargement"
              class="bg-secondary hover:bg-primary text-white text-sm font-medium px-5 py-2 rounded-lg transition disabled:opacity-50"
            >
              {{ chargement ? 'Enregistrement...' : 'Créer' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>