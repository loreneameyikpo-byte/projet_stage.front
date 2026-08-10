import { useAuthStore } from "../stores/auth"
import { defineNuxtRouteMiddleware, navigateTo } from '#app'

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

  const publicPages = ['/', '/login','/mot-de-passe-oublié', '/reinitialiser-mot-de-passe']
  const isPublicPage = publicPages.includes(to.path)

  //  si pas connecté
  if (!authStore.estConnecte && !isPublicPage) {
    if (to.path !== '/login') {
      return navigateTo('/login')
    }
  }
  if (authStore.utilisateur?.mot_de_passe_a_changer && to.path !== '/changer-mot-de-passe') {
    return navigateTo('/changer-mot-de-passe')
  }
  
})
