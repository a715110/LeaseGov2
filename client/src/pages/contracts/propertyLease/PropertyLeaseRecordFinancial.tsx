/**
 * RecordTabFinancial — Tab component consumed by RecordsDetail
 * FC-5 Screen 5.3 Financial tab
 *
 * Prompt 3 (Equipment Lease): Added isEquipmentLease prop.
 *   - isEquipmentLease = false → existing property lease layout (unchanged)
 *   - isEquipmentLease = true  → equipment layout:
 *       Tiles: Monthly Payment, Total Remaining Payments, ROU Asset, Lease Liability,
 *              Residual Value Guarantee, Purchase Option Value
 *       Payment schedule table (12 rows from equipment data)
 *       Finance lease depreciation section (only when lease_classification === 'finance')
 *
 * Data model refs: PropertyLease financial fields (ASC 842 / IFRS 16), EquipmentLease
 */

import { TrendingDown, DollarSign, Calendar, Percent, BarChart3, ChevronDown, ChevronUp, Shield, ShoppingCart } from "lucide-react";
import { useState } from "react";
import type { EquipmentLease } from "@/types/contracts/equipmentLease/EquipmentLease";

interface RecordTabFinancialProps {
  recordId: string;
  isEquipmentLease?: boolean;
  equipmentRecord?: EquipmentLease;
}

