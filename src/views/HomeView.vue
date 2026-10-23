<script setup lang="ts">
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

const features = [
  {
    icon: 'pi-box',
    title: 'Controle de Estoque',
    description: 'Gerencie materiais e suprimentos com eficiência e precisão',
  },
  {
    icon: 'pi-chart-line',
    title: 'Relatórios Detalhados',
    description: 'Acompanhe entradas e saídas com dashboards e relatórios completos',
  },
  {
    icon: 'pi-shield',
    title: 'Seguro e Confiável',
    description: 'Dados protegidos e rastreáveis com controle de acesso',
  },
  {
    icon: 'pi-users',
    title: 'Gestão de Usuários',
    description: 'Controle de permissões e responsáveis por movimentações',
  },
]

function navigateToLogin() {
  router.push('/login')
}

function navigateToDashboard() {
  router.push('/dashboard')
}
</script>

<template>
  <div class="min-h-[calc(100vh-80px)]">
    <!-- Hero Section -->
    <div class="bg-linear-to-br from-primary-500 to-primary-700 text-white">
      <div class="container mx-auto px-4 py-16 md:py-24">
        <div class="max-w-4xl mx-auto text-center space-y-8">
          <div class="flex justify-center">
            <div class="bg-white/10 backdrop-blur-sm p-6 rounded-3xl">
              <img
                src="/material-escolar.png"
                alt="Logo Scolarium"
                class="w-24 h-24 md:w-32 md:h-32 drop-shadow-lg"
              />
            </div>
          </div>

          <div class="space-y-4">
            <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold">Scolarium</h1>
            <p class="text-xl md:text-2xl text-white/90 leading-relaxed max-w-2xl mx-auto">
              Sistema de gestão de materiais escolares e almoxarifado
            </p>
          </div>

          <div class="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button
              v-if="!auth.user"
              label="Acessar Sistema"
              icon="pi pi-sign-in"
              size="large"
              @click="navigateToLogin"
              class="bg-white text-primary-600 hover:bg-white/90 border-0"
            />
            <Button
              label="Ver Dashboard"
              icon="pi pi-chart-bar"
              size="large"
              outlined
              @click="navigateToDashboard"
              class="border-white text-white hover:bg-white/10"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Features Section -->
    <div class="bg-surface-50 dark:bg-surface-950 py-16 md:py-20">
      <div class="container mx-auto px-4">
        <div class="max-w-6xl mx-auto">
          <div class="text-center space-y-4 mb-12">
            <h2 class="text-3xl md:text-4xl font-bold text-surface-900 dark:text-surface-0">
              Funcionalidades
            </h2>
            <p class="text-lg text-surface-600 dark:text-surface-400 max-w-2xl mx-auto">
              Tudo que você precisa para gerenciar o almoxarifado da sua instituição
            </p>
          </div>

          <div class="grid md:grid-cols-2 gap-6 lg:gap-8">
            <div
              v-for="feature in features"
              :key="feature.icon"
              class="bg-surface-0 dark:bg-surface-900 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow"
            >
              <div class="flex items-start gap-4">
                <div class="bg-primary-100 dark:bg-primary-900/30 rounded-full p-3 shrink-0">
                  <i
                    :class="['pi', feature.icon, 'text-2xl text-primary-600 dark:text-primary-400']"
                  ></i>
                </div>
                <div class="space-y-2">
                  <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-0">
                    {{ feature.title }}
                  </h3>
                  <p class="text-surface-600 dark:text-surface-400">
                    {{ feature.description }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- CTA Section -->
    <div v-if="!auth.user" class="bg-surface-0 dark:bg-surface-900 py-16">
      <div class="container mx-auto px-4">
        <div class="max-w-3xl mx-auto text-center space-y-6">
          <h2 class="text-3xl md:text-4xl font-bold text-surface-900 dark:text-surface-0">
            Pronto para começar?
          </h2>
          <p class="text-lg text-surface-600 dark:text-surface-400">
            Acesse o sistema e comece a gerenciar seus materiais de forma eficiente
          </p>
          <Button
            label="Fazer Login"
            icon="pi pi-sign-in"
            size="large"
            @click="navigateToLogin"
            class="mt-4"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
