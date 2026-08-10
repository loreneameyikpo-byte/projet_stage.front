<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const authStore = useAuthStore()

const libelleRole: Record<string, string> = {
  etudiant: 'Étudiant',
  encadreur: 'Encadreur',
  administrateur: 'Administrateur',
  super_administrateur: 'Super Administrateur',
  jury_externe: 'Membre de jury',
}

const estMonte = ref(false)
onMounted(() => {
  requestAnimationFrame(() => { estMonte.value = true })
})
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-[70vh] text-center px-6 opacity-0" :class="estMonte ? 'animate-entree' : ''">
    <span class="w-16 h-16 rounded-full bg-danger/10 text-danger flex items-center justify-center mb-5">
      <svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
      </svg>
    </span>

    <h1 class="text-xl font-bold text-slate-900 mb-2">Accès refusé</h1>
    <p class="text-sm text-ink-light max-w-sm mb-1">
      Vous n'avez pas les autorisations nécessaires pour accéder à cette page.
    </p>
    <p v-if="authStore.role" class="text-xs text-ink-light mb-6">
      Connecté en tant que <span class="font-medium text-slate-700">{{ libelleRole[authStore.role] ?? authStore.role }}</span>.
    </p>

    <NuxtLink
      to="/"
      class="inline-flex items-center gap-2 bg-secondary hover:bg-primary text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-all hover:-translate-y-0.5"
    >
      Retour à l'accueil
    </NuxtLink>
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
</style>