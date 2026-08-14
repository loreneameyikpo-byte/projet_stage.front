// Composables/useAlerte.ts
//
// Même interface qu'avant (alerter({...}) -> Promise<void>), mais
// implémentée avec SweetAlert2 au lieu de la modale maison à un seul
// bouton. Aucun appelant existant n'a besoin d'être modifié.

import Swal from 'sweetalert2'

interface OptionsAlerte {
  titre?: string
  message: string
}

export function useAlerte() {
  async function alerter(options: OptionsAlerte): Promise<void> {
    await Swal.fire({
      title: options.titre ?? 'Information',
      text: options.message,
      icon: 'warning',
      confirmButtonText: 'Compris',
      confirmButtonColor: 'rgb(var(--color-secondary))',
      background: 'rgb(var(--color-card))',
      color: 'rgb(var(--color-ink))',
      customClass: {
        popup: 'rounded-xl',
      },
    })
  }

  return { alerter }
}