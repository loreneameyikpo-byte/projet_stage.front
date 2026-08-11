<script setup lang="ts">
interface Utilisateur {
  id: string
  nom: string
  prenom: string
  email: string
  contacts: string | null
  promotion?: { id: string } | null
  specialite?: string | null
}

const props = defineProps<{
  type: 'etudiant' | 'encadreur' | 'jury_externe'
  utilisateur?: Utilisateur | null
  idRole: string
  promotions?: { value: string; label: string }[]
  specialites: { value: string; label: string }[]
  filieres?: { value: string; label: string }[]
}>()

const emit = defineEmits<{ close: []; saved: [] }>()

import { useApi } from '../Composables/useApi'
import { useFormErrors } from '../Composables/useFormErrors'

const { apiFetch } = useApi()
const { erreurGenerale, traiter, reinitialiser, champ } = useFormErrors()

const estEdition = computed(() => !!props.utilisateur)

const titres: Record<string, string> = {
  etudiant: 'étudiant',
  encadreur: 'encadreur',
  jury_externe: 'membre de jury',
}

const prenom = ref(props.utilisateur?.prenom ?? '')
const nom = ref(props.utilisateur?.nom ?? '')
const email = ref(props.utilisateur?.email ?? '')
const contacts = ref(props.utilisateur?.contacts ?? '')
const idPromotion = ref(props.utilisateur?.promotion?.id ?? '')
const idSpecialite = ref('')
const idFiliere = ref((props.utilisateur as any)?.filiere?.id_filiere ?? '')
const chargement = ref(false)
const creationReussie = ref(false)

async function enregistrer() {
  reinitialiser()
  chargement.value = true

  try {
    const body: Record<string, unknown> = {
      prenom: prenom.value,
      nom: nom.value,
      email: email.value,
      contacts: contacts.value || null,
    }
    if (props.type === 'etudiant') body.id_promotion = idPromotion.value
    if (props.type === 'etudiant') body.id_filiere = idFiliere.value
    if (props.type === 'etudiant' || props.type === 'encadreur' || props.type === 'jury_externe') body.id_specialite = idSpecialite.value

    if (estEdition.value && props.utilisateur) {
      await apiFetch(`/utilisateurs/${props.utilisateur.id}`, { method: 'PUT', body })
      emit('saved')
      emit('close')
    } else {
      await apiFetch('/utilisateurs', { method: 'POST', body: { ...body, id_role: props.idRole } })
      creationReussie.value = true
      emit('saved')
    }
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
      <div v-if="!creationReussie">
        <div class="px-6 pt-6 pb-2">
          <h2 class="text-lg font-bold text-slate-900">
            {{ estEdition ? `Modifier l'${titres[type]}` : `Nouvel ${titres[type]}` }}
          </h2>
        </div>

        <form @submit.prevent="enregistrer" class="px-6 py-4 space-y-4">
          <FormAlerte :message="erreurGenerale" />

          <div class="grid grid-cols-2 gap-4">
            <FormInput v-model="prenom" label="Prénom" :erreur="champ('prenom')" requis />
            <FormInput v-model="nom" label="Nom" :erreur="champ('nom')" requis />
          </div>

          <FormInput v-model="email" label="Email" type="email" :erreur="champ('email')" requis />
          <FormPhoneInput v-model="contacts" label="Téléphone" :erreur="champ('contacts')" />

          <FormSelect
            v-if="type === 'etudiant'"
            v-model="idPromotion"
            label="Promotion"
            :options="promotions ?? []"
            placeholder="Sélectionner une promotion"
            :erreur="champ('id_promotion')"
            requis
          />

          <FormSelect
            v-if="type === 'etudiant'"
            v-model="idFiliere"
            label="Filière"
            :options="filieres ?? []"
            placeholder="Sélectionner une filière"
            :erreur="champ('id_filiere')"
            requis
          />

          <FormSelect
            v-if="type === 'encadreur'|| type === 'jury_externe'"
            v-model="idSpecialite"
            label="Spécialité"
            :options="specialites"
            placeholder="Sélectionner une spécialité"
            :erreur="champ('id_specialite')"
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
              {{ chargement ? 'Enregistrement...' : estEdition ? "Enregistrer" : `Ajouter un ${titres[type]}` }}
            </button>
          </div>
        </form>
      </div>

      <div v-else class="p-6 text-center">
        <span class="inline-flex w-12 h-12 rounded-full bg-accent/10 text-accent items-center justify-center mb-4">
          <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </span>
        <h2 class="text-lg font-bold text-slate-900 mb-2">Compte créé</h2>
        <p class="text-sm text-ink-light mb-6">Ses identifiants de connexion lui ont été envoyés par email.</p>
        <button type="button" @click="emit('close')" class="w-full bg-secondary hover:bg-primary text-white text-sm font-medium py-2.5 rounded-lg transition">
          Fermer
        </button>
      </div>
    </div>
  </div>
</template>