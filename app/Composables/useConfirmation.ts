interface OptionsConfirmation {
  titre?: string
  message: string
  texteConfirmer?: string
  texteAnnuler?: string
  dangereux?: boolean
}

interface EtatConfirmation extends OptionsConfirmation {
  ouverte: boolean
  resoudre: ((valeur: boolean) => void) | null
}

const etat = reactive<EtatConfirmation>({
  ouverte: false,
  titre: 'Confirmer',
  message: '',
  texteConfirmer: 'Confirmer',
  texteAnnuler: 'Annuler',
  dangereux: false,
  resoudre: null,
})

export function useConfirmation() {
  function demander(options: OptionsConfirmation): Promise<boolean> {
    etat.titre = options.titre ?? 'Confirmer'
    etat.message = options.message
    etat.texteConfirmer = options.texteConfirmer ?? 'Confirmer'
    etat.texteAnnuler = options.texteAnnuler ?? 'Annuler'
    etat.dangereux = options.dangereux ?? false
    etat.ouverte = true

    return new Promise((resolve) => {
      etat.resoudre = resolve
    })
  }

  function confirmer() {
    etat.resoudre?.(true)
    etat.ouverte = false
    etat.resoudre = null
  }

  function annuler() {
    etat.resoudre?.(false)
    etat.ouverte = false
    etat.resoudre = null
  }

  return { demander, etatConfirmation: etat, confirmer, annuler }
}