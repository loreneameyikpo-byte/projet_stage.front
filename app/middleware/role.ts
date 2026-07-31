import { useAuthStore } from "../stores/auth"
import { navigateTo } from 'nuxt/app'

export default defineNuxtRouteMiddleware((to) => {
  const authStore = useAuthStore()
  const rolesAutorises = to.meta.roles as string[] | undefined

  if (rolesAutorises && !rolesAutorises.includes(authStore.role ?? '')) {
    return navigateTo('/acces-refuse')
  }
})