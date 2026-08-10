<script setup lang="ts">
import { useApi } from '../../Composables/useApi'
import { useFormErrors } from '../../Composables/useFormErrors'
import { useConfirmation } from '../../Composables/useConfirmation'
import { useAlerte } from '~/Composables/useAlerte'

definePageMeta({ layout: 'dashboard', middleware: 'role', roles: ['administrateur', 'super_administrateur'] })

const { apiFetch } = useApi()
const { demander } = useConfirmation()
const { alerter } = useAlerte()
const { erreurGenerale, traiter, reinitialiser, champ } = useFormErrors()

// --- Onglet principal ---
const ongletActif = ref<'planifier' | 'planning'>('planifier')

const estMonte = ref(false)
onMounted(() => {
  requestAnimationFrame(() => { estMonte.value = true })
})

// --- Types ---
interface Projet { id: string; titre: string; etudiant: { prenom: string; nom: string } }
interface Salle { id_salle: string; numero: string; libelle: string | null }
interface MembrePotentiel { id: string; nom: string; prenom: string }
interface MembreJury { id_utilisateur: string; nom: string; prenom: string; role_jury: string; note_saisie: number | null }
interface Presentation {
  id: string
  date_presentation: string
  heure_presentation: string
  note_finale: number | null
  statut: 'planifiee' | 'terminee'
  etudiant: { nom: string; prenom: string }
  projet: { titre: string }
  salle: { id_salle: string; numero: string; libelle: string | null }
  jury: { membres: MembreJury[] }
}

function dateHeureComplete(p: { date_presentation: string; heure_presentation: string }): Date {
  return new Date(`${p.date_presentation}T${p.heure_presentation}`)
}

const soutenancesAVenir = computed(() =>
  [...(data.value?.presentations ?? [])]
    .filter((p) => dateHeureComplete(p) >= new Date())
    .sort((a, b) => dateHeureComplete(a).getTime() - dateHeureComplete(b).getTime())
    .slice(0, 3)
)

// --- Données partagées ---
const { data: projetsData } = await useAsyncData<{ projets: Projet[] }>('projets-valides', async () => {
  const res = await apiFetch<{ projets: (Projet & { statut: string; presentation?: unknown })[] }>('/projets')
  return { projets: res.projets.filter((p) => p.statut === 'valide') }
})
const { data: sallesData } = await useAsyncData<{ salles: Salle[] }>('salles-select', () => apiFetch<{ salles: Salle[] }>('/salles'))

// Encadreurs ET jurys externes peuvent tous deux siéger dans un jury de soutenance
const { data: encadreursData } = await useAsyncData<{ utilisateurs: MembrePotentiel[] }>('encadreurs-select', () =>
  apiFetch<{ utilisateurs: MembrePotentiel[] }>('/utilisateurs?role=encadreur')
)
const { data: juryExterneData } = await useAsyncData<{ utilisateurs: MembrePotentiel[] }>('jury-externe-select', () =>
  apiFetch<{ utilisateurs: MembrePotentiel[] }>('/utilisateurs?role=jury_externe')
)

// Liste combinée utilisée par les 3 sélecteurs de composition du jury
const membresJuryDisponibles = computed(() => [
  ...(encadreursData.value?.utilisateurs ?? []).map((e) => ({
    value: e.id,
    label: `${e.prenom} ${e.nom} — Encadreur`,
  })),
  ...(juryExterneData.value?.utilisateurs ?? []).map((e) => ({
    value: e.id,
    label: `${e.prenom} ${e.nom} — Jury externe`,
  })),
])

const { data, refresh } = await useAsyncData<{ presentations: Presentation[] }>('presentations', () =>
  apiFetch<{ presentations: Presentation[] }>('/presentations')
)

// ==================== ONGLET "PLANIFIER" ====================
const idProjet = ref('')
const date = ref('')
const heure = ref('')
const idSalle = ref('')
const idPresident = ref('')
const idRapporteur = ref('')
const idMembreSupplementaire = ref('')

const projetSelectionne = computed(() => projetsData.value?.projets.find((p) => p.id === idProjet.value))

const disponibiliteVerifiee = ref<{ disponible: boolean; message: string } | null>(null)
const verificationEnCours = ref(false)

