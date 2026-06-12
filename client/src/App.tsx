/**
 * App.tsx — LeaseGov Route Configuration
 *
 * Routes are organised by Feature Cluster (FC-1 through FC-10) matching
 * SCREEN_REGISTRY_SPECIFICATION_V2.md Part 6.
 *
 * Every route is wrapped in <ScreenGate> for two-layer access control:
 *   Layer 1 — screen registry check (is this screen active for this tenant?)
 *   Layer 2 — role-based permission check (delegated to PermissionGate inside ScreenGate)
 *
 * Future-slot Phase 3 domains (equipment lease, service contract) are guarded
 * with {false && ...} until those domains are activated.
 */

import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Route, Switch, Redirect } from 'wouter'
import ErrorBoundary from './components/ErrorBoundary'
import { ThemeProvider } from './contexts/ThemeContext'
import { ScreenGate } from './components/shared/ScreenGate'
import { RegistryProvider } from './contexts/RegistryContext'
import { RoleProvider, useRole } from './contexts/RoleContext'
import { DemoModeProvider } from './contexts/DemoModeContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { ExtractionStoreProvider } from './contexts/ExtractionStoreContext'
import { PipelineCountsProvider } from './contexts/PipelineCountsContext'
import { DevModeProvider } from './contexts/DevModeContext'
import { LeaseGovThemeProvider } from './contexts/LeaseGovThemeProvider'
import { DemoOverlay } from './components/layout/DemoOverlay'
import { SCREEN_KEYS } from './constants/screenKeys'
import AppShell from './components/layout/AppShell'
import NotFound from './pages/NotFound'

// ─── FC-1: Document Pipeline ─────────────────────────────────────────────────
import PipelineDashboard      from './pages/pipeline/PipelineDashboard'
import PipelineUpload         from './pages/pipeline/PipelineUpload'
import PipelineNewRecordModal from './pages/pipeline/PipelineNewRecordModal'
import PipelineValidation     from './pages/pipeline/PipelineValidation'
import PipelineReviewGrouping from './pages/pipeline/PipelineReviewGrouping'
// PipelineSubmitConfirm removed in V3 — submission fires from PipelineReviewGrouping

// ─── FC-2: Extraction and Verification ───────────────────────────────────────
import ExtractionQueue           from './pages/extraction/ExtractionQueue'
import ExtractionUnderstanding   from './pages/extraction/ExtractionUnderstanding'
import ExtractionStrategy        from './pages/extraction/ExtractionStrategy'
import ExtractionAiWorkspace     from './pages/extraction/ExtractionAiWorkspace'
import ExtractionManualWorkspace from './pages/extraction/ExtractionManualWorkspace'
import ExtractionVerification    from './pages/extraction/ExtractionVerification'
import ExtractionTracker         from './pages/extraction/ExtractionTracker'
import ExtractionReprocessing    from './pages/extraction/ExtractionReprocessing'

// ─── FC-3: Contract Packages ──────────────────────────────────────────────────
import PackagesComposition from './pages/packages/PackagesComposition'
import PackagesFlags       from './pages/packages/PackagesFlags'
import PackagesReassembly  from './pages/packages/PackagesReassembly'

// ─── FC-4: Approval Workflow ──────────────────────────────────────────────────
import ApprovalsQueue    from './pages/approvals/ApprovalsQueue'
import ApprovalsReview   from './pages/approvals/ApprovalsReview'
import ApprovalsApprover from './pages/approvals/ApprovalsApprover'
import ApprovalsRework   from './pages/approvals/ApprovalsRework'
import ApprovalsRecall   from './pages/approvals/ApprovalsRecall'

// ─── FC-5: Contract Records (MVP) ────────────────────────────────────────────
import RecordsDashboard   from './pages/records/RecordsDashboard'
import RecordsSearch      from './pages/records/RecordsSearch'
import RecordsDetail      from './pages/records/RecordsDetail'
import RecordsAddDocument from './pages/records/RecordsAddDocument'

// ─── FC-7: Governed Export ────────────────────────────────────────────────────
import ExportTemplateSelection from './pages/export/ExportTemplateSelection'
import ExportStaging           from './pages/export/ExportStaging'
import ExportPreflight         from './pages/export/ExportPreflight'
import ExportUploadTask        from './pages/export/ExportUploadTask'