// ─── Shared helpers ───────────────────────────────────────────────────────────
function fmtCents(cents: number) {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}
function fmtCurrency(n: number) {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function MetricTile({
  icon, label, value, sub, accent,
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

// ─── Property lease mock data ─────────────────────────────────────────────────
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
  total_payments_made:      4_250_000 * 52,
  total_interest_expense:   8_940_000,
  total_amortization:       7_670_000,
};

function buildPropertyAmortizationSchedule() {
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

const PROPERTY_AMORT_SCHEDULE = buildPropertyAmortizationSchedule();

// ─── Equipment payment schedule builder ──────────────────────────────────────
function buildEquipmentPaymentSchedule(eq: EquipmentLease) {
  const monthlyRate = eq.discount_rate / 12;
  let balance = eq.lease_liability_balance ?? eq.present_value_of_payments;
  const payment = eq.monthly_payment;
  const rows = [];
  const startDate = new Date("2026-06-01");
  for (let i = 0; i < 12; i++) {
    const interest = Math.round(balance * monthlyRate);
    const principal = payment - interest;
    const endBalance = balance - principal;
    const d = new Date(startDate);
    d.setMonth(d.getMonth() + i);
    // Accumulated depreciation (straight-line from ROU asset)
    const rouAsset = eq.rou_asset_balance ?? eq.present_value_of_payments;
    const monthsElapsed = i + 1;
    const accDepreciation = Math.round((rouAsset / eq.base_lease_term_months) * monthsElapsed);
    rows.push({
      period: i + 1,
      date: d.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      payment,
      interest,
      principal,
      accumulated_depreciation_rou: accDepreciation,
      liability_balance: Math.max(0, endBalance),
    });
    balance = Math.max(0, endBalance);
  }
  return rows;
}

// ─── Equipment Financial Layout ───────────────────────────────────────────────
function EquipmentFinancial({ eq }: { eq: EquipmentLease }) {
  const [showFullSchedule, setShowFullSchedule] = useState(false);
  const schedule = buildEquipmentPaymentSchedule(eq);
  const visibleRows = showFullSchedule ? schedule : schedule.slice(0, 6);

  const isFinance = eq.lease_classification === "finance";
  const rouAsset = eq.rou_asset_balance ?? eq.present_value_of_payments;
  const liabilityBalance = eq.lease_liability_balance ?? eq.present_value_of_payments;

  // Months elapsed since commencement
  const start = new Date(eq.commencement_date);
  const now = new Date();
  const monthsElapsed = Math.max(0, (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth()));
  const monthlyDepreciation = Math.round(rouAsset / eq.useful_life_months);
  const accumulatedDepreciation = Math.min(monthlyDepreciation * monthsElapsed, rouAsset);
  const netBookValue = rouAsset - accumulatedDepreciation;

  const termProgress = Math.round((monthsElapsed / eq.base_lease_term_months) * 100);

  return (
    <div className="p-6 flex flex-col gap-6">
      {/* Standard badge */}
      <div className="flex items-center gap-3">
        <span className="text-[12px] font-semibold px-2.5 py-1 rounded-md bg-[var(--color-lg-accent-subtle)] text-[var(--color-lg-primary)]">
          ASC 842
        </span>
        <span className="text-[12px] text-muted-foreground capitalize">{eq.lease_classification} Lease</span>
        <span className="text-[12px] text-muted-foreground">·</span>
        <span className="text-[12px] text-muted-foreground">
          Commenced {new Date(eq.commencement_date).toLocaleDateString("en-US", { dateStyle: "medium" })}
        </span>
      </div>

      {/* Summary metric tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricTile
          icon={<DollarSign className="w-4 h-4 text-[var(--color-lg-success)]" />}
          label="Monthly Payment"
          value={fmtCurrency(eq.monthly_payment)}
          sub={`${eq.payment_frequency} · ${eq.base_lease_term_months} month term`}
          accent="var(--color-lg-success-subtle)"
        />
        <MetricTile
          icon={<Calendar className="w-4 h-4 text-muted-foreground" />}
          label="Total Remaining Payments"
          value={fmtCurrency(eq.monthly_payment * Math.max(0, eq.base_lease_term_months - monthsElapsed))}
          sub={`${Math.max(0, eq.base_lease_term_months - monthsElapsed)} payments remaining`}
          accent="var(--color-lg-page-bg)"
        />
        <MetricTile
          icon={<BarChart3 className="w-4 h-4 text-[var(--color-lg-primary)]" />}
          label="ROU Asset Balance"
          value={fmtCurrency(rouAsset)}
          sub={`Opening: ${fmtCurrency(eq.present_value_of_payments)}`}
          accent="var(--color-lg-accent-subtle)"
        />
        <MetricTile
          icon={<TrendingDown className="w-4 h-4 text-[var(--color-lg-warning)]" />}
          label="Lease Liability Balance"
          value={fmtCurrency(liabilityBalance)}
          sub={`Discount rate: ${(eq.discount_rate * 100).toFixed(2)}%`}
          accent="var(--color-lg-warning-subtle)"
        />
        <MetricTile
          icon={<Shield className="w-4 h-4 text-[var(--color-lg-info)]" />}
          label="Residual Value Guarantee"
          value={eq.residual_value_guarantee != null ? fmtCurrency(eq.residual_value_guarantee) : "None"}
          sub="Guaranteed at lease end"
          accent="var(--color-lg-info-subtle)"
        />
        <MetricTile
          icon={<ShoppingCart className="w-4 h-4 text-muted-foreground" />}
          label="Purchase Option Value"
          value={eq.purchase_option_price != null ? fmtCurrency(eq.purchase_option_price) : "No purchase option"}
          sub={eq.purchase_option_exercise_date ? `At ${eq.purchase_option_exercise_date}` : undefined}
          accent="var(--color-lg-page-bg)"
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
            style={{ width: `${Math.min(termProgress, 100)}%`, background: "var(--color-lg-primary)" }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[11px] text-muted-foreground">
            {new Date(eq.commencement_date).toLocaleDateString("en-US", { dateStyle: "medium" })}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {new Date(eq.expiration_date).toLocaleDateString("en-US", { dateStyle: "medium" })}
          </span>
        </div>
      </div>

      {/* Payment schedule table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <h3 className="text-[13px] font-semibold text-foreground">Payment Schedule</h3>
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
                <th className="text-right px-4 py-2.5 font-semibold text-muted-foreground uppercase tracking-wide text-[11px]">Accum. Depr. (ROU)</th>
                <th className="text-right px-5 py-2.5 font-semibold text-muted-foreground uppercase tracking-wide text-[11px]">Liability Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visibleRows.map((row) => (
                <tr key={row.period} className="hover:bg-[var(--color-lg-page-bg)] transition-colors">
                  <td className="px-5 py-3 text-muted-foreground">{row.period}</td>
                  <td className="px-4 py-3 font-medium text-foreground">{row.date}</td>
                  <td className="px-4 py-3 text-right text-foreground">{fmtCurrency(row.payment)}</td>
                  <td className="px-4 py-3 text-right" style={{ color: "var(--color-lg-warning)" }}>{fmtCurrency(row.interest)}</td>
                  <td className="px-4 py-3 text-right" style={{ color: "var(--color-lg-success)" }}>{fmtCurrency(row.principal)}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{fmtCurrency(row.accumulated_depreciation_rou)}</td>
                  <td className="px-5 py-3 text-right font-medium text-foreground">{fmtCurrency(row.liability_balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {schedule.length > 6 && (
          <div className="border-t border-border">
            <button
              onClick={() => setShowFullSchedule(!showFullSchedule)}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 text-[12px] text-[var(--color-lg-primary)] hover:bg-[var(--color-lg-accent-subtle)] transition-colors"
            >
              {showFullSchedule ? (
                <><ChevronUp className="w-3.5 h-3.5" /> Show fewer periods</>
              ) : (
                <><ChevronDown className="w-3.5 h-3.5" /> Show all {schedule.length} periods</>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Finance lease depreciation section */}
      {isFinance && (
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <span
              className="text-[11px] px-2 py-0.5 rounded font-semibold"
              style={{ background: "var(--color-lg-error-subtle)", color: "var(--color-lg-error)" }}
            >
              Finance Lease
            </span>
            <h3 className="text-[13px] font-semibold text-foreground">Depreciation Schedule</h3>
          </div>
          <p className="text-[12px] text-muted-foreground mb-4 leading-relaxed">
            Finance lease assets are depreciated on a straight-line basis over{" "}
            <strong className="text-foreground">{eq.useful_life_months} months</strong> (useful life).
          </p>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Depreciation / Month</p>
              <p className="text-[18px] font-bold text-foreground">{fmtCurrency(monthlyDepreciation)}</p>
              <p className="text-[11px] text-muted-foreground">ROU ÷ useful life</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Accumulated Depreciation</p>
              <p className="text-[18px] font-bold" style={{ color: "var(--color-lg-warning)" }}>{fmtCurrency(accumulatedDepreciation)}</p>
              <p className="text-[11px] text-muted-foreground">{monthsElapsed} months elapsed</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Net Book Value</p>
              <p className="text-[18px] font-bold" style={{ color: "var(--color-lg-success)" }}>{fmtCurrency(netBookValue)}</p>
              <p className="text-[11px] text-muted-foreground">ROU − accumulated depr.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Property Financial Layout (unchanged) ────────────────────────────────────
function PropertyFinancial() {
  const [showFullSchedule, setShowFullSchedule] = useState(false);
  const visibleRows = showFullSchedule ? PROPERTY_AMORT_SCHEDULE : PROPERTY_AMORT_SCHEDULE.slice(0, 6);

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
            style={{ width: `${termProgress}%`, background: "var(--color-lg-primary)" }}
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
        {PROPERTY_AMORT_SCHEDULE.length > 6 && (
          <div className="border-t border-border">
            <button
              onClick={() => setShowFullSchedule(!showFullSchedule)}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 text-[12px] text-[var(--color-lg-primary)] hover:bg-[var(--color-lg-accent-subtle)] transition-colors"
            >
              {showFullSchedule ? (
                <><ChevronUp className="w-3.5 h-3.5" /> Show fewer periods</>
              ) : (
                <><ChevronDown className="w-3.5 h-3.5" /> Show all {PROPERTY_AMORT_SCHEDULE.length} periods</>
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

// ─── Main export ──────────────────────────────────────────────────────────────
export default function RecordTabFinancial({ recordId: _recordId, isEquipmentLease = false, equipmentRecord }: RecordTabFinancialProps) {
  if (isEquipmentLease && equipmentRecord) {
    return <EquipmentFinancial eq={equipmentRecord} />;
  }
  return <PropertyFinancial />;
}
