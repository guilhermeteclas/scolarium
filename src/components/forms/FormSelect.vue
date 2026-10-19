<script setup lang="ts">
import { computed } from 'vue'
import Dropdown from 'primevue/dropdown'
import FormField from '@/components/forms/FormField.vue'

/**
 * Select (Dropdown PrimeVue) com label e mensagem de erro.
 */
const props = defineProps<{
  id: string
  label: string
  modelValue: unknown
  options: readonly unknown[]
  optionLabel: string
  optionValue?: string
  error?: string
  required?: boolean
  placeholder?: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: unknown): void
}>()

const value = computed({
  get: () => props.modelValue,
  set: (v: unknown) => emit('update:modelValue', v),
})

const dropdownOptions = computed(() => [...props.options])
</script>

<template>
  <FormField :id="id" :label="label" :error="error" :required="required">
    <Dropdown
      :id="id"
      v-model="value"
      :options="dropdownOptions"
      :option-label="optionLabel"
      :option-value="optionValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :aria-invalid="error ? 'true' : undefined"
      :aria-describedby="error ? `${id}-error` : undefined"
      class="w-full"
    />
  </FormField>
</template>
