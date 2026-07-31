<script setup lang="ts">
import IntlTelInput from '@intl-tel-input/vue'

defineProps<{
  modelValue: string
  label: string
  erreur?: string
  requis?: boolean
  aide?: string
}>()

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

function surChangement(value: string) {
  emit('update:modelValue', value)
}
</script>

<template>
  <div>
    <label class="block text-sm font-medium text-slate-700 mb-1.5">
      {{ label }}
      <span v-if="requis" class="text-danger">*</span>
    </label>

    <ClientOnly>
      <IntlTelInput
        :model-value="modelValue"
        initial-country="tg"
        :only-countries="[]"
        :load-utils="() => import('intl-tel-input/utils')"
        :input-class="[
          'form-phone-input w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 transition',
          erreur
            ? 'border-danger focus:ring-danger/40'
            : 'border-slate-300 focus:ring-secondary focus:border-secondary',
        ].join(' ')"
        @change-number="surChangement"
      />
      <template #fallback>
        <div class="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-400 bg-slate-50">
          Chargement...
        </div>
      </template>
    </ClientOnly>

    <p v-if="aide && !erreur" class="text-xs text-ink-light mt-1">{{ aide }}</p>
    <p v-if="erreur" class="text-xs text-danger mt-1">{{ erreur }}</p>
  </div>
</template>

<style>
/* Alignement du composant sur la palette Projetis */
.iti { width: 100%; }
.iti__country-list {
  border-radius: 8px;
  border-color: #E2E8F0;
  font-size: 14px;
}
.iti__selected-country:hover {
  background-color: #F8FAFC;
}
</style>