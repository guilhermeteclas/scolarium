<script setup lang="ts">
import { getStatusLabel, getStatusClass } from '@/utils/requestStatus'

import type { RequestStatus } from '@/types'

/**
 * Badge de status de pedido (cor + label via utilitário compartilhado).
 */
defineProps<{
  status: RequestStatus | null
}>()
</script>

<template>
  <span class="text-xl font-semibold px-2 py-1 rounded-md" :class="getStatusClass(status)">
    {{ getStatusLabel(status) }}
  </span>
</template>
