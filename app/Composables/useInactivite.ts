

// Déconnecte automatiquement l'utilisateur après une période d'inactivité,
// avec un avertissement (compte à rebours) affiché juste avant.
//
// À démarrer uniquement dans les layouts authentifiés (dashboard), pas sur
// les pages publiques — voir demarrer()/arreter() appelés depuis
// layouts/dashboard.vue.

const DUREE_INACTIVITE_MS = 10 * 60 * 1000 // 10 minutes avant déconnexion
const DUREE_AVERTISSEMENT_MS = 30 * 1000   // avertissement affiché 30s avant la fin

const EVENEMENTS_ACTIVITE = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'] as const

export function useInactivite() {
  const avertissementVisible = useState('inactivite-avertissement', () => false)
  const secondesRestantes = useState('inactivite-secondes', () => Math.floor(DUREE_AVERTISSEMENT_MS / 1000))

  let timerAvertissement: ReturnType<typeof setTimeout> | null = null
  let timerDeconnexion: ReturnType<typeof setTimeout> | null = null
  let intervalleCompteARebours: ReturnType<typeof setInterval> | null = null

  function nettoyerTimers() {
    if (timerAvertissement) clearTimeout(timerAvertissement)
    if (timerDeconnexion) clearTimeout(timerDeconnexion)
    if (intervalleCompteARebours) clearInterval(intervalleCompteARebours)
    timerAvertissement = null
    timerDeconnexion = null
    intervalleCompteARebours = null
  }

  function demarrerCompteARebours() {
    secondesRestantes.value = Math.floor(DUREE_AVERTISSEMENT_MS / 1000)
    intervalleCompteARebours = setInterval(() => {
      secondesRestantes.value -= 1
      if (secondesRestantes.value <= 0 && intervalleCompteARebours) {
        clearInterval(intervalleCompteARebours)
        intervalleCompteARebours = null
      }
    }, 1000)
  }

  async function deconnexionAutomatique() {
    nettoyerTimers()
    avertissementVisible.value = false
    const authStore = useAuthStore()
    await authStore.logout('/login')
  }

  function reinitialiser() {
    nettoyerTimers()
    avertissementVisible.value = false

    timerAvertissement = setTimeout(() => {
      avertissementVisible.value = true
      demarrerCompteARebours()
    }, DUREE_INACTIVITE_MS - DUREE_AVERTISSEMENT_MS)

    timerDeconnexion = setTimeout(() => {
      deconnexionAutomatique()
    }, DUREE_INACTIVITE_MS)
  }

  function resterConnecte() {
    reinitialiser()
  }

  function surActivite() {
    // Une fois l'avertissement affiché, on ignore les mouvements/clics
    // "passifs" — l'utilisateur doit cliquer explicitement sur
    // "Rester connecté(e)" pour confirmer sa présence.
    if (avertissementVisible.value) return
    reinitialiser()
  }

  function demarrer() {
    if (!import.meta.client) return
    reinitialiser()
    EVENEMENTS_ACTIVITE.forEach((e) => window.addEventListener(e, surActivite, { passive: true }))
  }

  function arreter() {
    nettoyerTimers()
    if (!import.meta.client) return
    EVENEMENTS_ACTIVITE.forEach((e) => window.removeEventListener(e, surActivite))
  }

  return { avertissementVisible, secondesRestantes, demarrer, arreter, resterConnecte, deconnexionAutomatique }
}