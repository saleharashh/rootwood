import { Link, useLocation } from "wouter";
import { BookOpen, ExternalLink, LayoutDashboard, Layers, MessageSquare, Package, Shield, Users } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { useStoreDialogs } from "@/components/store-dialogs";
import { Button } from "@/components/ui/button";
import { Dashboard } from "./admin/Dashboard";
import { Orders } from "./admin/Orders";
import { ProductsAdmin } from "./admin/Products";
import { Customers } from "./admin/Customers";
import { Content } from "./admin/Content";
import { BlogAdmin } from "./admin/BlogAdmin";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "dashboard", label: "داشبورد", icon: LayoutDashboard },
  { id: "orders", label: "سفارش‌ها", icon: Package },
  { id: "products", label: "محصولات و انبار", icon: Layers },
  { id: "blog", label: "مجله و مقالات", icon: BookOpen },
  { id: "customers", label: "مشتریان", icon: Users },
  { id: "content", label: "دیدگاه‌ها و پیام‌ها", icon: MessageSquare },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function Admin() {
  const [location, setLocation] = useLocation();
  const { user, isAuthenticated, loading, logout } = useAuth();
  const { openAuth } = useStoreDialogs();

  const segment = location.split("/").filter(Boolean)[1] || "dashboard";
  const active = (TABS.some((tab) => tab.id === segment) ? segment : "dashboard") as TabId;

  const go = (tab: TabId) => setLocation(`/admin/${tab}`);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--color-accent)]/20 border-t-[var(--color-accent)]" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "ADMIN") {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-red-200 bg-red-50 text-red-600">
          <Shield className="h-7 w-7" />
        </div>
        <h1 className="mt-4 font-serif text-xl font-bold text-[var(--color-ink)]">
          دسترسی مدیریت محدود است
        </h1>
        <p className="mt-2 text-xs leading-relaxed text-[var(--color-ink-soft)]">
          این بخش فقط برای شماره‌های موبایل مجاز آتلیه در دسترس است.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {isAuthenticated ? (
            <Button
              onClick={async () => {
                await logout();
                openAuth();
              }}
            >
              خروج و ورود با شمارهٔ مدیریت
            </Button>
          ) : (
            <Button onClick={openAuth}>ورود با شمارهٔ موبایل</Button>
          )}
          <Link href="/">
            <Button variant="outline">بازگشت به فروشگاه</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] pb-20">
      <header className="border-b border-[var(--color-border)] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-accent)] text-white">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-serif text-base font-black text-[var(--color-ink)] sm:text-lg">
                میز مدیریت آتلیه
              </h1>
              <p className="text-[11px] text-[var(--color-ink-muted)]">
                {user.name} — {user.phone || "مدیر کارگاه"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link href="/">
              <Button variant="outline" size="sm" className="gap-1.5">
                <ExternalLink className="h-3.5 w-3.5" />
                مشاهدهٔ فروشگاه
              </Button>
            </Link>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-1 overflow-x-auto border-t border-[var(--color-border-subtle)] py-2">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = active === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => go(tab.id)}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors sm:text-sm",
                    isActive
                      ? "bg-[var(--color-accent)] text-white"
                      : "text-[var(--color-ink-soft)] hover:bg-[var(--color-surface-2)]"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 pt-6 sm:px-6 lg:px-8">
        {active === "dashboard" && <Dashboard onNavigate={(tab) => go(tab as TabId)} />}
        {active === "orders" && <Orders />}
        {active === "products" && <ProductsAdmin />}
        {active === "blog" && <BlogAdmin />}
        {active === "customers" && <Customers />}
        {active === "content" && <Content />}
      </main>
    </div>
  );
}
