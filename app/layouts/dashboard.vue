<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { useConfirmation } from '~/Composables/useConfirmation'
import { useInactivite } from '~/Composables/useInactivite'
import { onMounted, onUnmounted, ref } from 'vue'

const authStore = useAuthStore()
const { demander } = useConfirmation()
const route = useRoute()
const sidebarReduite = ref(false)
const menuProfilOuvert = ref(false)

interface ItemNav {
  label: string
  chemin: string
  icone: string
}

const navParRole: Record<string, ItemNav[]> = {
  etudiant: [
    { label: 'Tableau de bord', chemin: '/etudiant/tableau-de-bord', icone: 'Menu' },
    { label: 'Soumettre un projet', chemin: '/etudiant/soumettre-projet', icone: 'Plus' },
    { label: 'Mon projet', chemin: '/etudiant/projet', icone: 'FileText' },
    //{ label: 'Paiement', chemin: '/etudiant/paiement', icone: 'DollarSign' },
    { label: 'Ma soutenance', chemin: '/etudiant/soutenance', icone: 'Calendar' },
    { label: 'Profil', chemin: '/profil', icone: 'User' },

  ],
  encadreur: [
    { label: 'Tableau de bord', chemin: '/encadreur/tableau-de-bord', icone: 'Menu' },
    { label: 'Projets à encadrer', chemin: '/encadreur/projets-a-encadrer', icone: 'FileText' },
    { label: 'Mes évaluations(juré)', chemin: '/encadreur/evaluations', icone: 'CheckCircle' },
    { label: 'Calendrier', chemin: '/encadreur/calendrier', icone: 'Calendar' },
    { label: 'Profil', chemin: '/profil', icone: 'User' },

  ],
  administrateur: [
    { label: 'Tableau de bord', chemin: '/admin/tableau-de-bord', icone: 'Menu' },
    { label: 'Étudiants', chemin: '/admin/etudiants', icone: 'Users' },
    { label: 'Encadreurs', chemin: '/admin/encadreurs', icone: 'Users' },
    { label: 'Jurés externes', chemin: '/admin/jury-externes', icone: 'Users' },
    { label: 'Projets', chemin: '/admin/projets', icone: 'FileText' },
    { label: 'Présentations', chemin: '/admin/presentations', icone: 'Calendar' },
    { label: 'Promotions', chemin: '/admin/promotions', icone: 'Users' },
    { label: 'Filières & spécialités', chemin: '/admin/filieres', icone: 'BookOpen' },
    { label: 'Salles', chemin: '/admin/salles', icone: 'LayoutGrid' },
    //{ label: 'Tarifs', chemin: '/admin/tarifs', icone: 'DollarSign' },
    { label: 'Profil', chemin: '/profil', icone: 'User' },

  ],
  super_administrateur: [
    { label: 'Tableau de bord', chemin: '/super-admin/tableau-de-bord', icone: 'Menu' },
    { label: 'Étudiants', chemin: '/admin/etudiants', icone: 'Users' },
    { label: 'Encadreurs', chemin: '/admin/encadreurs', icone: 'Users' },
    { label: 'Jurés externes', chemin: '/admin/jury-externes', icone: 'Users' },
    { label: 'Projets', chemin: '/admin/projets', icone: 'FileText' },
    { label: 'Présentations', chemin: '/admin/presentations', icone: 'Calendar' },
    { label: 'Promotions', chemin: '/admin/promotions', icone: 'Users' },
    { label: 'Filières & spécialités', chemin: '/admin/filieres', icone: 'BookOpen' },
    { label: 'Salles', chemin: '/admin/salles', icone: 'LayoutGrid' },
    //{ label: 'Tarifs', chemin: '/admin/tarifs', icone: 'DollarSign' },
    { label: 'Administrateurs', chemin: '/super-admin/administrateurs', icone: 'Users' },
    { label: 'Rôles et permissions', chemin: '/super-admin/roles', icone: 'Shield' },
    { label: 'Paramètres système', chemin: '/super-admin/parametres', icone: 'Settings' },
    //{ label: 'Rapports consolidés', chemin: '/super-admin/rapports', icone: 'BarChart2' },
    { label: 'Profil', chemin: '/profil', icone: 'User' },
  
  ],
  jury_externe: [
    { label: 'Tableau de bord', chemin: '/jury/tableau-de-bord', icone: 'Menu' },
    { label: 'Mes évaluations', chemin: '/jury/evaluations', icone: 'CheckCircle' },
    { label: 'Profil', chemin: '/profil', icone: 'User' },

  ],
}

