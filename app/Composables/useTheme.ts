// composables/useTheme.ts
//
// Gère la préférence de thème (clair/sombre), la persiste dans localStorage,
// et applique/retire la classe .dark sur <html>.
//
// L'état initial est déjà posé avant l'hydratation par le script injecté
// dans nuxt.config.ts (voir nuxt.config.snippet.ts) pour éviter le flash
// de mauvais thème au chargement.

export type Theme = 'light' | 'dark'

export function useTheme() {
  const theme = useState<Theme>('theme', () => 'light')

  function appliquer(t: Theme) {
    theme.value = t
    if (import.meta.client) {
      document.documentElement.classList.toggle('dark', t === 'dark')
      localStorage.setItem('theme', t)
    }
  }

  function basculer() {
    appliquer(theme.value === 'dark' ? 'light' : 'dark')
  }

  function initialiser() {
    if (!import.meta.client) return
    // Le script anti-flash (voir nuxt.config) a déjà posé la classe .dark
    // sur <html> si besoin ; on synchronise juste notre état réactif dessus.
    const estSombre = document.documentElement.classList.contains('dark')
    theme.value = estSombre ? 'dark' : 'light'
  }

  return { theme, basculer, appliquer, initialiser }
}