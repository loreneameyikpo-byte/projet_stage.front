<script setup lang="ts">
//faire les imports pour lucide.vue

const authStore = useAuthStore()
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
    { label: 'Tableau de bord', chemin: '/etudiant/tableau-de-bord', icone: 'M4 6h16M4 12h16M4 18h7' },
    { label: 'Soumettre un projet', chemin: '/etudiant/soumettre-projet', icone: 'M12 4v16m8-8H4' },
    { label: 'Mon projet', chemin: '/etudiant/projet', icone: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { label: 'Paiement', chemin: '/etudiant/paiement', icone: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { label: 'Ma soutenance', chemin: '/etudiant/soutenance', icone: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { label: 'Profil', chemin: '/profil', icone: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },

  ],
  encadreur: [
    { label: 'Tableau de bord', chemin: '/encadreur/tableau-de-bord', icone: 'M4 6h16M4 12h16M4 18h7' },
    { label: 'Projets à encadrer', chemin: '/encadreur/projets-a-encadrer', icone: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { label: 'Calendrier des soutenances', chemin: '/encadreur/calendrier', icone: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { label: 'Profil', chemin: '/profil', icone: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },


  ],
  administrateur: [
    { label: 'Tableau de bord', chemin: '/admin/tableau-de-bord', icone: 'M4 6h16M4 12h16M4 18h7' },
    { label: 'Étudiants', chemin: '/admin/etudiants', icone: 'M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z' },
    { label: 'Encadreurs', chemin: '/admin/encadreurs', icone: 'M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z' },
    { label: 'Jury externes', chemin: '/admin/jury-externes', icone: 'M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a4 4 0 10-4-4' },
    { label: 'Projets', chemin: '/admin/projets', icone: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { label: 'Présentations', chemin: '/admin/presentations', icone: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { label: 'Promotions', chemin: '/admin/promotions', icone: 'M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z' },
    { label: 'Filières & spécialités', chemin: '/admin/filieres', icone: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { label: 'Salles', chemin: '/admin/salles', icone: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2M5 21h2m10 0h-4M9 7h1m4 0h1M9 11h1m4 0h1M9 15h1m4 0h1' },
    { label: 'Tarifs', chemin: '/admin/tarifs', icone: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { label: 'Profil', chemin: '/profil', icone: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },

  ],
  super_administrateur: [
    { label: 'Tableau de bord', chemin: '/super-admin/tableau-de-bord', icone: 'M4 6h16M4 12h16M4 18h7' },
    { label: 'Administrateurs', chemin: '/super-admin/administrateurs', icone: 'M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a4 4 0 10-4-4' },
    { label: 'Rôles et permissions', chemin: '/super-admin/roles', icone: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
    { label: 'Paramètres système', chemin: '/super-admin/parametres', icone: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
    { label: 'Rapports consolidés', chemin: '/super-admin/rapports', icone: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { label: 'Profil', chemin: '/profil', icone: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },

  ],
  jury_externe: [
    { label: 'Tableau de bord', chemin: '/jury/tableau-de-bord', icone: 'M4 6h16M4 12h16M4 18h7' },
    { label: 'Mes évaluations', chemin: '/jury/evaluations', icone: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
    { label: 'Profil', chemin: '/profil', icone: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },

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
  await authStore.logout()
}
</script>

<template>
<div class="h-screen flex bg-surface font-sans overflow-hidden">    <!-- Barre latérale -->
    <aside
      class="flex flex-col bg-primary transition-all duration-200 shrink-0"
      :class="sidebarReduite ? 'w-20' : 'w-64'"
    >
      <div class="h-16 flex items-center gap-2.5 px-5 border-b border-white/10">
        <span class="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center shrink-0">
          <svg class="w-5 h-5 text-white" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
          </svg>
        </span>
        <div v-if="!sidebarReduite" class="leading-tight">
          <p class="text-sm font-semibold text-white">Projetis</p>
          <p class="text-[11px] text-slate-400">Gestion des projets</p>
        </div>
      </div>

        <nav class="sidebar-scroll flex-1 px-3 py-4 space-y-1 overflow-y-auto">        <NuxtLink
          v-for="item in itemsNav"
          :key="item.chemin"
          :to="item.chemin"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition"
          :class="route.path === item.chemin
            ? 'bg-secondary text-white'
            : 'text-slate-300 hover:bg-white/5 hover:text-white'"
        >
          <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" :d="item.icone" />
          </svg>
          <span v-if="!sidebarReduite">{{ item.label }}</span>
        </NuxtLink>
      </nav>

      <div class="p-3 border-t border-white/10">
        <button
          type="button"
          @click="sidebarReduite = !sidebarReduite"
          class="w-full flex items-center justify-center py-2 rounded-lg text-slate-400 hover:bg-white/5 hover:text-white transition"
        >
          <svg class="w-5 h-5 transition-transform" :class="sidebarReduite ? 'rotate-180' : ''" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>
    </aside>

    <!-- Zone principale -->
    <div class="flex-1 flex flex-col min-w-0">
      <!-- Barre supérieure -->
      <header class="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
        <p class="text-sm font-medium text-ink-light">{{ libelleRole[authStore.role ?? ''] }}</p>

        <div class="relative" v-click-outside="() => (menuProfilOuvert = false)">
  <button
    type="button"
    @click="menuProfilOuvert = !menuProfilOuvert"
    class="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition"
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
    <svg class="w-4 h-4 text-ink-light" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  </button>

  <div
    v-if="menuProfilOuvert"
    class="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-lg shadow-lg py-2 z-50"
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
      class="w-full flex items-center gap-2 px-4 py-2 text-sm text-danger hover:bg-red-50 transition"
    >
      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
      Déconnexion
    </button>
  </div>
</div>
      </header>

      <!-- Contenu -->
      <main class="flex-1 overflow-y-auto p-6">
        <slot />
      </main>
    </div>
  </div>
</template>