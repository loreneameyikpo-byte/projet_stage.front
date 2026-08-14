// Composables/useNotifications.ts
//
// État partagé (via useState, donc unique pour toute l'app) pour les
// notifications de l'utilisateur connecté. Utilisé par NotificationsCloche.vue.

import { useApi } from '~/Composables/useApi'

interface NotificationItem {
  id: string
  type: string | null
  message: string
  lien: string | null
  lu: boolean
  date: string
}

export function useNotifications() {
  const { apiFetch } = useApi()

  const notifications = useState<NotificationItem[]>('notifications-liste', () => [])
  const nonLues = useState<number>('notifications-non-lues', () => 0)

  async function charger() {
    try {
      const data = await apiFetch<{ notifications: NotificationItem[]; non_lues: number }>('/notifications')
      notifications.value = data.notifications
      nonLues.value = data.non_lues
    } catch {
      // Silencieux : un utilisateur sans droit d'accès (pas super admin pour
      // l'instant) obtient simplement une liste vide, ce n'est pas une erreur.
    }
  }

  async function marquerLu(id: string) {
    try {
      await apiFetch(`/notifications/${id}/marquer-lu`, { method: 'POST' })
    } catch {
      return
    }
    const n = notifications.value.find((item) => item.id === id)
    if (n && !n.lu) {
      n.lu = true
      nonLues.value = Math.max(0, nonLues.value - 1)
    }
  }

  async function marquerToutLu() {
    try {
      await apiFetch('/notifications/marquer-tout-lu', { method: 'POST' })
    } catch {
      return
    }
    notifications.value.forEach((n) => { n.lu = true })
    nonLues.value = 0
  }

  return { notifications, nonLues, charger, marquerLu, marquerToutLu }
}