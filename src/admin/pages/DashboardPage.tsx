import { useState } from "react";
import { Badge, Card, PageHeader } from "../components/ui";

// Sample data: replaced by GET /api/analytics/* in Phase 6.
const RANGES = ["Today", "7 Days", "30 Days", "3 Months", "12 Months"] as const;
type Range = (typeof RANGES)[number];

const revenueSeries: Record<Range, { label: string; books: number; consults: number }[]> = {
  Today: [
    { label: "9am", books: 40, consults: 250 }, { label: "12pm", books: 120, consults: 0 },
    { label: "3pm", books: 60, consults: 1250 }, { label: "6pm", books: 90, consults: 0 },
  ],
  "7 Days": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label, i) => ({
    label, books: [180, 240, 90, 310, 260, 420, 150][i]!, consults: [500, 250, 1250, 0, 750, 500, 0][i]!,
  })),
  "30 Days": ["W1", "W2", "W3", "W4"].map((label, i) => ({
    label, books: [1240, 1680, 1420, 1960][i]!, consults: [3250, 4500, 2750, 5000][i]!,
  })),
  "3 Months": ["Month 1", "Month 2", "Month 3"].map((label, i) => ({
    label, books: [5100, 6300, 6900][i]!, consults: [13200, 15750, 17500][i]!,
  })),
  "12 Months": ["Q1", "Q2", "Q3", "Q4"].map((label, i) => ({
    label, books: [17200, 19400, 22100, 24800][i]!, consults: [41000, 46500, 52000, 58750][i]!,
  })),
};

const money = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const orders = [
  { id: "#1042", customer: "Maya Thompson", items: "Arrive at Origin ×1", amount: 24.99, payment: "Paid", status: "Processing", date: "Sep 29" },
  { id: "#1041", customer: "Rohan Mehta", items: "Your Path to Peace ×2", amount: 39.98, payment: "Paid", status: "Shipped", date: "Sep 28" },
  { id: "#1040", customer: "Elena Garcia", items: "Keeping It Simple ×1", amount: 14.99, payment: "Pending", status: "Pending Payment", date: "Sep 28" },
  { id: "#1039", customer: "Daniel Kim", items: "Life Force ×1, AAO II ×1", amount: 44.98, payment: "Paid", status: "Delivered", date: "Sep 26" },
] as const;

const consultations = [
  { customer: "Priya Nair", service: "Private Session", date: "Oct 1", time: "10:00 AM", payment: "Paid", status: "Confirmed" },
  { customer: "James Carter", service: "Grief & Transition", date: "Oct 1", time: "2:30 PM", payment: "Paid", status: "Confirmed" },
  { customer: "Sofia Alvarez", service: "Relationship Counsel", date: "Oct 2", time: "11:00 AM", payment: "Pending", status: "Pending Payment" },
] as const;

const tone = (s: string) => (s === "Paid" || s === "Confirmed" || s === "Delivered" ? "good" : s.startsWith("Pending") ? "warn" : "info");

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-[var(--admin-radius)] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5">
      <div className="text-[0.82rem] text-[var(--admin-text-muted)]">{label}</div>
      <div className="mt-1 font-display text-[clamp(1.6rem,2.4vw,2.1rem)] leading-tight">{value}</div>
      {hint && <div className="mt-1 text-[0.78rem] text-[var(--admin-text-secondary)]">{hint}</div>}
    </div>
  );
}

