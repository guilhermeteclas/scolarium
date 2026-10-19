<script setup lang="ts">
import { ref } from 'vue'

import Card from 'primevue/card'
import Button from 'primevue/button'
import Dropdown from 'primevue/dropdown'

import PageHeader from '@/components/common/PageHeader.vue'
import EntityDataTable, { type EntityColumn } from '@/components/ui/EntityDataTable.vue'

import { useToast } from 'primevue/usetoast'
import { safeParse } from 'valibot'
import { useUsers } from '@/composables/useUsers'
import { usePermissions } from '@/composables/usePermissions'
import { UserRoleUpdateSchema } from '@/schemas'

import type { UserView, UserRole } from '@/types'

/**
 * Gestão de usuários (admin): lista perfis e altera papéis.
 * Alterações validadas por schema; serviço bloqueia auto-mudança;
 * RLS garante que apenas admin atualiza papéis.
 */
const toast = useToast()
const { loading, fetchUsers, updateUserRole } = useUsers()
const { canManageUsers } = usePermissions()

const users = ref<UserView[]>([])
const error = ref<Error | null>(null)

// Rascunho de papel por usuário (só persiste ao salvar)
const roleDrafts = ref<Record<string, UserRole>>({})

const ROLE_OPTIONS: Array<{ label: string; value: UserRole }> = [
  { label: 'Administrador', value: 'admin' },
  { label: 'Gestor', value: 'manager' },
  { label: 'Usuário', value: 'user' },
]

const columns: EntityColumn[] = [
  { field: 'firstName', header: 'Nome' },
  { field: 'email', header: 'E-mail' },
  { field: 'role', header: 'Papel' },
]

function hasChanges(user: UserView): boolean {
  return roleDrafts.value[user.id] !== undefined && roleDrafts.value[user.id] !== user.role
}

async function loadUsers() {
  try {
    users.value = await fetchUsers()
    roleDrafts.value = {}
    error.value = null
  } catch (e) {
    error.value = e instanceof Error ? e : new Error('Erro ao carregar usuários')
    toast.add({
      severity: 'error',
      summary: 'Erro de Carregamento',
      detail: error.value.message,
      life: 5000,
    })
  }
}

loadUsers()

async function handleSaveRole(user: UserView) {
  const parsed = safeParse(UserRoleUpdateSchema, { role: roleDrafts.value[user.id] })
  if (!parsed.success) {
    toast.add({
      severity: 'warn',
      summary: 'Atenção',
      detail: parsed.issues[0].message,
      life: 3000,
    })
    return
  }

  try {
    await updateUserRole(user.id, parsed.output.role)
    toast.add({
      severity: 'success',
      summary: 'Sucesso!',
      detail: `Papel de "${user.firstName ?? user.email}" atualizado para "${parsed.output.role}".`,
      life: 3000,
    })
    await loadUsers()
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Erro ao atualizar papel'
    toast.add({
      severity: 'error',
      summary: 'Erro ao atualizar',
      detail: message,
      life: 5000,
    })
  }
}
</script>

<template>
  <div class="space-y-4">
    <PageHeader title="Usuários" subtitle="Gerencie os papéis e acessos do sistema" icon="pi-users"
      icon-class="text-indigo-600 dark:text-indigo-400" icon-bg-class="bg-indigo-100 dark:bg-indigo-900/30" />

    <Card class="shadow-sm border border-surface-200 dark:border-surface-700">
      <template #content>
        <EntityDataTable :data="users" :columns="columns" :loading="loading" :error="error"
          empty-message="Nenhum usuário encontrado." actions-width="16rem" @retry="loadUsers">
          <template #cell-firstName="{ data }">
            {{ data.firstName }} {{ data.lastName }}
          </template>

          <template #cell-role="{ data }">
            {{ ROLE_OPTIONS.find(o => o.value === data.role)?.label ?? data.role }}
          </template>

          <template #actions="{ data }">
            <div class="flex items-center gap-2">
              <Dropdown v-model="roleDrafts[data.id]" :options="ROLE_OPTIONS" optionLabel="label"
                optionValue="value" placeholder="Papel" class="w-40" :disabled="!canManageUsers"
                :aria-label="`Papel de ${data.firstName ?? data.email}`" />
              <Button v-if="canManageUsers" icon="pi pi-check" severity="success" size="small"
                :disabled="!hasChanges(data)" aria-label="Salvar papel"
                @click="handleSaveRole(data)" />
            </div>
          </template>
        </EntityDataTable>

        <p class="text-xs text-surface-500 dark:text-surface-400 mt-3">
          Dica: você não pode alterar o próprio papel. Alterações valem imediatamente após salvar.
        </p>
      </template>
    </Card>
  </div>
</template>
