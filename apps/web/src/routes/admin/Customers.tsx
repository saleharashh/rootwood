import { useEffect, useMemo, useState } from "react";
import { Phone, Search, ShoppingBag, UserRound } from "lucide-react";
import { api, type AdminCustomer, type Order } from "@/lib/api";
import { formatJalaliDate, formatPriceToman, toPersianDigits } from "@/lib/price";
import { isSyntheticEmail } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { StatusBadge } from "@/components/status-badge";
import { AdminCard, AdminSectionHeader, LoadingBlock, inputClass } from "./components";

export function Customers() {
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selected, setSelected] = useState<AdminCustomer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  useEffect(() => {
    let active = true;
    api
      .getAdminCustomers()
      .then((response) => {
        if (active) setCustomers(response.customers || []);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : "خطا در دریافت مشتریان");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selected) return;
    let active = true;
    setOrdersLoading(true);
    setOrders([]);
    api
      .getAdminOrders({ userId: selected.id, limit: 20 })
      .then((response) => {
        if (active) setOrders(response.orders || []);
      })
      .catch(() => {
        if (active) setOrders([]);
      })
      .finally(() => {
        if (active) setOrdersLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selected]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return customers;
    return customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(term) ||
        (customer.phone || "").includes(term) ||
        (!isSyntheticEmail(customer.email) && customer.email.toLowerCase().includes(term))
    );
  }, [customers, search]);

  return (
    <AdminCard>
      <AdminSectionHeader
        title="مشتریان"
        description={`${toPersianDigits(customers.length)} حساب ثبت شده؛ برای دیدن سابقهٔ خرید روی هر ردیف کلیک کنید`}
      >
        <div className="relative">
          <Search className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-ink-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="نام، موبایل یا ایمیل"
            className={`${inputClass} w-56 pr-8`}
          />
        </div>
      </AdminSectionHeader>

      {error && <p className="py-8 text-center text-xs text-red-700">{error}</p>}

      {loading ? (
        <LoadingBlock />
      ) : filtered.length === 0 ? (
        <p className="py-12 text-center text-xs text-[var(--color-ink-muted)]">
          مشتری‌ای با این مشخصات پیدا نشد.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-[var(--color-ink-muted)]">
                <th className="p-2.5 font-semibold">مشتری</th>
                <th className="p-2.5 font-semibold">تماس</th>
                <th className="p-2.5 font-semibold">سفارش‌ها</th>
                <th className="p-2.5 font-semibold">مجموع خرید</th>
                <th className="p-2.5 font-semibold">آخرین خرید</th>
                <th className="p-2.5 font-semibold">عضویت</th>
                <th className="p-2.5 font-semibold"> </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-subtle)]">
              {filtered.map((customer) => (
                <tr key={customer.id} className="hover:bg-[var(--color-canvas)]">
                  <td className="p-2.5">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-surface-2)] text-[var(--color-ink-soft)]">
                        <UserRound className="h-4 w-4" />
                      </span>
                      <div>
                        <div className="font-bold text-[var(--color-ink)]">{customer.name}</div>
                        <div className="text-[10px] text-[var(--color-ink-muted)]">
                          {customer.role === "ADMIN" ? "مدیر کارگاه" : "مشتری"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-2.5">
                    <div className="flex items-center gap-1.5 font-mono text-[11px]" dir="ltr">
                      <Phone className="h-3 w-3 text-[var(--color-ink-muted)]" />
                      {customer.phone || "—"}
                    </div>
                    {!isSyntheticEmail(customer.email) && (
                      <div className="text-[10px] text-[var(--color-ink-muted)]">{customer.email}</div>
                    )}
                  </td>
                  <td className="p-2.5 font-mono font-bold text-[var(--color-ink)]">
                    {toPersianDigits(customer.orderCount || 0)}
                  </td>
                  <td className="p-2.5 font-bold text-[var(--color-accent)]">
                    {formatPriceToman(customer.totalSpent || 0)}
                  </td>
                  <td className="p-2.5 text-[11px] text-[var(--color-ink-muted)]">
                    {customer.lastOrderAt ? formatJalaliDate(customer.lastOrderAt) : "—"}
                  </td>
                  <td className="p-2.5 text-[11px] text-[var(--color-ink-muted)]">
                    {formatJalaliDate(customer.createdAt)}
                  </td>
                  <td className="p-2.5 text-left">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelected(customer)}
                      className="h-7 gap-1 px-2 text-[11px]"
                    >
                      <ShoppingBag className="h-3.5 w-3.5" />
                      پرونده
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Sheet open={!!selected} onClose={() => setSelected(null)} side="left">
        <SheetHeader onClose={() => setSelected(null)}>
          <SheetTitle>{selected?.name || "پروندهٔ مشتری"}</SheetTitle>
        </SheetHeader>

        <SheetContent className="space-y-5 text-xs">
          {selected && (
            <>
              <div className="grid grid-cols-2 gap-3 rounded-xl border border-[var(--color-border-subtle)] bg-white p-4">
                <div>
                  <div className="text-[11px] text-[var(--color-ink-muted)]">مجموع خرید</div>
                  <div className="mt-1 font-serif text-base font-bold text-[var(--color-accent)]">
                    {formatPriceToman(selected.totalSpent || 0)}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-[var(--color-ink-muted)]">تعداد سفارش</div>
                  <div className="mt-1 font-serif text-base font-bold text-[var(--color-ink)]">
                    {toPersianDigits(selected.orderCount || 0)}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-[var(--color-ink-muted)]">موبایل</div>
                  <div className="mt-1 font-mono text-[var(--color-ink)]" dir="ltr">
                    {selected.phone || "—"}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-[var(--color-ink-muted)]">عضویت</div>
                  <div className="mt-1 text-[var(--color-ink)]">
                    {formatJalaliDate(selected.createdAt)}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-serif text-sm font-bold text-[var(--color-ink)]">
                  سابقهٔ سفارش‌ها
                </h3>

                {ordersLoading ? (
                  <p className="py-6 text-center text-[var(--color-ink-muted)]">در حال بارگذاری…</p>
                ) : orders.length === 0 ? (
                  <p className="py-6 text-center text-[var(--color-ink-muted)]">
                    این مشتری هنوز سفارشی ثبت نکرده است.
                  </p>
                ) : (
                  orders.map((order) => (
                    <div
                      key={order.id}
                      className="space-y-1.5 rounded-xl border border-[var(--color-border-subtle)] bg-white p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[11px] font-bold" dir="ltr">
                          {order.orderNumber || order.id.slice(0, 8)}
                        </span>
                        <StatusBadge status={order.status} />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-[var(--color-ink-muted)]">
                        <span>{formatJalaliDate(order.createdAt)}</span>
                        <span className="font-bold text-[var(--color-ink)]">
                          {formatPriceToman(order.totalAmount || order.total || 0)}
                        </span>
                      </div>
                      <div className="text-[11px] text-[var(--color-ink-soft)]">
                        {order.items?.map((item) => item.productTitle).join("، ")}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </AdminCard>
  );
}
