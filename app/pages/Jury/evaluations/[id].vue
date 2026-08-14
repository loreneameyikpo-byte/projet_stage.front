<script setup lang="ts">
import { useApi } from '~/Composables/useApi'
import { useFormErrors } from '~/Composables/useFormErrors'
import { useConfirmation } from '~/Composables/useConfirmation'
import { computed, ref } from 'vue'
import { ChevronLeft, CalendarDays, Clock, DoorOpen, Github, FileText, Info } from 'lucide-vue-next'

definePageMeta({ layout: 'dashboard', middleware: 'role', roles: ['jury_externe'] })

const route = useRoute()
const { apiFetch } = useApi()
const { erreurGenerale, traiter, reinitialiser } = useFormErrors()
const { demander } = useConfirmation()

interface MembreJury {
  id_utilisateur: string
  nom: string
  prenom: string
  role_jury: string
  note_saisie: number | null
  est_utilisateur_courant: boolean
}

interface DetailEvaluation {
  id_jury: string
  date_presentation: string
  heure_presentation: string
  statut: 'planifiee' | 'terminee'
  salle: { numero: string; libelle: string | null }
  etudiant: {
    prenom: string
    nom: string
    email: string
    telephone: string | null
    promotion: string | null
    specialite: string | null
  }
  projet: {
    titre: string
    description: string
    depot_github: string | null
    rapport_pdf: string | null
  }
  jury: { membres: MembreJury[] }
}

// route.params.id = id_jury (une soutenance = un seul jury, partagé par tous ses membres)
const { data: detail, refresh } = await useAsyncData<DetailEvaluation>(`jury-${route.params.id}`, () =>
  apiFetch<DetailEvaluation>(`/jury/${route.params.id}`)
)

const monMembre = computed(() => detail.value?.jury.membres.find((m) => m.est_utilisateur_courant))

function initiales(prenom: string, nom: string) {
  return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase()
}

function labelRole(role: string) {
  return { president: 'Président', rapporteur: 'Rapporteur', membre: 'Membre' }[role] ?? role
}
function badgeRole(role: string) {
  return { president: 'bg-secondary/10 text-secondary', rapporteur: 'bg-accent/10 text-accent', membre: 'bg-warning/10 text-warning' }[role] ?? 'bg-slate-100 text-slate-600'
}

const bareme = [
  { plage: '0 - 9', label: 'Insuffisant', classe: 'bg-danger/5 border-danger/20 text-danger' },
  { plage: '10 - 13', label: 'Passable', classe: 'bg-warning/5 border-warning/20 text-warning' },
  { plage: '14 - 16', label: 'Bien', classe: 'bg-secondary/5 border-secondary/20 text-secondary' },
  { plage: '17 - 20', label: 'Très bien', classe: 'bg-accent/5 border-accent/20 text-accent' },
]

const note = ref<number | null>(monMembre.value?.note_saisie ?? null)
const enregistrement = ref(false)
const succes = ref('')

