<script setup lang="ts">
interface Option {
  value: string
  label: string
}

const props = defineProps<{
  modelValue: string
  options: Option[]
  placeholder?: string
  erreur?: string
  disabled?: boolean
  /** Classes complètes du bouton déclencheur — utile pour un style "badge" (ex: statut de projet) */
  triggerClass?: string
}>()

const emit = defineEmits<{ 'update:modelValue': [valeur: string] }>()

const ouvert = ref(false)

const libelleActif = computed(() => {
  const trouve = props.options.find((o) => o.value === props.modelValue)
  return trouve?.label ?? props.placeholder ?? ''
})

function choisir(valeur: string) {
  emit('update:modelValue', valeur)
  ouvert.value = false
}

function basculer() {
  if (props.disabled) return
  ouvert.value = !ouvert.value
}

function fermer() {
  ouvert.value = false
}
</script>

<template>
  <div class="relative" v-click-outside="fermer">
    <button
      type="button"
      :disabled="disabled"
      @click="basculer"
      @keydown.escape="fermer"
      class="w-full flex items-center justify-between gap-2 text-left transition-all duration-200 disabled:opacity-50"
      :class="triggerClass ?? [
        'px-3.5 py-2.5 text-sm rounded-lg border bg-card text-slate-900 focus:outline-none focus:ring-2',
        erreur ? 'border-danger focus:ring-danger/40' : 'border-slate-300 focus:ring-secondary',
      ]"
    >
      <span class="truncate" :class="modelValue !== '' && modelValue != null ? '' : 'text-slate-400'">{{ libelleActif }}</span>
      <svg
        class="w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200"
        :class="ouvert ? 'rotate-180' : ''"
        viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <Transition name="menu-select">
      <div
        v-if="ouvert"
        class="absolute left-0 right-0 mt-2 bg-card border border-slate-200 rounded-lg shadow-lg py-1.5 z-50 max-h-64 overflow-y-auto origin-top"
      >
        <button
          v-for="o in options"
          :key="o.value"
          type="button"
          @click="choisir(o.value)"
          class="w-full flex items-center justify-between gap-2 px-3.5 py-2 text-sm text-left transition-colors duration-150"
          :class="o.value === modelValue ? 'bg-secondary/10 text-secondary font-medium' : 'text-slate-700 hover:bg-slate-50'"
        >
          <span class="truncate">{{ o.label }}</span>
          <svg v-if="o.value === modelValue" class="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </button>

        <p v-if="!options.length" class="px-3.5 py-2 text-sm text-ink-light">Aucune option.</p>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.menu-select-enter-active,
.menu-select-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.menu-select-enter-from,
.menu-select-leave-to {
  opacity: 0;
  transform: scale(0.97) translateY(-4px);
}
</style>