// ─── FC-8: Administration (MVP) ──────────────────────────────────────────────
import AdminUsers         from './pages/admin/AdminUsers'
import AdminSchema        from './pages/admin/AdminSchema'
import AdminTemplates     from './pages/admin/AdminTemplates'
import AdminThresholds    from './pages/admin/AdminThresholds'
import AdminAuditLog      from './pages/admin/AdminAuditLog'
import AdminNotifications from './pages/admin/AdminNotifications'

// ─── FC-10: Multi-Tenancy and Platform ───────────────────────────────────────
import PlatformNotAuthorized  from './pages/platform/PlatformNotAuthorized'
import OrganizationSetupPage  from './pages/onboarding/OrganizationSetupPage'
import AdminUserSetupPage     from './pages/onboarding/AdminUserSetupPage'
import ThemeAndAutomationSetupPage from './pages/onboarding/ThemeAndAutomationSetupPage'
import WorkflowTemplateSetupPage   from './pages/onboarding/WorkflowTemplateSetupPage'
import OnboardingCompletePage from './pages/onboarding/OnboardingCompletePage'
import SuperAdminTenantList   from './pages/superadmin/SuperAdminTenantList'
import SuperAdminTenantDetail from './pages/superadmin/SuperAdminTenantDetail'
import SuperAdminSystemHealth from './pages/superadmin/SuperAdminSystemHealth'
import SuperAdminSubscriptionManagement from './pages/superadmin/SuperAdminSubscriptionManagement'
import SuperAdminScreenRegistry from './pages/superadmin/SuperAdminScreenRegistry'

// ─── FC-5: Contract Records (Phase 2) ────────────────────────────────────────
import RecordsDeferredTracker from './pages/records/RecordsDeferredTracker'
import RecordsSnapshotViewer  from './pages/records/RecordsSnapshotViewer'
import RecordsCorrection      from './pages/records/RecordsCorrection'

// ─── FC-6: Reassessment (Phase 2) ────────────────────────────────────────────
import ReassessmentDashboard       from './pages/reassessment/ReassessmentDashboard'
import ReassessmentTrigger         from './pages/reassessment/ReassessmentTrigger'
import ReassessmentSweep           from './pages/reassessment/ReassessmentSweep'
import ReassessmentCaseList        from './pages/reassessment/ReassessmentCaseList'
import ReassessmentClassification  from './pages/reassessment/ReassessmentClassification'
import ReassessmentAssessment      from './pages/reassessment/ReassessmentAssessment'
import ReassessmentAnalysis        from './pages/reassessment/ReassessmentAnalysis'
import ReassessmentMemo            from './pages/reassessment/ReassessmentMemo'
import ReassessmentPackagePreview  from './pages/reassessment/ReassessmentPackagePreview'
import ReassessmentRemediation     from './pages/reassessment/ReassessmentRemediation'
import ReassessmentConcurrentWarn  from './pages/reassessment/ReassessmentConcurrentWarn'
import ReassessmentWatchlist       from './pages/reassessment/ReassessmentWatchlist'
import ReassessmentSurveyIntake    from './pages/reassessment/ReassessmentSurveyIntake'
import ReassessmentContextualProject from './pages/reassessment/ReassessmentContextualProject'

// ─── FC-6: Reassessment Workflow Screens (workflows/ subfolder) ─────────────
import ReassessmentUpdateWorkflow    from './pages/workflows/ReassessmentUpdate'
import ReassessmentReviewWorkflow    from './pages/workflows/ReassessmentReview'
import ReassessmentApprovalWorkflow  from './pages/workflows/ReassessmentApproval'
import ReassessmentAnalysisWorkflow  from './pages/workflows/ReassessmentAnalysis'
// ─── FC-8: Administration (Phase 2) ──────────────────────────────────────────
import AdminAutomation from './pages/admin/AdminAutomation'

// ─── FC-9: AI Agents and Automation (Phase 2) ────────────────────────────────
import AgentCheckpointQueue  from './pages/agents/AgentCheckpointQueue'
import AgentActivityMonitor  from './pages/agents/AgentActivityMonitor'

