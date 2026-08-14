<script setup lang="ts">
import { useNotifications } from '~/Composables/useNotifications'

const { notifications, nonLues, charger, marquerLu, marquerToutLu } = useNotifications()

const ouvert = ref(false)
let intervalle: ReturnType<typeof setInterval> | null = null

function basculer() {
  ouvert.value = !ouvert.value
  if (ouvert.value) charger()
}

function fermer() {
  ouvert.value = false
}

async function surClicNotification(n: { id: string; lu: boolean; lien: string | null }) {
  if (!n.lu) await marquerLu(n.id)
  ouvert.value = false
  if (n.lien) navigateTo(n.lien)
}

onMounted(() => {
  charger()
  intervalle = setInterval(charger, 30000)
})
onBeforeUnmount(() => {
  if (intervalle) clearInterval(intervalle)
})
</script>

<template>
  <div class="relative" v-click-outside="fermer">
    <button
      type="button"
      @click="basculer"
      class="relative inline-flex items-center justify-center w-8 h-8 rounded-full border border-slate-200 bg-card text-ink-light hover:text-secondary hover:border-secondary/40 active:scale-90 transition-all duration-200"
      aria-label="Notifications"
    >
      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
      <span
        v-if="nonLues > 0"
        class="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-danger text-white text-[10px] font-semibold flex items-center justify-center"
      >
        {{ nonLues > 9 ? '9+' : nonLues }}
      </span>
    </button>

    <Transition name="menu-notif">
      <div
        v-if="ouvert"
        class="absolute right-0 mt-2 w-80 bg-card border border-slate-200 rounded-lg shadow-lg z-50 origin-top-right overflow-hidden"
      >
        <div class="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <p class="text-sm font-semibold text-slate-900">Notifications</p>
          <button
            v-if="nonLues > 0"
            type="button"
            @click="marquerToutLu"
            class="text-xs font-medium text-secondary hover:text-primary transition-colors"
          >
            Tout marquer comme lu
          </button>
        </div>

        <div class="max-h-96 overflow-y-auto">
          <button
            v-for="n in notifications"
            :key="n.id"
            type="button"
            @click="surClicNotification(n)"
            class="w-full flex items-start gap-2.5 px-4 py-3 text-left border-b border-slate-50 hover:bg-slate-50/70 transition-colors"
            :class="!n.lu ? 'bg-secondary/5' : ''"
          >
            <span
              class="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
              :class="!n.lu ? 'bg-secondary' : 'bg-transparent'"
            ></span>
            <span class="flex-1 min-w-0">
              <span class="block text-sm text-slate-700 leading-snug">{{ n.message }}</span>
              <span class="block text-xs text-ink-light mt-0.5">{{ n.date }}</span>
            </span>
          </button>

          <p v-if="!notifications.length" class="text-sm text-ink-light text-center py-8">
            Aucune notification pour le moment.
          </p>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.menu-notif-enter-active,
.menu-notif-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.menu-notif-enter-from,
.menu-notif-leave-to {
  opacity: 0;
  transform: scale(0.96) translateY(-4px);
}
</style>