async function verifierDisponibilite() {
  if (!date.value || !heure.value || !idSalle.value) return

  const aujourdHui = new Date().toISOString().split('T')[0] ?? ''
  if (date.value < aujourdHui) {
    await alerter({
      titre: 'Date invalide',
      message: 'La date de la soutenance doit être aujourd\'hui ou dans le futur.',
    })
    return
  }

  verificationEnCours.value = true
  disponibiliteVerifiee.value = null

  try {
    disponibiliteVerifiee.value = await apiFetch('/presentations/verifier-disponibilite', {
      method: 'POST',
      body: { date_presentation: date.value, heure_presentation: heure.value, id_salle: idSalle.value },
    })
  } finally {
    verificationEnCours.value = false
  }
}

const chargement = ref(false)
const succes = ref('')

async function planifier() {
  reinitialiser()
  succes.value = ''

  // Vérification des champs requis AVANT toute chose (et avant chargement = true)
  const champsRequis: [string, string][] = [
    [idProjet.value, 'Projet concerné'],
    [date.value, 'Date'],
    [heure.value, 'Heure'],
    [idSalle.value, 'Salle'],
    [idPresident.value, 'Président du jury'],
    [idRapporteur.value, 'Rapporteur'],
  ]

  const champManquant = champsRequis.find(([valeur]) => !valeur)
  if (champManquant) {
    await alerter({
      titre: 'Champ requis',
      message: `Merci de renseigner le champ « ${champManquant[1]} » avant de continuer.`,
    })
    return
  }

  const aujourdHui = new Date().toISOString().split('T')[0] ?? ''
  if (date.value < aujourdHui) {
    await alerter({
      titre: 'Date invalide',
      message: 'La date de la soutenance doit être aujourd\'hui ou dans le futur.',
    })
    return
  }

  chargement.value = true

  const membres = [
    { id_utilisateur: idPresident.value, role_jury: 'president' },
    { id_utilisateur: idRapporteur.value, role_jury: 'rapporteur' },
  ]
  if (idMembreSupplementaire.value) {
    membres.push({ id_utilisateur: idMembreSupplementaire.value, role_jury: 'membre' })
  }

  try {
    await apiFetch('/presentations', {
      method: 'POST',
      body: {
        id_projet: idProjet.value,
        date_presentation: date.value,
        heure_presentation: heure.value,
        id_salle: idSalle.value,
        membres,
      },
    })

    succes.value = 'Soutenance planifiée avec succès.'
    idProjet.value = ''
    date.value = ''
    heure.value = ''
    idSalle.value = ''
    idPresident.value = ''
    idRapporteur.value = ''
    idMembreSupplementaire.value = ''
    disponibiliteVerifiee.value = null

    await refresh()
  } catch (e: any) {
    traiter(e)
  } finally {
    chargement.value = false
  }
}

// ==================== ONGLET "PLANNING" ====================
const filtresStatut = [
  { valeur: 'toutes', label: 'Toutes' },
  { valeur: 'planifiee', label: 'Planifiée' },
  { valeur: 'terminee', label: 'Terminée' },
]
const filtreStatut = ref('toutes')
const vue = ref<'liste' | 'calendrier'>('liste')

const presentationsFiltrees = computed(() => {
  const toutes = [...(data.value?.presentations ?? [])].sort(
    (a, b) => new Date(a.date_presentation).getTime() - new Date(b.date_presentation).getTime()
  )
  if (filtreStatut.value === 'toutes') return toutes
  return toutes.filter((p) => p.statut === filtreStatut.value)
})

const stats = computed(() => {
  const toutes = data.value?.presentations ?? []
  return {
    total: toutes.length,
    a_venir: toutes.filter((p) => p.statut === 'planifiee').length,
    terminees: toutes.filter((p) => p.statut === 'terminee').length,
    notees: toutes.filter((p) => p.note_finale !== null).length,
  }
})

function badgeRole(role: string) {
  return { president: 'bg-secondary/10 text-secondary', rapporteur: 'bg-accent/10 text-accent', membre: 'bg-warning/10 text-warning' }[role] ?? 'bg-slate-100 text-slate-600'
}
function labelRole(role: string) {
  return { president: 'Président', rapporteur: 'Rapporteur', membre: 'Membre' }[role] ?? role
}

const presentationDetail = ref<Presentation | null>(null)

