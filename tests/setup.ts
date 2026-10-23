/**
 * Setup global dos testes (Vitest + jsdom).
 * Polyfills mínimos para componentes PrimeVue no jsdom.
 */

// matchMedia (usado por componentes/Dropdown em temas)
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList
}

// ResizeObserver (usado por overlays do PrimeVue)
if (typeof globalThis !== 'undefined' && !globalThis.ResizeObserver) {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver
}