function RevenueChart({ data }: { data: { label: string; books: number; consults: number }[] }) {
  const max = Math.max(...data.map((d) => d.books + d.consults), 1);
  const H = 180;
  const slot = 100 / data.length;
  return (
    <svg viewBox={`0 0 100 ${H + 22}`} preserveAspectRatio="none" className="h-[240px] w-full" role="img" aria-label="Revenue by period, books and consultations stacked">
      {data.map((d, i) => {
        const bh = (d.books / max) * H;
        const ch = (d.consults / max) * H;
        const x = i * slot + slot * 0.2;
        const w = slot * 0.6;
        return (
          <g key={d.label}>
            <rect x={x} y={H - bh - ch} width={w} height={ch} fill="var(--color-halo)" rx="0.6" />
            <rect x={x} y={H - bh} width={w} height={bh} fill="var(--color-verdigris)" rx="0.6" />
            <text x={i * slot + slot / 2} y={H + 14} textAnchor="middle" fontSize="3.4" fill="var(--color-dim)">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

function Th({ children }: { children: string }) {
  return <th className="px-3 py-2 text-left text-[0.78rem] font-medium whitespace-nowrap text-[var(--admin-text-muted)]">{children}</th>;
}
const td = "px-3 py-3 text-[0.88rem] whitespace-nowrap border-t border-[var(--admin-border)]";

export function DashboardPage() {
  const [range, setRange] = useState<Range>("30 Days");
  const data = revenueSeries[range];
  const books = data.reduce((s, d) => s + d.books, 0);
  const consults = data.reduce((s, d) => s + d.consults, 0);

  return (
    <>
      <PageHeader title="Dashboard" description="Sample data shown until the analytics API is connected." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Total Revenue" value={money(books + consults)} hint={range} />
        <Stat label="Book Revenue" value={money(books)} />
        <Stat label="Consultation Revenue" value={money(consults)} />
        <Stat label="Total Orders" value="186" hint="+12 this week" />
        <Stat label="Pending Orders" value="7" />
        <Stat label="Upcoming Consultations" value="14" hint="next 7 days" />
        <Stat label="Total Customers" value="412" />
        <Stat label="Blog Views" value="8,930" hint="last 30 days" />
      </div>

      <Card
        className="mt-6"
        title="Revenue"
        action={
          <div role="group" aria-label="Revenue range" className="flex flex-wrap gap-2">
            {RANGES.map((r) => (
              <button
                key={r}
                type="button"
                aria-pressed={r === range}
                onClick={() => setRange(r)}
                className={`rounded-full border px-3.5 py-1.5 text-[0.82rem] transition-colors ${
                  r === range
                    ? "border-[var(--admin-accent)] bg-[rgba(232,206,140,0.14)] text-[var(--admin-accent)]"
                    : "border-[var(--admin-border)] text-[var(--admin-text-secondary)] hover:border-[var(--admin-accent)]"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        }
      >
        <RevenueChart data={data} />
        <div className="mt-3 flex gap-5 text-[0.82rem] text-[var(--admin-text-secondary)]">
          <span className="inline-flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-sm bg-verdigris" /> Books</span>
          <span className="inline-flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-sm bg-halo" /> Consultations</span>
        </div>
      </Card>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card title="Recent Orders">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>{["Order", "Customer", "Items", "Amount", "Payment", "Status", "Date"].map((h) => <Th key={h}>{h}</Th>)}</tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td className={td}>{o.id}</td>
                    <td className={td}>{o.customer}</td>
                    <td className={`${td} text-[var(--admin-text-secondary)]`}>{o.items}</td>
                    <td className={td}>${o.amount.toFixed(2)}</td>
                    <td className={td}><Badge tone={tone(o.payment)}>{o.payment}</Badge></td>
                    <td className={td}><Badge tone={tone(o.status)}>{o.status}</Badge></td>
                    <td className={td}>{o.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Upcoming Consultations">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>{["Customer", "Service", "Date", "Time", "Payment", "Booking"].map((h) => <Th key={h}>{h}</Th>)}</tr>
              </thead>
              <tbody>
                {consultations.map((c) => (
                  <tr key={c.customer}>
                    <td className={td}>{c.customer}</td>
                    <td className={`${td} text-[var(--admin-text-secondary)]`}>{c.service}</td>
                    <td className={td}>{c.date}</td>
                    <td className={td}>{c.time}</td>
                    <td className={td}><Badge tone={tone(c.payment)}>{c.payment}</Badge></td>
                    <td className={td}><Badge tone={tone(c.status)}>{c.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </>
  );
}
