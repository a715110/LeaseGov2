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
 * Publish a cross-role event. Notifies all other tabs immediately.
 */
export function publishEvent(event: Omit<DemoEvent, 'timestamp'>): void {
  const fullEvent: DemoEvent = {
    ...event,
    timestamp: new Date().toISOString(),
  };

  // Write to localStorage for persistence
  const existing = getEventHistory();
  existing.push(fullEvent);
  // Keep last 100 events
  const trimmed = existing.slice(-100);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));

  // Broadcast to other tabs via BroadcastChannel
  const ch = getChannel();
  if (ch) {
    ch.postMessage(fullEvent);
  }
}

/**
 * Subscribe to cross-role events. Returns an unsubscribe function.
 * Listens to both BroadcastChannel (same-origin tabs) and storage events (fallback).
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

  // BroadcastChannel listener
  const ch = getChannel();
  const bcHandler = (e: MessageEvent<DemoEvent>) => wrappedHandler(e.data);
  if (ch) ch.addEventListener('message', bcHandler);

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
