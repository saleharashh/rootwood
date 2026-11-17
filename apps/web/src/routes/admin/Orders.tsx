import { useCallback, useEffect, useState } from "react";
import { Download, Eye, Search, Truck } from "lucide-react";
import { api, type Order } from "@/lib/api";
import { ORDER_STATUSES, ORDER_STATUS_OPTIONS, nextOrderStatus } from "@/lib/commerce";
import { formatJalaliDate, formatPriceToman, toPersianDigits } from "@/lib/price";
import { useToast } from "@/components/toast-provider";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import {
  AdminCard,
  AdminSectionHeader,
  ConfirmDialog,
  LoadingBlock,
  Modal,
  Pagination,
  inputClass,
} from "./components";

const PAGE_SIZE = 20;

export function Orders() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);

  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selected, setSelected] = useState<Order | null>(null);
  const [note, setNote] = useState("");
  const [tracking, setTracking] = useState("");
  const [saving, setSaving] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const { showToast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.getAdminOrders({
        status: status === "ALL" ? undefined : status,
        search: search || undefined,
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      });
      setOrders(response.orders || []);
      setTotal(response.total || 0);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "خطا در دریافت سفارش‌ها");
    } finally {
      setLoading(false);
    }
  }, [status, search, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (!selected) return;
    setNote(selected.note || "");
    setTracking(selected.paymentTrackId || "");
  }, [selected]);

  const applyStatus = async (order: Order, nextStatus: string) => {
    setSaving(true);
    try {
      await api.updateOrderStatus(order.id, nextStatus);
      setSelected((current) => (current ? { ...current, status: nextStatus } : current));
      showToast(`وضعیت سفارش به «${ORDER_STATUSES[nextStatus as keyof typeof ORDER_STATUSES]?.label || nextStatus}» تغییر کرد`, "success");
      await load();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "خطا در تغییر وضعیت سفارش", "error");
    } finally {
      setSaving(false);
    }
  };

  const saveExtra = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await api.updateOrderStatus(selected.id, selected.status, {
        note,
        trackingCode: tracking,
      });
      setSelected((current) =>
        current ? { ...current, note, paymentTrackId: tracking } : current
      );
      showToast("یادداشت و شمارهٔ بارنامه ذخیره شد", "success");
      await load();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "خطا در ذخیرهٔ اطلاعات", "error");
    } finally {
      setSaving(false);
    }
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      const response = await api.getAdminOrders({
        status: status === "ALL" ? undefined : status,
        search: search || undefined,
        limit: 100,
      });
      const rows = response.orders || [];
      if (rows.length === 0) {
        showToast("سفارشی برای خروجی وجود ندارد", "error");
        return;
      }

      const headers = [
        "کد سفارش",
        "تحویل‌گیرنده",
        "تلفن",
        "شهر",
        "نشانی",
        "مبلغ (تومان)",
        "وضعیت",
        "بارنامه",
        "تاریخ",
      ];

      const body = rows.map((order) => [
        `"${order.orderNumber || order.id}"`,
        `"${order.recipientName}"`,
        `"${order.phone}"`,
        `"${order.city}"`,
        `"${(order.street || "").replace(/"/g, '""')}"`,
        `"${order.totalAmount || order.total || 0}"`,
        `"${ORDER_STATUSES[order.status as keyof typeof ORDER_STATUSES]?.label || order.status}"`,
        `"${order.paymentTrackId || ""}"`,
        `"${formatJalaliDate(order.createdAt)}"`,
      ]);

      const csv = "\uFEFF" + [headers.join(","), ...body.map((row) => row.join(","))].join("\r\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `rootwood-orders-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
      showToast("فایل سفارش‌ها دانلود شد", "success");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "خطا در خروجی گرفتن", "error");
    } finally {
      setExporting(false);
    }
  };

  const next = selected ? nextOrderStatus(selected.status) : null;

  return (
    <AdminCard>
      <AdminSectionHeader
        title="سفارش‌ها"
        description={`${toPersianDigits(total)} سفارش ثبت شده است`}
      >
        <div className="relative">
          <Search className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-ink-muted)]" />
          <input
            type="text"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="نام، تلفن یا کد سفارش"
            className={`${inputClass} w-56 pr-8`}
          />
        </div>

        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
          className={`${inputClass} w-40`}
        >
          <option value="ALL">همهٔ وضعیت‌ها</option>
          {ORDER_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <Button
          variant="outline"
          size="sm"
          onClick={exportCsv}
          disabled={exporting}
          className="gap-1.5"
        >
          <Download className="h-3.5 w-3.5" />
          خروجی CSV
        </Button>
      </AdminSectionHeader>

      {error && <p className="py-8 text-center text-xs text-red-700">{error}</p>}

      {loading && orders.length === 0 ? (
        <LoadingBlock />
      ) : orders.length === 0 ? (
        <p className="py-12 text-center text-xs text-[var(--color-ink-muted)]">
          سفارشی با این فیلترها پیدا نشد.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-[var(--color-ink-muted)]">
                <th className="p-2.5 font-semibold">سفارش</th>
                <th className="p-2.5 font-semibold">مشتری</th>
                <th className="p-2.5 font-semibold">مبلغ</th>
                <th className="p-2.5 font-semibold">وضعیت</th>
                <th className="p-2.5 font-semibold">تاریخ</th>
                <th className="p-2.5 font-semibold"> </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-subtle)]">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-[var(--color-canvas)]">
                  <td className="p-2.5">
                    <div className="font-mono font-bold text-[var(--color-ink)]" dir="ltr">
                      {order.orderNumber || order.id.slice(0, 8)}
                    </div>
                    <div className="text-[11px] text-[var(--color-ink-muted)]">
                      {toPersianDigits(order.items?.length || 0)} قلم
                    </div>
                  </td>
                  <td className="p-2.5">
                    <div className="font-bold text-[var(--color-ink)]">
                      {order.user?.name || order.recipientName}
                    </div>
                    <div className="font-mono text-[11px] text-[var(--color-ink-muted)]" dir="ltr">
                      {order.phone}
                    </div>
                  </td>
                  <td className="p-2.5 font-bold text-[var(--color-ink)]">
                    {formatPriceToman(order.totalAmount || order.total || 0)}
                  </td>
                  <td className="p-2.5">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="p-2.5 text-[11px] text-[var(--color-ink-muted)]">
                    {formatJalaliDate(order.createdAt)}
                  </td>
                  <td className="p-2.5 text-left">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelected(order)}
                      className="h-7 gap-1 px-2 text-[11px]"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      جزئیات
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} total={total} pageSize={PAGE_SIZE} onChange={setPage} />

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={`سفارش ${selected?.orderNumber || ""}`}
        description={selected ? formatJalaliDate(selected.createdAt) : undefined}
        size="lg"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setSelected(null)}>
              بستن
            </Button>
            {selected && selected.status !== "CANCELLED" && selected.status !== "DELIVERED" && (
              <Button
                variant="outline"
                size="sm"
                disabled={saving}
                onClick={() => setCancelOpen(true)}
                className="text-red-700"
              >
                لغو سفارش
              </Button>
            )}
            {selected && next && (
              <Button size="sm" disabled={saving} onClick={() => applyStatus(selected, next)}>
                انتقال به «{ORDER_STATUSES[next].label}»
              </Button>
            )}
          </>
        }
      >
        {selected && (
          <div className="space-y-5 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <StatusBadge status={selected.status} />
              <span className="font-mono text-[11px] text-[var(--color-ink-muted)]" dir="ltr">
                {selected.id}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-canvas)] p-3.5 sm:grid-cols-2">
              <div>
                <span className="text-[var(--color-ink-muted)]">تحویل‌گیرنده</span>
                <div className="font-bold text-[var(--color-ink)]">{selected.recipientName}</div>
                <div className="font-mono text-[11px]" dir="ltr">
                  {selected.phone}
                </div>
              </div>
              <div>
                <span className="text-[var(--color-ink-muted)]">نشانی</span>
                <div className="leading-relaxed text-[var(--color-ink)]">
                  {selected.province}، {selected.city}
                  {selected.postalCode ? ` — ${selected.postalCode}` : ""}
                </div>
                <div className="leading-relaxed text-[var(--color-ink-soft)]">{selected.street}</div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-[11px]">
                <thead>
                  <tr className="border-b border-[var(--color-border)] text-[var(--color-ink-muted)]">
                    <th className="p-2 font-semibold">کالا</th>
                    <th className="p-2 font-semibold">قیمت واحد</th>
                    <th className="p-2 font-semibold">تعداد</th>
                    <th className="p-2 font-semibold">جمع</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-subtle)]">
                  {selected.items?.map((item) => (
                    <tr key={item.id}>
                      <td className="p-2 font-medium text-[var(--color-ink)]">{item.productTitle}</td>
                      <td className="p-2">{formatPriceToman(item.unitPrice)}</td>
                      <td className="p-2">{toPersianDigits(item.quantity)}</td>
                      <td className="p-2 font-bold">
                        {formatPriceToman(item.unitPrice * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-1.5 border-t border-[var(--color-border-subtle)] pt-3">
              <div className="flex justify-between text-[var(--color-ink-soft)]">
                <span>جمع کالاها</span>
                <span>{formatPriceToman(selected.subtotal)}</span>
              </div>
              <div className="flex justify-between text-[var(--color-ink-soft)]">
                <span>ارسال</span>
                <span>{selected.shipping === 0 ? "رایگان" : formatPriceToman(selected.shipping)}</span>
              </div>
              <div className="flex justify-between pt-1 text-sm font-bold text-[var(--color-ink)]">
                <span>مبلغ کل</span>
                <span className="text-[var(--color-accent)]">
                  {formatPriceToman(selected.totalAmount || selected.total || 0)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 border-t border-[var(--color-border-subtle)] pt-4 sm:grid-cols-2">
              <label className="block space-y-1">
                <span className="font-semibold text-[var(--color-ink-soft)]">شمارهٔ بارنامه</span>
                <input
                  type="text"
                  value={tracking}
                  onChange={(event) => setTracking(event.target.value)}
                  className={inputClass}
                  placeholder="کد رهگیری ارسال"
                />
              </label>

              <label className="block space-y-1">
                <span className="font-semibold text-[var(--color-ink-soft)]">تغییر وضعیت</span>
                <select
                  value={selected.status}
                  onChange={(event) => applyStatus(selected, event.target.value)}
                  className={inputClass}
                  disabled={saving}
                >
                  {ORDER_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block space-y-1">
              <span className="font-semibold text-[var(--color-ink-soft)]">یادداشت کارگاه</span>
              <textarea
                rows={2}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                className={inputClass}
                placeholder="توضیح ساخت، هماهنگی ارسال…"
              />
            </label>

            <div className="flex items-center justify-between gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={saveExtra}
                disabled={saving}
                className="gap-1.5"
              >
                <Truck className="h-3.5 w-3.5" />
                ذخیرهٔ بارنامه و یادداشت
              </Button>
              {selected.paymentTrackId && (
                <span className="font-mono text-[11px] text-[var(--color-ink-muted)]" dir="ltr">
                  {selected.paymentTrackId}
                </span>
              )}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={cancelOpen}
        title="لغو سفارش"
        description="با لغو این سفارش، موجودی اقلام به انبار بازمی‌گردد. این کار قابل بازگشت نیست."
        confirmLabel="لغو سفارش"
        busy={saving}
        onCancel={() => setCancelOpen(false)}
        onConfirm={async () => {
          if (!selected) return;
          await applyStatus(selected, "CANCELLED");
          setCancelOpen(false);
        }}
      />
    </AdminCard>
  );
}