const erreurAction = ref('')
async function annuler(p: Presentation) {
  const confirme = await demander({
    titre: 'Annuler cette soutenance',
    message: `Annuler la soutenance de ${p.etudiant.prenom} ${p.etudiant.nom} ? Le projet repassera au statut "validé".`,
    texteConfirmer: 'Annuler la soutenance',
    dangereux: true,
  })
  if (!confirme) return

  erreurAction.value = ''
  try {
    await apiFetch(`/presentations/${p.id}`, { method: 'DELETE' })
    await refresh()
  } catch (e: any) {
    erreurAction.value = e?.data?.message || 'Une erreur est survenue.'
  }
}

// --- Calendrier ---
const moisAffiche = ref(new Date())
const nomsJours = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM']

const nomMoisAnnee = computed(() =>
  moisAffiche.value.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
)

const joursDuMois = computed(() => {
  const annee = moisAffiche.value.getFullYear()
  const mois = moisAffiche.value.getMonth()
  const premierJour = new Date(annee, mois, 1)
  const dernierJour = new Date(annee, mois + 1, 0)
  const decalage = (premierJour.getDay() + 6) % 7 // lundi = 0

  const jours: (number | null)[] = Array(decalage).fill(null)
  for (let j = 1; j <= dernierJour.getDate(); j++) jours.push(j)
  return jours
})

function presentationsDuJour(jour: number | null) {
  if (!jour) return []
  const annee = moisAffiche.value.getFullYear()
  const mois = String(moisAffiche.value.getMonth() + 1).padStart(2, '0')
  const jourStr = String(jour).padStart(2, '0')
  const dateCible = `${annee}-${mois}-${jourStr}`
  return (data.value?.presentations ?? []).filter((p) => p.date_presentation === dateCible)
}

function moisPrecedent() {
  moisAffiche.value = new Date(moisAffiche.value.getFullYear(), moisAffiche.value.getMonth() - 1, 1)
}
function moisSuivant() {
  moisAffiche.value = new Date(moisAffiche.value.getFullYear(), moisAffiche.value.getMonth() + 1, 1)
}

const modeEdition = ref(false)
const idPresentationEnEdition = ref<string | null>(null)

function ouvrirModification(p: Presentation) {
  modeEdition.value = true
  idPresentationEnEdition.value = p.id
  date.value = p.date_presentation
  heure.value = p.heure_presentation
  idSalle.value = p.salle.id_salle // vérifie que ce champ existe dans PresentationResource, sinon adapte
  idPresident.value = p.jury.membres.find(m => m.role_jury === 'president')?.id_utilisateur ?? ''
  idRapporteur.value = p.jury.membres.find(m => m.role_jury === 'rapporteur')?.id_utilisateur ?? ''
  idMembreSupplementaire.value = p.jury.membres.find(m => m.role_jury === 'membre')?.id_utilisateur ?? ''
  presentationDetail.value = null
  ongletActif.value = 'planifier'
  reinitialiser()
}

async function enregistrerModification() {
  reinitialiser()
  succes.value = ''

  const champsRequis: [string, string][] = [
    [date.value, 'Date'],
    [heure.value, 'Heure'],
    [idSalle.value, 'Salle'],
    [idPresident.value, 'Président du jury'],
    [idRapporteur.value, 'Rapporteur'],
  ]

  const champManquant = champsRequis.find(([valeur]) => !valeur)
  if (champManquant) {
    await alerter({
      titre: 'Champ requis',
      message: `Merci de renseigner le champ « ${champManquant[1]} » avant de continuer.`,
    })
    return
  }

  const aujourdHui = new Date().toISOString().slice(0, 10)
  if (date.value < aujourdHui) {
    await alerter({
      titre: 'Date invalide',
      message: 'La date de la soutenance doit être aujourd\'hui ou dans le futur.',
    })
    return
  }

  chargement.value = true

  const membres = [
    { id_utilisateur: idPresident.value, role_jury: 'president' },
    { id_utilisateur: idRapporteur.value, role_jury: 'rapporteur' },
  ]
  if (idMembreSupplementaire.value) {
    membres.push({ id_utilisateur: idMembreSupplementaire.value, role_jury: 'membre' })
  }

  try {
    await apiFetch(`/presentations/${idPresentationEnEdition.value}`, {
      method: 'PUT',
      body: {
        date_presentation: date.value,
        heure_presentation: heure.value,
        id_salle: idSalle.value,
        membres,
      },
    })

    succes.value = 'Soutenance modifiée avec succès.'
    modeEdition.value = false
    idPresentationEnEdition.value = null
    date.value = ''
    heure.value = ''
    idSalle.value = ''
    idPresident.value = ''
    idRapporteur.value = ''
    idMembreSupplementaire.value = ''

    await refresh()
    ongletActif.value = 'planning'
  } catch (e: any) {
    traiter(e)
  } finally {
    chargement.value = false
  }
}
</script>

