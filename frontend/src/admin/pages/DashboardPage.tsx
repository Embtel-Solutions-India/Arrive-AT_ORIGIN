import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Badge, Button, Card, PageHeader } from "../components/ui";
import {
  AnalyticsTrendChart,
  CategoryRevenueChart,
  OrderStatusBreakdownChart,
  PublicationSalesBarChart,
} from "../components/DashboardCharts";

interface DashboardData {
  cards: {
    totalBooks: number;
    publishedBooks: number;
    draftBooks: number;
    outOfStockBooks: number;
    totalBlogs: number;
    publishedBlogs: number;
    draftBlogs: number;
    totalOrders: number;
    pendingOrders: number;
    completedOrders: number;
    totalCustomers: number;
    totalRevenue: number;
  };
  recentOrders: Array<{
    _id: string;
    orderNumber: string;
    customerInfo: { name: string; email: string };
    total: number;
    paymentStatus: string;
    orderStatus: string;
    createdAt: string;
    items: Array<{ title: string; quantity: number }>;
  }>;
  recentBlogs: Array<{
    _id: string;
    title: string;
    slug: string;
    authorName: string;
    categoryName: string;
    status: string;
    publishDate: string;
    createdAt: string;
  }>;
  bestSellingBooks: Array<{
    _id: string;
    title: string;
    slug: string;
    coverImage: string;
    price: number;
    salesCount: number;
    revenue: number;
    stockQuantity: number;
  }>;
  chartData: Array<{ date: string; revenue: number; orders: number }>;
  categoryDistribution?: Array<{ name: string; count: number; revenue: number; sales: number }>;
  orderStatusDistribution?: Array<{ status: string; count: number; amount: number }>;
  formatDistribution?: Array<{ format: string; count: number; stock: number }>;
  range: string;
}

const RANGES = [
  { label: "Today", value: "today" },
  { label: "Last 7 Days", value: "7d" },
  { label: "Last 30 Days", value: "30d" },
  { label: "This Year", value: "year" },
];

