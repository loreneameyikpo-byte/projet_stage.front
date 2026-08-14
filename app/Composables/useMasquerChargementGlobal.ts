// Composables/useMasquerChargementGlobal.ts
//
// État partagé permettant à une page de désactiver ponctuellement le spinner
// global (ChargementGlobal.vue) pour SA prochaine navigation — utile quand
// la page affiche déjà son propre message/feedback et qu'on ne veut pas
// superposer un second indicateur de chargement.
//
// Se réarme automatiquement une fois la navigation terminée (voir
// ChargementGlobal.vue), donc pas besoin de le remettre à false soi-même.

export function useMasquerChargementGlobal() {
  return useState('masquerChargementGlobal', () => false)
}