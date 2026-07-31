<script setup lang="ts">
defineProps<{
  modelValue: string
  label: string
  options: { value: string; label: string }[]
  erreur?: string
  requis?: boolean
  placeholder?: string
}>()

defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<template>
  <div>
    <label class="block text-sm font-medium text-slate-700 mb-1.5">
      {{ label }}
      <span v-if="requis" class="text-danger">*</span>
    </label>

    <select
      :value="modelValue"
      :required="requis"
      @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
      class="w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 transition bg-white"
      :class="erreur ? 'border-danger focus:ring-danger/40' : 'border-slate-300 focus:ring-secondary focus:border-transparent'"
    >
      <option value="" disabled>{{ placeholder ?? 'Sélectionner...' }}</option>
      <option v-for="o in options" :key="o.value" :value="o.value">{{ o.label }}</option>
    </select>

    <p v-if="erreur" class="text-xs text-danger mt-1">{{ erreur }}</p>
  </div>
</template>