<script setup lang="ts">
import Button from 'primevue/button'

defineProps<{
  title: string
  subtitle?: string
  icon?: string
  iconClass?: string
  iconBgClass?: string
  buttonLabel?: string
  buttonIcon?: string
  buttonSeverity?: string
}>()

defineEmits<{
  (e: 'action'): void
}>()
</script>

<template>
  <div
    class="bg-surface-0 dark:bg-surface-900 rounded-xl p-6 shadow-sm border border-surface-200 dark:border-surface-700"
  >
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <div
          v-if="icon"
          class="p-3 rounded-lg"
          :class="iconBgClass || 'bg-primary-100 dark:bg-primary-900/30'"
        >
          <i
            class="pi text-2xl"
            :class="[icon, iconClass || 'text-primary-600 dark:text-primary-400']"
          ></i>
        </div>
        <div>
          <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-0 m-0">{{ title }}</h1>
          <p v-if="subtitle" class="text-sm text-surface-600 dark:text-surface-400 mt-1">
            {{ subtitle }}
          </p>
        </div>
      </div>
      <div v-if="buttonLabel || $slots.actions">
        <slot name="actions">
          <Button
            v-if="buttonLabel"
            :label="buttonLabel"
            :icon="buttonIcon"
            :severity="buttonSeverity || 'primary'"
            @click="$emit('action')"
          />
        </slot>
      </div>
    </div>
  </div>
</template>
