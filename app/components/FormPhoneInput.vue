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
          'form-phone-input w-full rounded-lg border bg-card text-slate-900 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 transition',
          erreur
            ? 'border-danger focus:ring-danger/40'
            : 'border-slate-300 focus:ring-secondary focus:border-secondary',
        ].join(' ')"
        @change-number="surChangement"
      />
      <template #fallback>
        <div class="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-ink-light bg-slate-50">
          Chargement...
        </div>
      </template>
    </ClientOnly>

    <p v-if="aide && !erreur" class="text-xs text-ink-light mt-1">{{ aide }}</p>
    <p v-if="erreur" class="text-xs text-danger mt-1">{{ erreur }}</p>
  </div>
</template>

<style>
/*
  Alignement du composant intl-tel-input sur le style des autres champs
  (FormInput) et sur le système de thème clair/sombre — le plugin fournit
  ses propres couleurs en dur par défaut, on les remplace ici par nos
  classes Tailwind theme-aware (via @apply) plutôt que des hex fixes.
*/
.iti {
  width: 100%;
}

/* Bouton du drapeau / indicatif sélectionné */
.iti__selected-country {
  @apply rounded-l-lg transition-colors;
}
.iti__selected-country:hover,
.iti__selected-country:focus {
  @apply bg-slate-50;
}
.iti__selected-country-primary {
  @apply text-slate-700;
}
.iti__arrow {
  border-top-color: rgb(var(--slate-500)) !important;
}

/* Liste déroulante des pays */
.iti__dropdown-content {
  @apply bg-card border border-slate-200 rounded-lg shadow-lg;
}
.iti__country-list {
  @apply bg-card text-slate-900 rounded-lg;
  font-size: 14px;
}
.iti__country {
  @apply text-slate-700;
}
.iti__country:hover,
.iti__country.iti__highlight {
  @apply bg-slate-50;
}
.iti__divider {
  @apply border-slate-100;
}
.iti__search-input {
  @apply bg-card text-slate-900 border-slate-200 rounded-md;
}
.iti__search-input::placeholder {
  @apply text-slate-400;
}

/* Champ numéro lui-même */
.iti .form-phone-input {
  background-color: transparent;
}
</style>