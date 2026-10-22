import assert from 'node:assert/strict'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Window } from 'happy-dom'
import { createInstance } from 'i18next'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { I18nextProvider, initReactI18next } from 'react-i18next'
import { afterAll, describe, test, vi } from 'vitest'

import type { PricingModel } from '../../types'

vi.mock('@visactor/react-vchart', () => ({ VChart: () => null }))

const dom = new Window()
const originalStorage = Object.getOwnPropertyDescriptor(
  globalThis,
  'localStorage'
)
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: dom.localStorage,
})
const { DEFAULT_CURRENCY_CONFIG, useSystemConfigStore } =
  await import('@/stores/system-config-store')
const { ModelDetailsContent, ModelPricingPanel } =
  await import('../model-details')
const initialConfig = useSystemConfigStore.getState().config
const i18n = createInstance()
await i18n.use(initReactI18next).init({
  lng: 'en',
  resources: { en: { translation: {} } },
})

const groupRatio = { core: 0.3, direct: 6.5 }
const model: PricingModel = {
  model_name: 'price-test',
  id: 1,
  quota_type: 0,
  model_ratio: 1,
  completion_ratio: 2,
  enable_groups: ['core', 'direct'],
}

function renderPrices(
  pricingModel: PricingModel,
  view: 'plaza' | 'details' = 'plaza',
  showRechargePrice = false,
  priceRate = 1,
  usdExchangeRate = 1,
  ratios: Record<string, number> = groupRatio
) {
  useSystemConfigStore.getState().setConfig({
    currency: { ...DEFAULT_CURRENCY_CONFIG, usdExchangeRate },
  })
  const client = new QueryClient({
    defaultOptions: { queries: { enabled: false, retry: false, gcTime: 0 } },
  })
  const props = {
    model: pricingModel,
    groupRatio: ratios,
    usableGroup: Object.fromEntries(
      Object.entries(ratios).map(([group, ratio]) => [
        group,
        { desc: group, ratio },
      ])
    ),
    autoGroups: [],
    priceRate,
    usdExchangeRate,
    tokenUnit: 'M' as const,
    showRechargePrice,
  }
  const component =
    view === 'plaza'
      ? createElement(ModelPricingPanel, { ...props, onOpenDetails() {} })
      : createElement(ModelDetailsContent, { ...props, endpointMap: {} })
  const markup = renderToStaticMarkup(
    createElement(
      QueryClientProvider,
      { client },
      createElement(I18nextProvider, { i18n }, component)
    )
  )
  client.clear()
  const container = dom.document.createElement('div')
  container.innerHTML = markup
  return container
}

function tableRows(container: ReturnType<typeof renderPrices>) {
  return [...container.querySelectorAll('tbody tr')].map((row) =>
    [...row.querySelectorAll('td')].map((cell) => cell.textContent?.trim())
  )
}

