import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { Badge, Button, Card, PageHeader } from "../../components/ui";

interface BookStockItem {
  _id: string;
  title: string;
  sku: string;
  price: number;
  stockQuantity: number;
  lowStockThreshold: number;
  status: string;
  coverImage: string;
}

export function BookInventoryPage() {
  const queryClient = useQueryClient();
  const [stockMap, setStockMap] = useState<Record<string, { stock: number; threshold: number }>>({});
  const [hasChanges, setHasChanges] = useState(false);

  const { data, isLoading } = useQuery<{ books: BookStockItem[] }>({
    queryKey: ["admin", "books-inventory"],
    queryFn: () => api.get<{ books: BookStockItem[] }>("/admin/books?limit=50"),
  });

  useEffect(() => {
    if (data?.books) {
      const map: Record<string, { stock: number; threshold: number }> = {};
      data.books.forEach((b) => {
        map[b._id] = { stock: b.stockQuantity, threshold: b.lowStockThreshold || 5 };
      });
      setStockMap(map);
      setHasChanges(false);
    }
  }, [data]);

  const updateInventoryMutation = useMutation({
    mutationFn: () => {
      const items = Object.entries(stockMap).map(([id, val]) => ({
        id,
        stockQuantity: val.stock,
        lowStockThreshold: val.threshold,
      }));
      return api.put("/admin/books/inventory", { items });
    },
    onSuccess: () => {
      setHasChanges(false);
      queryClient.invalidateQueries({ queryKey: ["admin", "books"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "books-inventory"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
  });

  const handleStockChange = (id: string, newStock: number) => {
    setStockMap((prev) => ({
      ...prev,
      [id]: { ...prev[id], stock: Math.max(0, newStock) },
    }));
    setHasChanges(true);
  };

  const handleThresholdChange = (id: string, newThreshold: number) => {
    setStockMap((prev) => ({
      ...prev,
      [id]: { ...prev[id], threshold: Math.max(1, newThreshold) },
    }));
    setHasChanges(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory Management"
        description="Monitor physical stock levels, manage replenishment alerts, and perform quick inline updates."
        action={
          <div className="flex items-center gap-3">
            <Link to="/admin/books">
              <Button size="sm" variant="outline">
                ← Back to Books
              </Button>
            </Link>
            <Button
              size="sm"
              variant="primary"
              disabled={!hasChanges || updateInventoryMutation.isPending}
              onClick={() => updateInventoryMutation.mutate()}
            >
              {updateInventoryMutation.isPending ? "Saving Changes…" : "Save Inventory"}
            </Button>
          </div>
        }
      />

      <Card>
        {isLoading ? (
          <div className="py-12 text-center text-sm text-[var(--admin-text-muted)]">Loading stock levels…</div>
        ) : !data?.books?.length ? (
          <div className="py-12 text-center text-sm text-[var(--admin-text-secondary)]">No books found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--admin-border)]/50 text-[0.75rem] text-[var(--admin-text-muted)] uppercase">
                  <th className="pb-3 font-semibold">Book Title</th>
                  <th className="pb-3 font-semibold">SKU</th>
                  <th className="pb-3 font-semibold">Current Stock Qty</th>
                  <th className="pb-3 font-semibold">Low Alert Threshold</th>
                  <th className="pb-3 font-semibold">Stock Status</th>
                  <th className="pb-3 font-semibold text-right">Quick Stock Adjust</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--admin-border)]/30">
                {data.books.map((b) => {
                  const currentStock = stockMap[b._id]?.stock ?? b.stockQuantity;
                  const currentThreshold = stockMap[b._id]?.threshold ?? b.lowStockThreshold ?? 5;
                  const isLow = currentStock > 0 && currentStock <= currentThreshold;
                  const isOut = currentStock <= 0;

                  return (
                    <tr key={b._id} className="hover:bg-[rgba(237,231,218,0.03)]">
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={b.coverImage || "/aao-part-one.png"}
                            alt={b.title}
                            className="h-10 w-7 rounded object-cover border border-[var(--admin-border)]"
                          />
                          <span className="font-medium text-[var(--admin-text-primary)]">{b.title}</span>
                        </div>
                      </td>
                      <td className="py-3 font-mono text-xs text-[var(--admin-text-secondary)]">{b.sku}</td>
                      <td className="py-3">
                        <input
                          type="number"
                          value={currentStock}
                          onChange={(e) => handleStockChange(b._id, parseInt(e.target.value) || 0)}
                          className="w-24 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-background)] px-2.5 py-1 text-sm text-[var(--admin-text-primary)] focus:outline-none focus:border-[var(--admin-accent)] font-semibold"
                        />
                      </td>
                      <td className="py-3">
                        <input
                          type="number"
                          value={currentThreshold}
                          onChange={(e) => handleThresholdChange(b._id, parseInt(e.target.value) || 1)}
                          className="w-20 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-background)] px-2.5 py-1 text-xs text-[var(--admin-text-muted)] focus:outline-none"
                        />
                      </td>
                      <td className="py-3">
                        <Badge tone={isOut ? "bad" : isLow ? "warn" : "good"}>
                          {isOut ? "Out of Stock" : isLow ? "Low Stock Alert" : "In Stock"}
                        </Badge>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleStockChange(b._id, currentStock + 10)}
                            className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-background)] px-2.5 py-1 text-xs text-[var(--admin-text-secondary)] hover:border-[var(--admin-accent)] hover:text-white"
                          >
                            +10
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStockChange(b._id, currentStock + 25)}
                            className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-background)] px-2.5 py-1 text-xs text-[var(--admin-text-secondary)] hover:border-[var(--admin-accent)] hover:text-white"
                          >
                            +25
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStockChange(b._id, currentStock + 50)}
                            className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-background)] px-2.5 py-1 text-xs text-[var(--admin-text-secondary)] hover:border-[var(--admin-accent)] hover:text-white"
                          >
                            +50
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
