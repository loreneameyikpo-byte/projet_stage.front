<script setup lang="ts">
import { useApi } from '~/Composables/useApi'
import { useFormErrors } from '~/Composables/useFormErrors'
import { useConfirmation } from '~/Composables/useConfirmation'

definePageMeta({ layout: 'dashboard', middleware: 'role', roles: ['encadreur'] })

const route = useRoute()
const { apiFetch } = useApi()

const { data: stats } = await useAsyncData('encadreur-evaluation-detail', () => apiFetch<{
  presentations: { id_jury: string; projet_titre: string; etudiant: string; date_presentation: string; heure_presentation: string; salle: string; role_jury: string; note_saisie: number | null }[]
}>('/stats-jury/dashboard'))

const evaluation = computed(() => stats.value?.presentations.find((p) => p.id_jury === route.params.id))

const { erreurGenerale, traiter, reinitialiser } = useFormErrors()
const { demander } = useConfirmation()
const note = ref<number | ''>(evaluation.value?.note_saisie ?? '')
const chargement = ref(false)
const succes = ref('')

async function enregistrerNote() {
  reinitialiser()
  succes.value = ''
  chargement.value = true

  try {
    await apiFetch(`/jury/${route.params.id}/note`, { method: 'POST', body: { note: note.value } })
    succes.value = 'Note enregistrée avec succès.'
  } catch (e: any) {
    traiter(e)
  } finally {
    chargement.value = false
  }
}

async function annuler() {
  const confirme = await demander({
    titre: 'Annuler la saisie',
    message: 'Voulez-vous vraiment annuler ? La note que vous avez tapée sera effacée et non enregistrée.',
    texteConfirmer: 'Annuler la saisie',
    dangereux: true,
  })
  if (!confirme) return

  note.value = evaluation.value?.note_saisie ?? ''
  erreurGenerale.value = ''
  succes.value = ''
}

function labelRole(role: string) {
  return { president: 'Président', rapporteur: 'Rapporteur', membre: 'Membre' }[role] ?? role
}
</script>

<template>
  <div v-if="evaluation" class="max-w-lg">
    <NuxtLink to="/encadreur/evaluations" class="inline-flex items-center gap-1.5 text-sm text-secondary hover:text-primary mb-4">
      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
      Retour
    </NuxtLink>

    <div class="bg-card border border-slate-200 rounded-lg p-6 mb-6">
      <p class="font-semibold text-slate-900 mb-1">{{ evaluation.projet_titre }}</p>
      <p class="text-sm text-ink-light mb-4">{{ evaluation.etudiant }}</p>

      <div class="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p class="text-xs text-secondary mb-0.5">Date et heure</p>
          <p class="text-slate-900">{{ evaluation.date_presentation }} à {{ evaluation.heure_presentation }}</p>
        </div>
        <div>
          <p class="text-xs text-secondary mb-0.5">Salle</p>
          <p class="text-slate-900">{{ evaluation.salle }}</p>
        </div>
        <div>
          <p class="text-xs text-secondary mb-0.5">Votre rôle dans ce jury</p>
          <span class="inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium bg-secondary/10 text-secondary">{{ labelRole(evaluation.role_jury) }}</span>
        </div>
      </div>
    </div>

    <div class="bg-card border border-slate-200 rounded-lg p-6">
      <h2 class="font-semibold text-slate-900 mb-4">Saisir la note</h2>

      <p class="text-xs text-ink-light mb-3">
        Votre note sera moyennée avec celles des autres membres du jury dès que tous auront saisi leur note.
      </p>

      <form @submit.prevent="enregistrerNote" class="space-y-4">
        <FormAlerte :message="erreurGenerale" />
        <p v-if="succes" class="text-sm text-accent">{{ succes }}</p>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">Note (/20)</label>
          <input
            v-model.number="note"
            type="number"
            min="0"
            max="20"
            step="0.5"
            required
            class="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-secondary"
          />
        </div>

        <div class="flex items-center gap-3">
          <button
            type="submit"
            :disabled="chargement"
            class="flex-1 bg-secondary hover:bg-primary text-white text-sm font-medium py-2.5 rounded-lg transition disabled:opacity-50"
          >
            {{ chargement ? 'Enregistrement...' : evaluation.note_saisie !== null ? 'Modifier la note' : 'Enregistrer la note' }}
          </button>
          <button
            type="button"
            @click="annuler"
            class="text-sm font-medium text-ink-light hover:text-slate-700 transition-colors px-3"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  </div>

  <div v-else class="text-sm text-ink-light">Évaluation introuvable.</div>
</template>