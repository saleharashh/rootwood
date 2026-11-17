import { lazy, Suspense, useEffect } from "react";
import { Route, Switch, Link, Redirect, useLocation } from "wouter";
import { ToastProvider } from "@/components/toast-provider";
import { AuthProvider } from "@/components/auth-provider";
import { CartProvider } from "@/components/cart-provider";
import { StoreDialogsProvider } from "@/components/store-dialogs";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Seo } from "@/components/seo";
import { FEATURE_FLAGS } from "@/lib/site-config";

import { Home } from "@/routes/Home";

// Every non-landing route (and the whole admin tree) is split into its own chunk.
const Products = lazy(() => import("@/routes/Products").then((m) => ({ default: m.Products })));
const ProductDetail = lazy(() =>
  import("@/routes/ProductDetail").then((m) => ({ default: m.ProductDetail }))
);
const CartPage = lazy(() => import("@/routes/CartPage").then((m) => ({ default: m.CartPage })));
const Checkout = lazy(() => import("@/routes/Checkout").then((m) => ({ default: m.Checkout })));
const CheckoutCallback = lazy(() =>
  import("@/routes/CheckoutCallback").then((m) => ({ default: m.CheckoutCallback }))
);
const Account = lazy(() => import("@/routes/Account").then((m) => ({ default: m.Account })));
const Admin = lazy(() => import("@/routes/Admin").then((m) => ({ default: m.Admin })));
const Blog = lazy(() => import("@/routes/Blog").then((m) => ({ default: m.Blog })));
const BlogPostView = lazy(() =>
  import("@/routes/BlogPost").then((m) => ({ default: m.BlogPostView }))
);
const About = lazy(() => import("@/routes/About").then((m) => ({ default: m.About })));
const Gallery = lazy(() => import("@/routes/Gallery").then((m) => ({ default: m.Gallery })));
const Contact = lazy(() => import("@/routes/Contact").then((m) => ({ default: m.Contact })));
const TrackOrder = lazy(() =>
  import("@/routes/TrackOrder").then((m) => ({ default: m.TrackOrder }))
);

const PRIVATE_ROUTES: Record<string, string> = {
  "/cart": "سبد خرید",
  "/checkout": "تسویه حساب",
  "/checkout/callback": "تأیید پرداخت",
  "/account": "حساب کاربری",
  "/track": "پیگیری سفارش",
};

function NotFound() {
  const [location] = useLocation();

  return (
    <>
      <Seo
        title="صفحه یافت نشد"
        description="صفحه‌ای که به دنبال آن هستید حذف شده یا تغییر نام یافته است."
        path={location}
        noindex
      />
      <div className="min-h-[60vh] flex items-center justify-center py-20 px-4 text-center">
        <div className="max-w-md mx-auto space-y-4">
          <div className="text-6xl font-extrabold text-amber-900/30 font-serif">۴۰۴</div>
          <h1 className="text-2xl font-bold text-stone-900 font-serif">صفحه مورد نظر یافت نشد</h1>
          <p className="text-stone-600 text-sm leading-relaxed">
            صفحه‌ای که به دنبال آن هستید ممکن است حذف شده، تغییر نام یافته یا موقتاً در دسترس نباشد.
          </p>
          <Link
            href="/"
            className="inline-block bg-amber-900 hover:bg-amber-800 text-white font-medium text-xs sm:text-sm px-6 py-2.5 rounded-xl shadow-sm transition"
          >
            بازگشت به صفحه اصلی
          </Link>
        </div>
      </div>
    </>
  );
}

function RouteFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-900/20 border-t-amber-900" />
    </div>
  );
}

function AppRoutes() {
  const [location] = useLocation();

  const privateTitle = location.startsWith("/admin")
    ? "پنل مدیریت آتلیه"
    : PRIVATE_ROUTES[location];

  // مرورگر موقعیت قبلی را بازنگرداند؛ خودمان هر صفحه را از بالا شروع می‌کنیم.
  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  // هر جابه‌جایی صفحه از بالای صفحهٔ جدید شروع شود (بدون اسکرول نرم).
  useEffect(() => {
    const root = document.documentElement;
    const previous = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    window.scrollTo(0, 0);
    root.style.scrollBehavior = previous;
  }, [location]);

  return (
    <div key={location} className="page-enter">
      {privateTitle && (
        <Seo
          title={privateTitle}
          description="این صفحه خصوصی است و در نتایج جستجو نمایش داده نمی‌شود."
          path={location}
          noindex
        />
      )}

      <Suspense fallback={<RouteFallback />}>
        <Switch>
          <Route path="/" component={Home} />
          {FEATURE_FLAGS.showProducts ? (
            <>
              <Route path="/products" component={Products} />
              <Route path="/products/:slug" component={ProductDetail} />
            </>
          ) : (
            <>
              <Route path="/products"><Redirect to="/" /></Route>
              <Route path="/products/:slug"><Redirect to="/" /></Route>
            </>
          )}
          {FEATURE_FLAGS.showCart ? (
            <>
              <Route path="/cart" component={CartPage} />
              <Route path="/checkout" component={Checkout} />
              <Route path="/checkout/callback" component={CheckoutCallback} />
              <Route path="/track" component={TrackOrder} />
            </>
          ) : (
            <>
              <Route path="/cart"><Redirect to="/" /></Route>
              <Route path="/checkout"><Redirect to="/" /></Route>
              <Route path="/checkout/callback"><Redirect to="/" /></Route>
              <Route path="/track"><Redirect to="/" /></Route>
            </>
          )}
          {FEATURE_FLAGS.showAuth ? (
            <Route path="/account" component={Account} />
          ) : (
            <Route path="/account"><Redirect to="/" /></Route>
          )}
          <Route path="/admin" component={Admin} />
          <Route path="/admin/:tab" component={Admin} />
          <Route path="/blog" component={Blog} />
          <Route path="/blog/:slug" component={BlogPostView} />
          <Route path="/gallery" component={Gallery} />
          <Route path="/about" component={About} />
          <Route path="/contact" component={Contact} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </div>
  );
}

export function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <CartProvider>
          <StoreDialogsProvider>
            <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900 selection:bg-amber-900 selection:text-white" dir="rtl">
              <SiteHeader />

              <main className="flex-1">
                <AppRoutes />
              </main>

              <SiteFooter />
            </div>
          </StoreDialogsProvider>
        </CartProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
