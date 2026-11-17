import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  Banknote,
  Clock,
  MessageSquare,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
  Users,
} from "lucide-react";
import { api, type AdminSummary } from "@/lib/api";
import { ORDER_STATUSES } from "@/lib/commerce";
import { formatPriceToman, formatJalaliDate, toPersianDigits } from "@/lib/price";
import { useToast } from "@/components/toast-provider";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { AdminCard, AdminSectionHeader, LoadingBlock } from "./components";

export function Dashboard({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyStock, setBusyStock] = useState<string | null>(null);
  const { showToast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setSummary(await api.getAdminSummary());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "خطا در دریافت آمار");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const changeStock = async (productId: string, delta: number) => {
    const item = summary?.lowStock?.find((entry) => entry.id === productId);
    if (!item) return;
    const nextStock = Math.max(0, item.stock + delta);
    setBusyStock(productId);
    try {
      await api.updateProduct(productId, { stock: nextStock });
      setSummary((current) =>
        current
          ? {
              ...current,
              lowStock: current.lowStock?.map((entry) =>
                entry.id === productId ? { ...entry, stock: nextStock } : entry
              ),
            }
          : current
      );
      showToast("موجودی انبار به‌روزرسانی شد", "success");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "خطا در به‌روزرسانی موجودی", "error");
    } finally {
      setBusyStock(null);
    }
  };

  if (loading && !summary) {
    return (
      <AdminCard>
        <LoadingBlock />
      </AdminCard>
    );
  }

  if (error && !summary) {
    return (
      <AdminCard className="text-center">
        <p className="text-sm text-red-700">{error}</p>
        <Button size="sm" variant="outline" onClick={load} className="mt-3 gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" />
          تلاش دوباره
        </Button>
      </AdminCard>
    );
  }

  if (!summary) return null;

  const inProgress =
    (summary.ordersByStatus?.PENDING || 0) +
    (summary.ordersByStatus?.PAID || 0) +
    (summary.ordersByStatus?.PROCESSING || 0);

  const stats = [
    {
      label: "درآمد محقق‌شده",
      value: formatPriceToman(summary.totalRevenue || summary.revenue || 0),
      icon: Banknote,
      hint: `${toPersianDigits(summary.paidOrders || 0)} سفارش`,
    },
    {
      label: "سفارش‌های در جریان",
      value: `${toPersianDigits(inProgress)} سفارش`,
      icon: Clock,
      hint: "در انتظار پرداخت، ساخت و ارسال",
    },
    {
      label: "مشتریان",
      value: `${toPersianDigits(summary.customers || 0)} نفر`,
      icon: Users,
      hint: "حساب‌های ثبت‌شده",
    },
    {
      label: "پیام‌های باز",
      value: `${toPersianDigits(summary.openTickets || 0)} مورد`,
      icon: MessageSquare,
      hint: "در انتظار پاسخ کارگاه",
    },
  ];

  const sales = summary.salesByDay || [];
  const maxSale = Math.max(...sales.map((entry) => Number(entry.total) || 0), 1);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <AdminCard key={stat.label} className="flex items-start justify-between gap-3 p-5">
              <div>
                <p className="text-[11px] font-medium text-[var(--color-ink-muted)]">{stat.label}</p>
                <p className="mt-1 font-serif text-xl font-black text-[var(--color-ink)]">
                  {stat.value}
                </p>
                <p className="mt-1 text-[11px] text-[var(--color-ink-muted)]">{stat.hint}</p>
              </div>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
                <Icon className="h-5 w-5" />
              </span>
            </AdminCard>
          );
        })}
      </div>

      <AdminCard>
        <AdminSectionHeader title="فروش ۷ روز اخیر" description="مبالغ سفارش‌های پرداخت‌شده و در حال اجرا">
          <Button size="sm" variant="outline" onClick={load} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" />
            تازه‌سازی
          </Button>
        </AdminSectionHeader>

        {sales.length === 0 ? (
          <p className="py-10 text-center text-xs text-[var(--color-ink-muted)]">
            سفارشی در هفت روز گذشته ثبت نشده است.
          </p>
        ) : (
          <div className="flex h-48 items-end gap-2 pt-5 sm:gap-4">
            {sales.map((entry) => {
              const total = Number(entry.total) || 0;
              const height = Math.max(8, Math.round((total / maxSale) * 100));
              return (
                <div key={entry.day} className="group flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                  <span className="text-[10px] font-medium text-[var(--color-ink-muted)] opacity-0 transition group-hover:opacity-100">
                    {formatPriceToman(total)}
                  </span>
                  <div
                    className="w-full max-w-[46px] rounded-t-lg bg-gradient-to-t from-[var(--color-accent)] to-[#d67b36] transition-all"
                    style={{ height: `${height}%` }}
                  />
                  <span className="text-[10px] text-[var(--color-ink-muted)]">
                    {new Date(entry.day).toLocaleDateString("fa-IR", { day: "numeric", month: "short" })}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </AdminCard>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AdminCard>
          <AdminSectionHeader title="وضعیت سفارش‌ها">
            <Button size="sm" variant="ghost" onClick={() => onNavigate("orders")} className="gap-1 text-[var(--color-accent)]">
              مدیریت سفارش‌ها
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Button>
          </AdminSectionHeader>

          <div className="mt-4 space-y-2">
            {Object.entries(ORDER_STATUSES).map(([status, meta]) => (
              <button
                key={status}
                type="button"
                onClick={() => onNavigate("orders")}
                className="flex w-full items-center justify-between rounded-xl border border-[var(--color-border-subtle)] px-3 py-2 text-right transition-colors hover:bg-[var(--color-canvas)]"
              >
                <StatusBadge status={status} />
                <span className="font-mono text-sm font-bold text-[var(--color-ink)]">
                  {toPersianDigits(summary.ordersByStatus?.[status] || 0)}
                </span>
              </button>
            ))}
          </div>
        </AdminCard>

        <AdminCard>
          <AdminSectionHeader
            title="هشدار موجودی"
            description="آثاری که سه عدد یا کمتر از آن‌ها در انبار مانده است"
          >
            <AlertTriangle className="h-4 w-4 text-amber-700" />
          </AdminSectionHeader>

          {!summary.lowStock || summary.lowStock.length === 0 ? (
            <p className="py-8 text-center text-xs text-[var(--color-ink-muted)]">
              موجودی همهٔ آثار در محدودهٔ امن است.
            </p>
          ) : (
            <div className="mt-4 space-y-2">
              {summary.lowStock.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-border-subtle)] px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="truncate text-xs font-bold text-[var(--color-ink)]">
                      {item.title || item.name}
                    </div>
                    <div className="text-[11px] font-semibold text-red-700">
                      {toPersianDigits(item.stock)} عدد باقی مانده
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyStock === item.id}
                      onClick={() => changeStock(item.id, 5)}
                      className="h-7 px-2 text-[11px]"
                    >
                      +۵
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyStock === item.id}
                      onClick={() => changeStock(item.id, 10)}
                      className="h-7 px-2 text-[11px]"
                    >
                      +۱۰
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </AdminCard>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[11px] text-[var(--color-ink-muted)]">
        <TrendingUp className="h-3.5 w-3.5 text-[var(--color-accent)]" />
        آخرین به‌روزرسانی: {formatJalaliDate(new Date())}
        <Button size="sm" variant="link" onClick={() => onNavigate("products")} className="h-auto p-0 text-[11px]">
          <ShoppingBag className="h-3.5 w-3.5" />
          مدیریت کاتالوگ
        </Button>
      </div>
    </div>
  );
}
