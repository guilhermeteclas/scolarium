<script setup lang="ts">
import Button from 'primevue/button'

defineProps<{
    error: Error | string | null
    retryLabel?: string
}>()

defineEmits<{
    (e: 'retry'): void
}>()
</script>

<template>
    <div v-if="error" class="p-4 text-center">
        <div class="text-red-500 font-bold mb-3">
            {{ typeof error === 'string' ? error : error.message }}
        </div>
        <Button :label="retryLabel || 'Tentar Novamente'" icon="pi pi-refresh" severity="danger" outlined
            @click="$emit('retry')" />
    </div>
</template>