const itemsNav = computed(() => navParRole[authStore.role ?? ''] ?? [])

const libelleRole: Record<string, string> = {
  etudiant: 'Étudiant',
  encadreur: 'Encadreur',
  administrateur: 'Administrateur',
  super_administrateur: 'Super Administrateur',
  jury_externe: 'Membre de jury',
}

const initiales = computed(() => {
  const u = authStore.utilisateur
  if (!u) return ''
  return `${u.prenom.charAt(0)}${u.nom.charAt(0)}`.toUpperCase()
})



async function seDeconnecter() {
  const confirme = await demander({
    titre: 'Confirmer la déconnexion',
    message: 'Êtes-vous sûr de vouloir vous déconnecter ?',
    texteConfirmer: 'Se déconnecter',
    dangereux: true,
  })
  if (!confirme) return

  await authStore.logout()
}

async function allerAccueil() {
  const confirme = await demander({
    titre: 'Retourner à l\'accueil',
    message: 'Retourner à l\'accueil vous déconnectera de votre session en cours. Voulez-vous continuer ?',
    texteConfirmer: 'Se déconnecter',
    dangereux: true,
  })
  if (!confirme) return

  await authStore.logout('/')
}

/* ---------- Animation d'entrée de la barre latérale ---------- */
const estMonte = ref(false)

/* ---------- Déconnexion automatique après inactivité ---------- */
const { demarrer: demarrerInactivite, arreter: arreterInactivite } = useInactivite()

onMounted(() => {
  requestAnimationFrame(() => { estMonte.value = true })
  demarrerInactivite()
})
onUnmounted(() => {
  arreterInactivite()
})
</script>