<template>
  <div>
    <div class="flex items-start justify-between mb-6 opacity-0" :class="estMonte ? 'animate-entree' : ''">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">Présentations</h1>
        <p class="text-sm text-ink-light mt-1">Planifier et suivre les soutenances de fin de formation</p>
      </div>
    </div>

    <!-- Onglets principaux -->
    <div class="flex gap-2 mb-6 border-b border-slate-200 opacity-0" :class="estMonte ? 'animate-entree' : ''" style="animation-delay: 80ms">
      <button
        type="button"
        @click="ongletActif = 'planifier'"
        class="px-4 py-2.5 text-sm font-medium border-b-2 transition-colors duration-200"
        :class="ongletActif === 'planifier' ? 'border-secondary text-secondary' : 'border-transparent text-ink-light hover:text-slate-700'"
      >
        Planifier une présentation
      </button>
      <button
        type="button"
        @click="ongletActif = 'planning'"
        class="px-4 py-2.5 text-sm font-medium border-b-2 transition-colors duration-200"
        :class="ongletActif === 'planning' ? 'border-secondary text-secondary' : 'border-transparent text-ink-light hover:text-slate-700'"
      >
        Planning des présentations
      </button>
    </div>

    <!-- ==================== ONGLET PLANIFIER ==================== -->
    <Transition name="onglet" mode="out-in">
    <div v-if="ongletActif === 'planifier'" key="planifier" class="grid lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 bg-card border border-slate-200 rounded-lg p-6">
        <FormAlerte :message="erreurGenerale" />
        <p v-if="succes" class="text-sm text-accent mb-4">{{ succes }}</p>

        <form @submit.prevent="modeEdition ? enregistrerModification() : planifier()" class="space-y-5" novalidate>
           <h2 class="font-semibold text-slate-900">
              {{ modeEdition ? 'Modifier la soutenance' : 'Détails de la soutenance' }}
              </h2>
          <FormSelect
            v-model="idProjet"
            label="Projet concerné"
            :options="(projetsData?.projets ?? []).map(p => ({ value: p.id, label: `${p.titre} — ${p.etudiant.prenom} ${p.etudiant.nom}` }))"
            placeholder="Sélectionner un projet"
            :erreur="champ('id_projet')"
            requis
          />

          <div class="grid grid-cols-2 gap-4">
            <FormInput v-model="date" label="Date" type="date" :erreur="champ('date_presentation')" requis />
            <FormInput v-model="heure" label="Heure" type="time" :erreur="champ('heure_presentation')" requis />
          </div>

          <FormSelect
            v-model="idSalle"
            label="Salle"
            :options="(sallesData?.salles ?? []).map(s => ({ value: s.id_salle, label: `${s.numero}${s.libelle ? ' — ' + s.libelle : ''}` }))"
            placeholder="Sélectionner une salle"
            :erreur="champ('id_salle')"
            requis
          />

          <button
            type="button"
            :disabled="verificationEnCours || !date || !heure || !idSalle"
            @click="verifierDisponibilite"
            class="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-50"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
            </svg>
            {{ verificationEnCours ? 'Vérification...' : 'Vérifier la disponibilité' }}
          </button>

          <p
            v-if="disponibiliteVerifiee"
            class="text-sm rounded-lg px-3.5 py-2.5"
            :class="disponibiliteVerifiee.disponible ? 'bg-accent/5 text-accent' : 'bg-danger/5 text-danger'"
          >
            {{ disponibiliteVerifiee.message }}
          </p>

          <div class="pt-4 border-t border-slate-100">
            <h2 class="font-semibold text-slate-900 mb-4">Composition du jury</h2>
            <p class="text-xs text-ink-light -mt-2 mb-4">Le jury peut être composé d'encadreurs internes et/ou de jurys externes.</p>

            <div class="grid grid-cols-2 gap-4 mb-4">
              <FormSelect
                v-model="idPresident"
                label="Président"
                :options="membresJuryDisponibles"
                placeholder="— Sélectionner —"
                :erreur="champ('membres.0.id_utilisateur')"
                requis
              />
              <FormSelect
                v-model="idRapporteur"
                label="Rapporteur"
                :options="membresJuryDisponibles"
                placeholder="— Sélectionner —"
                :erreur="champ('membres.1.id_utilisateur')"
                requis
              />
            </div>

            <FormSelect
              v-model="idMembreSupplementaire"
              label="Membre supplémentaire"
              :options="membresJuryDisponibles"
              placeholder="— Optionnel —"
            />
          </div>

          <div class="flex items-center gap-3 pt-2">
            <button
              type="submit"
              :disabled="chargement"
              class="inline-flex items-center gap-2 bg-secondary hover:bg-primary text-white text-sm font-medium px-5 py-2.5 rounded-lg transition disabled:opacity-50"
            >
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {{ chargement ? 'Planification...' : modeEdition ? 'Enregistrer les modifications' : 'Planifier la soutenance' }}
            </button>
            <button type="button" @click="ongletActif = 'planning'" class="text-sm font-medium text-secondary hover:text-primary">
              Voir le planning
            </button>
          </div>
        </form>
      </div>

      <div class="space-y-6">
        <div class="bg-card border border-slate-200 rounded-lg p-5">
          <div v-if="!projetSelectionne" class="text-center py-6">
            <svg class="w-8 h-8 text-slate-300 mx-auto mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p class="text-sm text-ink-light">Sélectionnez un projet pour voir ses informations</p>
          </div>
          <div v-else>
            <p class="text-xs text-ink-light mb-1">Projet</p>
            <p class="text-sm font-medium text-slate-900 mb-3">{{ projetSelectionne.titre }}</p>
            <p class="text-xs text-ink-light mb-1">Étudiant</p>
            <p class="text-sm text-slate-900">{{ projetSelectionne.etudiant.prenom }} {{ projetSelectionne.etudiant.nom }}</p>
          </div>
        </div>

        <div class="bg-card border border-slate-200 rounded-lg p-5">
          <h3 class="font-semibold text-slate-900 text-sm mb-3">Soutenances à venir</h3>
          <div class="space-y-3">
            <div v-for="p in soutenancesAVenir" :key="p.id">              
              <p class="text-sm font-medium text-slate-900 truncate">{{ p.etudiant.prenom }} {{ p.etudiant.nom }}</p>
              <p class="text-xs text-ink-light">
                {{ p.date_presentation }} à {{ p.heure_presentation }} — {{ p.salle.numero }}
              </p>
            </div>
            <p v-if="!soutenancesAVenir.length" class="text-xs text-ink-light">Aucune soutenance planifiée.</p>
          </div>
        </div>

        <div class="bg-secondary/5 border border-secondary/20 rounded-lg p-5">
          <p class="text-sm font-medium text-secondary mb-2">Bon à savoir</p>
          <ul class="text-xs text-ink-light space-y-2 list-disc list-inside">
            <li>Vérifiez toujours les disponibilités avant de planifier. Une soutenance dure généralement 1h30.</li>
            <li>Le président et le rapporteur sont obligatoires. Un membre supplémentaire est optionnel.</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- ==================== ONGLET PLANNING ==================== -->
    <div v-else key="planning">
      <FormAlerte :message="erreurAction" />

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div
          v-for="(s, i) in [
            { valeur: stats.total, label: 'Total soutenances', couleur: 'text-slate-900' },
            { valeur: stats.a_venir, label: 'À venir', couleur: 'text-secondary' },
            { valeur: stats.terminees, label: 'Terminées', couleur: 'text-slate-600' },
            { valeur: stats.notees, label: 'Notées', couleur: 'text-accent' },
          ]"
          :key="s.label"
          class="bg-card border border-slate-200 rounded-lg p-4 opacity-0 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300"
          :class="estMonte ? 'animate-entree' : ''"
          :style="{ animationDelay: `${i * 70}ms` }"
        >
          <p class="text-2xl font-bold" :class="s.couleur">{{ s.valeur }}</p>
          <p class="text-xs text-ink-light">{{ s.label }}</p>
        </div>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div class="flex gap-2">
          <button
            v-for="o in filtresStatut"
            :key="o.valeur"
            type="button"
            @click="filtreStatut = o.valeur"
            class="px-3.5 py-2 rounded-full text-sm font-medium transition active:scale-95"
            :class="filtreStatut === o.valeur ? 'bg-primary text-white' : 'bg-slate-100 text-ink-light hover:bg-slate-200'"
          >
            {{ o.label }}
          </button>
        </div>

        <div class="flex items-center gap-3">
          <div class="inline-flex rounded-lg border border-slate-200 overflow-hidden">
            <button
              type="button"
              @click="vue = 'liste'"
              class="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium transition"
              :class="vue === 'liste' ? 'bg-card text-slate-900' : 'bg-slate-50 text-ink-light hover:bg-slate-100'"
            >
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h7" />
              </svg>
              Liste
            </button>
            <button
              type="button"
              @click="vue = 'calendrier'"
              class="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium transition border-l border-slate-200"
              :class="vue === 'calendrier' ? 'bg-card text-slate-900' : 'bg-slate-50 text-ink-light hover:bg-slate-100'"
            >
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Calendrier
            </button>
          </div>

          <button
            type="button"
            @click="ongletActif = 'planifier'"
            class="inline-flex items-center gap-2 bg-secondary hover:bg-primary text-white text-sm font-medium px-4 py-2.5 rounded-lg transition active:scale-95 shrink-0"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nouvelle soutenance
          </button>
        </div>
      </div>

      <!-- Vue liste -->
      <TransitionGroup v-if="vue === 'liste'" tag="div" name="ligne" class="space-y-3">
        <div
          v-for="p in presentationsFiltrees"
          :key="p.id"
          class="bg-card border border-slate-200 rounded-lg p-4 flex items-start gap-4 hover:border-secondary/30 hover:shadow-sm transition-all"
        >
          <div class="w-14 text-center shrink-0 bg-secondary/5 rounded-lg py-2">
            <p class="text-lg font-bold text-secondary">{{ p.date_presentation.split('-')[2] }}</p>
            <p class="text-[10px] text-ink-light uppercase">
              {{ new Date(p.date_presentation).toLocaleDateString('fr-FR', { month: 'short' }) }}
            </p>
          </div>

          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <p class="font-medium text-slate-900 truncate">{{ p.projet.titre }}</p>
              <span
                class="shrink-0 inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium"
                :class="p.statut === 'planifiee' ? 'bg-secondary/10 text-secondary' : 'bg-slate-200 text-slate-600'"
              >
                {{ p.statut === 'planifiee' ? 'Planifiée' : 'Terminée' }}
              </span>
            </div>
            <p class="text-xs text-ink-light mb-2">
              {{ p.etudiant.prenom }} {{ p.etudiant.nom }} · {{ p.heure_presentation }} · {{ p.salle.numero }}{{ p.salle.libelle ? ' — ' + p.salle.libelle : '' }}
            </p>
            <div class="flex flex-wrap gap-1.5">
              <span
                v-for="m in p.jury.membres"
                :key="m.id_utilisateur"
                class="inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium"
                :class="badgeRole(m.role_jury)"
              >
                {{ m.prenom.charAt(0) }}. {{ m.nom }} · {{ labelRole(m.role_jury) }}
              </span>
            </div>
            <p v-if="p.note_finale !== null" class="inline-flex items-center gap-1 mt-2 text-sm font-semibold text-accent">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.9 6.9 7.4.6-5.6 4.9 1.7 7.3-6.4-3.9-6.4 3.9 1.7-7.3-5.6-4.9 7.4-.6L12 2z"/></svg>
              {{ p.note_finale }}/20
            </p>
          </div>
            
          <div class="flex items-center gap-2 shrink-0">
            <button
    v-if="p.statut === 'planifiee'"
    type="button"
    class="p-1.5 text-ink-light hover:text-secondary transition"
    title="Modifier"
    @click="ouvrirModification(p)"
  >
    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  </button> 
            <button type="button" class="p-1.5 text-ink-light hover:text-secondary transition" @click="presentationDetail = p">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <button
              v-if="p.statut === 'planifiee'"
              type="button"
              class="p-1.5 text-ink-light hover:text-danger transition"
              title="Annuler"
              @click="annuler(p)"
            >
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <p v-if="!presentationsFiltrees.length" class="text-sm text-ink-light text-center py-10">
          Aucune soutenance trouvée.
        </p>
      </TransitionGroup>

      <!-- Vue calendrier -->
      <div v-else class="bg-card border border-slate-200 rounded-lg p-5 opacity-0 animate-entree">
        <div class="flex items-center justify-between mb-4">
          <button type="button" @click="moisPrecedent" class="p-1.5 text-ink-light hover:text-secondary hover:scale-110 active:scale-95 transition">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <p class="font-semibold text-slate-900 capitalize transition-opacity duration-200">{{ nomMoisAnnee }}</p>
          <button type="button" @click="moisSuivant" class="p-1.5 text-ink-light hover:text-secondary hover:scale-110 active:scale-95 transition">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div class="grid grid-cols-7 gap-px bg-slate-100 rounded-lg overflow-hidden text-xs">
          <div v-for="j in nomsJours" :key="j" class="bg-slate-50 text-center py-2 font-semibold text-ink-light">{{ j }}</div>

          <div
            v-for="(jour, i) in joursDuMois"
            :key="i"
            class="bg-card min-h-[80px] p-1.5"
            :class="!jour ? 'bg-slate-50/50' : ''"
          >
            <p v-if="jour" class="text-slate-500 mb-1">{{ jour }}</p>
            <button
              v-for="p in presentationsDuJour(jour)"
              :key="p.id"
              type="button"
              class="w-full text-left bg-secondary/10 text-secondary text-[10px] rounded px-1.5 py-1 mb-1 truncate hover:bg-secondary/20 active:scale-95 transition"
              @click="presentationDetail = p"
            >
              {{ p.heure_presentation }} — {{ p.etudiant.prenom }}
            </button>
          </div>
        </div>
      </div>

      <!-- Modale détail -->
      <Transition name="modale-fondu">
        <div v-if="presentationDetail" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <Transition name="panneau-zoom" appear>
        <div class="w-full max-w-md bg-card rounded-xl shadow-xl p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-bold text-slate-900">Détail de la soutenance</h2>
            <button type="button" @click="presentationDetail = null" class="text-ink-light hover:text-slate-600 hover:scale-110 active:scale-95 transition">
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="space-y-4 text-sm">
            <div>
              <p class="text-xs text-secondary uppercase font-semibold mb-1">Projet</p>
              <p class="text-slate-900 font-medium">{{ presentationDetail.projet.titre }}</p>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-xs text-secondary uppercase font-semibold mb-1">Étudiant</p>
                <p class="text-slate-900">{{ presentationDetail.etudiant.prenom }} {{ presentationDetail.etudiant.nom }}</p>
              </div>
              <div>
                <p class="text-xs text-secondary uppercase font-semibold mb-1">Date et heure</p>
                <p class="text-slate-900">{{ presentationDetail.date_presentation }} à {{ presentationDetail.heure_presentation }}</p>
              </div>
            </div>

            <div>
              <p class="text-xs text-secondary uppercase font-semibold mb-1">Salle</p>
              <p class="text-slate-900">{{ presentationDetail.salle.numero }}{{ presentationDetail.salle.libelle ? ' — ' + presentationDetail.salle.libelle : '' }}</p>
            </div>

            <div>
              <p class="text-xs text-secondary uppercase font-semibold mb-2">Jury</p>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="m in presentationDetail.jury.membres"
                  :key="m.id_utilisateur"
                  class="inline-flex px-2.5 py-1 rounded-full text-xs font-medium"
                  :class="badgeRole(m.role_jury)"
                >
                  {{ m.prenom }} {{ m.nom }} · {{ labelRole(m.role_jury) }}
                </span>
              </div>
            </div>

            <div>
              <p class="text-xs text-secondary uppercase font-semibold mb-1">Statut</p>
              <span
                class="inline-flex px-2.5 py-1 rounded-full text-xs font-medium"
                :class="presentationDetail.statut === 'planifiee' ? 'bg-secondary/10 text-secondary' : 'bg-slate-200 text-slate-600'"
              >
                {{ presentationDetail.statut === 'planifiee' ? 'Planifiée' : 'Terminée' }}
              </span>
            </div>
          </div>

          <div class="flex justify-end pt-5 mt-5 border-t border-slate-100">
            <button type="button" @click="presentationDetail = null" class="text-sm font-medium text-secondary hover:text-primary">
              Fermer
            </button>
          </div>
        </div>
          </Transition>
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

.ligne-enter-active,
.ligne-leave-active {
  transition: opacity 0.25s ease;
}
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

.onglet-enter-active,
.onglet-leave-active {
  transition: opacity 0.2s ease;
}
.onglet-enter-from,
.onglet-leave-to {
  opacity: 0;
}
</style>