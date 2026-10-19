<script setup lang="ts">
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'

export type EntityColumn = {
  field: string
  header: string
}

/**
 * DataTable com estados padrão (loading, erro, vazio) e slots:
 * - `cell-{field}`: conteúdo customizado de uma coluna (fallback: valor do campo)
 * - `actions`: coluna de ações (renderizada apenas se usada)
 */
withDefaults(
  defineProps<{
    data: unknown[]
    columns: EntityColumn[]
    loading?: boolean
    error?: Error | string | null
    emptyMessage?: string
    tableStyle?: string
    actionsWidth?: string
  }>(),
  {
    loading: false,
    error: null,
    emptyMessage: 'Nenhum registro encontrado.',
    tableStyle: 'min-width: 50rem',
    actionsWidth: '10rem',
  },
)

defineEmits<{
  (e: 'retry'): void
}>()

/** Resolve caminho com ponto (ex: 'manager.firstName') sem depender de libs. */
function valueAt(row: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc == null) return undefined
    return (acc as Record<string, unknown>)[key]
  }, row)
}
</script>

<template>
  <LoadingState v-if="loading" />
  <ErrorState v-else-if="error" :error="error" @retry="$emit('retry')" />

  <div v-else>
    <DataTable :value="data" :table-style="tableStyle">
      <Column v-for="col in columns" :key="col.field" :field="col.field" :header="col.header">
        <template #body="slotProps">
          <slot :name="`cell-${col.field}`" :data="slotProps.data">
            {{ valueAt(slotProps.data, col.field) ?? '—' }}
          </slot>
        </template>
      </Column>

      <Column v-if="$slots.actions" header="Ações" :header-style="actionsWidth">
        <template #body="slotProps">
          <slot name="actions" :data="slotProps.data" />
        </template>
      </Column>

      <template #empty>
        <div class="text-center p-6 text-surface-500 dark:text-surface-400">
          {{ emptyMessage }}
        </div>
      </template>
    </DataTable>
  </div>
</template>
