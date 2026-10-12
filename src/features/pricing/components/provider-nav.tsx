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
import { ChevronDown, ChevronRight, Sparkles } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { getLobeIcon } from '@/lib/lobe-icon'
import { cn } from '@/lib/utils'

import { FILTER_ALL } from '../constants'
import { getProviderModels } from '../lib/model-workspace'
import type { PricingModel, PricingVendor } from '../types'

export interface ProviderNavProps {
  vendors: PricingVendor[]
  models: PricingModel[]
  value: string
  onChange: (value: string) => void
  onModelClick: (modelName: string) => void
  selectedModelName?: string | null
  className?: string
}

type ProviderEntry = PricingVendor & { models: PricingModel[] }

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function formatContextLength(value: number): string {
  if (value >= 1_000_000) {
    const millions = value / 1_000_000
    return `${Number.isInteger(millions) ? millions : millions.toFixed(1)}M`
  }
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`
  return value.toLocaleString()
}

export function ProviderNav(props: ProviderNavProps) {
  const { t } = useTranslation()
  const [expandedProviders, setExpandedProviders] = useState<Set<string>>(
    () => new Set()
  )

  const providerEntries = useMemo<ProviderEntry[]>(() => {
    const knownNames = new Set(props.vendors.map((vendor) => vendor.name))
    const entries = props.vendors.map((vendor) => ({
      ...vendor,
      models: getProviderModels(props.models, vendor),
    }))

    for (const model of props.models) {
      const name = model.vendor_name?.trim()
      if (!name || knownNames.has(name)) continue
      knownNames.add(name)
      entries.push({
        id: model.vendor_id ?? entries.length,
        name,
        icon: model.vendor_icon,
        models: props.models.filter((item) => item.vendor_name === name),
      })
    }

    return entries.filter((entry) => entry.models.length > 0)
  }, [props.models, props.vendors])

  useEffect(() => {
    if (providerEntries.length === 0) return
    setExpandedProviders((current) => {
      if (current.size > 0) return current
      return new Set([providerEntries[0].name])
    })
  }, [providerEntries])

  const toggleProvider = (name: string) => {
    setExpandedProviders((current) => {
      const next = new Set(current)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  const expandAll = () => {
    setExpandedProviders((current) =>
      current.size === providerEntries.length
        ? new Set()
        : new Set(providerEntries.map((entry) => entry.name))
    )
  }

  const allModelsActive = props.value === FILTER_ALL
  const allProvidersExpanded =
    providerEntries.length > 0 &&
    expandedProviders.size === providerEntries.length

  return (
    <aside
      aria-label={t('Model providers')}
      className={cn('console-provider-nav', props.className)}
    >
      <div className='console-provider-nav-head'>
        <h2>{t('Provider')}</h2>
        <button type='button' onClick={expandAll}>
          {allProvidersExpanded ? t('Collapse') : t('Expand')}
        </button>
      </div>

      <button
        type='button'
        className={cn('console-provider-group', allModelsActive && 'is-active')}
        onClick={() => props.onChange(FILTER_ALL)}
        aria-pressed={allModelsActive}
      >
        <span className='console-provider-mark is-all' aria-hidden='true'>
          <Sparkles className='size-4' />
        </span>
        <span className='console-provider-copy'>
          <strong>{t('All providers')}</strong>
          <small>
            {props.models.length.toLocaleString()} {t('models')}
          </small>
        </span>
      </button>

      {providerEntries.map((provider) => {
        const isActive = props.value === provider.name
        const isExpanded = expandedProviders.has(provider.name)
        const providerIcon = provider.icon
          ? getLobeIcon(provider.icon, 18)
          : null

        return (
          <div className='console-provider-entry' key={provider.name}>
            <div className='console-provider-group-row'>
              <button
                type='button'
                className={cn(
                  'console-provider-group',
                  isActive && 'is-active'
                )}
                onClick={() => {
                  props.onChange(provider.name)
                  setExpandedProviders((current) =>
                    new Set(current).add(provider.name)
                  )
                }}
                aria-pressed={isActive}
              >
                <span className='console-provider-mark' aria-hidden='true'>
                  {providerIcon || initials(provider.name)}
                </span>
                <span className='console-provider-copy'>
                  <strong>{provider.name}</strong>
                  <small>
                    {provider.models.length.toLocaleString()} {t('models')}
                  </small>
                </span>
              </button>
              <button
                type='button'
                className='console-provider-chevron'
                onClick={() => toggleProvider(provider.name)}
                aria-label={isExpanded ? t('Collapse') : t('Expand')}
                aria-expanded={isExpanded}
              >
                {isExpanded ? <ChevronDown /> : <ChevronRight />}
              </button>
            </div>

            {isExpanded && (
              <div className='console-provider-models'>
                <div className='console-provider-channel'>
                  <span className='console-health-dot' aria-hidden='true' />
                  <span>
                    <strong>{t('Available routes')}</strong>
                    <small>{t('Catalog coverage')}</small>
                  </span>
                </div>
                {provider.models.map((model) => {
                  const isSelected =
                    props.selectedModelName === model.model_name
                  const modelTags = model.tags
                    ?.split(/[,\s]+/)
                    .filter(Boolean)
                    .slice(0, 1)
                    .join('')

                  return (
                    <button
                      type='button'
                      key={model.id ?? model.model_name}
                      className={cn(
                        'console-provider-model',
                        isSelected && 'is-selected'
                      )}
                      onClick={() => {
                        props.onChange(provider.name)
                        props.onModelClick(model.model_name)
                      }}
                      aria-pressed={isSelected}
                    >
                      <code>{model.model_name}</code>
                      <small>
                        {model.context_length
                          ? formatContextLength(model.context_length)
                          : modelTags || t('Pricing')}
                      </small>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </aside>
  )
}
