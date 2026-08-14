<script setup lang="ts">
interface Administrateur {
  id: string
  nom: string
  prenom: string
  email: string
  contacts: string | null
}

const props = defineProps<{
  administrateur?: Administrateur | null
}>()

const emit = defineEmits<{ close: []; saved: [] }>()

import { useApi } from '~/Composables/useApi'
import { useFormErrors } from '~/Composables/useFormErrors'

const { apiFetch } = useApi()
const {erreurs, champ, reinitialiser, traiter, erreurGenerale } = useFormErrors()

const estEdition = computed(() => !!props.administrateur)

const prenom = ref(props.administrateur?.prenom ?? '')
const nom = ref(props.administrateur?.nom ?? '')
const email = ref(props.administrateur?.email ?? '')
const contacts = ref(props.administrateur?.contacts ?? '')
const erreur = ref('')
const chargement = ref(false)
//const motDePasseGenere = ref('')
const creationReussie = ref(false)
async function enregistrer() {
  erreur.value = ''
  chargement.value = true

  try {
    if (estEdition.value && props.administrateur) {
      await apiFetch(`/administrateurs/${props.administrateur.id}`, {
        method: 'PUT',
        body: {
          prenom: prenom.value,
          nom: nom.value,
          email: email.value,
          contacts: contacts.value || null,
        },
      })
      emit('saved')
      emit('close')
    } else {
      const data = await apiFetch<{ mot_de_passe_temporaire: string }>('/administrateurs', {
        method: 'POST',
        body: {
          prenom: prenom.value,
          nom: nom.value,
          email: email.value,
          contacts: contacts.value || null,
        },
      })

      //motDePasseGenere.value = data.mot_de_passe_temporaire
      creationReussie.value = true
      emit('saved')
    }
  } catch (e: any) {
    const errData = e?.data
    const firstErr = errData?.errors ? (Object.values(errData.errors)[0] as any) : undefined
    erreur.value = errData?.message || (Array.isArray(firstErr) ? firstErr[0] : (typeof firstErr === 'string' ? firstErr : undefined)) || 'Une erreur est survenue.'
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
            {{ estEdition ? 'Modifier l\'administrateur' : 'Nouvel administrateur' }}
          </h2>
        </div>

        <form @submit.prevent="enregistrer" class="px-6 py-4 space-y-4">
          <FormAlerte :message="erreurGenerale"/>
          <div class="grid grid-cols-2 gap-4">
            
              <FormInput v-model="prenom" label="Prénom" :erreur="champ('prenom')" requis />
              <FormInput v-model="nom" label="Nom" :erreur="champ('nom')" requis />
             <!--<label class="block text-sm font-medium text-secondary mb-1.5">Prénom</label>
              <input v-model="prenom" type="text" required class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary" />
            </div>
            <div>
              <label class="block text-sm font-medium text-secondary mb-1.5">Nom</label>
              <input v-model="nom" type="text" required class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary" />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-secondary mb-1.5">Email</label>
            <input v-model="email" type="email" required class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary" />
          </div>

          <div>
            <label class="block text-sm font-medium text-secondary mb-1.5">Téléphone</label>
            <input v-model="contacts" type="text" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary" />
          </div>

          <p v-if="erreur" class="text-sm text-danger">{{ erreur }}</p>-->
          </div>

          <FormInput v-model="email" label="Email" type="email" :erreur="champ('email')" requis />

          <FormPhoneInput v-model="contacts" label="Téléphone" :erreur="champ('contacts')" />
          <div class="flex items-center justify-end gap-4 pt-3 border-t border-slate-100">
            <button type="button" @click="emit('close')" class="text-sm font-medium text-secondary hover:text-primary">
              Annuler
            </button>
            <button
              type="submit"
              :disabled="chargement"
              class="bg-secondary hover:bg-primary text-white text-sm font-medium px-5 py-2 rounded-lg transition disabled:opacity-50"
            >
              {{ chargement ? 'Enregistrement...' : estEdition ? 'Enregistrer' : 'Créer' }}
            </button>
          </div>
        </form>
      </div>

      <!-- Confirmation avec mot de passe temporaire (création uniquement) 
      <div v-else class="p-6 text-center">
        <span class="inline-flex w-12 h-12 rounded-full bg-accent/10 text-accent items-center justify-center mb-4">
          <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </span>
        <h2 class="text-lg font-bold text-slate-900 mb-2">Administrateur créé</h2>
        <p class="text-sm text-ink-light mb-4">Mot de passe temporaire à transmettre manuellement :</p>
        <p class="font-mono text-sm bg-slate-100 rounded-lg py-2.5 px-4 mb-6 select-all">{{ motDePasseGenere }}</p>
        <button
          type="button"
          @click="emit('close')"
          class="w-full bg-secondary hover:bg-primary text-white text-sm font-medium py-2.5 rounded-lg transition"
        >
          Fermer
        </button>
      </div>-->
      <!-- Confirmation (création uniquement) -->
      <div v-else class="p-6 text-center">
        <span class="inline-flex w-12 h-12 rounded-full bg-accent/10 text-accent items-center justify-center mb-4">
          <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </span>
        <h2 class="text-lg font-bold text-slate-900 mb-2">Administrateur créé</h2>
        <p class="text-sm text-ink-light mb-6">
          Ses identifiants de connexion, avec un mot de passe temporaire, lui ont été envoyés par email.
        </p>
        <button
          type="button"
          @click="emit('close')"
          class="w-full bg-secondary hover:bg-primary text-white text-sm font-medium py-2.5 rounded-lg transition"
        >
          Fermer
        </button>
      </div>
    </div>
  </div>
</template>