<script setup lang="ts">
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import ProgressSpinner from 'primevue/progressspinner'

/**
 * Modal genérico de criação/edição:
 * cabeçalho, conteúdo (slot), rodapé padrão Cancelar/Salvar
 * (substituível pelo slot `footer`) e estado de carregamento.
 */
withDefaults(
  defineProps<{
    visible: boolean
    title: string
    loading?: boolean
    saveLabel?: string
    cancelLabel?: string
    /** Classe extra aplicada ao diálogo (largura responsiva etc.) */
    dialogClass?: string
    /** Estilo extra aplicado ao diálogo (width, maxHeight etc.) */
    dialogStyle?: Record<string, string>
  }>(),
  {
    loading: false,
    saveLabel: 'Salvar',
    cancelLabel: 'Cancelar',
    dialogClass: 'w-full md:w-3/5 lg:w-2/5',
    dialogStyle: undefined,
  },
)

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'save'): void
  (e: 'cancel'): void
}>()

function close() {
  emit('update:visible', false)
}

function onCancel() {
  emit('cancel')
  close()
}
</script>

<template>
  <Dialog
    :visible="visible"
    :header="title"
    :modal="true"
    :draggable="false"
    :class="dialogClass"
    :style="dialogStyle"
    @update:visible="(val) => emit('update:visible', val)"
  >
    <div v-if="loading" class="flex justify-center py-8">
      <ProgressSpinner />
    </div>
    <slot v-else />

    <template #footer>
      <slot name="footer">
        <div class="flex justify-end gap-2">
          <Button type="button" :label="cancelLabel" icon="pi pi-times" text @click="onCancel" />
          <Button
            type="button"
            :label="saveLabel"
            icon="pi pi-check"
            severity="success"
            :loading="loading"
            @click="emit('save')"
          />
        </div>
      </slot>
    </template>
  </Dialog>
</template>