function Router() {
  return (
    <Switch>

      {/* ── FC-1: Document Pipeline ─────────────────────────────────────── */}
      <Route path="/pipeline/dashboard">
        <ScreenGate screenKey={SCREEN_KEYS.PIPELINE_DASHBOARD} fallback={<NotFound />}>
          <PipelineDashboard />
        </ScreenGate>
      </Route>
      <Route path="/pipeline/upload">
        <ScreenGate screenKey={SCREEN_KEYS.PIPELINE_UPLOAD} fallback={<NotFound />}>
          <PipelineUpload />
        </ScreenGate>
      </Route>
      <Route path="/pipeline/new-record">
        <ScreenGate screenKey={SCREEN_KEYS.PIPELINE_NEW_RECORD_MODAL} fallback={<NotFound />}>
          <PipelineNewRecordModal />
        </ScreenGate>
      </Route>
      <Route path="/pipeline/validation">
        <ScreenGate screenKey={SCREEN_KEYS.PIPELINE_VALIDATION} fallback={<NotFound />}>
          <PipelineValidation />
        </ScreenGate>
      </Route>
      <Route path="/pipeline/review">
        <ScreenGate screenKey={SCREEN_KEYS.PIPELINE_REVIEW_GROUPING} fallback={<NotFound />}>
          <PipelineReviewGrouping />
        </ScreenGate>
      </Route>
      {/* /pipeline/confirm removed in V3 — BATCH_SUBMITTED fires from /pipeline/review */}

      {/* ── FC-2: Extraction and Verification ──────────────────────────── */}
      <Route path="/extraction/queue">
        <ScreenGate screenKey={SCREEN_KEYS.EXTRACTION_QUEUE} fallback={<NotFound />}>
          <ExtractionQueue />
        </ScreenGate>
      </Route>
      <Route path="/extraction/understanding">
        <ScreenGate screenKey={SCREEN_KEYS.EXTRACTION_UNDERSTANDING} fallback={<NotFound />}>
          <ExtractionUnderstanding />
        </ScreenGate>
      </Route>
      <Route path="/extraction/strategy">
        <ScreenGate screenKey={SCREEN_KEYS.EXTRACTION_STRATEGY} fallback={<NotFound />}>
          <ExtractionStrategy />
        </ScreenGate>
      </Route>
      <Route path="/extraction/ai">
        <ScreenGate screenKey={SCREEN_KEYS.EXTRACTION_AI_WORKSPACE} fallback={<NotFound />}>
          <ExtractionAiWorkspace />
        </ScreenGate>
      </Route>
      <Route path="/extraction/manual">
        <ScreenGate screenKey={SCREEN_KEYS.EXTRACTION_MANUAL_WORKSPACE} fallback={<NotFound />}>
          <ExtractionManualWorkspace />
        </ScreenGate>
      </Route>
      <Route path="/extraction/verify">
        <ScreenGate screenKey={SCREEN_KEYS.EXTRACTION_VERIFICATION} fallback={<NotFound />}>
          <ExtractionVerification />
        </ScreenGate>
      </Route>
      <Route path="/extraction/tracker">
        <ScreenGate screenKey={SCREEN_KEYS.EXTRACTION_TRACKER} fallback={<NotFound />}>
          <ExtractionTracker />
        </ScreenGate>
      </Route>
      <Route path="/extraction/reprocess">
        <ScreenGate screenKey={SCREEN_KEYS.EXTRACTION_REPROCESSING} fallback={<NotFound />}>
          <ExtractionReprocessing />
        </ScreenGate>
      </Route>

      {/* ── FC-3: Contract Packages ─────────────────────────────────────── */}
      <Route path="/packages/:contractId">
        <ScreenGate screenKey={SCREEN_KEYS.PACKAGES_COMPOSITION} fallback={<NotFound />}>
          <PackagesComposition />
        </ScreenGate>
      </Route>
      <Route path="/packages/:packageId/flags">
        <ScreenGate screenKey={SCREEN_KEYS.PACKAGES_FLAGS} fallback={<NotFound />}>
          <PackagesFlags />
        </ScreenGate>
      </Route>
      <Route path="/packages/:packageId/reassembly">
        <ScreenGate screenKey={SCREEN_KEYS.PACKAGES_REASSEMBLY} fallback={<NotFound />}>
          <PackagesReassembly />
        </ScreenGate>
      </Route>

      {/* ── FC-4: Approval Workflow ─────────────────────────────────────── */}
      <Route path="/approvals/queue">
        <ScreenGate screenKey={SCREEN_KEYS.APPROVALS_QUEUE} fallback={<NotFound />}>
          <ApprovalsQueue />
        </ScreenGate>
      </Route>
      <Route path="/approvals/review">
        <ScreenGate screenKey={SCREEN_KEYS.APPROVALS_REVIEW} fallback={<NotFound />}>
          <ApprovalsReview />
        </ScreenGate>
      </Route>
      <Route path="/approvals/final">
        <ScreenGate screenKey={SCREEN_KEYS.APPROVALS_APPROVER} fallback={<NotFound />}>
          <ApprovalsApprover />
        </ScreenGate>
      </Route>
      <Route path="/approvals/rework">
        <ScreenGate screenKey={SCREEN_KEYS.APPROVALS_REWORK} fallback={<NotFound />}>
          <ApprovalsRework />
        </ScreenGate>
      </Route>
      <Route path="/approvals/recall">
        <ScreenGate screenKey={SCREEN_KEYS.APPROVALS_RECALL} fallback={<NotFound />}>
          <ApprovalsRecall />
        </ScreenGate>
      </Route>

      {/* ── FC-5: Contract Records (MVP) ────────────────────────────────── */}
      <Route path="/records/dashboard">
        <ScreenGate screenKey={SCREEN_KEYS.RECORDS_DASHBOARD} fallback={<NotFound />}>
          <RecordsDashboard />
        </ScreenGate>
      </Route>
      <Route path="/records/:id/add-document">
        <ScreenGate screenKey={SCREEN_KEYS.RECORDS_ADD_DOCUMENT} fallback={<NotFound />}>
          <RecordsAddDocument />
        </ScreenGate>
      </Route>
      <Route path="/records/:id">
        <ScreenGate screenKey={SCREEN_KEYS.RECORDS_DETAIL} fallback={<NotFound />}>
          <RecordsDetail />
        </ScreenGate>
      </Route>
      <Route path="/records">
        <ScreenGate screenKey={SCREEN_KEYS.RECORDS_SEARCH} fallback={<NotFound />}>
          <RecordsSearch />
        </ScreenGate>
      </Route>

      {/* ── FC-7: Governed Export ───────────────────────────────────────── */}
      <Route path="/export/templates">
        <ScreenGate screenKey={SCREEN_KEYS.EXPORT_TEMPLATE_SELECTION} fallback={<NotFound />}>
          <ExportTemplateSelection />
        </ScreenGate>
      </Route>
      <Route path="/export/staging">
        <ScreenGate screenKey={SCREEN_KEYS.EXPORT_STAGING} fallback={<NotFound />}>
          <ExportStaging />
        </ScreenGate>
      </Route>
      <Route path="/export/preflight">
        <ScreenGate screenKey={SCREEN_KEYS.EXPORT_PREFLIGHT} fallback={<NotFound />}>
          <ExportPreflight />
        </ScreenGate>
      </Route>
      <Route path="/export/tasks/:id">
        <ScreenGate screenKey={SCREEN_KEYS.EXPORT_UPLOAD_TASK} fallback={<NotFound />}>
          <ExportUploadTask />
        </ScreenGate>
      </Route>

      {/* ── FC-8: Administration (MVP) ──────────────────────────────────── */}
      <Route path="/admin/users">
        <ScreenGate screenKey={SCREEN_KEYS.ADMIN_USERS} fallback={<NotFound />}>
          <AdminUsers />
        </ScreenGate>
      </Route>
      <Route path="/admin/schema">
        <ScreenGate screenKey={SCREEN_KEYS.ADMIN_SCHEMA} fallback={<NotFound />}>
          <AdminSchema />
        </ScreenGate>
      </Route>
      <Route path="/admin/templates">
        <ScreenGate screenKey={SCREEN_KEYS.ADMIN_TEMPLATES} fallback={<NotFound />}>
          <AdminTemplates />
        </ScreenGate>
      </Route>
      <Route path="/admin/thresholds">
        <ScreenGate screenKey={SCREEN_KEYS.ADMIN_THRESHOLDS} fallback={<NotFound />}>
          <AdminThresholds />
        </ScreenGate>
      </Route>
      <Route path="/admin/audit">
        <ScreenGate screenKey={SCREEN_KEYS.ADMIN_AUDIT_LOG} fallback={<NotFound />}>
          <AdminAuditLog />
        </ScreenGate>
      </Route>
      <Route path="/admin/notifications">
        <ScreenGate screenKey={SCREEN_KEYS.ADMIN_NOTIFICATIONS} fallback={<NotFound />}>
          <AdminNotifications />
        </ScreenGate>
      </Route>

      {/* ── FC-10: Multi-Tenancy and Platform ──────────────────────────── */}
      <Route path="/not-authorized">
        <ScreenGate screenKey={SCREEN_KEYS.PLATFORM_NOT_AUTHORIZED} fallback={<NotFound />}>
          <PlatformNotAuthorized />
        </ScreenGate>
      </Route>
      <Route path="/onboarding/organization">
        <ScreenGate screenKey={SCREEN_KEYS.PLATFORM_ONBOARDING} fallback={<NotFound />}>
          <OrganizationSetupPage />
        </ScreenGate>
      </Route>
      <Route path="/onboarding/admin-user">
        <ScreenGate screenKey={SCREEN_KEYS.PLATFORM_ONBOARDING} fallback={<NotFound />}>
          <AdminUserSetupPage />
        </ScreenGate>
      </Route>
      <Route path="/onboarding/theme-automation">
        <ScreenGate screenKey={SCREEN_KEYS.PLATFORM_ONBOARDING} fallback={<NotFound />}>
          <ThemeAndAutomationSetupPage />
        </ScreenGate>
      </Route>
      <Route path="/onboarding/workflow-templates">
        <ScreenGate screenKey={SCREEN_KEYS.PLATFORM_ONBOARDING} fallback={<NotFound />}>
          <WorkflowTemplateSetupPage />
        </ScreenGate>
      </Route>
      <Route path="/onboarding/complete">
        <ScreenGate screenKey={SCREEN_KEYS.PLATFORM_ONBOARDING} fallback={<NotFound />}>
          <OnboardingCompletePage />
        </ScreenGate>
      </Route>
      <Route path="/superadmin/tenants/:id">
        <ScreenGate screenKey={SCREEN_KEYS.SUPERADMIN_TENANT_DETAIL} fallback={<NotFound />}>
          <SuperAdminTenantDetail />
        </ScreenGate>
      </Route>
      <Route path="/superadmin/tenants">
        <ScreenGate screenKey={SCREEN_KEYS.SUPERADMIN_TENANT_LIST} fallback={<NotFound />}>
          <SuperAdminTenantList />
        </ScreenGate>
      </Route>
      <Route path="/superadmin/health">
        <ScreenGate screenKey={SCREEN_KEYS.SUPERADMIN_SYSTEM_HEALTH} fallback={<NotFound />}>
          <SuperAdminSystemHealth />
        </ScreenGate>
      </Route>
      <Route path="/superadmin/subscriptions">
        <ScreenGate screenKey={SCREEN_KEYS.SUPERADMIN_SUBSCRIPTIONS} fallback={<NotFound />}>
          <SuperAdminSubscriptionManagement />
        </ScreenGate>
      </Route>
      <Route path="/superadmin/screen-registry">
        <ScreenGate screenKey={SCREEN_KEYS.SUPERADMIN_SCREEN_REGISTRY} fallback={<NotFound />}>
          <SuperAdminScreenRegistry />
        </ScreenGate>
      </Route>

      {/* ── FC-5: Contract Records (Phase 2) ────────────────────────────── */}
      <Route path="/records/:id/deferred">
        <ScreenGate screenKey={SCREEN_KEYS.RECORDS_DEFERRED_TRACKER} fallback={<NotFound />}>
          <RecordsDeferredTracker />
        </ScreenGate>
      </Route>
      <Route path="/records/:id/snapshots">
        <ScreenGate screenKey={SCREEN_KEYS.RECORDS_SNAPSHOT_VIEWER} fallback={<NotFound />}>
          <RecordsSnapshotViewer />
        </ScreenGate>
      </Route>
      <Route path="/records/:id/correction">
        <ScreenGate screenKey={SCREEN_KEYS.RECORDS_CORRECTION} fallback={<NotFound />}>
          <RecordsCorrection />
        </ScreenGate>
      </Route>

      {/* ── FC-6: Reassessment (Phase 2) ────────────────────────────────── */}
      <Route path="/reassessment/dashboard">
        <ScreenGate screenKey={SCREEN_KEYS.REASSESSMENT_DASHBOARD} fallback={<NotFound />}>
          <ReassessmentDashboard />
        </ScreenGate>
      </Route>
      <Route path="/reassessment/trigger">
        <ScreenGate screenKey={SCREEN_KEYS.REASSESSMENT_TRIGGER} fallback={<NotFound />}>
          <ReassessmentTrigger />
        </ScreenGate>
      </Route>
      <Route path="/reassessment/sweep">
        <ScreenGate screenKey={SCREEN_KEYS.REASSESSMENT_SWEEP} fallback={<NotFound />}>
          <ReassessmentSweep />
        </ScreenGate>
      </Route>
      <Route path="/reassessment/cases/:id/classify">
        <ScreenGate screenKey={SCREEN_KEYS.REASSESSMENT_CLASSIFICATION} fallback={<NotFound />}>
          <ReassessmentClassification />
        </ScreenGate>
      </Route>
      <Route path="/reassessment/cases/:id/assess">
        <ScreenGate screenKey={SCREEN_KEYS.REASSESSMENT_ASSESSMENT} fallback={<NotFound />}>
          <ReassessmentAssessment />
        </ScreenGate>
      </Route>
      <Route path="/reassessment/cases/:id/analysis">
        <ScreenGate screenKey={SCREEN_KEYS.REASSESSMENT_ANALYSIS} fallback={<NotFound />}>
          <ReassessmentAnalysis />
        </ScreenGate>
      </Route>
      <Route path="/reassessment/cases/:id/memo">
        <ScreenGate screenKey={SCREEN_KEYS.REASSESSMENT_MEMO} fallback={<NotFound />}>
          <ReassessmentMemo />
        </ScreenGate>
      </Route>
      <Route path="/reassessment/cases/:id/package">
        <ScreenGate screenKey={SCREEN_KEYS.REASSESSMENT_PACKAGE_PREVIEW} fallback={<NotFound />}>
          <ReassessmentPackagePreview />
        </ScreenGate>
      </Route>
      <Route path="/reassessment/cases/:id/remediation">
        <ScreenGate screenKey={SCREEN_KEYS.REASSESSMENT_REMEDIATION} fallback={<NotFound />}>
          <ReassessmentRemediation />
        </ScreenGate>
      </Route>
      <Route path="/reassessment/cases">
        <ScreenGate screenKey={SCREEN_KEYS.REASSESSMENT_CASE_LIST} fallback={<NotFound />}>
          <ReassessmentCaseList />
        </ScreenGate>
      </Route>
      <Route path="/reassessment/concurrent">
        <ScreenGate screenKey={SCREEN_KEYS.REASSESSMENT_CONCURRENT_WARN} fallback={<NotFound />}>
          <ReassessmentConcurrentWarn />
        </ScreenGate>
      </Route>
      <Route path="/reassessment/watchlist">
        <ScreenGate screenKey={SCREEN_KEYS.REASSESSMENT_WATCHLIST} fallback={<NotFound />}>
          <ReassessmentWatchlist />
        </ScreenGate>
      </Route>
      <Route path="/reassessment/surveys">
        <ScreenGate screenKey={SCREEN_KEYS.REASSESSMENT_SURVEY_INTAKE} fallback={<NotFound />}>
          <ReassessmentSurveyIntake />
        </ScreenGate>
      </Route>
      <Route path="/reassessment/projects/:id">
        <ScreenGate screenKey={SCREEN_KEYS.REASSESSMENT_PROJECT_VIEW} fallback={<NotFound />}>
          <ReassessmentContextualProject />
        </ScreenGate>
      </Route>

      {/* ── FC-6: Reassessment Workflow Screens (workflows/ subfolder) ────── */}
      <Route path="/workflows/reassessment/update">
        <ScreenGate screenKey={SCREEN_KEYS.REASSESSMENT_UPDATE} fallback={<NotFound />}>
          <ReassessmentUpdateWorkflow />
        </ScreenGate>
      </Route>
      <Route path="/workflows/reassessment/review">
        <ScreenGate screenKey={SCREEN_KEYS.REASSESSMENT_REVIEW} fallback={<NotFound />}>
          <ReassessmentReviewWorkflow />
        </ScreenGate>
      </Route>
      <Route path="/workflows/reassessment/approval">
        <ScreenGate screenKey={SCREEN_KEYS.REASSESSMENT_APPROVAL} fallback={<NotFound />}>
          <ReassessmentApprovalWorkflow />
        </ScreenGate>
      </Route>
      <Route path="/workflows/reassessment/analysis">
        <ScreenGate screenKey={SCREEN_KEYS.REASSESSMENT_ANALYSIS_WORKFLOW} fallback={<NotFound />}>
          <ReassessmentAnalysisWorkflow />
        </ScreenGate>
      </Route>
      {/* ── FC-8: Administration (Phase 2) ──────────────────────────────── */}
      <Route path="/admin/automation">
        <ScreenGate screenKey={SCREEN_KEYS.ADMIN_AUTOMATION} fallback={<NotFound />}>
          <AdminAutomation />
        </ScreenGate>
      </Route>

      {/* ── FC-9: AI Agents and Automation (Phase 2) ────────────────────── */}
      <Route path="/approvals/checkpoints">
        <ScreenGate screenKey={SCREEN_KEYS.AGENT_CHECKPOINT_QUEUE} fallback={<NotFound />}>
          <AgentCheckpointQueue />
        </ScreenGate>
      </Route>
      <Route path="/agents/monitor">
        <ScreenGate screenKey={SCREEN_KEYS.AGENT_ACTIVITY_MONITOR} fallback={<NotFound />}>
          <AgentActivityMonitor />
        </ScreenGate>
      </Route>

      {/* ── PHASE 3 FUTURE SLOTS (inactive until domain activation) ─────── */}
      {false && (
        <>
          {/* Equipment Lease — activate when EQUIPMENT_LEASE domain is enabled */}
          {/* Service Contract — activate when SERVICE_CONTRACT domain is enabled */}
        </>
      )}

      {/* ── Root redirect ───────────────────────────────────────────────── */}
      <Route path="/">
        <Redirect to="/pipeline/dashboard" />
      </Route>

      {/* ── Default / 404 ───────────────────────────────────────────────── */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />

    </Switch>
  )
}

/** Thin wrapper that reads activeRole from RoleContext and passes it to DemoModeProvider */
function DemoModeProviderWithRole({ children }: { children: React.ReactNode }) {
  const { activeRole } = useRole()
  return <DemoModeProvider activeRole={activeRole}>{children}</DemoModeProvider>
}

function App() {
  return (
    <ErrorBoundary>
      <RoleProvider>
      <ThemeProvider defaultTheme="light" switchable>
      <LeaseGovThemeProvider initialThemeKey="structured_authority" allowUserModeToggle={true}>
        {/*
          RegistryProvider — scaffold mode: immediately marks registry as loaded.
          isScreenEnabled() already fail-opens when no registry is cached, so
          all screens render correctly during development without a backend fetch.
          When the backend registry endpoint is ready, set scaffoldMode={false}
          and wire fetchScreenRegistry() inside RegistryProvider.
        */}
        <DevModeProvider>
        <RegistryProvider scaffoldMode={true}>
          {/* DemoModeProvider must be inside Router context (wouter) so DemoOverlay
              can call useLocation for navigation. Wouter's Router is implicit at
              the top level, so this placement is safe. */}
          <DemoModeProviderWithRole>
            <NotificationProvider>
            <PipelineCountsProvider>
            <ExtractionStoreProvider>
            <TooltipProvider>
              <Toaster />
              <AppShell>
                <Router />
              </AppShell>
              {/* DemoOverlay renders as a fixed-position floating panel outside
                  the AppShell scroll container so it is never clipped. */}
              <DemoOverlay />
            </TooltipProvider>
            </ExtractionStoreProvider>
            </PipelineCountsProvider>
            </NotificationProvider>
          </DemoModeProviderWithRole>
        </RegistryProvider>
        </DevModeProvider>
      </LeaseGovThemeProvider>
      </ThemeProvider>
      </RoleProvider>
    </ErrorBoundary>
  )
}

export default App
