<script setup lang="ts">
import { useApi } from '../Composables/useApi'
import { useFormErrors } from '../Composables/useFormErrors'

interface Projet { id: string; titre: string }
interface Encadreur { id: string; nom: string; prenom: string; specialite: string | null }

const props = defineProps<{ projet: Projet }>()
const emit = defineEmits<{ close: []; saved: [] }>()

const { apiFetch } = useApi()
const { erreurGenerale, traiter, reinitialiser } = useFormErrors()

const { data: encadreursData } = await useAsyncData<{ utilisateurs: Encadreur[] }>('encadreurs-select', () =>
  apiFetch('/utilisateurs?role=encadreur')
)

const idEncadreur = ref('')
const chargement = ref(false)

async function affecter() {
  reinitialiser()
  chargement.value = true

  try {
    await apiFetch(`/projets/${props.projet.id}/affecter-encadreur`, {
      method: 'PUT',
      body: { id_encadreur: idEncadreur.value },
    })
    emit('saved')
    emit('close')
  } catch (e: any) {
    traiter(e)
  } finally {
    chargement.value = false
  }
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
    <div class="w-full max-w-md bg-card rounded-xl shadow-xl">
      <div class="px-6 pt-6 pb-2">
        <h2 class="text-lg font-bold text-slate-900">Affecter un encadreur</h2>
        <p class="text-sm text-ink-light mt-1">{{ projet.titre }}</p>
      </div>

      <form @submit.prevent="affecter" class="px-6 py-4 space-y-4">
        <FormAlerte :message="erreurGenerale" />

        <FormSelect
          v-model="idEncadreur"
          label="Encadreur"
          :options="(encadreursData?.utilisateurs ?? []).map(e => ({ value: e.id, label: `${e.prenom} ${e.nom}${e.specialite ? ' — ' + e.specialite : ''}` }))"
          placeholder="Sélectionner un encadreur"
          requis
        />

        <div class="flex items-center justify-end gap-4 pt-3 border-t border-slate-100">
          <button type="button" @click="emit('close')" class="text-sm font-medium text-secondary hover:text-primary">
            Annuler
          </button>
          <button
            type="submit"
            :disabled="chargement"
            class="bg-secondary hover:bg-primary text-white text-sm font-medium px-5 py-2 rounded-lg transition disabled:opacity-50"
          >
            {{ chargement ? 'Affectation...' : 'Affecter' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>