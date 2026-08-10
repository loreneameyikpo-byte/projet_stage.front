// Composables/useAlerte.ts
//
// Modale d'alerte à un seul bouton ("Compris"), pour informer l'utilisateur
// d'un problème bloquant (ex: champ requis non rempli) sans lui demander
// de confirmer/annuler quoi que ce soit.
//
// Usage dans un composant :
//   const { alerter } = useAlerte()
//   await alerter({ titre: 'Champ requis', message: "Merci de sélectionner un projet." })

import { reactive } from 'vue'

interface EtatAlerte {
  ouverte: boolean
  titre: string
  message: string
}

// État partagé au niveau module : une seule modale pour toute l'app,
// montée une fois dans app.vue (voir AlerteDialog.vue).
const etatAlerte = reactive<EtatAlerte>({
  ouverte: false,
  titre: '',
  message: '',
})

let resoudre: (() => void) | null = null

export function useAlerte() {
  function alerter(options: { titre?: string; message: string }): Promise<void> {
    etatAlerte.titre = options.titre ?? 'Champ requis'
    etatAlerte.message = options.message
    etatAlerte.ouverte = true

    return new Promise((resolve) => {
      resoudre = resolve
    })
  }

  function fermer() {
    etatAlerte.ouverte = false
    resoudre?.()
    resoudre = null
  }

  return { etatAlerte, alerter, fermer }
}