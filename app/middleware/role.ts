import { useAuthStore } from "../stores/auth"
import { navigateTo } from 'nuxt/app'

export default defineNuxtRouteMiddleware((to) => {
  const authStore = useAuthStore()
  const rolesAutorises = to.meta.roles as string[] | undefined

  console.log('[role middleware]', {
    chemin: to.path,
    rolesAutorises,
    roleActuel: authStore.role,
    estConnecte: authStore.estConnecte,
  })

  if (!authStore.estConnecte) {
    return navigateTo('/login')
  }

  if (rolesAutorises && !rolesAutorises.includes(authStore.role ?? '')) {
    return navigateTo('/acces-refuse')
  }
})