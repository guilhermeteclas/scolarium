import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PageHeader from '@/components/common/PageHeader.vue'
import ErrorState from '@/components/common/ErrorState.vue'

describe('PageHeader', () => {
  it('renderiza título e subtítulo', () => {
    const wrapper = mount(PageHeader, {
      props: { title: 'Inventários', subtitle: 'Gerencie os almoxarifados' },
    })

    expect(wrapper.find('h1').text()).toBe('Inventários')
    expect(wrapper.text()).toContain('Gerencie os almoxarifados')
  })

  it('renderiza ícone quando informado', () => {
    const wrapper = mount(PageHeader, {
      props: { title: 'Itens', icon: 'pi-box', iconClass: 'text-green-600' },
    })

    expect(wrapper.find('i.pi.pi-box').exists()).toBe(true)
  })

  it('emite action pelo botão padrão', async () => {
    const wrapper = mount(PageHeader, {
      props: { title: 'Pedidos', buttonLabel: 'Novo Pedido' },
    })

    const button = wrapper.find('button')
    expect(button.text()).toContain('Novo Pedido')
    await button.trigger('click')

    expect(wrapper.emitted('action')).toHaveLength(1)
  })

  it('o slot actions substitui o botão padrão', () => {
    const wrapper = mount(PageHeader, {
      props: { title: 'X', buttonLabel: 'Padrão' },
      slots: { actions: '<button id="custom-action">Custom</button>' },
    })

    expect(wrapper.find('#custom-action').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('Padrão')
  })
})

describe('ErrorState', () => {
  it('renderiza a mensagem de erro string', () => {
    const wrapper = mount(ErrorState, { props: { error: 'Erro de conexão' } })
    expect(wrapper.text()).toContain('Erro de conexão')
  })

  it('renderiza a mensagem de Error', () => {
    const wrapper = mount(ErrorState, { props: { error: new Error('Timeout') } })
    expect(wrapper.text()).toContain('Timeout')
  })

  it('renderiza nada sem erro', () => {
    const wrapper = mount(ErrorState, { props: { error: null } })
    expect(wrapper.text()).not.toContain('Tentar Novamente')
  })

  it('emite retry ao clicar no botão', async () => {
    const wrapper = mount(ErrorState, { props: { error: 'Erro' } })
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('retry')).toHaveLength(1)
  })

  it('usa o label de retry customizado', () => {
    const wrapper = mount(ErrorState, {
      props: { error: 'Erro', retryLabel: 'Recarregar' },
    })
    expect(wrapper.text()).toContain('Recarregar')
  })
})
