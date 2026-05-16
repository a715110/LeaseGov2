/**
 * RecordTabTerms — Tab component consumed by RecordsDetail
 * Converted from PropertyLeaseRecordTerms.tsx scaffold stub.
 *
 * Rent Schedule table: period_start_date · period_end_date · base_rent_amount ·
 *   escalation_amount · payment_amount. Paginated 12 rows. Footer: cumulative total.
 *
 * Data model refs: RentSchedule
 */

import { useState } from "react";

interface RecordTabTermsProps {
  recordId: string;
}

// TODO: Backend integration required — GET /api/records/:id/rent-schedule
const generateSchedule = () => {
  const rows = [];
  let base = 4250000; // cents
  let cumulative = 0;
  for (let i = 0; i < 132; i++) {
    const year = Math.floor(i / 12);
    const escalation = i > 0 && i % 12 === 0 ? Math.round(base * 0.03) : 0;
    if (escalation > 0) base += escalation;
    const payment = base;
    cumulative += payment;
    const startDate = new Date(2022, 0 + i, 1);
    const endDate = new Date(2022, 1 + i, 0);
    rows.push({
      period_number: i + 1,
      period_start_date: startDate.toISOString().slice(0, 10),
      period_end_date: endDate.toISOString().slice(0, 10),
      base_rent_amount: base,
      escalation_amount: escalation,
      payment_amount: payment,
      cumulative_amount: cumulative,
    });
  }
  return rows;
};

const SCHEDULE = generateSchedule();

function fmtCents(cents: number) {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits:2, maximumFractionDigits:2 })}`;
}

const PAGE_SIZE = 12;

export default function RecordTabTerms({ recordId }: RecordTabTermsProps) {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(SCHEDULE.length / PAGE_SIZE);
  const paged = SCHEDULE.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalCumulative = SCHEDULE[SCHEDULE.length - 1]?.cumulative_amount ?? 0;

  return (
    <div className="p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-semibold text-foreground">Rent Schedule</h3>
        <span className="text-[12px] text-muted-foreground">{SCHEDULE.length} periods · 132 months</span>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="data-table w-full text-[13px]">
          <thead>
            <tr>
              <th className="text-right w-12">#</th>
              <th className="text-left">Period Start</th>
              <th className="text-left">Period End</th>
              <th className="text-right">Base Rent</th>
              <th className="text-right">Escalation</th>
              <th className="text-right">Payment</th>
              <th className="text-right">Cumulative</th>
            </tr>
          </thead>
          <tbody>
            {paged.map(row => (
              <tr key={row.period_number} className={row.escalation_amount > 0 ? "bg-[var(--color-lg-accent-subtle)]/30" : ""}>
                <td className="text-right font-mono text-[11px] text-muted-foreground">{row.period_number}</td>
                <td className="text-muted-foreground">{row.period_start_date}</td>
                <td className="text-muted-foreground">{row.period_end_date}</td>
                <td className="text-right font-mono">{fmtCents(row.base_rent_amount)}</td>
                <td className="text-right font-mono">
                  {row.escalation_amount > 0
                    ? <span style={{ color:"var(--color-lg-success)" }}>+{fmtCents(row.escalation_amount)}</span>
                    : <span className="text-muted-foreground">—</span>
                  }
                </td>
                <td className="text-right font-mono font-semibold">{fmtCents(row.payment_amount)}</td>
                <td className="text-right font-mono text-muted-foreground text-[11px]">{fmtCents(row.cumulative_amount)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-border bg-muted/20">
              <td colSpan={5} className="text-right text-[12px] font-semibold text-foreground pr-4">Total Contract Value</td>
              <td className="text-right font-mono font-bold text-foreground">{fmtCents(totalCumulative)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border">
            <span className="text-[12px] text-muted-foreground">
              Periods {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, SCHEDULE.length)} of {SCHEDULE.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                className="px-2.5 py-1 text-[12px] border border-border rounded hover:bg-muted/30 disabled:opacity-40"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >Prev</button>
              <span className="px-2 text-[12px] text-muted-foreground">Page {page} of {totalPages}</span>
              <button
                className="px-2.5 py-1 text-[12px] border border-border rounded hover:bg-muted/30 disabled:opacity-40"
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
              >Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
