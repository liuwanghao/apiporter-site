/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import assert from 'node:assert/strict'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, test } from 'vitest'

const React = await import('react')
const { act } = React
Object.defineProperty(globalThis, 'React', { configurable: true, value: React })
const { createRoot } = await import('react-dom/client')
const { createInstance } = await import('i18next')
const { I18nextProvider, initReactI18next } = await import('react-i18next')
const { PartnerMetricsOverview, PartnerProgramOverview } =
  await import('../index')
const { LedgerStatusBadge } = await import('../ledger-status-badge')
const { ListPager } = await import('../pager')

const i18n = createInstance()
await i18n.use(initReactI18next).init({
  lng: 'en',
  resources: { en: { translation: {} } },
})

const reactTestGlobals = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean
}
reactTestGlobals.IS_REACT_ACT_ENVIRONMENT = true

async function render(element: React.ReactNode) {
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)

  const client = new QueryClient()
  await act(async () =>
    root.render(
      <QueryClientProvider client={client}>
        <I18nextProvider i18n={i18n}>{element}</I18nextProvider>
      </QueryClientProvider>
    )
  )

  return { container, root }
}

describe('promotion partner overview layout', () => {
  test('combines earnings, performance, plan terms, and referral tools into one partner workspace', async () => {
    const rendered = await render(
      <PartnerMetricsOverview
        membership={{
          id: 1,
          user_id: 2,
          status: 'ACTIVE',
          effective_from: 1_700_000_000,
          created_by: 3,
          created_at: 1_700_000_000,
          updated_at: 1_700_000_000,
        }}
        settings={{
          version: 1,
          commission_rate_bps: 1_000,
          currency: 'USD',
          confirmation_days: 7,
          settlement_cycle: 'MONTHLY',
          timezone: 'Asia/Shanghai',
          minimum_settlement_amount: 5_000,
        }}
        loading={false}
        referralLink='https://example.com/ref/demo'
        onCopyReferral={() => {}}
      />
    )

    const profileCard = rendered.container.querySelector(
      '[data-partner-profile-card]'
    )
    assert.ok(profileCard)
    assert.equal(profileCard.classList.contains('grid'), false)
    const commandCenter = profileCard.querySelector(
      '[data-partner-command-center]'
    )
    const commandGrid = profileCard.querySelector('[data-partner-command-grid]')
    const earningsCard = profileCard.querySelector(
      '[data-partner-earnings-card]'
    )
    const planCard = profileCard.querySelector('[data-partner-plan-card]')
    const referral = profileCard.querySelector('[data-partner-referral]')
    assert.ok(commandCenter)
    assert.ok(commandGrid)
    assert.equal(
      commandGrid.classList.contains(
        'xl:grid-cols-[minmax(0,1.3fr)_minmax(360px,0.9fr)]'
      ),
      true
    )
    assert.ok(earningsCard)
    assert.ok(planCard)
    assert.equal(earningsCard.nextElementSibling, planCard)
    const plan = planCard.querySelector('[data-partner-plan]')
    assert.ok(plan)
    assert.ok(commandCenter.querySelector('[data-partner-status]'))
    assert.ok(referral)
    assert.equal(planCard.querySelector('[data-partner-referral]'), referral)
    assert.equal(plan.classList.contains('xl:flex-1'), true)
    assert.equal(
      Boolean(
        plan.compareDocumentPosition(referral) &
        Node.DOCUMENT_POSITION_FOLLOWING
      ),
      true
    )
    const planTerms = planCard.querySelector('[data-partner-plan-terms]')
    assert.ok(planTerms)
    assert.equal(planTerms.classList.contains('sm:grid-cols-3'), true)
    assert.equal(planTerms.classList.contains('xl:grid-cols-2'), true)
    assert.equal(planTerms.classList.contains('xl:grid-rows-3'), false)
    assert.equal(planTerms.classList.contains('xl:flex-1'), true)
    assert.equal(planTerms.classList.contains('border'), false)
    assert.equal(planTerms.classList.contains('bg-muted/30'), false)
    assert.equal(
      planTerms
        .querySelector('[data-partner-rate]')
        ?.classList.contains('xl:col-span-2'),
      true
    )
    assert.equal(planTerms.children.length, 3)
    assert.equal(planCard.classList.contains('overflow-y-auto'), false)
    assert.equal(planCard.classList.contains('h-full'), true)
    assert.match(planTerms.textContent, /Commission rate\s*10\.00%/)
    assert.match(planTerms.textContent, /Confirmation period\s*7 days/)
    assert.doesNotMatch(planTerms.textContent, /Minimum withdrawal amount/)
    const earningsPrimary = earningsCard.querySelector(
      '[data-earnings-primary]'
    )
    const earningsStages = earningsCard.querySelector('[data-earnings-stages]')
    assert.ok(earningsPrimary)
    assert.equal(earningsPrimary.classList.contains('bg-muted/40'), true)
    assert.ok(
      earningsCard.querySelector(
        '[data-settlement-readiness][role="progressbar"]'
      )
    )
    assert.ok(earningsStages)
    assert.equal(earningsStages.classList.contains('sm:grid-cols-3'), true)
    assert.equal(earningsStages.children.length, 3)
    assert.equal(
      [...earningsStages.children].every(
        (metric) =>
          metric.classList.contains('bg-background/80') &&
          metric.classList.contains('rounded-lg')
      ),
      true
    )
    assert.equal(
      earningsPrimary.querySelector('dd')?.classList.contains('text-primary'),
      false
    )
    assert.equal(
      earningsCard
        .querySelector('[data-partner-performance]')
        ?.classList.contains('bg-muted/25'),
      true
    )
    assert.equal(
      earningsCard
        .querySelector('[data-partner-performance]')
        ?.classList.contains('xl:flex-1'),
      false
    )
    assert.equal(
      earningsCard
        .querySelector('[data-partner-performance]')
        ?.classList.contains('xl:mt-auto'),
      false
    )
    assert.equal(referral.classList.contains('mt-auto'), false)
    const referralControls = referral.querySelector('[data-referral-controls]')
    assert.ok(referralControls)
    assert.equal(
      referralControls.classList.contains('xl:grid-cols-[minmax(0,1fr)_auto]'),
      true
    )
    assert.equal(
      referralControls.querySelector('button')?.classList.contains('xl:w-auto'),
      true
    )
    assert.equal(planCard.querySelector('[data-partner-performance]'), null)
    assert.equal(
      commandCenter
        .querySelector('[data-metric-icon="earnings"]')
        ?.classList.contains('text-emerald-600'),
      true
    )
    assert.equal(
      earningsCard
        .querySelector('[data-metric-icon="performance"]')
        ?.classList.contains('text-primary'),
      false
    )

    await act(async () => rendered.root.unmount())
    rendered.container.remove()
  })

  test('marks confirmed ledger status with a semantic green badge', async () => {
    const rendered = await render(
      <LedgerStatusBadge status='CONFIRMED' label='Confirmed' />
    )

    assert.equal(
      rendered.container
        .querySelector('[data-slot="badge"]')
        ?.classList.contains('text-emerald-700'),
      true
    )

    await act(async () => rendered.root.unmount())
    rendered.container.remove()
  })

  test('supports direct page entry and exposes a page-size selector', async () => {
    let selectedPage = 0
    const rendered = await render(
      <ListPager
        page={3}
        total={200}
        pageSize={10}
        onChange={(page) => {
          selectedPage = page
        }}
        onPageSizeChange={() => {}}
      />
    )

    const input = rendered.container.querySelector<HTMLInputElement>(
      'input[inputmode="numeric"]'
    )
    assert.ok(input)
    assert.ok(rendered.container.querySelector('[role="combobox"]'))
    const setInputValue = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value'
    )?.set
    assert.ok(setInputValue)

    await act(async () => {
      setInputValue.call(input, '17')
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await act(async () => {
      input.dispatchEvent(
        new KeyboardEvent('keydown', {
          bubbles: true,
          key: 'Enter',
        }) as unknown as KeyboardEvent
      )
    })
    assert.equal(selectedPage, 17)

    await act(async () => rendered.root.unmount())
    rendered.container.remove()
  })

  test('keeps the approved partner view visible and offers reactivation when membership is disabled', async () => {
    const rendered = await render(
      <PartnerMetricsOverview
        membership={{
          id: 1,
          user_id: 2,
          application_id: 8,
          status: 'DISABLED',
          effective_from: 1_700_000_000,
          effective_to: 1_710_000_000,
          created_by: 3,
          created_at: 1_700_000_000,
          updated_at: 1_710_000_000,
        }}
        application={{
          id: 8,
          user_id: 2,
          status: 'APPROVED',
          contact_email: 'partner@example.com',
          apply_reason: 'publish tutorials',
          review_reason: '',
          reviewer_id: 3,
          reviewed_at: 1_700_000_000,
          created_at: 1_690_000_000,
          updated_at: 1_700_000_000,
        }}
        loading={false}
        referralLink='https://example.com/ref/demo'
        onCopyReferral={() => {}}
        onRequestReactivation={() => {}}
      />
    )

    const profileCard = rendered.container.querySelector(
      '[data-partner-profile-card]'
    )
    assert.ok(profileCard)
    assert.equal(profileCard.classList.contains('lg:auto-rows-auto'), false)
    assert.equal(profileCard.classList.contains('lg:auto-rows-[260px]'), false)
    const reactivationPanel = rendered.container.querySelector(
      '[data-reactivation-panel]'
    )
    const planTerms = rendered.container.querySelector(
      '[data-partner-plan-terms]'
    )
    assert.ok(reactivationPanel)
    assert.ok(planTerms)
    assert.equal(
      Boolean(
        reactivationPanel.compareDocumentPosition(planTerms) &
        Node.DOCUMENT_POSITION_FOLLOWING
      ),
      true
    )
    assert.ok(
      rendered.container.querySelector(
        '[data-reactivation-panel] [data-request-reactivation]'
      )
    )
    assert.match(rendered.container.textContent, /Disabled/)
    assert.equal(
      rendered.container.querySelector<HTMLButtonElement>(
        '[data-request-reactivation]'
      )?.disabled,
      false
    )
    assert.equal(
      rendered.container
        .querySelector('[data-request-reactivation]')
        ?.classList.contains('bg-primary'),
      true
    )
    assert.match(rendered.container.textContent, /Request reactivation/)

    await act(async () => rendered.root.unmount())
    rendered.container.remove()
  })

  test('only enables settlement requests once confirmed earnings reach the minimum', async () => {
    const baseProps = {
      membership: {
        id: 1,
        user_id: 2,
        status: 'ACTIVE' as const,
        effective_from: 1_700_000_000,
        created_by: 3,
        created_at: 1_700_000_000,
        updated_at: 1_700_000_000,
      },
      settings: {
        version: 1,
        commission_rate_bps: 1_000,
        currency: 'USD',
        confirmation_days: 7,
        settlement_cycle: 'MONTHLY',
        timezone: 'Asia/Shanghai',
        minimum_settlement_amount: 5_000,
      },
      loading: false,
      referralLink: 'https://example.com/ref/demo',
      onCopyReferral: () => {},
      onRequestSettlement: () => {},
    }
    const belowMinimum = await render(
      <PartnerMetricsOverview
        {...baseProps}
        summary={{
          invitee_count: 1,
          consumption_amount: 0,
          estimated_amount: 0,
          confirmed_amount: 4_999,
          settled_amount: 0,
          paid_amount: 0,
          reversal_amount: 0,
        }}
      />
    )
    assert.equal(
      belowMinimum.container.querySelector<HTMLButtonElement>(
        '[data-request-settlement]'
      )?.disabled,
      true
    )
    await act(async () => belowMinimum.root.unmount())
    belowMinimum.container.remove()

    const atMinimum = await render(
      <PartnerMetricsOverview
        {...baseProps}
        summary={{
          invitee_count: 1,
          consumption_amount: 0,
          estimated_amount: 0,
          confirmed_amount: 5_000,
          settled_amount: 0,
          paid_amount: 0,
          reversal_amount: 0,
        }}
      />
    )
    assert.equal(
      atMinimum.container.querySelector<HTMLButtonElement>(
        '[data-request-settlement]'
      )?.disabled,
      false
    )
    await act(async () => atMinimum.root.unmount())
    atMinimum.container.remove()
  })

  test('shows a locked pending state after the disabled partner requests reactivation', async () => {
    const rendered = await render(
      <PartnerMetricsOverview
        membership={{
          id: 1,
          user_id: 2,
          application_id: 8,
          status: 'DISABLED',
          effective_from: 1_700_000_000,
          effective_to: 1_710_000_000,
          created_by: 3,
          created_at: 1_700_000_000,
          updated_at: 1_710_000_000,
        }}
        application={{
          id: 8,
          user_id: 2,
          status: 'PENDING',
          contact_email: 'partner@example.com',
          apply_reason: 'reactivate partnership',
          review_reason: '',
          reviewer_id: 0,
          reviewed_at: null,
          created_at: 1_690_000_000,
          updated_at: 1_720_000_000,
        }}
        loading={false}
        referralLink='https://example.com/ref/demo'
        onCopyReferral={() => {}}
        onRequestReactivation={() => {}}
      />
    )

    assert.equal(
      rendered.container.querySelector<HTMLButtonElement>(
        '[data-request-reactivation]'
      )?.disabled,
      true
    )
    assert.match(rendered.container.textContent, /Reactivation pending/)

    await act(async () => rendered.root.unmount())
    rendered.container.remove()
  })

  test('places the commission rate summary beside the introduction and benefits below', async () => {
    const rendered = await render(
      <PartnerProgramOverview
        settings={{
          version: 1,
          commission_rate_bps: 1_000,
          currency: 'USD',
          confirmation_days: 7,
          settlement_cycle: 'MONTHLY',
          timezone: 'Asia/Shanghai',
          minimum_settlement_amount: 5_000,
        }}
        minimumSettlementAmount={5_000}
        loading={false}
        canApply={false}
        onApply={() => {}}
      />
    )

    const overviewLayout = rendered.container.querySelector(
      '[data-program-overview-layout]'
    )
    const policy = overviewLayout?.querySelector('[data-consumption-policy]')
    const benefits = overviewLayout?.querySelector('[data-program-benefits]')
    assert.ok(overviewLayout)
    assert.ok(overviewLayout.querySelector('[data-program-introduction]'))
    assert.ok(policy)
    assert.equal(policy.classList.contains('bg-muted/30'), true)
    assert.equal(policy.classList.contains('bg-primary/5'), false)
    assert.equal(
      policy.querySelector('span')?.classList.contains('text-primary'),
      false
    )
    assert.doesNotMatch(
      policy.textContent,
      /Consumption commission settings|Consumption commission|Current/
    )
    assert.equal(
      policy.querySelector('[data-policy-terms]')?.children.length,
      3
    )
    assert.ok(benefits)
    assert.equal(benefits.children.length, 3)
    assert.equal(benefits.classList.contains('grid'), true)
    assert.equal(benefits.classList.contains('lg:col-span-2'), true)
    assert.deepEqual(
      Array.from(
        benefits.querySelectorAll('[data-program-benefit-tone]'),
        (item) => item.getAttribute('data-program-benefit-tone')
      ),
      ['blue', 'emerald', 'violet']
    )

    await act(async () => rendered.root.unmount())
    rendered.container.remove()
  })

  test('uses one fixed policy summary instead of a separate plans card', async () => {
    const rendered = await render(
      <PartnerProgramOverview
        settings={null}
        minimumSettlementAmount={0}
        loading={false}
        canApply={false}
        onApply={() => {}}
      />
    )

    assert.equal(
      rendered.container.querySelector('[data-commission-plans]'),
      null
    )
    assert.ok(rendered.container.querySelector('[data-consumption-policy]'))
    const joiningCard = rendered.container.querySelector('[data-joining-steps]')
    const joiningContent = joiningCard?.querySelector(
      '[data-slot="card-content"]'
    )
    assert.ok(joiningCard)
    assert.ok(joiningContent)
    assert.equal(joiningContent.classList.contains('border-t'), false)
    assert.equal(joiningContent.classList.contains('pt-0'), true)

    await act(async () => rendered.root.unmount())
    rendered.container.remove()
  })

  test('shows the current rate without retired commission labels or a plan selector', async () => {
    const rendered = await render(
      <PartnerProgramOverview
        settings={{
          version: 1,
          commission_rate_bps: 1_000,
          currency: 'USD',
          confirmation_days: 7,
          settlement_cycle: 'MONTHLY',
          timezone: 'Asia/Shanghai',
          minimum_settlement_amount: 0,
        }}
        minimumSettlementAmount={0}
        loading={false}
        canApply={false}
        onApply={() => {}}
      />
    )

    assert.match(rendered.container.textContent, /10\.00%/)
    assert.doesNotMatch(
      rendered.container.textContent,
      /Consumption commission settings|Consumption commission|Current/
    )
    assert.doesNotMatch(rendered.container.textContent, /Recharge commission/)
    assert.equal(rendered.container.querySelector('[role="radiogroup"]'), null)
    assert.deepEqual(
      Array.from(
        rendered.container.querySelectorAll('[data-step-number]'),
        (item) => item.getAttribute('data-step-number')
      ),
      ['1', '2', '3', '4']
    )
    const firstStep = rendered.container.querySelector(
      '[data-step-number="1"]'
    )?.parentElement
    assert.ok(firstStep)
    assert.equal(firstStep.classList.contains('flex'), true)
    const firstStepContent = firstStep.querySelector('[data-step-content]')
    assert.ok(firstStepContent)
    assert.match(
      firstStepContent.children[0]?.textContent ?? '',
      /Review commission settings/
    )
    assert.match(
      firstStepContent.children[1]?.textContent ?? '',
      /Review the consumption commission rate and confirmation period\./
    )

    await act(async () => rendered.root.unmount())
    rendered.container.remove()
  })
})
