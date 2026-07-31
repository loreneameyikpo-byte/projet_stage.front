interface ErreursValidation {
  message?: string
  errors?: Record<string, string[]>
}

export function useFormErrors() {
  const erreurs = reactive<Record<string, string>>({})
  const erreurGenerale = ref('')

  function reinitialiser() {
    Object.keys(erreurs).forEach((cle) => delete erreurs[cle])
    erreurGenerale.value = ''
  }

  /**
   * À appeler dans le catch d'un appel API. Remplit automatiquement
   * les erreurs par champ (422) ou l'erreur générale (401, 403, 500...).
   */
  function traiter(e: any) {
    reinitialiser()

    const data = e?.data as ErreursValidation | undefined

    if (data?.errors) {
      for (const [champ, messages] of Object.entries(data.errors)) {
        if (messages[0]) {
          erreurs[champ] = messages[0]
        }
      }
    }

    erreurGenerale.value = data?.message || 'Une erreur est survenue. Veuillez réessayer.'
  }

  function champ(nom: string): string | undefined {
    return erreurs[nom]
  }

  return { erreurs, erreurGenerale, traiter, reinitialiser, champ }
}