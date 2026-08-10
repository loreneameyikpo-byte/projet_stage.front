<script setup lang="ts">
import { useApi } from '../Composables/useApi'
import { useFormErrors } from '../Composables/useFormErrors'


definePageMeta({ layout: 'dashboard' })
// Pas de restriction de rôle : accessible à tout utilisateur connecté

const { apiFetch } = useApi()
const authStore = useAuthStore()

const onglet = ref<'infos' | 'mot_de_passe'>('infos')

const libelleRole: Record<string, string> = {
  etudiant: 'Étudiant',
  encadreur: 'Encadreur',
  administrateur: 'Administrateur',
  super_administrateur: 'Super Administrateur',
  jury_externe: 'Membre de jury',
}

function initiales() {
  const u = authStore.utilisateur
  if (!u) return ''
  return `${u.prenom.charAt(0)}${u.nom.charAt(0)}`.toUpperCase()
}

// --- Informations personnelles ---
const { erreurGenerale: erreurInfos, traiter: traiterInfos, reinitialiser: reinitialiserInfos, champ: champInfos } = useFormErrors()

const prenom = ref(authStore.utilisateur?.prenom ?? '')
const nom = ref(authStore.utilisateur?.nom ?? '')
const email = ref(authStore.utilisateur?.email ?? '')
const contacts = ref('')
const chargementInfos = ref(false)
const succesInfos = ref('')

async function enregistrerInfos() {
  reinitialiserInfos()
  succesInfos.value = ''
  chargementInfos.value = true

  try {
    await apiFetch('/me', {
      method: 'PUT',
      body: { nom: nom.value, prenom: prenom.value, email: email.value, contacts: contacts.value || null },
    })
    await authStore.fetchMe()
    succesInfos.value = 'Informations mises à jour avec succès.'
  } catch (e: any) {
    traiterInfos(e)
  } finally {
    chargementInfos.value = false
  }
}

// --- Mot de passe ---
const { erreurGenerale: erreurMdp, traiter: traiterMdp, reinitialiser: reinitialiserMdp, champ: champMdp } = useFormErrors()

const mdpActuel = ref('')
const nouveauMdp = ref('')
const confirmationMdp = ref('')
const chargementMdp = ref(false)
const succesMdp = ref('')

async function changerMotDePasse() {
  reinitialiserMdp()
  succesMdp.value = ''
  chargementMdp.value = true

  try {
    await apiFetch('/me/mot-de-passe', {
      method: 'PUT',
      body: {
        mot_de_passe_actuel: mdpActuel.value,
        mot_de_passe: nouveauMdp.value,
        mot_de_passe_confirmation: confirmationMdp.value,
      },
    })
    succesMdp.value = 'Mot de passe modifié avec succès.'
    mdpActuel.value = ''
    nouveauMdp.value = ''
    confirmationMdp.value = ''
  } catch (e: any) {
    traiterMdp(e)
  } finally {
    chargementMdp.value = false
  }
}
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold text-slate-900">Profil</h1>
    <p class="text-sm text-ink-light mt-1 mb-6">Gérez vos informations personnelles et votre mot de passe</p>

    <!-- Carte identité -->
    <div class="bg-card border border-slate-200 rounded-lg p-6 flex items-center gap-4 mb-6">
      <span class="w-14 h-14 rounded-lg bg-secondary/10 text-secondary text-lg font-semibold flex items-center justify-center shrink-0">
        {{ initiales() }}
      </span>
      <div>
        <p class="font-semibold text-slate-900">{{ authStore.utilisateur?.prenom }} {{ authStore.utilisateur?.nom }}</p>
        <p class="text-sm text-secondary">{{ authStore.utilisateur?.email }}</p>
        <span class="inline-flex mt-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary/10 text-secondary">
          {{ libelleRole[authStore.role ?? ''] }}
        </span>
      </div>
    </div>

    <!-- Onglets -->
    <div class="inline-flex bg-slate-100 rounded-lg p-1 mb-6">
      <button
        type="button"
        @click="onglet = 'infos'"
        class="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition"
        :class="onglet === 'infos' ? 'bg-card text-slate-900 shadow-sm' : 'text-ink-light'"
      >
        <BaseIcon name="User" size="16" stroke-width="2" class="w-4 h-4" />
        Informations personnelles
      </button>
      <button
        type="button"
        @click="onglet = 'mot_de_passe'"
        class="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition"
        :class="onglet === 'mot_de_passe' ? 'bg-card text-slate-900 shadow-sm' : 'text-ink-light'"
      >
        <BaseIcon name="Lock" size="16" stroke-width="2" class="w-4 h-4" />
        Mot de passe
      </button>
    </div>

    <!-- Informations personnelles -->
    <div v-if="onglet === 'infos'" class="bg-card border border-slate-200 rounded-lg p-6 max-w-2xl">
      <h2 class="font-semibold text-slate-900 mb-4">Informations personnelles</h2>

      <div v-if="authStore.role === 'etudiant'" class="bg-slate-50 rounded-lg p-4">
  <p class="text-xs text-secondary uppercase font-semibold mb-3">Informations académiques</p>
  <div class="grid grid-cols-2 gap-4 text-sm mb-2">
    <div>
      <p class="text-xs text-ink-light">Promotion</p>
      <p class="font-medium text-slate-900">{{ authStore.utilisateur?.promotion?.intitule ?? '—' }}</p>
    </div>
    <div>
      <p class="text-xs text-ink-light">Filière</p>
      <p class="font-medium text-slate-900">{{ authStore.utilisateur?.filiere ?? '—' }}</p>
    </div>
  </div>
  <p class="text-xs text-ink-light">
    Ces informations sont gérées par l'administration. Contactez votre administrateur pour toute modification.
  </p>
