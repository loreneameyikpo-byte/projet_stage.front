<script setup lang="ts">
const props = defineProps<{
  modelValue: string | number
  label: string
  type?: string
  erreur?: string
  requis?: boolean
  placeholder?: string
  aide?: string
}>()

defineEmits<{ 'update:modelValue': [value: string] }>()

const motDePasseVisible = ref(false)

const estChampMotDePasse = computed(() => props.type === 'password')

const typeReel = computed(() => {
  if (estChampMotDePasse.value) {
    return motDePasseVisible.value ? 'text' : 'password'
  }
  return props.type ?? 'text'
})
</script>


<template>
  <div>
    <label class="block text-sm font-medium text-slate-700 mb-1.5">
      {{ label }}
      <span v-if="requis" class="text-danger">*</span>
    </label>

   
    <div class="relative">
      <input
        :value="modelValue"
        :type="typeReel"
        :placeholder="placeholder"
        :required="requis"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        class="w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 transition"
        :class="[
          erreur
            ? 'border-danger focus:ring-danger/40'
            : 'border-slate-300 focus:ring-secondary focus:border-transparent',
          estChampMotDePasse ? 'pr-10' : '',
        ]"
      />

      <button
        v-if="estChampMotDePasse"
        type="button"
        tabindex="-1"
        @click="motDePasseVisible = !motDePasseVisible"
        class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
        :aria-label="motDePasseVisible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'"
      >
        <!-- œil ouvert -->
        <svg v-if="!motDePasseVisible" class="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <!-- œil barré -->
        <svg v-else class="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
        </svg>
      </button>
    </div>
    
    <p v-if="aide && !erreur" class="text-xs text-ink-light mt-1">{{ aide }}</p>
    <p v-if="erreur" class="text-xs text-danger mt-1">{{ erreur }}</p>
  </div>
</template>