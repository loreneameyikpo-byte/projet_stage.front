<script setup lang="ts">
import { useApi } from '~/Composables/useApi'
import { computed, onMounted, ref } from 'vue'
import { User, Clock, MapPin, PenLine, Eye, ClipboardList, Inbox, CheckCheck } from 'lucide-vue-next'

definePageMeta({ layout: 'dashboard', middleware: 'role' })
useRoute().meta.roles = ['jury_externe']

const { apiFetch } = useApi()

const { data: stats } = await useAsyncData('jury-evaluations', () => apiFetch<{
  presentations: { id_jury: string; projet_titre: string; etudiant: string; date_presentation: string; heure_presentation: string; salle: string; role_jury: string; note_saisie: number | null }[]
}>('/stats-jury/dashboard'))

const presentations = computed(() => stats.value?.presentations ?? [])

type Onglet = 'toutes' | 'a_evaluer' | 'evaluees'
const nbEnAttente = computed(() => presentations.value.filter((p) => p.note_saisie === null).length)
const nbEvaluees = computed(() => presentations.value.filter((p) => p.note_saisie !== null).length)

const onglets = computed(() => [
  { valeur: 'toutes' as Onglet, label: 'Toutes', compte: presentations.value.length },
  { valeur: 'a_evaluer' as Onglet, label: 'En attente', compte: nbEnAttente.value },
  { valeur: 'evaluees' as Onglet, label: 'Évaluées', compte: nbEvaluees.value },
]) 
const ongletActif = ref<Onglet>('toutes')

const presentationsFiltrees = computed(() => {
  const toutes = presentations.value
  if (ongletActif.value === 'a_evaluer') return toutes.filter((p) => p.note_saisie === null)
  if (ongletActif.value === 'evaluees') return toutes.filter((p) => p.note_saisie !== null)
  return toutes
})

function labelRole(role: string) {
  return { president: 'Président', rapporteur: 'Rapporteur', membre: 'Membre' }[role] ?? role
}

function badgeRole(role: string) {
  return { president: 'bg-secondary/10 text-secondary', rapporteur: 'bg-accent/10 text-accent', membre: 'bg-warning/10 text-warning' }[role] ?? 'bg-slate-100 text-slate-600'
}

function moisAbrege(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '').toUpperCase()
}
function jourDuMois(dateStr: string) {
  return new Date(dateStr).getDate()
}

type EtatVide = { icone: any; titre: string; message: string }

const etatsVides: Record<Onglet, EtatVide> = {
  toutes: { icone: Inbox, titre: 'Aucune soutenance assignée', message: "Vous n'êtes assigné à aucune soutenance pour le moment." },
  a_evaluer: { icone: CheckCheck, titre: 'Aucune soutenance en attente', message: 'Toutes vos soutenances ont été évaluées.' },
  evaluees: { icone: ClipboardList, titre: 'Aucune soutenance évaluée', message: "Vous n'avez pas encore évalué de soutenance." },
}
const etatVideActif = computed<EtatVide>(() => etatsVides[ongletActif.value])

