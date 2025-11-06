<script setup lang="ts">
import Card from 'primevue/card'
import Button from 'primevue/button'
</script>

<template>
  <div class="space-y-4">
    <!-- Header separado do Card -->
    <div
      class="bg-surface-0 dark:bg-surface-900 rounded-xl p-6 shadow-sm border border-surface-200 dark:border-surface-700"
    >
      <div class="flex items-center gap-3">
        <div
          class="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg flex items-center justify-center"
        >
          <i class="pi pi-box text-green-600 dark:text-green-400 text-2xl leading-none"></i>
        </div>
        <div>
          <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-0 m-0">Itens</h1>
          <p class="text-sm text-surface-600 dark:text-surface-400 mt-1">
            Gerencie os materiais escolares do almoxarifado
          </p>
        </div>
      </div>
    </div>

    <!-- Conteúdo -->
    <Card class="shadow-sm border border-surface-200 dark:border-surface-700">
      <template #content>
        <div class="flex flex-col items-center justify-center py-12">
          <div
            class="bg-surface-100 dark:bg-surface-800 p-6 rounded-full mb-6 flex items-center justify-center"
          >
            <i class="pi pi-box text-surface-400 dark:text-surface-500 text-5xl"></i>
          </div>
          <h2 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mb-2">
            Em Desenvolvimento
          </h2>
          <p class="text-surface-600 dark:text-surface-400 text-center max-w-md mb-6">
            A funcionalidade de gerenciamento de itens está sendo desenvolvida. Em breve você poderá
            cadastrar e organizar todos os materiais escolares.
          </p>
          <div class="flex gap-3">
            <Button
              label="Voltar ao Dashboard"
              icon="pi pi-home"
              @click="$router.push('/')"
              severity="secondary"
            />
          </div>
        </div>

        <!-- Preview de features futuras -->
        <div class="mt-8 pt-8 border-t border-surface-200 dark:border-surface-700">
          <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-4">
            Funcionalidades Previstas
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="flex items-start gap-3 p-4 bg-surface-50 dark:bg-surface-800 rounded-lg">
              <i class="pi pi-plus-circle text-blue-600 dark:text-blue-400 text-lg shrink-0"></i>
              <div>
                <h4 class="font-semibold text-surface-900 dark:text-surface-0 mb-1">
                  Cadastro de Itens
                </h4>
                <p class="text-sm text-surface-600 dark:text-surface-400">
                  Adicione novos materiais com nome, código, categoria e descrição
                </p>
              </div>
            </div>

            <div class="flex items-start gap-3 p-4 bg-surface-50 dark:bg-surface-800 rounded-lg">
              <i class="pi pi-chart-bar text-green-600 dark:text-green-400 text-lg shrink-0"></i>
              <div>
                <h4 class="font-semibold text-surface-900 dark:text-surface-0 mb-1">
                  Controle de Estoque
                </h4>
                <p class="text-sm text-surface-600 dark:text-surface-400">
                  Monitore quantidades, estoque mínimo e alertas automáticos
                </p>
              </div>
            </div>

            <div class="flex items-start gap-3 p-4 bg-surface-50 dark:bg-surface-800 rounded-lg">
              <i class="pi pi-tags text-purple-600 dark:text-purple-400 text-lg shrink-0"></i>
              <div>
                <h4 class="font-semibold text-surface-900 dark:text-surface-0 mb-1">
                  Categorização
                </h4>
                <p class="text-sm text-surface-600 dark:text-surface-400">
                  Organize itens por categorias e subcategorias personalizadas
                </p>
              </div>
            </div>
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>

<style scoped>
/* Corrigir alinhamento vertical dos ícones */
.pi {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  vertical-align: middle;
}

/* Garantir que ícones nos botões estejam centralizados */
:deep(.p-button .p-button-icon) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}
</style>
