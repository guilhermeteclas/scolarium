import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import 'primeicons/primeicons.css'
import Lara from '@primeuix/themes/lara'
import ToastService from 'primevue/toastservice'

import './assets/main.css'

const app = createApp(App)

app.use(router)
app.use(createPinia())
app.use(PrimeVue, {
  theme: {
    preset: Lara,
  },
  ripple: true,
  unstyled: false,
  locale: {
    startsWith: 'Começa com',
    contains: 'Contém',
    notContains: 'Não contém',
    endsWith: 'Termina com',
    equals: 'Igual',
    notEquals: 'Diferente',
    noFilter: 'Sem filtro',
    lt: 'Menor que',
    lte: 'Menor ou igual a',
    gt: 'Maior que',
    gte: 'Maior ou igual a',
    dateIs: 'Data é',
    dateIsNot: 'Data não é',
    dateBefore: 'Data antes de',
    dateAfter: 'Data depois de',
    clear: 'Limpar',
    apply: 'Aplicar',
    matchAll: 'Corresponder a todos',
    matchAny: 'Corresponder a qualquer',
    addRule: 'Adicionar regra',
    removeRule: 'Remover regra',
    accept: 'Sim',
    reject: 'Não',
    choose: 'Escolher',
    upload: 'Enviar',
    cancel: 'Cancelar',
    dayNames: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
    dayNamesShort: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
    dayNamesMin: ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'],
    monthNames: [
      'Janeiro',
      'Fevereiro',
      'Março',
      'Abril',
      'Maio',
      'Junho',
      'Julho',
      'Agosto',
      'Setembro',
      'Outubro',
      'Novembro',
      'Dezembro',
    ],
    monthNamesShort: [
      'Jan',
      'Fev',
      'Mar',
      'Abr',
      'Mai',
      'Jun',
      'Jul',
      'Ago',
      'Set',
      'Out',
      'Nov',
      'Dez',
    ],
    today: 'Hoje',
    weekHeader: 'Sem',
    firstDayOfWeek: 0,
    dateFormat: 'dd/mm/yy',
    weak: 'Fraco',
    medium: 'Médio',
    strong: 'Forte',
    passwordPrompt: 'Digite uma senha',
    emptyFilterMessage: 'Nenhum resultado encontrado',
    emptyMessage: 'Nenhuma opção disponível',
  },
})
app.use(ToastService)

app.mount('#app')
