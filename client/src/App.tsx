/**
 * App.tsx — LeaseGov root application.
 *
 * Architecture: MASTER_FRONTEND_ARCHITECTURE_V4
 * Design: Structured Authority (deep navy sidebar, IBM Plex Sans, minimal)
 *
 * Provider stack (outer → inner):
 * 1. ErrorBoundary
 * 2. TenantProvider (resolves organizationId, tenantConfig)
 * 3. LeaseGovThemeProvider (injects CSS custom properties, manages color mode)
 * 4. TooltipProvider
 * 5. Toaster (sonner)
 * 6. Router
 *
 * ScreenGate wraps every authenticated route.
 * Two-layer check: registry enabled → role match.
 *
 * NOTE: isRegistryLoaded is hardcoded to true for scaffold phase.
 * Replace with real registry fetch in app bootstrap sequence.
 */
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Route, Switch } from 'wouter'
import ErrorBoundary from './components/ErrorBoundary'
import { AppShell } from './components/layout/AppShell'
import { ScreenGate } from './components/shared/ScreenGate'
import { LeaseGovThemeProvider } from './contexts/LeaseGovThemeProvider'
import { TenantProvider } from './contexts/TenantContext'
import { SCREEN_KEYS } from './constants/screenKeys'
import NotFound from './pages/NotFound'

// ─── Auth pages (no AppShell) ─────────────────────────────────────────────────
import LoginPage from './pages/auth/Login'
import SuperAdminLoginPage from './pages/auth/SuperAdminLogin'
import MfaChallengePage from './pages/auth/MfaChallenge'
import PasswordResetPage from './pages/auth/PasswordReset'

// ─── Portfolio ────────────────────────────────────────────────────────────────
import PortfolioDashboardPage from './pages/portfolio/PortfolioDashboard'
import PortfolioExceptionQueuePage from './pages/portfolio/PortfolioExceptionQueue'
import PortfolioWorkflowSummaryPage from './pages/portfolio/PortfolioWorkflowSummary'

// ─── Property Lease — List ────────────────────────────────────────────────────
import PropertyLeaseListPage from './pages/contracts/propertyLease/PropertyLeaseList'
import PropertyLeaseSearchPage from './pages/contracts/propertyLease/PropertyLeaseSearch'

// ─── Property Lease — Record ──────────────────────────────────────────────────
import PropertyLeaseRecordOverviewPage from './pages/contracts/propertyLease/PropertyLeaseRecordOverview'
import PropertyLeaseRecordTermsPage from './pages/contracts/propertyLease/PropertyLeaseRecordTerms'
import PropertyLeaseRecordDocumentsPage from './pages/contracts/propertyLease/PropertyLeaseRecordDocuments'
import PropertyLeaseRecordWorkflowPage from './pages/contracts/propertyLease/PropertyLeaseRecordWorkflow'
import PropertyLeaseRecordHistoryPage from './pages/contracts/propertyLease/PropertyLeaseRecordHistory'
import PropertyLeaseRecordAgentPage from './pages/contracts/propertyLease/PropertyLeaseRecordAgent'
import PropertyLeaseRecordReassessmentPage from './pages/contracts/propertyLease/PropertyLeaseRecordReassessment'

// ─── Onboarding Workflow ──────────────────────────────────────────────────────
import OnboardingDocumentUploadPage from './pages/onboarding/OnboardingDocumentUpload'
import OnboardingOcrProcessingPage from './pages/onboarding/OnboardingOcrProcessing'
import OnboardingExtractionReviewPage from './pages/onboarding/OnboardingExtractionReview'
import OnboardingDataValidationPage from './pages/onboarding/OnboardingDataValidation'
import OnboardingSurveyDispatchPage from './pages/onboarding/OnboardingSurveyDispatch'
import OnboardingApprovalPage from './pages/onboarding/OnboardingApproval'

// ─── Reassessment Workflow ────────────────────────────────────────────────────
import ReassessmentAnalysisPage from './pages/workflows/ReassessmentAnalysis'
import ReassessmentReviewPage from './pages/workflows/ReassessmentReview'
import ReassessmentUpdatePage from './pages/workflows/ReassessmentUpdate'
import ReassessmentApprovalPage from './pages/workflows/ReassessmentApproval'

