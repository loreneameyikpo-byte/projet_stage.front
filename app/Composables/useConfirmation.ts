// Composables/useConfirmation.ts
//
// Même interface qu'avant (demander({...}) -> Promise<boolean>), mais
// implémentée avec SweetAlert2 au lieu de la modale maison. Aucun des
// appelants existants (dashboard-layout.vue, presentations.vue, les pages
// d'évaluation, les tableaux admin...) n'a besoin d'être modifié.

import Swal from 'sweetalert2'

interface OptionsConfirmation {
  titre: string
  message: string
  texteConfirmer?: string
  dangereux?: boolean
}

export function useConfirmation() {
  async function demander(options: OptionsConfirmation): Promise<boolean> {
    const resultat = await Swal.fire({
      title: options.titre,
      text: options.message,
      icon: options.dangereux ? 'warning' : 'question',
      showCancelButton: true,
      confirmButtonText: options.texteConfirmer ?? 'Confirmer',
      cancelButtonText: 'Annuler',
      reverseButtons: true,
      confirmButtonColor: options.dangereux ? 'rgb(var(--color-danger))' : 'rgb(var(--color-secondary))',
      cancelButtonColor: 'rgb(var(--slate-300))',
      background: 'rgb(var(--color-card))',
      color: 'rgb(var(--color-ink))',
      customClass: {
        popup: 'rounded-xl',
      },
    })

    return resultat.isConfirmed
  }

  return { demander }
}