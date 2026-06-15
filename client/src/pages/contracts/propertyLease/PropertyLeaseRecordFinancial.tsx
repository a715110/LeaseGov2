/**
 * RecordTabFinancial — Tab component consumed by RecordsDetail
 * FC-5 Screen 5.3 Financial tab
 *
 * Shows: summary metric tiles (ROU asset, lease liability, monthly payment,
 * discount rate, remaining term), amortization schedule table (first 12 periods),
 * and key financial metrics panel.
 *
 * Data model refs: PropertyLease financial fields (ASC 842 / IFRS 16)
 */
import { TrendingDown, DollarSign, Calendar, Percent, BarChart3, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface RecordTabFinancialProps {
  recordId: string;
}

// TODO: Backend integration required — GET /api/records/:id/financial
const MOCK_FINANCIAL = {
  rou_asset_opening:       52_480_000,   // cents
  rou_asset_current:       44_810_000,
  lease_liability_opening: 52_480_000,
  lease_liability_current: 43_920_000,
  monthly_payment:          4_250_000,
  discount_rate:            0.0425,
  remaining_term_months:    80,
  total_term_months:        132,
  commencement_date:        "2022-01-01",
  expiration_date:          "2032-12-31",
  classification:           "Operating Lease",
  standard:                 "ASC 842",
  // Cumulative totals
  total_payments_made:      4_250_000 * 52,
  total_interest_expense:   8_940_000,
  total_amortization:       7_670_000,
};

// Generate first 12 amortization periods from mock data
function buildAmortizationSchedule() {
  const monthlyRate = MOCK_FINANCIAL.discount_rate / 12;
  let balance = MOCK_FINANCIAL.lease_liability_current;
  const payment = MOCK_FINANCIAL.monthly_payment;
  const rows = [];
  const startDate = new Date("2026-06-01");
  for (let i = 0; i < 12; i++) {
    const interest = Math.round(balance * monthlyRate);
    const principal = payment - interest;
    const endBalance = balance - principal;
    const d = new Date(startDate);
    d.setMonth(d.getMonth() + i);
    rows.push({
      period: i + 1,
      date: d.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      payment,
      interest,
      principal,
      balance: Math.max(0, endBalance),
    });
    balance = Math.max(0, endBalance);
  }
  return rows;
}

const AMORT_SCHEDULE = buildAmortizationSchedule();

function fmtCents(cents: number) {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function MetricTile({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="bg-card border border-border rounded-lg p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2 text-muted-foreground">
        <span className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: accent || "var(--color-lg-accent-subtle)" }}>
          {icon}
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-[22px] font-bold text-foreground leading-none">{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

export default function RecordTabFinancial({ recordId }: RecordTabFinancialProps) {
  const [showFullSchedule, setShowFullSchedule] = useState(false);
  const visibleRows = showFullSchedule ? AMORT_SCHEDULE : AMORT_SCHEDULE.slice(0, 6);

  const rouProgress = Math.round((MOCK_FINANCIAL.rou_asset_current / MOCK_FINANCIAL.rou_asset_opening) * 100);
  const termProgress = Math.round(
    ((MOCK_FINANCIAL.total_term_months - MOCK_FINANCIAL.remaining_term_months) /
      MOCK_FINANCIAL.total_term_months) *
      100
  );

  return (
    <div className="p-6 flex flex-col gap-6">
      {/* Standard badge */}
      <div className="flex items-center gap-3">
        <span className="text-[12px] font-semibold px-2.5 py-1 rounded-md bg-[var(--color-lg-accent-subtle)] text-[var(--color-lg-primary)]">
          {MOCK_FINANCIAL.standard}
        </span>
        <span className="text-[12px] text-muted-foreground">{MOCK_FINANCIAL.classification}</span>
        <span className="text-[12px] text-muted-foreground">·</span>
        <span className="text-[12px] text-muted-foreground">
          Commenced {new Date(MOCK_FINANCIAL.commencement_date).toLocaleDateString("en-US", { dateStyle: "medium" })}
        </span>
      </div>

      {/* Summary metric tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricTile
          icon={<BarChart3 className="w-4 h-4 text-[var(--color-lg-primary)]" />}
          label="ROU Asset (Current)"
          value={fmtCents(MOCK_FINANCIAL.rou_asset_current)}
          sub={`Opening: ${fmtCents(MOCK_FINANCIAL.rou_asset_opening)} · ${rouProgress}% remaining`}
          accent="var(--color-lg-accent-subtle)"
        />
        <MetricTile
          icon={<TrendingDown className="w-4 h-4 text-[var(--color-lg-warning)]" />}
          label="Lease Liability (Current)"
          value={fmtCents(MOCK_FINANCIAL.lease_liability_current)}
          sub={`Opening: ${fmtCents(MOCK_FINANCIAL.lease_liability_opening)}`}
          accent="var(--color-lg-warning-subtle)"
        />
        <MetricTile
          icon={<DollarSign className="w-4 h-4 text-[var(--color-lg-success)]" />}
          label="Monthly Payment"
          value={fmtCents(MOCK_FINANCIAL.monthly_payment)}
          sub="Fixed · escalates 3% annually"
          accent="var(--color-lg-success-subtle)"
        />
        <MetricTile
          icon={<Percent className="w-4 h-4 text-[var(--color-lg-info)]" />}
          label="Discount Rate (IBR)"
          value={`${(MOCK_FINANCIAL.discount_rate * 100).toFixed(2)}%`}
          sub="Incremental borrowing rate"
          accent="var(--color-lg-info-subtle)"
        />
        <MetricTile
          icon={<Calendar className="w-4 h-4 text-muted-foreground" />}
          label="Remaining Term"
          value={`${MOCK_FINANCIAL.remaining_term_months} mo`}
          sub={`${termProgress}% elapsed of ${MOCK_FINANCIAL.total_term_months} mo total`}
          accent="var(--color-lg-page-bg)"
        />
        <MetricTile
          icon={<TrendingDown className="w-4 h-4 text-[var(--color-lg-error)]" />}
          label="Cumulative Interest"
          value={fmtCents(MOCK_FINANCIAL.total_interest_expense)}
          sub={`Amortization: ${fmtCents(MOCK_FINANCIAL.total_amortization)}`}
          accent="var(--color-lg-error-subtle)"
        />
      </div>

      {/* Term progress bar */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide">Lease Term Progress</span>
          <span className="text-[12px] text-muted-foreground">{termProgress}% elapsed</span>
        </div>
        <div className="h-2 bg-[var(--color-lg-page-bg)] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${termProgress}%`,
              background: "var(--color-lg-primary)",
            }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[11px] text-muted-foreground">
            {new Date(MOCK_FINANCIAL.commencement_date).toLocaleDateString("en-US", { dateStyle: "medium" })}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {new Date(MOCK_FINANCIAL.expiration_date).toLocaleDateString("en-US", { dateStyle: "medium" })}
          </span>
        </div>
      </div>

      {/* Amortization schedule */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <h3 className="text-[13px] font-semibold text-foreground">Amortization Schedule</h3>
          <span className="text-[11px] text-muted-foreground">Next 12 periods shown</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-border bg-[var(--color-lg-page-bg)]">
                <th className="text-left px-5 py-2.5 font-semibold text-muted-foreground uppercase tracking-wide text-[11px]">#</th>
                <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground uppercase tracking-wide text-[11px]">Period</th>
                <th className="text-right px-4 py-2.5 font-semibold text-muted-foreground uppercase tracking-wide text-[11px]">Payment</th>
                <th className="text-right px-4 py-2.5 font-semibold text-muted-foreground uppercase tracking-wide text-[11px]">Interest</th>
                <th className="text-right px-4 py-2.5 font-semibold text-muted-foreground uppercase tracking-wide text-[11px]">Principal</th>
                <th className="text-right px-5 py-2.5 font-semibold text-muted-foreground uppercase tracking-wide text-[11px]">Ending Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visibleRows.map((row) => (
                <tr key={row.period} className="hover:bg-[var(--color-lg-page-bg)] transition-colors">
                  <td className="px-5 py-3 text-muted-foreground">{row.period}</td>
                  <td className="px-4 py-3 font-medium text-foreground">{row.date}</td>
                  <td className="px-4 py-3 text-right text-foreground">{fmtCents(row.payment)}</td>
                  <td className="px-4 py-3 text-right" style={{ color: "var(--color-lg-warning)" }}>{fmtCents(row.interest)}</td>
                  <td className="px-4 py-3 text-right" style={{ color: "var(--color-lg-success)" }}>{fmtCents(row.principal)}</td>
                  <td className="px-5 py-3 text-right font-medium text-foreground">{fmtCents(row.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {AMORT_SCHEDULE.length > 6 && (
          <div className="border-t border-border">
            <button
              onClick={() => setShowFullSchedule(!showFullSchedule)}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 text-[12px] text-[var(--color-lg-primary)] hover:bg-[var(--color-lg-accent-subtle)] transition-colors"
            >
              {showFullSchedule ? (
                <><ChevronUp className="w-3.5 h-3.5" /> Show fewer periods</>
              ) : (
                <><ChevronDown className="w-3.5 h-3.5" /> Show all {AMORT_SCHEDULE.length} periods</>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Cumulative totals */}
      <div className="bg-card border border-border rounded-lg p-5">
        <h3 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide mb-4">Cumulative Totals (Inception to Date)</h3>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Total Payments Made</p>
            <p className="text-[18px] font-bold text-foreground">{fmtCents(MOCK_FINANCIAL.total_payments_made)}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Total Interest Expense</p>
            <p className="text-[18px] font-bold" style={{ color: "var(--color-lg-warning)" }}>{fmtCents(MOCK_FINANCIAL.total_interest_expense)}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Total Amortization</p>
            <p className="text-[18px] font-bold" style={{ color: "var(--color-lg-success)" }}>{fmtCents(MOCK_FINANCIAL.total_amortization)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
