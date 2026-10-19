<script setup lang="ts">
import { computed } from 'vue'
import FormField from '@/components/forms/FormField.vue'

/**
 * Textarea com label e mensagem de erro (aceita string | null como v-model).
 */
const props = defineProps<{
  id: string
  label: string
  modelValue: string | null
  error?: string
  required?: boolean
  rows?: number
  placeholder?: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const value = computed({
  get: () => props.modelValue ?? '',
  set: (v: string) => emit('update:modelValue', v),
})
</script>

<template>
  <FormField :id="id" :label="label" :error="error" :required="required">
    <textarea
      :id="id"
      v-model="value"
      :rows="rows ?? 3"
      :placeholder="placeholder"
      :disabled="disabled"
      :aria-invalid="error ? 'true' : undefined"
      :aria-describedby="error ? `${id}-error` : undefined"
      class="w-full px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-surface-0 dark:bg-surface-800 text-surface-900 dark:text-surface-0 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
    />
  </FormField>
</template>
