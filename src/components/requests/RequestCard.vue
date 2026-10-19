<script setup lang="ts">
import Button from 'primevue/button'
import StatusBadge from '@/components/ui/StatusBadge.vue'

import { formatDate } from '@/utils/dateFormatter'

import type { Request } from '@/types'

/**
 * Card de pedido na grade (puramente apresentacional).
 * Emits: view (itens), edit, delete.
 */
defineProps<{
  request: Request
  canDelete: boolean
}>()

defineEmits<{
  (e: 'view', requestId: number): void
  (e: 'edit', request: Request): void
  (e: 'delete', request: Request): void
}>()

const fmt = formatDate
</script>

<template>
  <div class="w-full md:w-1/2 px-3 mb-4">
    <div class="cardPretty group h-full w-full p-5 rounded-xl border border-surface-200 dark:border-surface-700
          bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0))]
          hover:border-primary-400 transition-all">
      <div class="flex items-start justify-between mb-3">
        <span class="text-xl font-medium">Pedido {{ request.id }}</span>
        <StatusBadge :status="request.status" />
      </div>

      <div class="space-y-10">
        <p class="text-xl m-0 mb-2 flex items-center gap-2">
          <i class="pi pi-calendar"></i>
          <span>Início:</span>
          <span class="font-medium">{{ fmt(request.reservationStart) }}</span>
        </p>
        <p class="text-xl m-0 mb-2 flex items-center gap-2">
          <i class="pi pi-calendar-plus"></i>
          <span>Término:</span>
          <span class="font-medium">{{ fmt(request.reservationEnd) }}</span>
        </p>
        <p class="text-xl m-0 mb-2 flex items-center gap-2">
          <i class="pi pi-user"></i>
          <span class="truncate">{{ request.requesterName }}</span>
        </p>
        <p class="text-xl m-0 mb-2 flex items-center gap-2">
          <i class="pi pi-info-circle"></i>
          <span class="truncate">{{ request.details }} </span>
        </p>
      </div>

      <div class="mt-2 flex justify-end">
        <Button class="m-2" icon="pi pi-eye" severity="success" size="large" aria-label="Itens"
          @click="$emit('view', request.id)" />

        <Button class="m-2" icon="pi pi-pencil" severity="info" size="large" aria-label="Editar"
          @click="$emit('edit', request)" />

        <Button v-if="canDelete" class="m-2" icon="pi pi-trash" severity="danger" size="large"
          aria-label="Deletar" @click="$emit('delete', request)" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.cardPretty {
  width: 100%;
  margin: 0;
}

.cardPretty:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.28);
}

.pi {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  vertical-align: middle;
}
</style>
