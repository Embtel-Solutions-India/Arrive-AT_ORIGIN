import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { Badge, Button, Card, Field, Modal, PageHeader, Select, Textarea } from "../../components/ui";

export interface CouponItem {
  _id: string;
  code: string;
  description: string;
  currency?: "ALL" | "INR" | "USD";
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  discountValueINR?: number | null;
  applicableTo: "ALL" | "CHECKOUT" | "CONSULTATION";
  minOrderAmount: number;
  minOrderAmountINR?: number | null;
  maxDiscountAmount?: number | null;
  maxDiscountAmountINR?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  usageLimit?: number | null;
  usedCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function CouponsPage() {
  const queryClient = useQueryClient();

  // Search & Filters
  const [search, setSearch] = useState("");
  const [scopeFilter, setScopeFilter] = useState("ALL_FILTER");
  const [currencyFilter, setCurrencyFilter] = useState("ALL_FILTER");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponItem | null>(null);

  // Form Fields
  const [formCode, setFormCode] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCurrency, setFormCurrency] = useState<"INR" | "USD" | "ALL">("INR");
  const [formDiscountType, setFormDiscountType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [formDiscountValue, setFormDiscountValue] = useState<number | string>(10);
  const [formDiscountValueINR, setFormDiscountValueINR] = useState<number | string>("");
  const [formApplicableTo, setFormApplicableTo] = useState<"ALL" | "CHECKOUT" | "CONSULTATION">("ALL");
  const [formMinOrderAmount, setFormMinOrderAmount] = useState<number | string>(0);
  const [formMinOrderAmountINR, setFormMinOrderAmountINR] = useState<number | string>("");
  const [formMaxDiscountAmount, setFormMaxDiscountAmount] = useState<number | string>("");
  const [formMaxDiscountAmountINR, setFormMaxDiscountAmountINR] = useState<number | string>("");
  const [formUsageLimit, setFormUsageLimit] = useState<number | string>("");
  const [formEndDate, setFormEndDate] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);
  const [formError, setFormError] = useState("");