const estMonte = ref(false)
onMounted(() => {
  requestAnimationFrame(() => { estMonte.value = true })
})
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold text-slate-900 opacity-0" :class="estMonte ? 'animate-entree' : ''">Mes évaluations</h1>
    <p class="text-sm text-ink-light mt-1 mb-6 opacity-0" :class="estMonte ? 'animate-entree' : ''" style="animation-delay: 40ms">Liste des soutenances où vous intervenez comme membre de jury</p>

    <!-- Cartes résumé -->
    <div class="grid sm:grid-cols-3 gap-4 mb-6">
      <div
        v-for="(c, i) in [
          { valeur: presentations.length, label: 'Assignées', couleur: 'text-slate-900' },
          { valeur: nbEnAttente, label: 'En attente', couleur: 'text-warning' },
          { valeur: nbEvaluees, label: 'Évaluées', couleur: 'text-accent' },
        ]"
        :key="c.label"
        class="bg-card border border-slate-200 rounded-lg p-5 opacity-0 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300"
        :class="estMonte ? 'animate-entree' : ''"
        :style="{ animationDelay: `${100 + i * 80}ms` }"
      >
        <p class="text-sm text-ink-light mb-2">{{ c.label }}</p>
        <p class="text-3xl font-bold" :class="c.couleur">{{ c.valeur }}</p>
      </div>
    </div>

    <!-- Onglets -->
    <div class="flex gap-2 mb-6 opacity-0" :class="estMonte ? 'animate-entree' : ''" style="animation-delay: 340ms">
      <button
        v-for="o in onglets"
        :key="o.valeur"
        type="button"
        @click="ongletActif = o.valeur"
        class="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 active:scale-95"
        :class="ongletActif === o.valeur
          ? 'bg-primary text-white shadow-sm'
          : 'bg-card border border-slate-200 text-slate-700 hover:bg-slate-50'"
      >
        {{ o.label }}
        <span
          class="inline-flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full text-[11px] font-semibold transition-transform"
          :class="ongletActif === o.valeur ? 'bg-white/20 text-white scale-105' : 'bg-slate-100 text-ink-light'"
        >
          {{ o.compte }}
        </span>
      </button>
    </div>

    <!-- Liste -->
    <TransitionGroup tag="div" name="carte" class="space-y-3">
      <div
        v-for="p in presentationsFiltrees"
        :key="p.id_jury"
        class="bg-card border border-slate-200 rounded-lg p-5 flex items-center gap-5 hover:shadow-sm hover:border-secondary/30 transition-all duration-200"
      >
        <div class="w-16 text-center shrink-0 bg-slate-50 border border-slate-100 rounded-lg py-2.5">
          <p class="text-xl font-bold text-slate-900 leading-none">{{ jourDuMois(p.date_presentation) }}</p>
          <p class="text-[10px] text-ink-light uppercase mt-1">{{ moisAbrege(p.date_presentation) }}</p>
        </div>

        <div class="flex-1 min-w-0">
          <p class="font-semibold text-slate-900 mb-2">{{ p.projet_titre }}</p>

          <div class="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-ink-light mb-3">
            <span class="inline-flex items-center gap-1.5">
              <User class="w-4 h-4 shrink-0" />
              {{ p.etudiant }}
            </span>
            <span class="inline-flex items-center gap-1.5">
              <Clock class="w-4 h-4 shrink-0" />
              {{ p.heure_presentation }}
            </span>
            <span class="inline-flex items-center gap-1.5">
              <MapPin class="w-4 h-4 shrink-0" />
              {{ p.salle }}
            </span>
          </div>

          <div class="flex flex-wrap gap-2">
            <span class="inline-flex px-2.5 py-1 rounded-full text-xs font-medium" :class="badgeRole(p.role_jury)">
              {{ labelRole(p.role_jury) }}
            </span>
            <span
              class="inline-flex px-2.5 py-1 rounded-full text-xs font-medium"
              :class="p.note_saisie !== null ? 'bg-accent/10 text-accent' : 'bg-secondary/10 text-secondary'"
            >
              {{ p.note_saisie !== null ? 'Soutenance évaluée' : 'Présentation planifiée' }}
            </span>
          </div>
        </div>

        <NuxtLink
          :to="`/jury/evaluations/${p.id_jury}`"
          class="inline-flex items-center gap-2 shrink-0 text-sm font-medium px-4 py-2.5 rounded-lg transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
          :class="p.note_saisie !== null
            ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            : 'bg-primary text-white hover:bg-primary/90 shadow-sm'"
        >
          <PenLine v-if="p.note_saisie === null" class="w-4 h-4" />
          <Eye v-else class="w-4 h-4" />
          {{ p.note_saisie !== null ? 'Voir le détail' : 'Évaluer' }}
        </NuxtLink>
      </div>

      <div v-if="!presentationsFiltrees.length" class="flex flex-col items-center justify-center text-center py-16">
        <span class="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-4">
          <component :is="etatVideActif.icone" class="w-5.5 h-5.5" />
        </span>
        <p class="font-medium text-slate-900 mb-1">{{ etatVideActif.titre }}</p>
        <p class="text-sm text-ink-light mb-4">{{ etatVideActif.message }}</p>
        <button
          v-if="ongletActif !== 'toutes'"
          type="button"
          @click="ongletActif = 'toutes'"
          class="text-sm font-medium text-secondary hover:text-primary transition-colors"
        >
          Voir toutes les soutenances
        </button>
      </div>
    </TransitionGroup>
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

.carte-enter-active,
.carte-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.carte-enter-from,
.carte-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
.carte-leave-active {
  position: absolute;
}
.carte-move {
  transition: transform 0.3s ease;
}
</style>