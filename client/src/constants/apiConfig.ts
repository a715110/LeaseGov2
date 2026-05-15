/**
 * API configuration — all service URLs.
 * Every service file imports URLs from here. No URL is ever hardcoded.
 *
 * // TODO: Backend integration required — replace placeholder URLs with real endpoints
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api'

// ─── Tenant ───────────────────────────────────────────────────────────────────
export const TENANT_RESOLVER_URL      = `${API_BASE}/tenants/resolve`
export const TENANT_CONFIG_URL        = `${API_BASE}/tenants/config`

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const AUTH_LOGIN_URL           = `${API_BASE}/auth/login`
export const AUTH_LOGOUT_URL          = `${API_BASE}/auth/logout`
export const AUTH_REFRESH_URL         = `${API_BASE}/auth/refresh`
export const AUTH_SUPERADMIN_URL      = `${API_BASE}/auth/superadmin/login`

// ─── Screen Registry ──────────────────────────────────────────────────────────
export const SCREEN_REGISTRY_URL      = `${API_BASE}/screen-registry/active`
export const SCREEN_REGISTRY_ADMIN_URL = `${API_BASE}/superadmin/screen-registry`

// ─── Contracts — Property Lease ───────────────────────────────────────────────
export const PROPERTY_LEASE_URL       = `${API_BASE}/contracts/property-leases`

// ─── Documents ────────────────────────────────────────────────────────────────
export const DOCUMENT_UPLOAD_URL      = `${API_BASE}/documents/upload`
export const DOCUMENT_URL             = `${API_BASE}/documents`
export const OCR_URL                  = `${API_BASE}/documents/ocr`
export const EXTRACTION_URL           = `${API_BASE}/documents/extraction`

// ─── Workflows ────────────────────────────────────────────────────────────────
export const WORKFLOW_URL             = `${API_BASE}/workflows`
export const REASSESSMENT_URL         = `${API_BASE}/workflows/reassessments`

// ─── Surveys ──────────────────────────────────────────────────────────────────
export const SURVEY_URL               = `${API_BASE}/surveys`

// ─── Properties ───────────────────────────────────────────────────────────────
export const PROPERTY_URL             = `${API_BASE}/properties`

// ─── Counterparties ───────────────────────────────────────────────────────────
export const COUNTERPARTY_URL         = `${API_BASE}/counterparties`

// ─── Notifications ────────────────────────────────────────────────────────────
export const NOTIFICATION_URL         = `${API_BASE}/notifications`

// ─── Automation ───────────────────────────────────────────────────────────────
export const AUTOMATION_POLICY_URL    = `${API_BASE}/automation/policies`

// ─── Permissions ──────────────────────────────────────────────────────────────
export const PERMISSIONS_URL          = `${API_BASE}/permissions`

// ─── Reporting ────────────────────────────────────────────────────────────────
export const REPORTING_URL            = `${API_BASE}/reporting`

// ─── Export ───────────────────────────────────────────────────────────────────
export const DATA_EXPORT_URL          = `${API_BASE}/export`

// ─── User Preferences ─────────────────────────────────────────────────────────
export const USER_PREFERENCE_URL      = `${API_BASE}/users/preferences`

// ─── SuperAdmin ───────────────────────────────────────────────────────────────
export const SUPERADMIN_TENANT_URL    = `${API_BASE}/superadmin/tenants`
export const SUPERADMIN_HEALTH_URL    = `${API_BASE}/superadmin/health`
export const SUPERADMIN_SUBSCRIPTION_URL = `${API_BASE}/superadmin/subscriptions`

// ─── Future integration points ────────────────────────────────────────────────
// FUTURE: LEASE_ACCOUNTING_ENGINE_URL — IFRS 16 / ASC 842
// FUTURE: REVENUE_RECOGNITION_ENGINE_URL — IFRS 15 / ASC 606
// FUTURE: EQUIPMENT_LEASE_URL — when equipment lease domain is activated
// FUTURE: SERVICE_CONTRACT_URL — when service contract domain is activated