  // Delete Confirm
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Query
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "coupons", search, scopeFilter, currencyFilter, statusFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (scopeFilter !== "ALL_FILTER") params.append("scope", scopeFilter);
      if (currencyFilter !== "ALL_FILTER") params.append("currency", currencyFilter);
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      return api.get<{
        coupons: CouponItem[];
        stats: { totalCoupons: number; activeCoupons: number; totalUses: number };
      }>(`/admin/coupons?${params.toString()}`);
    },
  });

  const coupons = data?.coupons ?? [];
  const stats = data?.stats ?? { totalCoupons: 0, activeCoupons: 0, totalUses: 0 };

  // Mutations
  const createMutation = useMutation({
    mutationFn: (body: any) => api.post("/admin/coupons", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] });
      closeModal();
    },
    onError: (err: any) => setFormError(err?.message || "Failed to create coupon"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: any }) => api.put(`/admin/coupons/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] });
      closeModal();
    },
    onError: (err: any) => setFormError(err?.message || "Failed to update coupon"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/coupons/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] });
      setDeleteConfirmId(null);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => api.put(`/admin/coupons/${id}/toggle`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] });
    },
  });

  const openCreateModal = () => {
    setEditingCoupon(null);
    setFormCode("");
    setFormDescription("");
    setFormCurrency("INR");
    setFormDiscountType("PERCENTAGE");
    setFormDiscountValue(10);
    setFormDiscountValueINR("");
    setFormApplicableTo("ALL");
    setFormMinOrderAmount(0);
    setFormMinOrderAmountINR("");
    setFormMaxDiscountAmount("");
    setFormMaxDiscountAmountINR("");
    setFormUsageLimit("");
    setFormEndDate("");
    setFormIsActive(true);
    setFormError("");
    setModalOpen(true);
  };

  const openEditModal = (c: CouponItem) => {
    setEditingCoupon(c);
    setFormCode(c.code);
    setFormDescription(c.description || "");
    setFormCurrency(c.currency || "ALL");
    setFormDiscountType(c.discountType);
    setFormDiscountValue(c.discountValue);
    setFormDiscountValueINR(c.discountValueINR ?? "");
    setFormApplicableTo(c.applicableTo);
    setFormMinOrderAmount(c.minOrderAmount || 0);
    setFormMinOrderAmountINR(c.minOrderAmountINR ?? "");
    setFormMaxDiscountAmount(c.maxDiscountAmount ?? "");
    setFormMaxDiscountAmountINR(c.maxDiscountAmountINR ?? "");
    setFormEndDate(c.endDate ? c.endDate.split("T")[0] : "");
    setFormIsActive(c.isActive);
    setFormError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingCoupon(null);
    setFormError("");
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCode.trim()) {
      setFormError("Coupon code is required");
      return;
    }

    const payload = {
      code: formCode.trim().toUpperCase(),
      description: formDescription.trim(),
      currency: formCurrency,
      discountType: formDiscountType,
      discountValue: Number(formDiscountValue) || 0,
      discountValueINR:
        formCurrency === "ALL" && formDiscountType === "FIXED" && formDiscountValueINR !== ""
          ? Number(formDiscountValueINR)
          : null,
      applicableTo: formApplicableTo,
      minOrderAmount: Number(formMinOrderAmount) || 0,
      minOrderAmountINR:
        formCurrency === "ALL" && formMinOrderAmountINR !== "" ? Number(formMinOrderAmountINR) : null,
      maxDiscountAmount: formMaxDiscountAmount !== "" ? Number(formMaxDiscountAmount) : null,
      maxDiscountAmountINR:
        formCurrency === "ALL" && formMaxDiscountAmountINR !== ""
          ? Number(formMaxDiscountAmountINR)
          : null,
      usageLimit: formUsageLimit !== "" ? Number(formUsageLimit) : null,
      endDate: formEndDate ? new Date(formEndDate).toISOString() : null,
      isActive: formIsActive,
    };

    if (editingCoupon) {
      updateMutation.mutate({ id: editingCoupon._id, body: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const scopeBadge = (scope: CouponItem["applicableTo"]) => {
    switch (scope) {
      case "CHECKOUT":
        return <Badge tone="info">🛍️ Store Checkout</Badge>;
      case "CONSULTATION":
        return <Badge tone="warn">🧘 Session Booking</Badge>;
      default:
        return <Badge tone="good">✦ Both (Store & Booking)</Badge>;
    }
  };

  const currencyBadge = (currency?: CouponItem["currency"]) => {
    switch (currency) {
      case "INR":
        return <Badge tone="warn">🇮🇳 INR (₹)</Badge>;
      case "USD":
        return <Badge tone="info">🇺🇸 USD ($)</Badge>;
      default:
        return <Badge tone="good">🌐 Both (USD & ₹)</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Coupon Codes & Discounts"
        description="Configure promotional discounts and restrict coupon application to Book Store checkout, Session booking popups, or all services in INR (₹) or USD ($)."
        action={
          <Button onClick={openCreateModal} variant="primary">
            + Create New Coupon
          </Button>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-[rgba(232,206,140,0.12)] border border-[rgba(232,206,140,0.3)] flex items-center justify-center text-xl">
            🎟️
          </div>
          <div>
            <div className="text-2xl font-display font-light text-[var(--admin-text-primary)]">
              {stats.totalCoupons}
            </div>
            <div className="text-xs text-[var(--admin-text-secondary)] uppercase tracking-wider">
              Total Coupons
            </div>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-[rgba(78,124,116,0.15)] border border-[rgba(78,124,116,0.35)] flex items-center justify-center text-xl">
            ✓
          </div>
          <div>
            <div className="text-2xl font-display font-light text-[#8fc7bb]">
              {stats.activeCoupons}
            </div>
            <div className="text-xs text-[var(--admin-text-secondary)] uppercase tracking-wider">
              Active & Live
            </div>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-[rgba(232,150,60,0.15)] border border-[rgba(232,150,60,0.35)] flex items-center justify-center text-xl">
            📈
          </div>
          <div>
            <div className="text-2xl font-display font-light text-[#f0b070]">
              {stats.totalUses}
            </div>
            <div className="text-xs text-[var(--admin-text-secondary)] uppercase tracking-wider">
              Times Redeemed
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search by code or description…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="min-h-[42px] w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] px-3.5 text-[0.875rem] text-[var(--admin-text-primary)] placeholder:text-[var(--admin-text-muted)] focus:border-[var(--admin-accent)] focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={currencyFilter}
              onChange={(e) => setCurrencyFilter(e.target.value)}
              className="min-h-[42px] rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] px-3 text-[0.85rem] text-[var(--admin-text-primary)] focus:border-[var(--admin-accent)] focus:outline-none"
            >
              <option value="ALL_FILTER">All Currencies</option>
              <option value="INR">🇮🇳 INR (₹) Only</option>
              <option value="USD">🇺🇸 USD ($) Only</option>
              <option value="ALL">🌐 Both (Global)</option>
            </select>

            <select
              value={scopeFilter}
              onChange={(e) => setScopeFilter(e.target.value)}
              className="min-h-[42px] rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] px-3 text-[0.85rem] text-[var(--admin-text-primary)] focus:border-[var(--admin-accent)] focus:outline-none"
            >
              <option value="ALL_FILTER">All Target Scopes</option>
              <option value="ALL">✦ Both Store & Booking</option>
              <option value="CHECKOUT">🛍️ Store Checkout Only</option>
              <option value="CONSULTATION">🧘 Session Booking Only</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="min-h-[42px] rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] px-3 text-[0.85rem] text-[var(--admin-text-primary)] focus:border-[var(--admin-accent)] focus:outline-none"
            >
              <option value="ALL">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Coupons Table */}
      <Card>
        {isLoading ? (
          <div className="py-12 text-center text-sm text-[var(--admin-text-muted)]">
            Loading coupon codes…
          </div>
        ) : coupons.length === 0 ? (
          <div className="py-12 text-center">
            <div className="text-3xl mb-2">🎟️</div>
            <h3 className="font-display text-lg text-[var(--admin-text-primary)]">No coupons found</h3>
            <p className="text-xs text-[var(--admin-text-muted)] mt-1">
              Create your first promotional discount coupon in INR or USD to drive bookings and store sales.
            </p>
            <Button onClick={openCreateModal} variant="outline" size="sm" className="mt-4">
              + Create Coupon
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--admin-border)] text-xs uppercase tracking-wider text-[var(--admin-text-muted)] whitespace-nowrap">
                  <th className="py-3 px-4">Coupon Code</th>
                  <th className="py-3 px-4">Currency</th>
                  <th className="py-3 px-4">Discount</th>
                  <th className="py-3 px-4">Applicable Scope</th>
                  <th className="py-3 px-4">Min Order</th>
                  <th className="py-3 px-4">Usage</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--admin-border)]/40">
                {coupons.map((c) => (
                  <tr key={c._id} className="hover:bg-[rgba(237,231,218,0.02)] transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[var(--admin-accent)]">
                      <div className="flex items-center gap-2">
                        <span>{c.code}</span>
                      </div>
                      {c.description && (
                        <div className="text-xs font-sans font-normal text-[var(--admin-text-muted)] mt-0.5 max-w-[280px] truncate">
                          {c.description}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">{currencyBadge(c.currency)}</td>

                    <td className="py-3.5 px-4 font-medium text-[var(--admin-text-primary)]">
                      {c.discountType === "PERCENTAGE" ? (
                        <span>
                          {c.discountValue}% OFF
                          {c.currency === "INR" && c.maxDiscountAmount ? (
                            <span className="text-xs text-[var(--admin-text-muted)] block font-normal">
                              Max ₹{c.maxDiscountAmount}
                            </span>
                          ) : c.currency === "USD" && c.maxDiscountAmount ? (
                            <span className="text-xs text-[var(--admin-text-muted)] block font-normal">
                              Max ${c.maxDiscountAmount}
                            </span>
                          ) : c.maxDiscountAmount || c.maxDiscountAmountINR ? (
                            <span className="text-xs text-[var(--admin-text-muted)] block font-normal">
                              Max {c.maxDiscountAmount ? `$${c.maxDiscountAmount}` : ""}{c.maxDiscountAmount && c.maxDiscountAmountINR ? " / " : ""}{c.maxDiscountAmountINR ? `₹${c.maxDiscountAmountINR}` : ""}
                            </span>
                          ) : null}
                        </span>
                      ) : (
                        <span>
                          {c.currency === "INR"
                            ? `₹${c.discountValue.toFixed(2)} OFF`
                            : c.currency === "USD"
                            ? `$${c.discountValue.toFixed(2)} OFF`
                            : typeof c.discountValueINR === "number" && c.discountValueINR > 0
                            ? `$${c.discountValue.toFixed(2)} / ₹${c.discountValueINR.toFixed(2)} OFF`
                            : `$${c.discountValue.toFixed(2)} OFF`}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">{scopeBadge(c.applicableTo)}</td>

                    <td className="py-3.5 px-4 text-[var(--admin-text-secondary)]">
                      {c.currency === "INR" ? (
                        c.minOrderAmount > 0 ? `₹${c.minOrderAmount.toFixed(2)}` : "None"
                      ) : c.currency === "USD" ? (
                        c.minOrderAmount > 0 ? `$${c.minOrderAmount.toFixed(2)}` : "None"
                      ) : (
                        c.minOrderAmount > 0 || (c.minOrderAmountINR && c.minOrderAmountINR > 0)
                          ? `${c.minOrderAmount > 0 ? `$${c.minOrderAmount.toFixed(2)}` : "$0"} / ${c.minOrderAmountINR ? `₹${c.minOrderAmountINR.toFixed(2)}` : "None"}`
                          : "None"
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-[var(--admin-text-secondary)]">
                      {c.usedCount}
                      {c.usageLimit ? ` / ${c.usageLimit}` : " / ∞"}
                    </td>

                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => toggleMutation.mutate(c._id)}
                        disabled={toggleMutation.isPending}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                          c.isActive
                            ? "bg-[rgba(78,124,116,0.25)] text-[#8fc7bb] hover:bg-[rgba(78,124,116,0.4)]"
                            : "bg-[rgba(237,231,218,0.08)] text-[var(--admin-text-muted)] hover:bg-[rgba(237,231,218,0.15)]"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${c.isActive ? "bg-[#8fc7bb]" : "bg-zinc-500"}`}
                        />
                        {c.isActive ? "Active" : "Inactive"}
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(c)}
                          title="Edit coupon"
                        >
                          ✎
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteConfirmId(c._id)}
                          className="hover:text-red-400"
                          title="Delete coupon"
                        >
                          🗑
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingCoupon ? `Edit Coupon: ${editingCoupon.code}` : "Create Promotional Coupon"}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSave} className="space-y-4 pt-2">
          {formError && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-800 text-xs text-red-200">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="Coupon Code *"
              value={formCode}
              onChange={(e) => setFormCode(e.target.value.toUpperCase())}
              placeholder="e.g. DIWALI, WELCOME10"
              required
            />

            <div>
              <label className="mb-1.5 block text-[0.85rem] font-medium text-[var(--admin-text-secondary)]">
                Target Application Scope *
              </label>
              <select
                value={formApplicableTo}
                onChange={(e) => setFormApplicableTo(e.target.value as any)}
                className="min-h-[44px] w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] px-3.5 text-[0.9rem] text-[var(--admin-text-primary)] focus:border-[var(--admin-accent)] focus:outline-none"
              >
                <option value="ALL">✦ Both Store Checkout & Session Booking</option>
                <option value="CHECKOUT">🛍️ Book Store Checkout Only</option>
                <option value="CONSULTATION">🧘 Consultation Session Booking Only</option>
              </select>
              <p className="mt-1 text-[0.75rem] text-[var(--admin-text-muted)]">
                Choose where customers can apply this code.
              </p>
            </div>
          </div>

          <Textarea
            label="Description / Purpose"
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
            rows={2}
            placeholder="e.g. Special festive promotional discount for clients in India"
          />

          {/* Currency and Discount Type Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-[0.85rem] font-medium text-[var(--admin-text-secondary)]">
                Currency *
              </label>
              <select
                value={formCurrency}
                onChange={(e) => setFormCurrency(e.target.value as any)}
                className="min-h-[44px] w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] px-3.5 text-[0.9rem] text-[var(--admin-text-primary)] focus:border-[var(--admin-accent)] focus:outline-none"
              >
                <option value="INR">🇮🇳 INR (₹ Indian Rupee)</option>
                <option value="USD">🇺🇸 USD ($ US Dollar)</option>
                <option value="ALL">🌐 Both Currencies (USD & INR)</option>
              </select>
              <p className="mt-1 text-[0.75rem] text-[var(--admin-text-muted)]">
                Select INR for rupee discounts, or USD / Both.
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-[0.85rem] font-medium text-[var(--admin-text-secondary)]">
                Discount Type *
              </label>
              <select
                value={formDiscountType}
                onChange={(e) => setFormDiscountType(e.target.value as any)}
                className="min-h-[44px] w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] px-3.5 text-[0.9rem] text-[var(--admin-text-primary)] focus:border-[var(--admin-accent)] focus:outline-none"
              >
                <option value="PERCENTAGE">Percentage (% Off)</option>
                <option value="FIXED">
                  {formCurrency === "INR"
                    ? "Fixed Amount (₹ Off)"
                    : formCurrency === "USD"
                    ? "Fixed Amount ($ Off)"
                    : "Fixed Amount Off"}
                </option>
              </select>
            </div>
          </div>

          {/* Discount Value Inputs */}
          {formCurrency === "INR" ? (
            <Field
              label={formDiscountType === "PERCENTAGE" ? "Discount Percentage (%) *" : "Discount Amount (₹ INR) *"}
              type="number"
              min={0}
              max={formDiscountType === "PERCENTAGE" ? 100 : undefined}
              step={formDiscountType === "PERCENTAGE" ? 1 : 0.01}
              value={formDiscountValue}
              onChange={(e) => setFormDiscountValue(e.target.value)}
              placeholder={formDiscountType === "PERCENTAGE" ? "e.g. 15" : "e.g. 482"}
              required
            />
          ) : formCurrency === "USD" ? (
            <Field
              label={formDiscountType === "PERCENTAGE" ? "Discount Percentage (%) *" : "Discount Amount ($ USD) *"}
              type="number"
              min={0}
              max={formDiscountType === "PERCENTAGE" ? 100 : undefined}
              step={formDiscountType === "PERCENTAGE" ? 1 : 0.01}
              value={formDiscountValue}
              onChange={(e) => setFormDiscountValue(e.target.value)}
              placeholder={formDiscountType === "PERCENTAGE" ? "e.g. 15" : "e.g. 25"}
              required
            />
          ) : formDiscountType === "PERCENTAGE" ? (
            <Field
              label="Discount Percentage (%) *"
              type="number"
              min={0}
              max={100}
              step={1}
              value={formDiscountValue}
              onChange={(e) => setFormDiscountValue(e.target.value)}
              placeholder="e.g. 15"
              required
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label="Discount Amount ($ USD) *"
                type="number"
                min={0}
                step={0.01}
                value={formDiscountValue}
                onChange={(e) => setFormDiscountValue(e.target.value)}
                placeholder="e.g. 20"
                required
              />
              <Field
                label="Discount Amount (₹ INR) *"
                type="number"
                min={0}
                step={0.01}
                value={formDiscountValueINR}
                onChange={(e) => setFormDiscountValueINR(e.target.value)}
                placeholder="e.g. 1500"
                required
              />
            </div>
          )}

          {/* Min Order & Limits */}
          {formCurrency === "INR" ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field
                label="Min Order Amount (₹ INR)"
                type="number"
                min={0}
                step={0.01}
                value={formMinOrderAmount}
                onChange={(e) => setFormMinOrderAmount(e.target.value)}
                helperText="0 for no minimum"
              />

              {formDiscountType === "PERCENTAGE" && (
                <Field
                  label="Max Discount Cap (₹ INR)"
                  type="number"
                  min={0}
                  step={0.01}
                  value={formMaxDiscountAmount}
                  onChange={(e) => setFormMaxDiscountAmount(e.target.value)}
                  placeholder="Optional"
                  helperText="Limit max discount in ₹"
                />
              )}

              <Field
                label="Max Usage Limit"
                type="number"
                min={1}
                value={formUsageLimit}
                onChange={(e) => setFormUsageLimit(e.target.value)}
                placeholder="Unlimited"
                helperText="Total redemptions"
              />
            </div>
          ) : formCurrency === "USD" ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field
                label="Min Order Amount ($ USD)"
                type="number"
                min={0}
                step={0.01}
                value={formMinOrderAmount}
                onChange={(e) => setFormMinOrderAmount(e.target.value)}
                helperText="0 for no minimum"
              />

              {formDiscountType === "PERCENTAGE" && (
                <Field
                  label="Max Discount Cap ($ USD)"
                  type="number"
                  min={0}
                  step={0.01}
                  value={formMaxDiscountAmount}
                  onChange={(e) => setFormMaxDiscountAmount(e.target.value)}
                  placeholder="Optional"
                  helperText="Limit max discount in $"
                />
              )}

              <Field
                label="Max Usage Limit"
                type="number"
                min={1}
                value={formUsageLimit}
                onChange={(e) => setFormUsageLimit(e.target.value)}
                placeholder="Unlimited"
                helperText="Total redemptions"
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  label="Min Order Amount ($ USD)"
                  type="number"
                  min={0}
                  step={0.01}
                  value={formMinOrderAmount}
                  onChange={(e) => setFormMinOrderAmount(e.target.value)}
                  helperText="0 for no minimum in USD"
                />
                <Field
                  label="Min Order Amount (₹ INR)"
                  type="number"
                  min={0}
                  step={0.01}
                  value={formMinOrderAmountINR}
                  onChange={(e) => setFormMinOrderAmountINR(e.target.value)}
                  helperText="0 for no minimum in INR"
                />
              </div>

              <div className={`grid grid-cols-1 ${formDiscountType === "PERCENTAGE" ? "sm:grid-cols-3" : "sm:grid-cols-1"} gap-4`}>
                {formDiscountType === "PERCENTAGE" && (
                  <>
                    <Field
                      label="Max Discount Cap ($ USD)"
                      type="number"
                      min={0}
                      step={0.01}
                      value={formMaxDiscountAmount}
                      onChange={(e) => setFormMaxDiscountAmount(e.target.value)}
                      placeholder="Optional"
                      helperText="Max cap in USD"
                    />
                    <Field
                      label="Max Discount Cap (₹ INR)"
                      type="number"
                      min={0}
                      step={0.01}
                      value={formMaxDiscountAmountINR}
                      onChange={(e) => setFormMaxDiscountAmountINR(e.target.value)}
                      placeholder="Optional"
                      helperText="Max cap in INR"
                    />
                  </>
                )}
                <Field
                  label="Max Usage Limit"
                  type="number"
                  min={1}
                  value={formUsageLimit}
                  onChange={(e) => setFormUsageLimit(e.target.value)}
                  placeholder="Unlimited"
                  helperText="Total redemptions"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="Expiration Date"
              type="date"
              value={formEndDate}
              onChange={(e) => setFormEndDate(e.target.value)}
              helperText="Leave empty for never expires"
            />

            <div className="flex items-center gap-3 pt-6">
              <label className="flex items-center gap-2.5 cursor-pointer text-sm text-[var(--admin-text-primary)] select-none">
                <input
                  type="checkbox"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-amber-500"
                />
                <span>Active & Redeemable</span>
              </label>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 border-t border-[var(--admin-border)]/50 pt-4">
            <Button type="button" variant="ghost" onClick={closeModal}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editingCoupon ? "Save Changes" : "Create Coupon"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <Modal
          open={!!deleteConfirmId}
          onClose={() => setDeleteConfirmId(null)}
          title="Delete Coupon"
          maxWidth="max-w-md"
        >
          <div className="py-2">
            <p className="text-sm text-[var(--admin-text-secondary)]">
              Are you sure you want to delete this coupon? Existing orders and sessions that already used
              this code will retain their recorded discount.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <Button variant="ghost" onClick={() => setDeleteConfirmId(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(deleteConfirmId)}
              >
                Delete
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
