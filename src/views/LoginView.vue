<script setup lang="ts">
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import { ref } from 'vue'
import { supabase } from '@/lib/supabaseClient'
import router from '@/router'

const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMsg = ref<string | null>(null)

async function signIn() {
  loading.value = true
  errorMsg.value = null
  const { error } = await supabase.auth.signInWithPassword({
    email: email.value,
    password: password.value,
  })
  if (error) {
    errorMsg.value = error.message
  }
  loading.value = false
  router.push('/')
}
</script>

<template>
  <div class="h-[calc(100vh-80px)] flex items-center justify-center px-4 py-4">
    <div
      class="w-full max-w-6xl h-full max-h-[700px] bg-surface-0 dark:bg-surface-900 rounded-2xl shadow-2xl overflow-hidden"
    >
      <div class="grid md:grid-cols-2 gap-0 h-full">
        <!-- Lado Esquerdo - Logo e Texto -->
        <div
          class="bg-linear-to-br from-primary-500 to-primary-700 p-8 md:p-12 flex flex-col justify-center items-center text-white"
        >
          <div class="max-w-md space-y-6">
            <div class="flex justify-center">
              <div class="bg-white/10 backdrop-blur-sm p-4 rounded-3xl">
                <img
                  src="/material-escolar.png"
                  alt="Logo Scolarium"
                  class="w-20 h-20 md:w-24 md:h-24 drop-shadow-lg"
                />
              </div>
            </div>

            <div class="text-center space-y-3">
              <h1 class="text-3xl md:text-4xl font-bold">Scolarium</h1>
              <p class="text-base md:text-lg text-white/90 leading-relaxed">
                Sistema de gestão de materiais escolares e almoxarifado
              </p>
            </div>

            <div class="space-y-3 pt-4">
              <div class="flex items-start gap-3">
                <div class="bg-white/20 rounded-full p-2 mt-0.5 shrink-0">
                  <i class="pi pi-box text-base"></i>
                </div>
                <div>
                  <h3 class="font-semibold text-base">Controle de Estoque</h3>
                  <p class="text-white/80 text-sm">Gerencie materiais e suprimentos</p>
                </div>
              </div>

              <div class="flex items-start gap-3">
                <div class="bg-white/20 rounded-full p-2 mt-0.5 shrink-0">
                  <i class="pi pi-chart-line text-base"></i>
                </div>
                <div>
                  <h3 class="font-semibold text-base">Relatórios</h3>
                  <p class="text-white/80 text-sm">Acompanhe entradas e saídas</p>
                </div>
              </div>

              <div class="flex items-start gap-3">
                <div class="bg-white/20 rounded-full p-2 mt-0.5 shrink-0">
                  <i class="pi pi-shield text-base"></i>
                </div>
                <div>
                  <h3 class="font-semibold text-base">Seguro e Confiável</h3>
                  <p class="text-white/80 text-sm">Dados protegidos e rastreáveis</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Lado Direito - Formulário de Login -->
        <div class="p-6 md:p-10 flex flex-col justify-center overflow-y-auto">
          <div class="max-w-md w-full mx-auto space-y-6">
            <div class="space-y-2">
              <h2 class="text-2xl md:text-3xl font-bold text-surface-900 dark:text-surface-0">
                Bem-vindo de volta
              </h2>
              <p class="text-sm text-surface-600 dark:text-surface-400">
                Entre com suas credenciais para acessar o sistema
              </p>
            </div>

            <form @submit.prevent="signIn" class="space-y-5">
              <div class="space-y-2">
                <label
                  for="email"
                  class="text-surface-900 dark:text-surface-0 font-medium block text-sm"
                >
                  E-mail
                </label>
                <InputText
                  id="email"
                  v-model="email"
                  type="email"
                  placeholder="seu@email.com"
                  class="w-full"
                  autocomplete="email"
                  required
                />
              </div>

              <div class="space-y-2">
                <label
                  for="password"
                  class="text-surface-900 dark:text-surface-0 font-medium block text-sm"
                >
                  Senha
                </label>
                <Password
                  id="password"
                  v-model="password"
                  placeholder="Digite sua senha"
                  :toggleMask="true"
                  :feedback="false"
                  inputClass="w-full"
                  class="w-full"
                  autocomplete="current-password"
                  required
                />
              </div>

              <div
                v-if="errorMsg"
                class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3"
              >
                <div class="flex items-center gap-2">
                  <i class="pi pi-exclamation-circle text-red-600 dark:text-red-400 text-sm"></i>
                  <span class="text-red-600 dark:text-red-400 text-sm">{{ errorMsg }}</span>
                </div>
              </div>

              <Button type="submit" label="Entrar" class="w-full justify-center" :loading="loading">
                <template #icon>
                  <i class="pi pi-sign-in"></i>
                </template>
              </Button>
            </form>

            <div class="text-center text-xs text-surface-600 dark:text-surface-400">
              Problemas para acessar? Entre em contato com o suporte
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
:deep(.p-password) {
  width: 100%;
}

:deep(.p-password-input) {
  width: 100%;
}
</style>
