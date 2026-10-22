import { afterEach, expect, it, vi } from 'vitest'

afterEach(() => {
  localStorage.removeItem('i18nextLng')
})

it('starts in simplified Chinese despite a stored foreign language preference', async () => {
  localStorage.setItem('i18nextLng', 'en')
  vi.resetModules()
  const { default: i18n, resources } = await import('../config')
  expect(Object.keys(resources)).toEqual(['zhCN'])
  expect(i18n.options.supportedLngs).toEqual(['zhCN', 'cimode'])
  expect(i18n.language).toBe('zhCN')
  expect(document.documentElement.lang).toBe('zh-CN')
})
