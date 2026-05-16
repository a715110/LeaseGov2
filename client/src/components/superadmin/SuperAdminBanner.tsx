/**
 * SuperAdminBanner — persistent full-width red banner shown on all SuperAdmin screens.
 * Spec: var(--color-lg-error-subtle) background, 2px solid var(--color-lg-error) border-bottom.
 * Never shown to tenant users.
 */
export default function SuperAdminBanner() {
  return (
    <div
      className="w-full px-6 py-2.5 flex items-center gap-2 text-[12px] font-semibold shrink-0"
      style={{
        background: 'var(--color-lg-error-subtle)',
        borderBottom: '2px solid var(--color-lg-error)',
        color: 'var(--color-lg-error)',
      }}
    >
      <span className="text-base">⚠</span>
      <span>SuperAdmin Mode — Platform administration only. No tenant data is accessible from this view.</span>
    </div>
  );
}
