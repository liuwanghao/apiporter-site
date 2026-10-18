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
import { MousePointerClick } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { PublicLayout } from '@/components/layout'
import { PublicLegalFooter } from '@/components/layout/components/public-legal-footer'
import { PageTransition } from '@/components/page-transition'

import {
  EmptyState,
  LoadingSkeleton,
  ModelDetailsDrawer,
  ProviderNav,
  PricingToolbar,
  ModelPricingPanel,
} from './components'
import { EXCLUDED_GROUPS } from './constants'
import { useFilters } from './hooks/use-filters'
import { usePricingData } from './hooks/use-pricing-data'
import {
  getModelWorkspaceView,
  resolveWorkspaceModel,
} from './lib/model-workspace'

export function Pricing() {
  const { t } = useTranslation()
  const [selectedModelName, setSelectedModelName] = useState<string | null>(
    null
  )
  const [detailsOpen, setDetailsOpen] = useState(false)

  const {
    models,
    vendors,
    groupRatio,
    usableGroup,
    endpointMap,
    autoGroups,
    isLoading,
    priceRate,
    usdExchangeRate,
  } = usePricingData()

  const {
    searchInput,
    sortBy,
    vendorFilter,
    groupFilter,
    quotaTypeFilter,
    endpointTypeFilter,
    tagFilter,
    tokenUnit,
    viewMode,
    showRechargePrice,
    setSearchInput,
    setSortBy,
    setVendorFilter,
    setGroupFilter,
    setQuotaTypeFilter,
    setEndpointTypeFilter,
    setTagFilter,
    setTokenUnit,
    setShowRechargePrice,
    filteredModels,
    providerNavigationModels,
    hasActiveFilters,
    activeFilterCount,
    availableTags,
    clearFilters,
    clearSearch,
  } = useFilters(models || [])

  const handleModelClick = useCallback((modelName: string) => {
    setDetailsOpen(false)
    setSelectedModelName(modelName)
  }, [])

  const handleVendorChange = useCallback(
    (value: string) => {
      setDetailsOpen(false)
      setSelectedModelName(null)
      setVendorFilter(value)
    },
    [setVendorFilter]
  )

  const selectedModel = useMemo(
    () =>
      resolveWorkspaceModel(filteredModels, selectedModelName, vendors || []),
    [filteredModels, selectedModelName, vendors]
  )

  const availableGroups = useMemo(
    () =>
      Object.keys(usableGroup || {}).filter(
        (g) => !EXCLUDED_GROUPS.includes(g)
      ),
    [usableGroup]
  )

  const handleClearAll = useCallback(() => {
    clearFilters()
    clearSearch()
  }, [clearFilters, clearSearch])

  const renderModelWorkspace = () => {
    const workspaceView = getModelWorkspaceView({
      hasSelectedModel: Boolean(selectedModel),
      filteredModelCount: filteredModels.length,
    })

    if (workspaceView === 'pricing' && selectedModel) {
      return (
        <ModelPricingPanel
          model={selectedModel}
          groupRatio={groupRatio || {}}
          usableGroup={usableGroup || {}}
          autoGroups={autoGroups || []}
          priceRate={priceRate ?? 1}
          usdExchangeRate={usdExchangeRate ?? 1}
          tokenUnit={tokenUnit}
          showRechargePrice={showRechargePrice}
          onOpenDetails={() => setDetailsOpen(true)}
        />
      )
    }

    if (workspaceView === 'empty-results') {
      return (
        <EmptyState
          searchQuery={searchInput}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={handleClearAll}
        />
      )
    }

    return (
      <div className='console-model-selection-empty'>
        <span className='console-model-selection-orb' aria-hidden='true'>
          <MousePointerClick className='size-7' />
        </span>
        <span className='console-model-selection-eyebrow'>
          {t('Select from the provider list')}
        </span>
        <h2>{t('Choose a model to inspect')}</h2>
        <p>
          {t(
            'Click a model on the left to compare its pricing across your configured groups.'
          )}
        </p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <PublicLayout gradientBackground showMainContainer={false}>
        <div className='console-model-plaza-loading mx-auto w-full max-w-[1524px] px-3 pt-16 pb-8 sm:px-6 sm:pt-20 sm:pb-10 xl:px-8'>
          <LoadingSkeleton viewMode={viewMode} />
        </div>
        <PublicLegalFooter />
      </PublicLayout>
    )
  }

  return (
    <PublicLayout gradientBackground showMainContainer={false}>
      <div className='console-model-plaza relative'>
        <PageTransition className='console-model-plaza-content relative mx-auto w-full max-w-[1524px] px-3 pt-16 pb-8 sm:px-6 sm:pt-20 sm:pb-10 xl:px-8'>
          <header className='console-model-plaza-heading'>
            <h1 className='public-page-title font-bold'>{t('Model Square')}</h1>
            <p className='text-muted-foreground/80 mt-3 text-sm sm:mt-4 sm:text-base'>
              {t('This site currently has {{count}} models enabled', {
                count: models?.length || 0,
              })}
            </p>
            <p className='public-page-lead text-muted-foreground/60 mt-2 max-w-2xl'>
              {t(
                'Discover curated AI models, compare pricing and capabilities, and choose the right model for every scenario.'
              )}
            </p>
          </header>

          <PricingToolbar
            searchInput={searchInput}
            onSearchChange={setSearchInput}
            onClearSearch={clearSearch}
            filteredCount={filteredModels.length}
            totalCount={models?.length}
            sortBy={sortBy}
            onSortChange={setSortBy}
            tokenUnit={tokenUnit}
            onTokenUnitChange={setTokenUnit}
            showRechargePrice={showRechargePrice}
            onRechargePriceChange={setShowRechargePrice}
            quotaTypeFilter={quotaTypeFilter}
            endpointTypeFilter={endpointTypeFilter}
            vendorFilter={vendorFilter}
            groupFilter={groupFilter}
            tagFilter={tagFilter}
            onQuotaTypeChange={setQuotaTypeFilter}
            onEndpointTypeChange={setEndpointTypeFilter}
            onVendorChange={handleVendorChange}
            onGroupChange={setGroupFilter}
            onTagChange={setTagFilter}
            vendors={vendors || []}
            groups={availableGroups}
            groupRatios={groupRatio}
            tags={availableTags}
            models={models || []}
            hasActiveFilters={hasActiveFilters}
            activeFilterCount={activeFilterCount}
            onClearFilters={clearFilters}
          />

          <div className='console-model-plaza-layout'>
            <ProviderNav
              vendors={vendors || []}
              models={providerNavigationModels}
              value={vendorFilter}
              onChange={handleVendorChange}
              onModelClick={handleModelClick}
              selectedModelName={selectedModel?.model_name ?? null}
              className='console-model-plaza-sidebar'
            />

            <main className='console-model-plaza-main min-w-0'>
              {renderModelWorkspace()}
            </main>
          </div>

          {selectedModel && (
            <ModelDetailsDrawer
              open={detailsOpen}
              onOpenChange={setDetailsOpen}
              model={selectedModel}
              groupRatio={groupRatio || {}}
              usableGroup={usableGroup || {}}
              endpointMap={
                (endpointMap as Record<
                  string,
                  { path?: string; method?: string }
                >) || {}
              }
              autoGroups={autoGroups || []}
              priceRate={priceRate ?? 1}
              usdExchangeRate={usdExchangeRate ?? 1}
              tokenUnit={tokenUnit}
              showRechargePrice={showRechargePrice}
            />
          )}
        </PageTransition>
      </div>
      <PublicLegalFooter />
    </PublicLayout>
  )
}
