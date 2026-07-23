/**
 * DoDesk MVP — Multi-Tab Demo Event Bus
 *
 * Uses localStorage + BroadcastChannel for cross-tab state synchronisation.
 * This enables the multi-role demo where actions in one tab (e.g. Document Submitter
 * submitting a batch) are immediately visible in another tab (e.g. Preparer's queue).
 *
 * PRODUCTION UPGRADE PATH:
 * Replace `publish()` with: await api.post('/api/v1/events', event)
 * Replace `subscribe()` with: new WebSocket('/ws/events') + STOMP subscription
 * The event type names map directly to Spring ApplicationEvent class names.
 *
 * Java equivalent:
 *   @EventListener
 *   public void handleBatchSubmitted(BatchSubmittedEvent event) { ... }
 */

import type { DemoEvent, DemoEventType } from './types';

const STORAGE_KEY = 'dodesk_demo_events';
const CHANNEL_NAME = 'leasegov_demo';

let channel: BroadcastChannel | null = null;

function getChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === 'undefined') return null;
  if (!channel) {
    channel = new BroadcastChannel(CHANNEL_NAME);
  }
  return channel;
}

/**
 * sessionStorage key for BATCH_SUBMITTED jobs that have not yet been consumed
 * by ExtractionQueue. This bridges the timing gap where the event fires while
 * ExtractionQueue is unmounted (i.e. the submitter navigates away before the
 * preparer opens the queue). ExtractionQueue drains this on mount.
 *
 * PRODUCTION UPGRADE: Remove entirely — the backend persists the job record
 * and ExtractionQueue fetches it via GET /api/v1/extraction/queue on mount.
 */
export const PENDING_EXTRACTION_JOBS_KEY = 'leasegov_pending_extraction_jobs';

/**
 * sessionStorage key for DECLINE_SUBMITTED events that have not yet been consumed
 * by PipelineDashboard. Bridges the timing gap where the event fires while
 * PipelineDashboard is unmounted (submitter is on a different screen).
 * PipelineDashboard drains this on mount.
 *
 * PRODUCTION UPGRADE: Remove entirely — the backend persists the decline record
 * and PipelineDashboard fetches it via GET /api/v1/submissions on mount.
 */
export const PENDING_DECLINE_EVENTS_KEY = 'leasegov_pending_decline_events';

/**
 * sessionStorage key for SUBMIT_FOR_REVIEW events that have not yet been consumed
 * by ApprovalsQueue. Bridges the timing gap where the event fires while
 * ApprovalsQueue is unmounted (reviewer is on a different screen).
 * ApprovalsQueue drains this on mount.
 *
 * PRODUCTION UPGRADE: Remove entirely — the backend persists the review task
 * and ApprovalsQueue fetches it via GET /api/v1/approvals/queue on mount.
 */
export const PENDING_REVIEW_EVENTS_KEY = 'leasegov_pending_review_events';

/**
 * Publish a cross-role event. Notifies all other tabs immediately.
 *
 * // DEMO ONLY — replace with: await api.post('/api/v1/events', event)
 * For BATCH_SUBMITTED events, the payload is also written to sessionStorage so
 * ExtractionQueue can consume it on mount even if it was not mounted when the
 * event fired (e.g. after a same-tab navigate away).
 * A real backend would persist events in a database and deliver via WebSocket/SSE.
 */
export function publishEvent(event: Omit<DemoEvent, 'timestamp'>): void {
  const fullEvent: DemoEvent = {
    ...event,
    timestamp: new Date().toISOString(),
  };

  // DEMO ONLY: persist BATCH_SUBMITTED payloads so ExtractionQueue can drain
  // them on mount, regardless of whether it was mounted when the event fired.
  // PRODUCTION: remove — backend persists the job; queue fetches via API.
  if (fullEvent.type === 'BATCH_SUBMITTED') {
    try {
      const raw = sessionStorage.getItem(PENDING_EXTRACTION_JOBS_KEY);
      const pending: DemoEvent[] = raw ? JSON.parse(raw) : [];
      pending.push(fullEvent);
      sessionStorage.setItem(PENDING_EXTRACTION_JOBS_KEY, JSON.stringify(pending));
    } catch { /* quota exceeded — ignore */ }
  }

  // DEMO ONLY: persist DECLINE_SUBMITTED payloads so PipelineDashboard can drain
  // them on mount if it was not mounted when the event fired.
  // PRODUCTION: remove — backend persists the decline; dashboard fetches via API.
  if (fullEvent.type === 'DECLINE_SUBMITTED') {
    try {
      const raw = sessionStorage.getItem(PENDING_DECLINE_EVENTS_KEY);
      const pending: DemoEvent[] = raw ? JSON.parse(raw) : [];
      pending.push(fullEvent);
      sessionStorage.setItem(PENDING_DECLINE_EVENTS_KEY, JSON.stringify(pending));
    } catch { /* quota exceeded — ignore */ }
  }

  // DEMO ONLY: persist SUBMIT_FOR_REVIEW payloads so ApprovalsQueue can drain
  // them on mount if it was not mounted when the event fired.
  // PRODUCTION: remove — backend persists the review task; queue fetches via API.
  if (fullEvent.type === 'SUBMIT_FOR_REVIEW') {
    try {
      const raw = sessionStorage.getItem(PENDING_REVIEW_EVENTS_KEY);
      const pending: DemoEvent[] = raw ? JSON.parse(raw) : [];
      pending.push(fullEvent);
      sessionStorage.setItem(PENDING_REVIEW_EVENTS_KEY, JSON.stringify(pending));
    } catch { /* quota exceeded — ignore */ }
  }

  // Broadcast to other tabs via BroadcastChannel
  // DEMO ONLY — replace with: WebSocket or SSE push from backend
  const ch = getChannel();
  if (ch) {
    ch.postMessage(fullEvent);
  }

  // Also dispatch a same-tab CustomEvent so subscribers in the SAME tab receive it.
  // BroadcastChannel only delivers to OTHER tabs; without this, same-tab cross-component
  // communication (e.g. ExtractionQueue → PipelineDashboard in the same window) is silent.
  // DEMO ONLY — remove once real-time backend events are wired up.
  window.dispatchEvent(new CustomEvent('leasegov_same_tab_event', { detail: fullEvent }));
}

