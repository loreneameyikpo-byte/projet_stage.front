<script setup lang="ts">
const aDefile = ref(false)

function gererScroll() {
  aDefile.value = window.scrollY > 40
}

onMounted(() => {
  window.addEventListener('scroll', gererScroll)
  gererScroll()
})

onUnmounted(() => {
  window.removeEventListener('scroll', gererScroll)
})
</script>

<template>
  <div class="bg-surface text-ink font-sans antialiased">
    <!-- En-tête : transparent sur le hero, blanc opaque une fois défilé -->
    <header
      class="fixed top-0 left-0 right-0 z-50 transition-colors duration-300"
      :class="aDefile ? 'bg-white border-b border-slate-200 shadow-sm' : 'bg-transparent'"
    >
      <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <NuxtLink to="/" class="flex items-center gap-2">
          <span class="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center shrink-0">
            <svg class="w-5 h-5 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
            </svg>
          </span>
          <span class="font-semibold transition-colors" :class="aDefile ? 'text-slate-900' : 'text-white'">
            Projetis
          </span>
        </NuxtLink>

        <NuxtLink
          to="/login"
          class="text-sm font-medium px-4 py-2 rounded-md transition"
          :class="aDefile
            ? 'bg-secondary hover:bg-primary text-white'
            : 'bg-white/10 hover:bg-white/15 text-white border border-white/20'"
        >
          Connexion
        </NuxtLink>
      </div>
    </header>

    <!-- Contenu de la page -->
    <slot />

    <!-- Footer -->
    <footer class="bg-primary py-8">
      <div class="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <span class="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center">
            <svg class="w-4 h-4 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
            </svg>
          </span>
          <span class="font-semibold text-white text-sm">Projetis</span>
        </div>
        <p class="text-secondary text-xs">© 2026 Projetis — Tous droits réservés.</p>
      </div>
    </footer>
  </div>
</template>