// ─── Documents ────────────────────────────────────────────────────────────────
import DocumentLibraryPage from './pages/documents/DocumentLibrary'
import DocumentViewerPage from './pages/documents/DocumentViewer'
import DocumentExtractionDetailPage from './pages/documents/DocumentExtractionDetail'
import DocumentUploadPage from './pages/documents/DocumentUpload'

// ─── Surveys ──────────────────────────────────────────────────────────────────
import SurveyListPage from './pages/surveys/SurveyList'
import SurveyDetailPage from './pages/surveys/SurveyDetail'
import SurveyResponseFormPage from './pages/surveys/SurveyResponseForm'

// ─── Checkpoints ──────────────────────────────────────────────────────────────
import CheckpointQueuePage from './pages/workflows/CheckpointQueue'
import CheckpointDetailPage from './pages/workflows/CheckpointDetail'

// ─── Notifications ────────────────────────────────────────────────────────────
import NotificationCentrePage from './pages/notifications/NotificationCentre'

// ─── Settings ─────────────────────────────────────────────────────────────────
import SettingsProfilePage from './pages/settings/SettingsProfile'
import SettingsAutomationPage from './pages/settings/SettingsAutomation'
import SettingsNotificationsPage from './pages/settings/SettingsNotifications'
import SettingsAppearancePage from './pages/settings/SettingsAppearance'

// ─── SuperAdmin ───────────────────────────────────────────────────────────────
import SuperAdminTenantListPage from './pages/superadmin/SuperAdminTenantList'
import SuperAdminTenantDetailPage from './pages/superadmin/SuperAdminTenantDetail'
import SuperAdminSystemHealthPage from './pages/superadmin/SuperAdminSystemHealth'

// ─── Phase 2 — Equipment Lease (FUTURE SLOT — not yet active) ───────────────
// TO ACTIVATE: add EQUIPMENT_LEASE to ACTIVE_CONTRACT_TYPES in constants/contractTypes.ts
// and remove the /* FUTURE_SLOT */ comments below.
import EquipmentLeaseListPage from './pages/contracts/equipmentLease/EquipmentLeaseList'
import EquipmentLeaseRecordOverviewPage from './pages/contracts/equipmentLease/EquipmentLeaseRecordOverview'
import EquipmentLeaseRecordTermsPage from './pages/contracts/equipmentLease/EquipmentLeaseRecordTerms'
import EquipmentLeaseRecordWorkflowPage from './pages/contracts/equipmentLease/EquipmentLeaseRecordWorkflow'

// ─── Phase 2 — Service Contract (FUTURE SLOT — not yet active) ───────────────
// TO ACTIVATE: add SERVICE_CONTRACT to ACTIVE_CONTRACT_TYPES in constants/contractTypes.ts
// and remove the /* FUTURE_SLOT */ comments below.
import ServiceContractListPage from './pages/contracts/serviceContract/ServiceContractList'
import ServiceContractRecordOverviewPage from './pages/contracts/serviceContract/ServiceContractRecordOverview'
import ServiceContractRecordTermsPage from './pages/contracts/serviceContract/ServiceContractRecordTerms'
import ServiceContractRecordWorkflowPage from './pages/contracts/serviceContract/ServiceContractRecordWorkflow'

// ─── Phase 2 — Reporting ──────────────────────────────────────────────────────
import ReportingPortfolioAnalyticsPage from './pages/settings/ReportingPortfolioAnalytics'
import ReportingAutomationEfficiencyPage from './pages/settings/ReportingAutomationEfficiency'
import ReportingAuditExportPage from './pages/settings/ReportingAuditExport'

// ─── Phase 2 — Counterparties & Properties ────────────────────────────────────
import CounterpartyListPage from './pages/counterparties/CounterpartyList'
import CounterpartyDetailPage from './pages/counterparties/CounterpartyDetail'
import PropertyListPage from './pages/properties/PropertyList'
import PropertyDetailPage from './pages/properties/PropertyDetail'

// ─── Phase 2 — SuperAdmin additions ──────────────────────────────────────────
import SuperAdminScreenRegistryPage from './pages/superadmin/SuperAdminScreenRegistry'
import SuperAdminSubscriptionManagementPage from './pages/superadmin/SuperAdminSubscriptionManagement'
import SuperAdminAuditLogPage from './pages/superadmin/SuperAdminAuditLog'