<template>
<div class="h-screen flex bg-surface font-sans overflow-hidden">    <!-- Barre latérale -->
    <aside
      class="flex flex-col bg-primary transition-all duration-300 shrink-0"
      :class="sidebarReduite ? 'w-20' : 'w-64'"
    >
      <div class="h-16 flex items-center gap-2.5 px-5 border-b border-white/10 overflow-hidden">
        <span class="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center shrink-0 transition-transform duration-300 hover:scale-105">
          <BaseIcon name="GraduationCap" size="20" stroke-width="2" class="text-white" />
        </span>
        <Transition name="libelle">
          <div v-if="!sidebarReduite" class="leading-tight whitespace-nowrap">
            <p class="text-sm font-semibold text-white">Projetis</p>
            <p class="text-[11px] text-white/50">Gestion des projets</p>
          </div>
        </Transition>
      </div>

        <nav class="sidebar-scroll flex-1 px-3 py-4 space-y-1 overflow-y-auto overflow-x-hidden">        
          <button
            type="button"
            @click="allerAccueil"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 opacity-0 text-white/60 hover:bg-white/5 hover:text-white hover:translate-x-0.5 w-full text-left"
            :class="estMonte ? 'animate-entree-nav' : ''"
          >
            <BaseIcon name="Home" size="18" stroke-width="2" class="w-5 h-5 shrink-0" />
            <Transition name="libelle">
              <span v-if="!sidebarReduite" class="whitespace-nowrap">Accueil</span>
            </Transition>
          </button>

          <NuxtLink
          v-for="(item, i) in itemsNav"
          :key="item.chemin"
          :to="item.chemin"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 opacity-0 hover:translate-x-0.5"
          :class="[
            route.path === item.chemin ? 'bg-secondary text-white' : 'text-white/60 hover:bg-white/5 hover:text-white',
            estMonte ? 'animate-entree-nav' : '',
          ]"
          :style="{ animationDelay: `${40 + i * 40}ms` }"
        >
                <BaseIcon :name="item.icone" size="18" stroke-width="2" class="w-5 h-5 shrink-0" />
          <Transition name="libelle">
            <span v-if="!sidebarReduite" class="whitespace-nowrap">{{ item.label }}</span>
          </Transition>
        </NuxtLink>
      </nav>

      <div class="p-3 border-t border-white/10">
        <button
          type="button"
          @click="sidebarReduite = !sidebarReduite"
          class="w-full flex items-center justify-center py-2 rounded-lg text-white/50 hover:bg-white/5 hover:text-white transition-colors duration-200"
        >
          <BaseIcon name="ChevronsLeft" size="20" stroke-width="2" class="w-5 h-5 transition-transform duration-300" :class="sidebarReduite ? 'rotate-180' : ''" />
        </button>
      </div>
    </aside>

    <!-- Zone principale -->
    <div class="flex-1 flex flex-col min-w-0">
      <!-- Barre supérieure -->
      <header class="h-16 bg-card border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
        <p class="text-sm font-medium text-ink-light">{{ libelleRole[authStore.role ?? ''] }}</p>

        <div class="flex items-center gap-3">
          <NotificationsCloche />
          <ThemeToggle />

        <div class="relative" v-click-outside="() => (menuProfilOuvert = false)">
  <button
    type="button"
    @click="menuProfilOuvert = !menuProfilOuvert"
    class="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors duration-200"
  >
    <span class="w-8 h-8 rounded-full bg-secondary/10 text-secondary text-xs font-semibold flex items-center justify-center">
      {{ initiales }}
    </span>
    <span class="text-left hidden sm:block">
      <span class="block text-sm font-medium text-slate-900 leading-tight">
        {{ authStore.utilisateur?.prenom }} {{ authStore.utilisateur?.nom }}
      </span>
      <span class="block text-xs text-ink-light leading-tight">
        {{ libelleRole[authStore.role ?? ''] }}
      </span>
    </span>
    <BaseIcon
      name="ChevronDown"
      size="16"
      stroke-width="2"
      class="text-ink-light transition-transform duration-200"
      :class="menuProfilOuvert ? 'rotate-180' : ''"
    />
  </button>

  <Transition name="menu">
    <div
      v-if="menuProfilOuvert"
      class="absolute right-0 mt-2 w-64 bg-card border border-slate-200 rounded-lg shadow-lg py-2 z-50 origin-top-right"
    >
      <div class="px-4 py-2 border-b border-slate-100">
        <p class="text-sm font-medium text-slate-900">
          {{ authStore.utilisateur?.prenom }} {{ authStore.utilisateur?.nom }}
        </p>
        <p class="text-xs text-secondary">{{ authStore.utilisateur?.email }}</p>
      </div>
      <button
        type="button"
        @click="seDeconnecter"
        class="w-full flex items-center gap-2 px-4 py-2 text-sm text-danger hover:bg-danger/10 transition-colors duration-200"
      >
        <BaseIcon name="LogOut" size="16" stroke-width="2" />
        Déconnexion
      </button>
    </div>
  </Transition>
</div>
        </div>
      </header>

      <!-- Contenu -->
      <main class="flex-1 overflow-y-auto p-6">
        <Transition name="page" mode="out-in">
          <div :key="route.fullPath">
            <slot />
          </div>
        </Transition>
      </main>
    </div>

    <ModaleInactivite />
  </div>
</template>

<style scoped>
@keyframes entree-nav {
  from {
    opacity: 0;
    transform: translateX(-8px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
.animate-entree-nav {
  animation: entree-nav 0.4s ease-out forwards;
}

.libelle-enter-active,
.libelle-leave-active {
  transition: opacity 0.15s ease;
}
.libelle-enter-from,
.libelle-leave-to {
  opacity: 0;
}

.menu-enter-active,
.menu-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.menu-enter-from,
.menu-leave-to {
  opacity: 0;
  transform: scale(0.96) translateY(-4px);
}

.page-enter-active,
.page-leave-active {
  transition: opacity 0.12s ease;
}
.page-enter-from,
.page-leave-to {
  opacity: 0;
}
</style>