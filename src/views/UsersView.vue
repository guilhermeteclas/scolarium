<script setup lang="ts">
import { ref } from 'vue'

import Card from 'primevue/card'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dropdown from 'primevue/dropdown'

import PageHeader from '@/components/common/PageHeader.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'

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

const columns = [
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
        <LoadingState v-if="loading" />
        <ErrorState v-else-if="error" :error="error" @retry="loadUsers" />

        <div v-else>
          <DataTable :value="users" tableStyle="min-width: 50rem">
            <Column v-for="col of columns" :key="col.field" :field="col.field" :header="col.header">
              <template #body="slotProps">
                <template v-if="col.field === 'firstName'">
                  {{ slotProps.data.firstName }} {{ slotProps.data.lastName }}
                </template>
                <template v-else-if="col.field === 'role'">
                  {{ ROLE_OPTIONS.find(o => o.value === slotProps.data.role)?.label ?? slotProps.data.role }}
                </template>
                <template v-else>
                  {{ slotProps.data[col.field] ?? '—' }}
                </template>
              </template>
            </Column>

            <Column header="Ações" headerStyle="width: 16rem">
              <template #body="slotProps">
                <div class="flex items-center gap-2">
                  <Dropdown v-model="roleDrafts[slotProps.data.id]" :options="ROLE_OPTIONS" optionLabel="label"
                    optionValue="value" placeholder="Papel" class="w-40" :disabled="!canManageUsers"
                    :aria-label="`Papel de ${slotProps.data.firstName ?? slotProps.data.email}`" />
                  <Button v-if="canManageUsers" icon="pi pi-check" severity="success" size="small"
                    :disabled="!hasChanges(slotProps.data)" aria-label="Salvar papel"
                    @click="handleSaveRole(slotProps.data)" />
                </div>
              </template>
            </Column>

            <template #empty>
              <div class="text-center p-6 text-surface-500 dark:text-surface-400">
                Nenhum usuário encontrado.
              </div>
            </template>
          </DataTable>

          <p class="text-xs text-surface-500 dark:text-surface-400 mt-3">
            Dica: você não pode alterar o próprio papel. Alterações valem imediatamente após salvar.
          </p>
        </div>
      </template>
    </Card>
  </div>
</template>