// ─── Phase 2 — Onboarding Wizard ─────────────────────────────────────────────
import OnboardingWizardStartPage from './pages/onboarding/OnboardingWizardStart'
import OnboardingWizardCompletePage from './pages/onboarding/OnboardingWizardComplete'

// ─── Scaffold: registry is pre-loaded as all-enabled for development ──────────
// TODO: Replace with real registry fetch in app bootstrap sequence
const IS_REGISTRY_LOADED = true

// ─── Gate helper ─────────────────────────────────────────────────────────────
function Gate({
  screenKey,
  children,
}: {
  screenKey: string
  children: React.ReactNode
}) {
  return (
    <ScreenGate
      screenKey={screenKey as any}
      isRegistryLoaded={IS_REGISTRY_LOADED}
      userRoles={['admin']}
    >
      {children}
    </ScreenGate>
  )
}

// ─── Authenticated layout wrapper ────────────────────────────────────────────
function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell userRoles={['admin']} organizationName="LeaseGov" userDisplayName="Admin User">
      {children}
    </AppShell>
  )
}

function Router() {
  return (
    <Switch>
      {/* ── Public / Auth ──────────────────────────────────────────────── */}
      <Route path="/login" component={LoginPage} />
      <Route path="/superadmin/login" component={SuperAdminLoginPage} />
      <Route path="/mfa" component={MfaChallengePage} />
      <Route path="/password-reset" component={PasswordResetPage} />

      {/* ── Portfolio ──────────────────────────────────────────────────── */}
      <Route path="/portfolio">
        <AuthenticatedLayout>
          <Gate screenKey={SCREEN_KEYS.PORTFOLIO_DASHBOARD}>
            <PortfolioDashboardPage />
          </Gate>
        </AuthenticatedLayout>
      </Route>
      <Route path="/portfolio/exceptions">
        <AuthenticatedLayout>
          <Gate screenKey={SCREEN_KEYS.PORTFOLIO_EXCEPTION_QUEUE}>
            <PortfolioExceptionQueuePage />
          </Gate>
        </AuthenticatedLayout>
      </Route>
      <Route path="/portfolio/workflows">
        <AuthenticatedLayout>
          <Gate screenKey={SCREEN_KEYS.PORTFOLIO_WORKFLOW_SUMMARY}>
            <PortfolioWorkflowSummaryPage />
          </Gate>
        </AuthenticatedLayout>
      </Route>

      {/* ── Property Lease — List ──────────────────────────────────────── */}
      <Route path="/contracts/property-leases">
        <AuthenticatedLayout>
          <Gate screenKey={SCREEN_KEYS.PROPERTY_LEASE_LIST}>
            <PropertyLeaseListPage />
          </Gate>
        </AuthenticatedLayout>
      </Route>
      <Route path="/contracts/property-leases/search">
        <AuthenticatedLayout>
          <Gate screenKey={SCREEN_KEYS.PROPERTY_LEASE_SEARCH}>
            <PropertyLeaseSearchPage />
          </Gate>
        </AuthenticatedLayout>
      </Route>

      {/* ── Property Lease — Record ────────────────────────────────────── */}
      <Route path="/contracts/property-leases/:leaseId/overview">
        <AuthenticatedLayout>
          <Gate screenKey={SCREEN_KEYS.PROPERTY_LEASE_RECORD_OVERVIEW}>
            <PropertyLeaseRecordOverviewPage />
          </Gate>
        </AuthenticatedLayout>
      </Route>
      <Route path="/contracts/property-leases/:leaseId/terms">
        <AuthenticatedLayout>
          <Gate screenKey={SCREEN_KEYS.PROPERTY_LEASE_RECORD_TERMS}>
            <PropertyLeaseRecordTermsPage />
          </Gate>
        </AuthenticatedLayout>
      </Route>
      <Route path="/contracts/property-leases/:leaseId/documents">
        <AuthenticatedLayout>
          <Gate screenKey={SCREEN_KEYS.PROPERTY_LEASE_RECORD_DOCUMENTS}>
            <PropertyLeaseRecordDocumentsPage />
          </Gate>
        </AuthenticatedLayout>
      </Route>
      <Route path="/contracts/property-leases/:leaseId/workflow">
        <AuthenticatedLayout>
          <Gate screenKey={SCREEN_KEYS.PROPERTY_LEASE_RECORD_WORKFLOW}>
            <PropertyLeaseRecordWorkflowPage />
          </Gate>
        </AuthenticatedLayout>
      </Route>
      <Route path="/contracts/property-leases/:leaseId/history">
        <AuthenticatedLayout>
          <Gate screenKey={SCREEN_KEYS.PROPERTY_LEASE_RECORD_HISTORY}>
            <PropertyLeaseRecordHistoryPage />
          </Gate>
        </AuthenticatedLayout>
      </Route>
      <Route path="/contracts/property-leases/:leaseId/agent">
        <AuthenticatedLayout>
          <Gate screenKey={SCREEN_KEYS.PROPERTY_LEASE_RECORD_AGENT}>
            <PropertyLeaseRecordAgentPage />
          </Gate>
        </AuthenticatedLayout>
      </Route>
      <Route path="/contracts/property-leases/:leaseId/reassessment">
        <AuthenticatedLayout>
          <Gate screenKey={SCREEN_KEYS.PROPERTY_LEASE_RECORD_REASSESSMENT}>
            <PropertyLeaseRecordReassessmentPage />
          </Gate>
        </AuthenticatedLayout>
      </Route>

      {/* ── Onboarding Workflow ────────────────────────────────────────── */}
      <Route path="/onboarding/:workflowId/upload">
        <AuthenticatedLayout>
          <Gate screenKey={SCREEN_KEYS.ONBOARDING_DOCUMENT_UPLOAD}>
            <OnboardingDocumentUploadPage />
          </Gate>
        </AuthenticatedLayout>
      </Route>
      <Route path="/onboarding/:workflowId/ocr">
        <AuthenticatedLayout>
          <Gate screenKey={SCREEN_KEYS.ONBOARDING_OCR_PROCESSING}>
            <OnboardingOcrProcessingPage />
          </Gate>
        </AuthenticatedLayout>
      </Route>
      <Route path="/onboarding/:workflowId/extraction">
        <AuthenticatedLayout>
          <Gate screenKey={SCREEN_KEYS.ONBOARDING_EXTRACTION_REVIEW}>
            <OnboardingExtractionReviewPage />
          </Gate>
        </AuthenticatedLayout>
      </Route>
      <Route path="/onboarding/:workflowId/validation">
        <AuthenticatedLayout>
          <Gate screenKey={SCREEN_KEYS.ONBOARDING_DATA_VALIDATION}>
            <OnboardingDataValidationPage />
          </Gate>
        </AuthenticatedLayout>
      </Route>
      <Route path="/onboarding/:workflowId/survey">
        <AuthenticatedLayout>
          <Gate screenKey={SCREEN_KEYS.ONBOARDING_SURVEY_DISPATCH}>
            <OnboardingSurveyDispatchPage />
          </Gate>
        </AuthenticatedLayout>
      </Route>
      <Route path="/onboarding/:workflowId/approval">
        <AuthenticatedLayout>
          <Gate screenKey={SCREEN_KEYS.ONBOARDING_APPROVAL}>
            <OnboardingApprovalPage />
          </Gate>
        </AuthenticatedLayout>
      </Route>

      {/* ── Reassessment Workflow ──────────────────────────────────────── */}
      <Route path="/reassessment/:reassessmentId/analysis">
        <AuthenticatedLayout>
          <Gate screenKey={SCREEN_KEYS.REASSESSMENT_ANALYSIS}>
            <ReassessmentAnalysisPage />
          </Gate>
        </AuthenticatedLayout>
      </Route>
      <Route path="/reassessment/:reassessmentId/review">
        <AuthenticatedLayout>
          <Gate screenKey={SCREEN_KEYS.REASSESSMENT_REVIEW}>
            <ReassessmentReviewPage />
          </Gate>
        </AuthenticatedLayout>
      </Route>
      <Route path="/reassessment/:reassessmentId/update">
        <AuthenticatedLayout>
          <Gate screenKey={SCREEN_KEYS.REASSESSMENT_UPDATE}>
            <ReassessmentUpdatePage />
          </Gate>
        </AuthenticatedLayout>
      </Route>
      <Route path="/reassessment/:reassessmentId/approval">
        <AuthenticatedLayout>
          <Gate screenKey={SCREEN_KEYS.REASSESSMENT_APPROVAL}>
            <ReassessmentApprovalPage />
          </Gate>
        </AuthenticatedLayout>
      </Route>

      {/* ── Documents ─────────────────────────────────────────────────── */}
      <Route path="/documents">
        <AuthenticatedLayout>
          <Gate screenKey={SCREEN_KEYS.DOCUMENT_LIBRARY}>
            <DocumentLibraryPage />
          </Gate>
        </AuthenticatedLayout>
      </Route>
      <Route path="/documents/upload">
        <AuthenticatedLayout>
          <Gate screenKey={SCREEN_KEYS.DOCUMENT_UPLOAD}>
            <DocumentUploadPage />
          </Gate>
        </AuthenticatedLayout>
      </Route>
      <Route path="/documents/:documentId/extraction">
        <AuthenticatedLayout>
          <Gate screenKey={SCREEN_KEYS.DOCUMENT_EXTRACTION_DETAIL}>
            <DocumentExtractionDetailPage />
          </Gate>
        </AuthenticatedLayout>
      </Route>
      <Route path="/documents/:documentId">
        <AuthenticatedLayout>
          <Gate screenKey={SCREEN_KEYS.DOCUMENT_VIEWER}>
            <DocumentViewerPage />
          </Gate>
        </AuthenticatedLayout>
      </Route>

      {/* ── Surveys ───────────────────────────────────────────────────── */}
      <Route path="/surveys">
        <AuthenticatedLayout>
          <Gate screenKey={SCREEN_KEYS.SURVEY_LIST}>
            <SurveyListPage />
          </Gate>
        </AuthenticatedLayout>
      </Route>
      <Route path="/surveys/:surveyId/respond">
        <AuthenticatedLayout>
          <Gate screenKey={SCREEN_KEYS.SURVEY_RESPONSE_FORM}>
            <SurveyResponseFormPage />
          </Gate>
        </AuthenticatedLayout>
      </Route>
      <Route path="/surveys/:surveyId">
        <AuthenticatedLayout>
          <Gate screenKey={SCREEN_KEYS.SURVEY_DETAIL}>
            <SurveyDetailPage />
          </Gate>
        </AuthenticatedLayout>
      </Route>

      {/* ── Checkpoints ───────────────────────────────────────────────── */}
      <Route path="/checkpoints">
        <AuthenticatedLayout>
          <Gate screenKey={SCREEN_KEYS.CHECKPOINT_QUEUE}>
            <CheckpointQueuePage />
          </Gate>
        </AuthenticatedLayout>
      </Route>
      <Route path="/checkpoints/:checkpointId">
        <AuthenticatedLayout>
          <Gate screenKey={SCREEN_KEYS.CHECKPOINT_DETAIL}>
            <CheckpointDetailPage />
          </Gate>
        </AuthenticatedLayout>
      </Route>

      {/* ── Notifications ─────────────────────────────────────────────── */}
      <Route path="/notifications">
        <AuthenticatedLayout>
          <Gate screenKey={SCREEN_KEYS.NOTIFICATION_CENTRE}>
            <NotificationCentrePage />
          </Gate>
        </AuthenticatedLayout>
      </Route>

      {/* ── Settings ──────────────────────────────────────────────────── */}
      <Route path="/settings/profile">
        <AuthenticatedLayout>
          <Gate screenKey={SCREEN_KEYS.SETTINGS_PROFILE}>
            <SettingsProfilePage />
          </Gate>
        </AuthenticatedLayout>
      </Route>
      <Route path="/settings/automation">
        <AuthenticatedLayout>
          <Gate screenKey={SCREEN_KEYS.SETTINGS_AUTOMATION}>
            <SettingsAutomationPage />
          </Gate>
        </AuthenticatedLayout>
      </Route>
      <Route path="/settings/notifications">
        <AuthenticatedLayout>
          <Gate screenKey={SCREEN_KEYS.SETTINGS_NOTIFICATIONS}>
            <SettingsNotificationsPage />
          </Gate>
        </AuthenticatedLayout>
      </Route>
      <Route path="/settings/appearance">
        <AuthenticatedLayout>
          <Gate screenKey={SCREEN_KEYS.SETTINGS_APPEARANCE}>
            <SettingsAppearancePage />
          </Gate>
        </AuthenticatedLayout>
      </Route>

      {/* ── SuperAdmin ────────────────────────────────────────────────── */}
      <Route path="/superadmin/tenants">
        <AuthenticatedLayout>
          <Gate screenKey={SCREEN_KEYS.SUPERADMIN_TENANT_LIST}>
            <SuperAdminTenantListPage />
          </Gate>
        </AuthenticatedLayout>
      </Route>
      <Route path="/superadmin/tenants/:tenantId">
        <AuthenticatedLayout>
          <Gate screenKey={SCREEN_KEYS.SUPERADMIN_TENANT_DETAIL}>
            <SuperAdminTenantDetailPage />
          </Gate>
        </AuthenticatedLayout>
      </Route>
      <Route path="/superadmin/health">
        <AuthenticatedLayout>
          <Gate screenKey={SCREEN_KEYS.SUPERADMIN_SYSTEM_HEALTH}>
            <SuperAdminSystemHealthPage />
          </Gate>
        </AuthenticatedLayout>
      </Route>

      {/* ── Phase 2 — Equipment Lease (FUTURE SLOT — inactive until domain activated) ── */}
      {/* FUTURE_SLOT: Remove fragment wrapper when activating Equipment Lease domain */}
      {false && <>
        <Route path="/contracts/equipment-leases">
          <AuthenticatedLayout>
            <Gate screenKey={SCREEN_KEYS.EQUIPMENT_LEASE_LIST}>
              <EquipmentLeaseListPage />
            </Gate>
          </AuthenticatedLayout>
        </Route>
        <Route path="/contracts/equipment-leases/:leaseId/overview">
          <AuthenticatedLayout>
            <Gate screenKey={SCREEN_KEYS.EQUIPMENT_LEASE_RECORD_OVERVIEW}>
              <EquipmentLeaseRecordOverviewPage />
            </Gate>
          </AuthenticatedLayout>
        </Route>
        <Route path="/contracts/equipment-leases/:leaseId/terms">
          <AuthenticatedLayout>
            <Gate screenKey={SCREEN_KEYS.EQUIPMENT_LEASE_RECORD_TERMS}>
              <EquipmentLeaseRecordTermsPage />
            </Gate>
          </AuthenticatedLayout>
        </Route>
        <Route path="/contracts/equipment-leases/:leaseId/workflow">
          <AuthenticatedLayout>
            <Gate screenKey={SCREEN_KEYS.EQUIPMENT_LEASE_RECORD_WORKFLOW}>
              <EquipmentLeaseRecordWorkflowPage />
            </Gate>
          </AuthenticatedLayout>
        </Route>
      </>}{/* end FUTURE_SLOT equipment-leases */}

      {/* ── Phase 2 — Service Contract (FUTURE SLOT — inactive until domain activated) ── */}
      {/* FUTURE_SLOT: Remove fragment wrapper when activating Service Contract domain */}
      {false && <>
        <Route path="/contracts/service-contracts">
          <AuthenticatedLayout>
            <Gate screenKey={SCREEN_KEYS.SERVICE_CONTRACT_LIST}>
              <ServiceContractListPage />
            </Gate>
          </AuthenticatedLayout>
        </Route>
        <Route path="/contracts/service-contracts/:contractId/overview">
          <AuthenticatedLayout>
            <Gate screenKey={SCREEN_KEYS.SERVICE_CONTRACT_RECORD_OVERVIEW}>
              <ServiceContractRecordOverviewPage />
            </Gate>
          </AuthenticatedLayout>
        </Route>
        <Route path="/contracts/service-contracts/:contractId/terms">
          <AuthenticatedLayout>
            <Gate screenKey={SCREEN_KEYS.SERVICE_CONTRACT_RECORD_TERMS}>
              <ServiceContractRecordTermsPage />
            </Gate>
          </AuthenticatedLayout>
        </Route>
        <Route path="/contracts/service-contracts/:contractId/workflow">
          <AuthenticatedLayout>
            <Gate screenKey={SCREEN_KEYS.SERVICE_CONTRACT_RECORD_WORKFLOW}>
              <ServiceContractRecordWorkflowPage />
            </Gate>
          </AuthenticatedLayout>
        </Route>
      </>}{/* end FUTURE_SLOT service-contracts */}

      {/* ── Phase 2 — Reporting ───────────────────────────────────────── */}
      <Route path="/reporting/portfolio">
        <AuthenticatedLayout>
          <Gate screenKey={SCREEN_KEYS.REPORTING_PORTFOLIO_ANALYTICS}>
            <ReportingPortfolioAnalyticsPage />
          </Gate>
        </AuthenticatedLayout>
      </Route>
      <Route path="/reporting/automation">
        <AuthenticatedLayout>
          <Gate screenKey={SCREEN_KEYS.REPORTING_AUTOMATION_EFFICIENCY}>
            <ReportingAutomationEfficiencyPage />
          </Gate>
        </AuthenticatedLayout>
      </Route>
      <Route path="/reporting/audit">
        <AuthenticatedLayout>
          <Gate screenKey={SCREEN_KEYS.REPORTING_AUDIT_EXPORT}>
            <ReportingAuditExportPage />
          </Gate>
        </AuthenticatedLayout>
      </Route>

      {/* ── Phase 2 — Counterparties & Properties ─────────────────────── */}
      <Route path="/counterparties">
        <AuthenticatedLayout>
          <Gate screenKey={SCREEN_KEYS.COUNTERPARTY_LIST}>
            <CounterpartyListPage />
          </Gate>
        </AuthenticatedLayout>
      </Route>
      <Route path="/counterparties/:counterpartyId">
        <AuthenticatedLayout>
          <Gate screenKey={SCREEN_KEYS.COUNTERPARTY_DETAIL}>
            <CounterpartyDetailPage />
          </Gate>
        </AuthenticatedLayout>
      </Route>
      <Route path="/properties">
        <AuthenticatedLayout>
          <Gate screenKey={SCREEN_KEYS.PROPERTY_LIST}>
            <PropertyListPage />
          </Gate>
        </AuthenticatedLayout>
      </Route>
      <Route path="/properties/:propertyId">
        <AuthenticatedLayout>
          <Gate screenKey={SCREEN_KEYS.PROPERTY_DETAIL}>
            <PropertyDetailPage />
          </Gate>
        </AuthenticatedLayout>
      </Route>

      {/* ── Phase 2 — SuperAdmin additions ────────────────────────────── */}
      <Route path="/superadmin/registry">
        <AuthenticatedLayout>
          <Gate screenKey={SCREEN_KEYS.SUPERADMIN_SCREEN_REGISTRY}>
            <SuperAdminScreenRegistryPage />
          </Gate>
        </AuthenticatedLayout>
      </Route>
      <Route path="/superadmin/subscriptions">
        <AuthenticatedLayout>
          <Gate screenKey={SCREEN_KEYS.SUPERADMIN_SUBSCRIPTION_MANAGEMENT}>
            <SuperAdminSubscriptionManagementPage />
          </Gate>
        </AuthenticatedLayout>
      </Route>
      <Route path="/superadmin/audit">
        <AuthenticatedLayout>
          <Gate screenKey={SCREEN_KEYS.SUPERADMIN_AUDIT_LOG}>
            <SuperAdminAuditLogPage />
          </Gate>
        </AuthenticatedLayout>
      </Route>

      {/* ── Phase 2 — Onboarding Wizard ───────────────────────────────── */}
      <Route path="/onboarding/wizard">
        <AuthenticatedLayout>
          <Gate screenKey={SCREEN_KEYS.ONBOARDING_WIZARD_START}>
            <OnboardingWizardStartPage />
          </Gate>
        </AuthenticatedLayout>
      </Route>
      <Route path="/onboarding/wizard/complete">
        <AuthenticatedLayout>
          <Gate screenKey={SCREEN_KEYS.ONBOARDING_WIZARD_COMPLETE}>
            <OnboardingWizardCompletePage />
          </Gate>
        </AuthenticatedLayout>
      </Route>

      {/* ── Root redirect ─────────────────────────────────────────────── */}
      <Route path="/">
        <AuthenticatedLayout>
          <Gate screenKey={SCREEN_KEYS.PORTFOLIO_DASHBOARD}>
            <PortfolioDashboardPage />
          </Gate>
        </AuthenticatedLayout>
      </Route>

      {/* ── 404 ───────────────────────────────────────────────────────── */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <TenantProvider>
        <LeaseGovThemeProvider
          themeKey="structured_authority"
          tenantColorModeDefault="light"
          allowUserModeToggle={true}
        >
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </LeaseGovThemeProvider>
      </TenantProvider>
    </ErrorBoundary>
  )
}

export default App
