/**
 * Tenant configuration — fetched on app load, drives theme, automation, and feature flags.
 */
import type { ThemeKey, ColorMode } from './ThemeMode'

export interface TenantConfiguration {
  organization_id: string
  subdomain: string
  display_name: string
  logo_url: string | null

  // Theme and appearance
  design_theme: ThemeKey
  color_mode_default: ColorMode
  allow_user_mode_toggle: boolean
  branding_accent_color: string | null   // Professional/Enterprise override

  // Automation defaults
  default_automation_level: 'full_autonomous' | 'collaborative' | 'full_manual'
  allow_per_contract_automation_override: boolean

  // Feature flags
  features_enabled: string[]

  // Subscription
  subscription_tier: 'starter' | 'professional' | 'enterprise'

  created_at: Date
  updated_at: Date
}
