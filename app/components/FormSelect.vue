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

    <SelectPersonnalise
      :model-value="modelValue"
      @update:model-value="$emit('update:modelValue', $event)"
      :options="options"
      :placeholder="placeholder ?? 'Sélectionner...'"
      :erreur="erreur"
    />

    <p v-if="erreur" class="text-xs text-danger mt-1">{{ erreur }}</p>
  </div>
</template>