<script setup lang="ts">
import { useApi } from '~/Composables/useApi'
import { useFormErrors } from '~/Composables/useFormErrors'
import { useConfirmation } from '../../Composables/useConfirmation'
import { useAlerte } from '~/Composables/useAlerte'

definePageMeta({ layout: 'dashboard', middleware: 'role', roles: ['administrateur', 'super_administrateur'] })

const { apiFetch } = useApi()
const { demander } = useConfirmation()
const { alerter } = useAlerte()

const erreurSuppression = ref('')

interface Promotion {
  id: string
  libelle: string
  annee_debut: number | null
  annee_fin: number | null
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

const estMonte = ref(false)
onMounted(() => {
  requestAnimationFrame(() => { estMonte.value = true })
})

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

function periodeAffichee(p: Promotion) {
  if (!p.annee_debut || !p.annee_fin) return '—'
  return `${p.annee_debut} - ${p.annee_fin}`
}

// --- Modale création/édition ---
const modaleOuverte = ref(false)
const promotionEnEdition = ref<Promotion | null>(null)
const libelle = ref('')
const anneeDebut = ref('')
const anneeFin = ref('')
const idNiveau = ref('')
const optionsNiveaux = computed(
  () => data.value?.niveaux.map((n: { id_niveau: string; libelle: string }) => ({ value: n.id_niveau, label: n.libelle })) ?? []
)

// Liste déroulante d'années : de 3 ans avant l'année en cours à 6 ans après,
// largement suffisant pour couvrir les promotions passées et à venir.
const anneeCourante = new Date().getFullYear()
const optionsAnnees = Array.from({ length: 10 }, (_, i) => {
  const annee = anneeCourante - 3 + i
  return { value: String(annee), label: String(annee) }
})

const { erreurGenerale, traiter, reinitialiser, champ } = useFormErrors()
const chargement = ref(false)

function ouvrirCreation() {
  promotionEnEdition.value = null
  libelle.value = ''
  anneeDebut.value = ''
  anneeFin.value = ''
  idNiveau.value = ''
  reinitialiser()
  modaleOuverte.value = true
}

function ouvrirEdition(p: Promotion) {
  promotionEnEdition.value = p
  libelle.value = p.libelle
  anneeDebut.value = p.annee_debut ? String(p.annee_debut) : ''
  anneeFin.value = p.annee_fin ? String(p.annee_fin) : ''
  idNiveau.value = p.id_niveau
  reinitialiser()
  modaleOuverte.value = true
}

// Suggère automatiquement l'année de fin à +3 ans quand l'année de début
// change, pour éviter à l'utilisateur de devoir calculer lui-même l'échéance.
function surChangementAnneeDebut(valeur: string) {
  anneeDebut.value = valeur
  if (!valeur) return
  anneeFin.value = String(Number(valeur) + 3)
}

// Le libellé est entièrement déduit des deux années choisies (ex: "2025-2028")
// — plus besoin de le saisir manuellement.
watch([anneeDebut, anneeFin], ([debut, fin]) => {
  libelle.value = debut && fin ? `Promotion ${debut}-${fin}` : ''
})

async function enregistrer() {
  reinitialiser()

  // Contrôle immédiat côté client, avant même d'appeler l'API : une
  // promotion doit durer exactement 3 ans. On alerte tout de suite plutôt
  // que d'attendre l'aller-retour serveur.
  if (anneeDebut.value && anneeFin.value) {
    const debut = Number(anneeDebut.value)
    const fin = Number(anneeFin.value)

    if (fin <= debut) {
      await alerter({
        titre: 'Années invalides',
        message: "L'année de fin doit être postérieure à l'année de début.",
      })
      return
    }

    if (fin - debut !== 3) {
      await alerter({
        titre: 'Durée de promotion invalide',
        message: `Une promotion doit durer exactement 3 ans. D'après l'année de début choisie (${debut}), l'année de fin devrait être ${debut + 3}.`,
      })
      return
    }
  }

  chargement.value = true

  try {
    const body = {
      libelle: libelle.value,
      annee_debut: anneeDebut.value ? Number(anneeDebut.value) : null,
      annee_fin: anneeFin.value ? Number(anneeFin.value) : null,
      id_niveau: idNiveau.value,
    }

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
    <div class="flex items-start justify-between mb-6 opacity-0" :class="estMonte ? 'animate-entree' : ''">
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
        class="inline-flex items-center gap-2 bg-secondary hover:bg-primary text-white text-sm font-medium px-4 py-2.5 rounded-lg transition active:scale-95 shrink-0"
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Nouvelle promotion
      </button>
    </div>

    <div class="relative mb-6 max-w-sm opacity-0" :class="estMonte ? 'animate-entree' : ''" style="animation-delay: 80ms">
      <svg class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
      </svg>
      <input
        v-model="recherche"
        type="text"
        placeholder="Rechercher par nom, niveau ou libellé..."
        class="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary transition-shadow"
      />
    </div>

    <TransitionGroup tag="div" name="groupe" class="space-y-6">
      <div v-for="(promos, niveau, i) in groupesParNiveau" :key="niveau" class="opacity-0" :class="estMonte ? 'animate-entree' : ''" :style="{ animationDelay: `${140 + i * 80}ms` }">
        <h2 class="text-sm font-semibold text-slate-900 mb-2">
          {{ niveau }} <span class="text-ink-light font-normal">({{ promos.length }})</span>
        </h2>

        <div class="bg-card border border-slate-200 rounded-lg overflow-hidden">
          <table class="w-full text-sm">
            <thead class="bg-slate-50 border-b border-slate-200">
              <tr class="text-left text-xs font-semibold text-ink-light uppercase tracking-wide">
                <th class="px-5 py-3">Promotion</th>
                <th class="px-5 py-3">Période</th>
                <th class="px-5 py-3">Étudiants</th>
                <th class="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <TransitionGroup tag="tbody" name="ligne" class="divide-y divide-slate-100">
              <tr v-for="p in promos" :key="p.id" class="hover:bg-slate-50/60">
                <td class="px-5 py-3 font-medium text-slate-900">{{ p.intitule }}</td>
                <td class="px-5 py-3">
                  <span class="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-secondary/10 text-secondary">
                    {{ periodeAffichee(p) }}
                  </span>
                </td>
                <td class="px-5 py-3 text-ink-light">{{ p.nb_etudiants }}</td>
                <td class="px-5 py-3">
                  <div class="flex items-center justify-end gap-2">
                    <button type="button" class="p-1.5 text-ink-light hover:text-secondary hover:scale-110 active:scale-95 transition" @click="ouvrirEdition(p)">
                      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button type="button" class="p-1.5 text-ink-light hover:text-danger hover:scale-110 active:scale-95 transition" @click="supprimer(p)">
                      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            </TransitionGroup>
          </table>
        </div>
      </div>

      <p v-if="!promotionsFiltrees.length" class="text-sm text-ink-light text-center py-10">
        Aucune promotion trouvée.
      </p>
    </TransitionGroup>

    <!-- Modale -->
    <Transition name="modale-fondu">
      <div v-if="modaleOuverte" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
        <Transition name="panneau-zoom" appear>
          <div class="w-full max-w-md bg-card rounded-xl shadow-xl">
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
                <SelectPersonnalise
                  v-model="idNiveau"
                  :options="optionsNiveaux"
                  placeholder="Sélectionner un niveau"
                  :erreur="champ('id_niveau')"
                />
                <p v-if="champ('id_niveau')" class="text-xs text-danger mt-1">{{ champ('id_niveau') }}</p>
              </div>

              <div v-if="libelle" class="bg-secondary/5 border border-secondary/20 rounded-lg px-3.5 py-2.5 text-sm text-secondary font-medium">
                Libellé : {{ libelle }}
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1.5">
                    Année de début <span class="text-danger">*</span>
                  </label>
                  <SelectPersonnalise
                    :model-value="anneeDebut"
                    @update:model-value="surChangementAnneeDebut"
                    :options="optionsAnnees"
                    placeholder="Sélectionner"
                    :erreur="champ('annee_debut')"
                  />
                  <p v-if="champ('annee_debut')" class="text-xs text-danger mt-1">{{ champ('annee_debut') }}</p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1.5">
                    Année de fin <span class="text-danger">*</span>
                  </label>
                  <SelectPersonnalise
                    v-model="anneeFin"
                    :options="optionsAnnees"
                    placeholder="Sélectionner"
                    :erreur="champ('annee_fin')"
                  />
                  <p v-if="champ('annee_fin')" class="text-xs text-danger mt-1">{{ champ('annee_fin') }}</p>
                </div>
              </div>
              <p class="text-xs text-ink-light -mt-2">
                Une promotion dure exactement 3 ans — l'année de fin est suggérée automatiquement à partir de l'année de début.
              </p>

              <div class="flex items-center justify-end gap-4 pt-3 border-t border-slate-100">
                <button type="button" @click="modaleOuverte = false" class="text-sm font-medium text-secondary hover:text-primary">
                  Annuler
                </button>
                <button
                  type="submit"
                  :disabled="chargement"
                  class="bg-secondary hover:bg-primary text-white text-sm font-medium px-5 py-2 rounded-lg transition active:scale-95 disabled:opacity-50"
                >
                  {{ chargement ? 'Enregistrement...' : (promotionEnEdition ? 'Enregistrer' : 'Créer') }}
                </button>
              </div>
            </form>
          </div>
        </Transition>
      </div>
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

.groupe-enter-active,
.groupe-leave-active,
.ligne-enter-active,
.ligne-leave-active {
  transition: opacity 0.25s ease;
}
.groupe-enter-from,
.groupe-leave-to,
.ligne-enter-from,
.ligne-leave-to {
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

.panneau-zoom-enter-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.panneau-zoom-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.panneau-zoom-enter-from,
.panneau-zoom-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(6px);
}
</style>