const money = (n: number) =>
  `$${(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const orderStatusTone = (s: string) => {
  if (s === "DELIVERED" || s === "PAYMENT_CONFIRMED") return "good";
  if (s === "PROCESSING" || s === "SHIPPED") return "info";
  if (s === "PENDING") return "warn";
  return "bad";
};

const paymentStatusTone = (s: string) => {
  if (s === "PAID" || s === "SUCCESSFUL") return "good";
  if (s === "PENDING") return "warn";
  return "bad";
};

export function DashboardPage() {
  const [range, setRange] = useState("30d");

  const { data, isLoading, error } = useQuery<DashboardData>({
    queryKey: ["admin", "dashboard", range],
    queryFn: () => api.get<DashboardData>(`/admin/dashboard?range=${range}`),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" description="Loading real-time MongoDB data and store metrics…" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-[var(--admin-surface)]" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-[var(--admin-danger)]/30 bg-[var(--admin-danger)]/10 p-6 text-center">
        <p className="text-[var(--admin-danger)] font-medium">Failed to load dashboard metrics from MongoDB.</p>
        <p className="text-sm text-[var(--admin-text-muted)] mt-1">{(error as any)?.message || "Unknown error"}</p>
      </div>
    );
  }

  const { cards, recentOrders, recentBlogs, bestSellingBooks, chartData } = data;  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Real-time MongoDB overview of publications, inventory, store sales, and customer activity."
        action={
          <div className="flex items-center gap-2">
            <Link to="/admin/books/new">
              <Button size="sm" variant="outline">
                + Add Book
              </Button>
            </Link>
            <Link to="/admin/blog/new">
              <Button size="sm" variant="primary">
                + New Post
              </Button>
            </Link>
          </div>
        }
      />

      {/* 12 Dynamic Metrics Cards */}
      <div>
        <h2 className="mb-3 text-[0.8rem] font-semibold tracking-wider text-[var(--admin-text-muted)] uppercase">
          Key Performance Indicators (MongoDB)
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          <StatCard label="Total Revenue" value={money(cards.totalRevenue)} highlight="good" />
          <StatCard label="Total Orders" value={cards.totalOrders} sub={`${cards.pendingOrders} pending`} />
          <StatCard label="Completed Orders" value={cards.completedOrders} />
          <StatCard label="Total Customers" value={cards.totalCustomers} />
          <StatCard label="Total Books" value={cards.totalBooks} sub={`${cards.publishedBooks} published`} />
          <StatCard label="Draft Books" value={cards.draftBooks} />
          <StatCard
            label="Out of Stock Books"
            value={cards.outOfStockBooks}
            highlight={cards.outOfStockBooks > 0 ? "warn" : undefined}
          />
          <StatCard label="Total Blogs" value={cards.totalBlogs} />
          <StatCard label="Published Posts" value={cards.publishedBlogs} />
          <StatCard label="Draft Posts" value={cards.draftBlogs} />
          <StatCard label="Pending Orders" value={cards.pendingOrders} highlight={cards.pendingOrders > 0 ? "warn" : undefined} />
          <StatCard label="Published Books" value={cards.publishedBooks} />
        </div>
      </div>

      {/* 1. Main Interactive Analytics Trend Chart with Area / Bar / Pie Switcher */}
      <AnalyticsTrendChart
        data={chartData}
        range={range}
        onRangeChange={setRange}
        ranges={RANGES}
      />

      {/* 2. Visual Distribution Charts: Category Share (Pie/Donut) & Order Status Breakdown (Pie/Donut) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="min-w-0">
          <CategoryRevenueChart categories={data.categoryDistribution || []} />
        </div>
        <div className="min-w-0">
          <OrderStatusBreakdownChart statuses={data.orderStatusDistribution || []} />
        </div>
      </div>

      {/* 3. Publication Sales Comparison (Horizontal Bar Chart) */}
      {bestSellingBooks.length > 0 && (
        <div className="min-w-0">
          <PublicationSalesBarChart books={bestSellingBooks} />
        </div>
      )}

      {/* Grid: Recent Orders & Best Sellers */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Orders (2 cols) */}
        <div className="lg:col-span-2 min-w-0">
          <Card
            title="Recent Orders"
            action={
              <Link to="/admin/orders" className="text-xs font-semibold text-[var(--admin-accent)] hover:underline">
                View all orders →
              </Link>
            }
          >
            {recentOrders.length === 0 ? (
              <p className="py-6 text-center text-sm text-[var(--admin-text-muted)]">No orders placed yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[var(--admin-border)]/50 text-[0.75rem] text-[var(--admin-text-muted)] uppercase">
                      <th className="pb-3 font-semibold">Order</th>
                      <th className="pb-3 font-semibold">Customer</th>
                      <th className="pb-3 font-semibold">Amount</th>
                      <th className="pb-3 font-semibold">Payment</th>
                      <th className="pb-3 font-semibold">Status</th>
                      <th className="pb-3 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--admin-border)]/30">
                    {recentOrders.map((ord) => (
                      <tr key={ord._id} className="hover:bg-[rgba(237,231,218,0.03)]">
                        <td className="py-3 font-mono font-medium text-[var(--admin-text-primary)]">
                          {ord.orderNumber}
                        </td>
                        <td className="py-3">
                          <div className="font-medium text-[var(--admin-text-primary)]">{ord.customerInfo.name}</div>
                          <div className="text-[0.75rem] text-[var(--admin-text-muted)]">{ord.customerInfo.email}</div>
                        </td>
                        <td className="py-3 font-semibold text-[var(--admin-text-primary)]">{money(ord.total)}</td>
                        <td className="py-3">
                          <Badge tone={paymentStatusTone(ord.paymentStatus)}>{ord.paymentStatus}</Badge>
                        </td>
                        <td className="py-3">
                          <Badge tone={orderStatusTone(ord.orderStatus)}>{ord.orderStatus.replace(/_/g, " ")}</Badge>
                        </td>
                        <td className="py-3 text-right">
                          <Link
                            to={`/admin/orders/${ord._id}`}
                            className="text-xs text-[var(--admin-accent)] hover:underline"
                          >
                            Details
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* Best-Selling Books (1 col) */}
        <div className="min-w-0">
          <Card
            title="Best-Selling Books"
            action={
              <Link to="/admin/books" className="text-xs font-semibold text-[var(--admin-accent)] hover:underline">
                Catalog →
              </Link>
            }
          >
            <div className="space-y-4">
              {bestSellingBooks.map((bk) => (
                <div key={bk._id} className="flex items-center gap-3 rounded-xl border border-[var(--admin-border)]/40 p-2.5 bg-[var(--admin-background)]">
                  <img
                    src={bk.coverImage || "/aao-part-one.png"}
                    alt={bk.title}
                    className="h-14 w-10 shrink-0 rounded object-cover shadow-sm"
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate text-[0.875rem] font-medium text-[var(--admin-text-primary)]">
                      {bk.title}
                    </h4>
                    <p className="text-[0.75rem] text-[var(--admin-text-muted)]">
                      {bk.salesCount || 0} sold · {money(bk.revenue || 0)}
                    </p>
                    <p className="text-[0.75rem] text-[var(--admin-text-secondary)] mt-0.5">
                      Stock: <span className={bk.stockQuantity <= 5 ? "text-amber-400 font-semibold" : ""}>{bk.stockQuantity}</span>
                    </p>
                  </div>
                  <div className="text-right font-semibold text-[0.9rem] text-[var(--admin-accent)]">
                    {money(bk.price)}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Recent Blog Posts */}
      <Card
        title="Recent Blog Posts"
        action={
          <Link to="/admin/blog" className="text-xs font-semibold text-[var(--admin-accent)] hover:underline">
            All posts →
          </Link>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--admin-border)]/50 text-[0.75rem] text-[var(--admin-text-muted)] uppercase">
                <th className="pb-3 font-semibold">Title</th>
                <th className="pb-3 font-semibold">Category</th>
                <th className="pb-3 font-semibold">Author</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold">Published</th>
                <th className="pb-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--admin-border)]/30">
              {recentBlogs.map((b) => (
                <tr key={b._id} className="hover:bg-[rgba(237,231,218,0.03)]">
                  <td className="py-3 font-medium text-[var(--admin-text-primary)] max-w-[280px] truncate">
                    {b.title}
                  </td>
                  <td className="py-3 text-[var(--admin-text-secondary)]">{b.categoryName}</td>
                  <td className="py-3 text-[var(--admin-text-secondary)]">{b.authorName}</td>
                  <td className="py-3">
                    <Badge tone={b.status === "PUBLISHED" ? "good" : b.status === "DRAFT" ? "neutral" : "info"}>
                      {b.status}
                    </Badge>
                  </td>
                  <td className="py-3 text-[var(--admin-text-muted)] text-xs">
                    {b.publishDate ? new Date(b.publishDate).toLocaleDateString() : "—"}
                  </td>
                  <td className="py-3 text-right">
                    <Link to={`/admin/blog/${b._id}`} className="text-xs text-[var(--admin-accent)] hover:underline">
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string | number;
  sub?: string;
  highlight?: "good" | "warn" | "bad";
}) {
  const highlightStyles = {
    good: "border-emerald-500/30 bg-emerald-500/5",
    warn: "border-amber-500/30 bg-amber-500/5",
    bad: "border-rose-500/30 bg-rose-500/5",
  };

  return (
    <div
      className={`rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4.5 transition-all ${
        highlight ? highlightStyles[highlight] : ""
      }`}
    >
      <div className="truncate text-[0.78rem] font-medium text-[var(--admin-text-muted)]">{label}</div>
      <div className="mt-1.5 font-display text-[1.65rem] font-light text-[var(--admin-text-primary)] leading-tight">
        {value}
      </div>
      {sub && <div className="mt-1 truncate text-[0.72rem] text-[var(--admin-text-secondary)]">{sub}</div>}
    </div>
  );
}