</div>

      <form @submit.prevent="enregistrerInfos" class="space-y-4">
        <FormAlerte :message="erreurInfos" />
        <p v-if="succesInfos" class="text-sm text-accent">{{ succesInfos }}</p>

        <div class="grid grid-cols-2 gap-4">
          <FormInput v-model="prenom" label="Prénom" :erreur="champInfos('prenom')" requis />
          <FormInput v-model="nom" label="Nom" :erreur="champInfos('nom')" requis />
        </div>

        <FormInput v-model="email" label="Email" type="email" :erreur="champInfos('email')" requis />
        <FormPhoneInput v-model="contacts" label="Téléphone" :erreur="champInfos('contacts')" />

        <button
          type="submit"
          :disabled="chargementInfos"
          class="inline-flex items-center gap-2 bg-secondary hover:bg-primary text-white text-sm font-medium px-5 py-2.5 rounded-lg transition disabled:opacity-50"
        >
          {{ chargementInfos ? 'Enregistrement...' : 'Enregistrer les modifications' }}
        </button>
      </form>
    </div>

    <!-- Mot de passe -->
    <div v-else class="bg-card border border-slate-200 rounded-lg p-6 max-w-2xl">
      <h2 class="font-semibold text-slate-900 mb-4">Changer le mot de passe</h2>

      <form @submit.prevent="changerMotDePasse" class="space-y-4">
        <FormAlerte :message="erreurMdp" />
        <p v-if="succesMdp" class="text-sm text-accent">{{ succesMdp }}</p>

        <FormInput v-model="mdpActuel" label="Mot de passe actuel" type="password" :erreur="champMdp('mot_de_passe_actuel')" requis />
        <FormInput v-model="nouveauMdp" label="Nouveau mot de passe" type="password" :erreur="champMdp('mot_de_passe')" requis />
        <FormInput v-model="confirmationMdp" label="Confirmer le mot de passe" type="password" :erreur="champMdp('mot_de_passe_confirmation')" requis />

        <button
          type="submit"
          :disabled="chargementMdp"
          class="inline-flex items-center gap-2 bg-secondary hover:bg-primary text-white text-sm font-medium px-5 py-2.5 rounded-lg transition disabled:opacity-50"
        >
          {{ chargementMdp ? 'Mise à jour...' : 'Mettre à jour le mot de passe' }}
        </button>
      </form>
    </div>
  </div>
</template>