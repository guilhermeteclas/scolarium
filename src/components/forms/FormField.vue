<script setup lang="ts">
/**
 * Campo de formulário: label + slot de input + mensagem de erro.
 * O slot deve conter o input com o mesmo :for/:id do label.
 */
defineProps<{
  id: string
  label: string
  error?: string
  required?: boolean
}>()
</script>

<template>
  <div class="mb-5">
    <label :for="id" class="font-bold block mb-2 text-surface-900 dark:text-surface-0">
      {{ label }}<span v-if="required" class="text-red-500"> *</span>
    </label>
    <slot />
    <p
      v-if="error"
      :id="`${id}-error`"
      class="text-xs text-red-600 dark:text-red-400 mt-1"
      role="alert"
    >
      {{ error }}
    </p>
  </div>
</template>
