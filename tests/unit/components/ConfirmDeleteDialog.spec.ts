import { describe, it, expect } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent } from 'vue'
import ConfirmDeleteDialog from '@/components/common/ConfirmDeleteDialog.vue'

/**
 * Stub do Dialog PrimeVue que renderiza os slots (default + footer)
 * mantendo a lógica do próprio ConfirmDeleteDialog testável em jsdom.
 */
const DialogStub = defineComponent({
  props: { visible: { type: Boolean, default: false }, header: { type: String, default: '' } },
  emits: ['update:visible'],
  template: `<div v-if="visible" data-testid="dialog-stub" :data-header="header"><slot /><slot name="footer" /></div>`,
})

function mountDialog(props: Record<string, unknown> = {}): VueWrapper {
  return mount(ConfirmDeleteDialog, {
    props: { visible: true, ...props },
    global: { stubs: { Dialog: DialogStub } },
  })
}

function findButton(wrapper: VueWrapper, label: string) {
  return wrapper.findAll('button').find((b) => b.text().includes(label))
}

describe('ConfirmDeleteDialog', () => {
  it('renderiza mensagem customizada quando fornecida', () => {
    const wrapper = mountDialog({ message: 'Deletar <b>inventário</b>?' })
    expect(wrapper.html()).toContain('<b>inventário</b>')
  })

  it('renderiza mensagem padrão sem message', () => {
    const wrapper = mountDialog()
    expect(wrapper.text()).toContain('Tem certeza que deseja realizar esta ação?')
  })

  it('usa o título padrão de confirmação', () => {
    const wrapper = mountDialog()
    expect(wrapper.find('[data-testid="dialog-stub"]').attributes('data-header')).toBe(
      'Confirmar Exclusão',
    )
  })

  it('usa título customizado', () => {
    const wrapper = mountDialog({ title: 'Remover item' })
    expect(wrapper.find('[data-testid="dialog-stub"]').attributes('data-header')).toBe(
      'Remover item',
    )
  })

  it('emite confirm ao confirmar', async () => {
    const wrapper = mountDialog({ confirmLabel: 'Sim, Deletar' })
    await findButton(wrapper, 'Sim, Deletar')?.trigger('click')
    expect(wrapper.emitted('confirm')).toHaveLength(1)
    // não fecha sozinho (a view controla o estado)
    expect(wrapper.emitted('update:visible')).toBeUndefined()
  })

  it('emite cancel + update:visible(false) ao cancelar', async () => {
    const wrapper = mountDialog({ cancelLabel: 'Não' })
    await findButton(wrapper, 'Não')?.trigger('click')

    expect(wrapper.emitted('cancel')).toHaveLength(1)
    expect(wrapper.emitted('update:visible')?.[0]).toEqual([false])
  })

  it('desabilita botões quando loading', () => {
    const wrapper = mountDialog({ loading: true })
    const buttons = wrapper.findAll('button')
    expect(buttons).toHaveLength(2)
    for (const button of buttons) {
      expect(button.attributes('disabled')).toBeDefined()
    }
  })
})