/**
 * Subscribe to cross-role events. Returns an unsubscribe function.
 * Listens to both BroadcastChannel (same-origin tabs) and storage events (fallback).
 *
 * // DEMO ONLY — replace with: new WebSocket('/ws/events') + STOMP/SSE subscription
 * The event type names map directly to Spring ApplicationEvent class names.
 */
export function subscribeToEvents(
  handler: (event: DemoEvent) => void,
  filter?: DemoEventType[]
): () => void {
  const wrappedHandler = (event: DemoEvent) => {
    if (!filter || filter.includes(event.type)) {
      handler(event);
    }
  };

  // BroadcastChannel listener (other tabs)
  const ch = getChannel();
  const bcHandler = (e: MessageEvent<DemoEvent>) => wrappedHandler(e.data);
  if (ch) ch.addEventListener('message', bcHandler);

  // Same-tab CustomEvent listener — handles events published from the same window
  const sameTabHandler = (e: Event) => {
    const detail = (e as CustomEvent<DemoEvent>).detail;
    if (detail) wrappedHandler(detail);
  };
  window.addEventListener('leasegov_same_tab_event', sameTabHandler);

  // Storage event fallback (for browsers without BroadcastChannel)
  const storageHandler = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try {
        const events: DemoEvent[] = JSON.parse(e.newValue);
        const latest = events[events.length - 1];
        if (latest) wrappedHandler(latest);
      } catch {
        // ignore parse errors
      }
    }
  };
  window.addEventListener('storage', storageHandler);

  return () => {
    if (ch) ch.removeEventListener('message', bcHandler);
    window.removeEventListener('leasegov_same_tab_event', sameTabHandler);
    window.removeEventListener('storage', storageHandler);
  };
}

/**
 * Get the full event history from localStorage.
 */
export function getEventHistory(): DemoEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Get the most recent event of a specific type.
 */
export function getLatestEvent(type: DemoEventType): DemoEvent | null {
  const history = getEventHistory();
  const matching = history.filter(e => e.type === type);
  return matching.length > 0 ? matching[matching.length - 1] : null;
}

/**
 * Clear all demo events (useful for resetting the demo).
 */
export function clearEventHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Get demo state — aggregated state derived from event history.
 * This simulates what a backend would maintain in a database.
 *
 * PRODUCTION UPGRADE: Replace with API calls:
 *   GET /api/v1/pipeline/queue
 *   GET /api/v1/extraction/queue
 *   GET /api/v1/approvals/queue
 */
export interface DemoState {
  pendingBatches: Array<{ batchId: string; fileCount: number; workspaceTag: string; submittedAt: string }>;
  pendingExtractions: Array<{ jobId: string; fileName: string; batchId: string; submittedAt: string }>;
  pendingReviews: Array<{ recordId: string; label: string; submittedAt: string }>;
  pendingApprovals: Array<{ recordId: string; label: string; submittedAt: string }>;
  pendingExports: Array<{ recordId: string; label: string; approvedAt: string }>;
}

export function getDemoState(): DemoState {
  const history = getEventHistory();
  const state: DemoState = {
    pendingBatches: [],
    pendingExtractions: [],
    pendingReviews: [],
    pendingApprovals: [],
    pendingExports: [],
  };

  for (const event of history) {
    switch (event.type) {
      case 'BATCH_SUBMITTED':
        state.pendingBatches.push({
          batchId: event.payload.batchId as string,
          fileCount: event.payload.fileCount as number,
          workspaceTag: event.payload.workspaceTag as string,
          submittedAt: event.timestamp,
        });
        break;
      case 'EXTRACTION_COMPLETE':
        state.pendingExtractions.push({
          jobId: event.payload.jobId as string,
          fileName: event.payload.fileName as string,
          batchId: event.payload.batchId as string,
          submittedAt: event.timestamp,
        });
        break;
      case 'SUBMIT_FOR_REVIEW':
        state.pendingReviews.push({
          recordId: event.payload.recordId as string,
          label: event.payload.label as string,
          submittedAt: event.timestamp,
        });
        break;
      case 'APPROVE_FOR_FINAL':
        state.pendingApprovals.push({
          recordId: event.payload.recordId as string,
          label: event.payload.label as string,
          submittedAt: event.timestamp,
        });
        break;
      case 'RECORD_APPROVED':
        state.pendingExports.push({
          recordId: event.payload.recordId as string,
          label: event.payload.label as string,
          approvedAt: event.timestamp,
        });
        break;
    }
  }

  return state;
}