async function enregistrer() {
  reinitialiser()
  succes.value = ''

  if (note.value === null || note.value < 0 || note.value > 20) {
    erreurGenerale.value = 'Veuillez saisir une note comprise entre 0 et 20.'
    return
  }

  enregistrement.value = true
  try {
    await apiFetch(`/jury/${route.params.id}/note`, {
      method: 'POST',
      body: { note: note.value },
    })
    succes.value = 'Note enregistrée avec succès.'
    await refresh()
  } catch (e: any) {
    traiter(e)
  } finally {
    enregistrement.value = false
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

  note.value = monMembre.value?.note_saisie ?? null
  erreurGenerale.value = ''
  succes.value = ''
}
</script>

<template>
  <div v-if="detail" class="max-w-3xl">
    <NuxtLink to="/jury/evaluations" class="inline-flex items-center gap-1.5 text-sm text-ink-light hover:text-secondary transition-colors mb-4">
      <ChevronLeft class="w-4 h-4" />
      Retour aux évaluations
    </NuxtLink>

    <!-- Bandeau infos rapides -->
    <div class="bg-card border border-slate-200 rounded-lg p-4 flex flex-wrap items-center gap-6 mb-6">
      <div class="flex items-center gap-2">
        <span class="w-8 h-8 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
          <CalendarDays class="w-4 h-4" />
        </span>
        <div>
          <p class="text-[11px] text-ink-light">Date</p>
          <p class="text-sm font-medium text-slate-900">{{ detail.date_presentation }}</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <span class="w-8 h-8 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
          <Clock class="w-4 h-4" />
        </span>
        <div>
          <p class="text-[11px] text-ink-light">Heure</p>
          <p class="text-sm font-medium text-slate-900">{{ detail.heure_presentation }}</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <span class="w-8 h-8 rounded-lg bg-warning/10 text-warning flex items-center justify-center shrink-0">
          <DoorOpen class="w-4 h-4" />
        </span>
        <div>
          <p class="text-[11px] text-ink-light">Salle</p>
          <p class="text-sm font-medium text-slate-900">{{ detail.salle.numero }}</p>
        </div>
      </div>
      <span class="ml-auto inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-secondary/10 text-secondary">
        {{ detail.statut === 'planifiee' ? 'Présentation planifiée' : 'Soutenance terminée' }}
      </span>
    </div>

    <!-- Étudiant + Projet -->
    <div class="grid sm:grid-cols-2 gap-4 mb-6">
      <div class="bg-card border border-slate-200 rounded-lg p-5">
        <h2 class="text-sm font-semibold text-slate-900 mb-4">Informations de l'étudiant</h2>
        <div class="flex items-center gap-3 mb-4">
          <span class="w-10 h-10 rounded-full bg-secondary/10 text-secondary text-sm font-semibold flex items-center justify-center shrink-0">
            {{ initiales(detail.etudiant.prenom, detail.etudiant.nom) }}
          </span>
          <p class="font-medium text-slate-900">{{ detail.etudiant.prenom }} {{ detail.etudiant.nom }}</p>
        </div>
        <ul class="space-y-1.5 text-sm text-ink-light">
          <li>{{ detail.etudiant.email }}</li>
          <li v-if="detail.etudiant.promotion">Promotion : <span class="text-slate-700">{{ detail.etudiant.promotion }}</span></li>
          <li v-if="detail.etudiant.specialite">Spécialité : <span class="text-slate-700">{{ detail.etudiant.specialite }}</span></li>
          <li v-if="detail.etudiant.telephone">{{ detail.etudiant.telephone }}</li>
        </ul>
      </div>

      <div class="bg-card border border-slate-200 rounded-lg p-5">
        <h2 class="text-sm font-semibold text-slate-900 mb-3">Informations du projet</h2>
        <p class="font-medium text-slate-900 mb-2">{{ detail.projet.titre }}</p>
        <p class="text-sm text-ink-light leading-relaxed mb-4 line-clamp-3">{{ detail.projet.description }}</p>
        <div class="flex flex-wrap gap-2">
          <a
            v-if="detail.projet.depot_github"
            :href="detail.projet.depot_github"
            target="_blank"
            rel="noopener"
            class="inline-flex items-center gap-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Github class="w-3.5 h-3.5" />
            Dépôt GitHub
          </a>
          <a
            v-if="detail.projet.rapport_pdf"
            :href="detail.projet.rapport_pdf"
            target="_blank"
            rel="noopener"
            class="inline-flex items-center gap-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg transition-colors"
          >
            <FileText class="w-3.5 h-3.5" />
            Rapport PDF
          </a>
        </div>
      </div>
    </div>

    <!-- Composition du jury -->
    <div class="bg-card border border-slate-200 rounded-lg p-5 mb-6">
      <h2 class="text-sm font-semibold text-slate-900 mb-4">Composition du jury</h2>
      <div class="grid sm:grid-cols-3 gap-3 mb-4">
        <div
          v-for="m in detail.jury.membres" :key="m.id_utilisateur"
          class="flex items-center gap-3 rounded-lg p-3 border transition-colors"
          :class="m.est_utilisateur_courant ? 'border-secondary/40 bg-secondary/5' : 'border-slate-100'"
        >
          <span
            class="w-9 h-9 rounded-full text-xs font-semibold flex items-center justify-center shrink-0"
            :class="m.est_utilisateur_courant ? 'bg-secondary text-white' : 'bg-slate-200 text-slate-600'"
          >
            {{ initiales(m.prenom, m.nom) }}
          </span>
          <div class="min-w-0">
            <p class="text-sm font-medium text-slate-900 truncate">
              {{ m.prenom.charAt(0) }}. {{ m.nom }}
              <span v-if="m.est_utilisateur_courant" class="text-xs text-secondary font-normal">(vous)</span>
            </p>
            <span class="inline-flex mt-0.5 px-2 py-0.5 rounded-full text-[11px] font-medium" :class="badgeRole(m.role_jury)">
              {{ labelRole(m.role_jury) }}
            </span>
          </div>
        </div>
      </div>
      <p v-if="monMembre" class="inline-flex items-center gap-1.5 text-xs text-ink-light">
        <Info class="w-3.5 h-3.5 shrink-0" />
        Vous intervenez dans cette soutenance en tant que <span class="font-medium text-slate-700">{{ labelRole(monMembre.role_jury).toLowerCase() }}</span>.
      </p>
    </div>

    <!-- Saisie de la note -->
    <div class="bg-card border border-slate-200 rounded-lg p-6">
      <h2 class="font-semibold text-slate-900 mb-1">Saisie de la note</h2>
      <p class="text-sm text-ink-light mb-5">Attribuez une note sur 20 pour cette soutenance.</p>

      <FormAlerte :message="erreurGenerale" />
      <p v-if="succes" class="text-sm text-accent mb-4">{{ succes }}</p>

      <p class="text-xs font-medium text-slate-700 mb-2">Barème indicatif</p>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div v-for="b in bareme" :key="b.label" class="rounded-lg border px-3 py-2.5 text-center" :class="b.classe">
          <p class="text-sm font-semibold">{{ b.plage }}</p>
          <p class="text-xs">{{ b.label }}</p>
        </div>
      </div>

      <form @submit.prevent="enregistrer" class="space-y-5">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">Note <span class="text-danger">*</span></label>
          <div class="flex items-center gap-2 max-w-[160px]">
            <input
              v-model.number="note"
              type="number"
              min="0"
              max="20"
              step="0.5"
              placeholder="0 - 20"
              class="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary transition-all duration-200"
            />
            <span class="text-sm text-ink-light shrink-0">/20</span>
          </div>
        </div>

        <div class="flex items-center gap-3 pt-2">
          <button
            type="submit"
            :disabled="enregistrement"
            class="inline-flex items-center gap-2 bg-secondary hover:bg-primary text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {{ enregistrement ? 'Enregistrement...' : 'Enregistrer la note' }}
          </button>
          <button type="button" @click="annuler" class="text-sm font-medium text-ink-light hover:text-slate-700 transition-colors">
            Annuler
          </button>
        </div>
      </form>
    </div>
  </div>
</template>