describe('model original prices and group discounts', () => {
  afterAll(() => {
    useSystemConfigStore.getState().setConfig(initialConfig)
    if (originalStorage) {
      Object.defineProperty(globalThis, 'localStorage', originalStorage)
    } else {
      Reflect.deleteProperty(globalThis, 'localStorage')
    }
    dom.close()
  })

  test('multiplies only the original token price and preserves actual group prices', () => {
    const rows = tableRows(renderPrices(model))

    assert.deepEqual(rows[0]?.slice(0, 5), [
      'Base Price',
      '6.5x',
      '0% off',
      '$13',
      '$26',
    ])
    assert.deepEqual(rows[1]?.slice(0, 5), [
      'core',
      '0.3x',
      '95.38% off',
      '$0.6',
      '$1.2',
    ])
    assert.deepEqual(rows[2]?.slice(0, 5), [
      'direct',
      '6.5x',
      '0% off',
      '$13',
      '$26',
    ])
  })

  test('uses the same original price and group discounts in full details', () => {
    const container = renderPrices(model, 'details')
    const rows = tableRows(container)
    const originalPrice = [...container.querySelectorAll('section')].find(
      (section) => section.firstElementChild?.textContent === 'Base Price'
    )

    assert.ok(originalPrice?.textContent.includes('$13'))
    assert.ok(originalPrice?.textContent.includes('$26'))
    assert.deepEqual(rows[0]?.slice(0, 5), [
      'core',
      '0.3x',
      '95.38% off',
      '$0.6',
      '$1.2',
    ])
    assert.deepEqual(rows[1]?.slice(0, 5), [
      'direct',
      '6.5x',
      '0% off',
      '$13',
      '$26',
    ])
  })

  test('compares fixed request prices with the original benchmark', () => {
    const rows = tableRows(
      renderPrices({ ...model, quota_type: 1, model_price: 2 })
    )

    assert.deepEqual(rows[0], ['Base Price', '6.5x', '0% off', '$13'])
    assert.deepEqual(rows[1], ['core', '0.3x', '95.38% off', '$0.6'])
    assert.deepEqual(rows[2], ['direct', '6.5x', '0% off', '$13'])
  })

  test('uses the original benchmark for dynamic tiers while retaining group billing prices', () => {
    const dynamicModel = {
      ...model,
      billing_mode: 'tiered_expr',
      billing_expr:
        'p <= 100000 ? tier("short", p * 2 + c * 4) : tier("long", p * 4 + c * 8)',
    }
    const container = renderPrices(dynamicModel)
    const rows = tableRows(container)

    assert.deepEqual(rows[0]?.slice(0, 3), ['short', '$13', '$26'])
    assert.deepEqual(rows[1]?.slice(0, 3), ['long', '$26', '$52'])
    assert.deepEqual(rows[2]?.slice(0, 3), ['short', '$0.6', '$1.2'])
    assert.deepEqual(rows[3]?.slice(0, 3), ['long', '$1.2', '$2.4'])
    assert.ok(container.textContent.includes('95.38% off'))

    const details = renderPrices(dynamicModel, 'details')
    const originalPrice = [...details.querySelectorAll('section')].find(
      (section) => section.firstElementChild?.textContent === 'Base Price'
    )
    assert.ok(originalPrice?.textContent.includes('$13'))
    assert.ok(originalPrice?.textContent.includes('$26'))
    assert.deepEqual(tableRows(details).at(-4)?.slice(0, 3), [
      'short',
      '$0.6',
      '$1.2',
    ])
  })

  test('applies recharge conversion once without changing group ratios or discounts', () => {
    const rows = tableRows(renderPrices(model, 'plaza', true, 4, 8))

    assert.deepEqual(rows[0]?.slice(0, 5), [
      'Base Price',
      '6.5x',
      '0% off',
      '$6.5',
      '$13',
    ])
    assert.deepEqual(rows[1]?.slice(0, 5), [
      'core',
      '0.3x',
      '95.38% off',
      '$0.3',
      '$0.6',
    ])
  })

  test('uses production Codex_core and Codex_prime custom ratios for every pricing tier', () => {
    const codexModel: PricingModel = {
      ...model,
      model_name: 'gpt-6.1-sol',
      completion_ratio: 5,
      enable_groups: ['Codex_core', 'Codex_prime'],
      billing_mode: 'tiered_expr',
      billing_expr:
        'len <= 272000 ? tier("base", p * 2 + c * 10 + cr * 0.1 + cc * 2.5) : tier("tier_2", p * 4 + c * 15 + cr * 0.2 + cc * 5)',
    }
    const ratios = { Codex_core: 0.3, Codex_prime: 0.5 }
    const container = renderPrices(codexModel, 'plaza', false, 1, 1, ratios)
    const rows = tableRows(container)

    assert.deepEqual(
      rows.map((row) => row.slice(0, 3)),
      [
        ['base', '$13', '$65'],
        ['tier_2', '$26', '$97.5'],
        ['base', '$0.6', '$3'],
        ['tier_2', '$1.2', '$4.5'],
        ['base', '$1', '$5'],
        ['tier_2', '$2', '$7.5'],
      ]
    )
    assert.ok(container.textContent.includes('Codex_core'))
    assert.ok(container.textContent.includes('95.38% off'))
    assert.ok(container.textContent.includes('Codex_prime'))
    assert.ok(container.textContent.includes('92.31% off'))

    const details = renderPrices(codexModel, 'details', false, 1, 1, ratios)
    assert.deepEqual(tableRows(details).slice(-4), rows.slice(-4))

    const updatedRows = tableRows(
      renderPrices(codexModel, 'plaza', false, 1, 1, {
        Codex_core: 0.4,
        Codex_prime: 0.8,
      })
    )
    assert.deepEqual(updatedRows[2]?.slice(0, 3), ['base', '$0.8', '$4'])
    assert.deepEqual(updatedRows[4]?.slice(0, 3), ['base', '$1.6', '$8'])
  })
})
