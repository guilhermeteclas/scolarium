<script setup lang="ts">
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'

defineProps<{
    visible: boolean
    title?: string
    message?: string
    confirmLabel?: string
    cancelLabel?: string
    loading?: boolean
}>()

const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void
    (e: 'confirm'): void
    (e: 'cancel'): void
}>()

function onCancel() {
    emit('update:visible', false)
    emit('cancel')
}

function onConfirm() {
    emit('confirm')
}
</script>

<template>
    <Dialog :visible="visible" :header="title || 'Confirmar Exclusão'" modal :draggable="false" class="w-full md:w-2/5"
        @update:visible="(val) => emit('update:visible', val)">
        <div class="flex items-center">
            <i class="pi pi-exclamation-triangle text-red-500 text-3xl mr-4" />
            <span v-if="message" v-html="message"></span>
            <span v-else>
                Tem certeza que deseja realizar esta ação?
            </span>
        </div>

        <template #footer>
            <Button :label="cancelLabel || 'Cancelar'" icon="pi pi-times" text @click="onCancel" :disabled="loading" />
            <Button :label="confirmLabel || 'Confirmar'" icon="pi pi-check" severity="danger" autofocus
                :loading="loading" @click="onConfirm" />
        </template>
    </Dialog>
</template>
