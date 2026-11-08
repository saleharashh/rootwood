import { Route, Switch, Link } from "wouter";
import { ToastProvider } from "@/components/toast-provider";
import { AuthProvider } from "@/components/auth-provider";
import { CartProvider } from "@/components/cart-provider";
import { StoreDialogsProvider } from "@/components/store-dialogs";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

import { Home } from "@/routes/Home";
import { Products } from "@/routes/Products";
import { ProductDetail } from "@/routes/ProductDetail";
import { CartPage } from "@/routes/CartPage";
import { Checkout } from "@/routes/Checkout";
import { CheckoutCallback } from "@/routes/CheckoutCallback";
import { Account } from "@/routes/Account";
import { Admin } from "@/routes/Admin";
import { Blog } from "@/routes/Blog";
import { BlogPostView } from "@/routes/BlogPost";
import { About } from "@/routes/About";
import { Contact } from "@/routes/Contact";

function NotFound() {
  return (
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
                <Switch>
                  <Route path="/" component={Home} />
                  <Route path="/products" component={Products} />
                  <Route path="/products/:slug" component={ProductDetail} />
                  <Route path="/cart" component={CartPage} />
                  <Route path="/checkout" component={Checkout} />
                  <Route path="/checkout/callback" component={CheckoutCallback} />
                  <Route path="/account" component={Account} />
                  <Route path="/admin" component={Admin} />
                  <Route path="/blog" component={Blog} />
                  <Route path="/blog/:slug" component={BlogPostView} />
                  <Route path="/about" component={About} />
                  <Route path="/contact" component={Contact} />
                  <Route component={NotFound} />
                </Switch>
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
