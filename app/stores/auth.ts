import { defineStore } from 'pinia'
import { useApi } from '~/Composables/useApi'

interface Utilisateur {
  id: string
  nom: string
  prenom: string
  email: string
  role: string
  promotion?: { id: string; annee: number; intitule: string }
  filiere?: string
  specialite?: string
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    utilisateur: null as Utilisateur | null,
  }),

  getters: {
    estConnecte: (state) => !!state.utilisateur,
    role: (state) => state.utilisateur?.role ?? null,
  },

  actions: {
    async login(email: string, password: string) {
      const { apiFetch } = useApi()
      const token = useCookie('auth_token', { maxAge: 60 * 60 * 24 * 7 })

      const data = await apiFetch<{ token: string; utilisateur: Utilisateur }>('/login', {
        method: 'POST',
        body: { email, password },
      })

      token.value = data.token
      this.utilisateur = data.utilisateur

      return data.utilisateur
    },

    async logout() {
      const { apiFetch } = useApi()
      const token = useCookie('auth_token')

      try {
        await apiFetch('/logout', { method: 'POST' })
      } finally {
        token.value = null
        this.utilisateur = null
        navigateTo('/login')
      }
    },

    async fetchMe() {
      const { apiFetch } = useApi()

      try {
        const data = await apiFetch<{ utilisateur: Utilisateur }>('/me')
        this.utilisateur = data.utilisateur
        return data.utilisateur
      } catch {
        this.utilisateur = null
        return null
      }
    },

    redirectionParRole() {
      const chemins: Record<string, string> = {
        etudiant: '/etudiant/tableau-de-bord',
        encadreur: '/encadreur/tableau-de-bord',
        administrateur: '/admin/tableau-de-bord',
        super_administrateur: '/super-admin/tableau-de-bord',
        jury_externe: '/jury/tableau-de-bord',
      }

      const chemin = this.utilisateur ? chemins[this.utilisateur.role] : null
      navigateTo(chemin ?? '/login')
    },
  },
})