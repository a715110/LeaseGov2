/**
 * AdminAutomation — FC-8 Phase 2 stub
 * Screen key: admin-automation-config
 * Route: /admin/automation
 *
 * PHASE 2 — activate when Phase 2 is enabled
 *
 * When built: renders AutomationPolicy fields per workflow domain:
 *   Document Extraction · Verification · Approval Review ·
 *   Reassessment Classification · Assessment · Analysis
 * Each domain: three-option segmented control
 *   Full Autonomous · Collaborative · Full Manual
 * Checkpoint response deadline: hours input
 * Graceful degradation: toggle switch
 *   "Fall back to collaborative mode when agent is unavailable"
 *
 * Data model refs: AutomationPolicy (Part 2.1)
 */

import { Bot } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";

export default function AdminAutomation() {
  // PHASE 2 — activate when Phase 2 is enabled
  return (
    <AdminLayout>
      <div className="flex flex-col items-center justify-center flex-1 gap-4 py-24 text-center">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-muted/30">
          <Bot className="w-7 h-7 text-muted-foreground" />
        </div>
        <h2 className="text-[16px] font-bold text-foreground">Automation Configuration</h2>
        <p className="text-[13px] text-muted-foreground max-w-sm">
          This screen is part of Phase 2 and will be enabled when the automation policy feature is activated for your organization.
        </p>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold bg-muted/30 text-muted-foreground">
          PHASE 2 — NOT YET AVAILABLE
        </span>
      </div>
    </AdminLayout>
  );
}
