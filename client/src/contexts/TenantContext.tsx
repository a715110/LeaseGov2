/**
 * TenantContext — provides the resolved tenant context throughout the app.
 *
 * Populated by TenantProvider on app load via tenantResolverService.
 * All components that need organizationId, tenantConfig, or theme settings
 * read from this context.
 */
import React, { createContext, useContext, useState, useEffect } from 'react'
import type { TenantContext as TenantContextType } from '../types/shared/TenantContext'

const TenantCtx = createContext<TenantContextType | null>(null)

export function useTenantContext(): TenantContextType {
  const ctx = useContext(TenantCtx)
  if (!ctx) throw new Error('useTenantContext must be used within TenantProvider')
  return ctx
}

interface TenantProviderProps {
  children: React.ReactNode
}

export function TenantProvider({ children }: TenantProviderProps) {
  const [tenantCtx, setTenantCtx] = useState<TenantContextType>({
    organizationId: '',
    subdomain: '',
    displayName: 'LeaseGov',
    logoUrl: null,
    tenantConfig: {
      organization_id: '',
      subdomain: '',
      display_name: 'LeaseGov',
      logo_url: null,
      design_theme: 'structured_authority',
      color_mode_default: 'light',
      allow_user_mode_toggle: true,
      branding_accent_color: null,
      default_automation_level: 'collaborative',
      allow_per_contract_automation_override: true,
      features_enabled: [],
      subscription_tier: 'professional',
      created_at: new Date(),
      updated_at: new Date(),
    },
    isResolved: false,
    isLoading: true,
    error: null,
  })

  useEffect(() => {
    // TODO: Replace with real tenant resolution via tenantResolverService
    // For now, resolve with default values so the app renders
    setTenantCtx(prev => ({
      ...prev,
      isLoading: false,
      isResolved: true,
    }))
  }, [])

  return (
    <TenantCtx.Provider value={tenantCtx}>
      {children}
    </TenantCtx.Provider>
  )
}
