/**
 * uploadSimulation.ts — Shared upload validation simulation utility
 *
 * V3 Document Intake Governance Flow — Stage 1 Format Validation only.
 * Four checks: File Format · File Size · Duplicate Detection · File Integrity.
 * No OCR. No contract-likeness scoring. No warning state.
 * Outcome per file: VALID or INVALID only.
 *
 * Exports:
 *   - Types: ValidationStatus, ValidationCategory, StagedFile
 *   - Constants: WORKSPACE_TAGS, INVALID_KEYWORDS, ANIMATION_STYLES
 *   - Helpers: formatBytes, isInvalidFilename, makeStagedFile, injectAnimationStyles
 *   - Core: simulateFileLifecycle (requires a React setFiles dispatcher)
 */

// ─── Types ────────────────────────────────────────────────────────────────────
export type ValidationStatus = 'uploading' | 'validating' | 'valid' | 'invalid';

export interface ValidationCategory {
  name: string;
  passed: boolean;
  detail?: string;
}

export interface StagedFile {
  id: string;
  name: string;
  size: number;
  mime_type: string;
  status: ValidationStatus;
  uploadProgress: number; // 0–100
  categories: ValidationCategory[];
  error?: string;
  workspace_tag?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
export const WORKSPACE_TAGS = [
  'Q1-2026-Retail',
  'Q1-2026-Office',
  'Q1-2026-Industrial',
  'Q2-2026-Land',
  'Q2-2026-Retail',
];

/** V3: filenames containing these keywords resolve as INVALID (demo simulation) */
export const INVALID_KEYWORDS = ['corrupt', 'invalid', 'error', 'bad', 'scan_fail'];

// ─── Helpers ──────────────────────────────────────────────────────────────────
export function formatBytes(bytes: number): string {
  if (bytes < 1_000_000) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
}

export function isInvalidFilename(name: string): boolean {
  const lower = name.toLowerCase();
  return INVALID_KEYWORDS.some(kw => lower.includes(kw));
}

/**
 * makeStagedFile — creates a StagedFile with V3 four-check validation categories.
 * Categories: File Format · File Size · Duplicate Check · File Integrity.
 * No OCR Quality or Contract Likeness checks (those are Stage 2 / Preparer-triggered).
 */
export function makeStagedFile(name: string, size: number, mime: string): StagedFile {
  return {
    id: `upload-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name,
    size,
    mime_type: mime,
    status: 'uploading',
    uploadProgress: 0,
    categories: [
      { name: 'File Format',     passed: true },
      { name: 'File Size',       passed: true },
      { name: 'Duplicate Check', passed: true },
      { name: 'File Integrity',  passed: true, detail: 'Pending…' },
    ],
  };
}

// ─── Animation CSS ────────────────────────────────────────────────────────────
export const ANIMATION_STYLES = `
@keyframes upload-card-in {
  from { opacity: 0; transform: translateY(10px) scale(0.98); }
  to   { opacity: 1; transform: translateY(0)    scale(1); }
}
@keyframes shimmer {
  0%   { background-position: -200% center; }
  100% { background-position:  200% center; }
}
@keyframes scan-sweep {
  0%   { transform: translateX(-100%); opacity: 0.6; }
  50%  { opacity: 1; }
  100% { transform: translateX(100%);  opacity: 0.6; }
}
@keyframes result-pop {
  0%   { opacity: 0; transform: scale(0.4) rotate(-10deg); }
  60%  { transform: scale(1.25) rotate(4deg); }
  80%  { transform: scale(0.92) rotate(-2deg); }
  100% { opacity: 1; transform: scale(1) rotate(0deg); }
}
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%       { transform: translateX(-5px); }
  40%       { transform: translateX(5px); }
  60%       { transform: translateX(-3px); }
  80%       { transform: translateX(3px); }
}
@keyframes border-flash-valid {
  0%   { border-left-color: #6ee7b7; box-shadow: -4px 0 12px rgba(16,185,129,0.5); }
  60%  { border-left-color: #10b981; box-shadow: -4px 0 20px rgba(16,185,129,0.7); }
  100% { border-left-color: var(--color-lg-success); box-shadow: none; }
}
@keyframes border-flash-invalid {
  0%   { border-left-color: #fca5a5; box-shadow: -4px 0 12px rgba(239,68,68,0.5); }
  60%  { border-left-color: #ef4444; box-shadow: -4px 0 20px rgba(239,68,68,0.7); }
  100% { border-left-color: var(--color-lg-error); box-shadow: none; }
}
@keyframes dot-bounce {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
  40%            { transform: scale(1.0); opacity: 1; }
}
.upload-card-enter { animation: upload-card-in 220ms cubic-bezier(0.23,1,0.32,1) both; }
.shimmer-bar {
  background: linear-gradient(90deg, #3b82f6 0%, #93c5fd 40%, #3b82f6 60%, #2563eb 100%);
  background-size: 200% 100%;
  animation: shimmer 1.2s linear infinite;
}
.scan-sweep-bar {
  position: absolute; inset-y-0; width: 40%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(251,191,36,0.6), transparent);
  animation: scan-sweep 1.4s ease-in-out infinite;
}
.result-pop-icon { animation: result-pop 380ms cubic-bezier(0.23,1,0.32,1) both; }
.card-shake { animation: shake 350ms cubic-bezier(0.23,1,0.32,1) both; }
.border-flash-valid   { animation: border-flash-valid   600ms ease-out both; }
.border-flash-invalid { animation: border-flash-invalid 600ms ease-out both; }
`;

let stylesInjected = false;
export function injectAnimationStyles() {
  if (stylesInjected) return;
  const el = document.createElement('style');
  el.textContent = ANIMATION_STYLES;
  document.head.appendChild(el);
  stylesInjected = true;
}

// ─── Core simulation ──────────────────────────────────────────────────────────
/**
 * simulateFileLifecycle — V3 single-pass format validation simulation.
 *
 * Animates a single file through: uploading (progress 0→100) → validating → valid|invalid.
 * Invalid determination: filename contains any INVALID_KEYWORDS → INVALID
 *   with reason "File integrity check failed" (V3 deterministic demo rule).
 * All other files → VALID.
 *
 * @param fileId         - The StagedFile.id to animate
 * @param fileName       - Used to determine if the file should resolve as invalid
 * @param setFiles       - React setState dispatcher from the consuming component
 * @param progressTimers - A React.MutableRefObject<Map<string, ReturnType<typeof setInterval>>>
 *                         used to track and clean up timers on unmount
 */
export function simulateFileLifecycle(
  fileId: string,
  fileName: string,
  setFiles: React.Dispatch<React.SetStateAction<StagedFile[]>>,
  progressTimers: React.MutableRefObject<Map<string, ReturnType<typeof setInterval>>>,
) {
  const willBeInvalid = isInvalidFilename(fileName);
  let progress = 0;

  // Step 1: Animate upload progress 0→100 with variable speed (feels organic)
  const progressInterval = setInterval(() => {
    const remaining = 100 - progress;
    const step = Math.max(2, Math.floor(Math.random() * (remaining > 30 ? 18 : 8)) + 3);
    progress = Math.min(100, progress + step);

    if (progress >= 100) {
      clearInterval(progressInterval);
      progressTimers.current.delete(`progress-${fileId}`);

      // Step 2: Transition to validating
      setFiles(prev =>
        prev.map(f => f.id === fileId ? { ...f, status: 'validating', uploadProgress: 100 } : f)
      );

      // Step 3: Resolve after 1800–2800ms (V3: <2 seconds per file)
      const delay = 1800 + Math.random() * 1000;
      const resolveTimer = setTimeout(() => {
        progressTimers.current.delete(`resolve-${fileId}`);
        setFiles(prev =>
          prev.map(f => {
            if (f.id !== fileId) return f;
            if (willBeInvalid) {
              // V3: INVALID — File integrity check failed
              return {
                ...f,
                status: 'invalid' as ValidationStatus,
                error: 'File integrity check failed',
                categories: f.categories.map(c => ({
                  ...c,
                  passed: c.name !== 'File Integrity',
                  detail:
                    c.name === 'File Integrity'
                      ? 'File cannot be opened or is malformed'
                      : c.detail,
                })),
              };
            }
            // V3: VALID — all four checks pass
            return {
              ...f,
              status: 'valid' as ValidationStatus,
              categories: f.categories.map(c => ({
                ...c,
                passed: true,
                detail: c.name === 'File Integrity' ? 'Well-formed' : c.detail,
              })),
            };
          })
        );
      }, delay);
      progressTimers.current.set(
        `resolve-${fileId}`,
        resolveTimer as unknown as ReturnType<typeof setInterval>,
      );
    } else {
      setFiles(prev =>
        prev.map(f => f.id === fileId ? { ...f, uploadProgress: progress } : f)
      );
    }
  }, 70);

  progressTimers.current.set(`progress-${fileId}`, progressInterval);
}
