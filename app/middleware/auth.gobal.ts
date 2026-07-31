import { useAuthStore } from "../stores/auth"
import { navigateTo } from 'nuxt/app'

/**
 * S'exécute avant chaque navigation (fichier suffixé ".global.ts").
 * - Restaure la session au premier chargement (fetchUser via le cookie).
 * - Bloque l'accès aux pages privées si non connecté -> redirige vers /login.
 * - Empêche un utilisateur déjà connecté de revoir /login ou /register.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore()

  if (!authStore.utilisateur) {
    await authStore.fetchMe()
  }

  const publicPages = ['/', '/login',]
  const isPublicPage = publicPages.includes(to.path)

  //  si pas connecté
  if (!authStore.estConnecte && !isPublicPage) {
    if (to.path !== '/login') {
      return navigateTo('/login')
    }
  }

  
})
