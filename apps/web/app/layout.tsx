import type { Metadata, Viewport } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CartProvider } from "@/components/cart-provider";
import { AuthProvider } from "@/components/auth-provider";
import { ToastProvider } from "@/components/toast-provider";
import { StoreDialogsProvider } from "@/components/store-dialogs";

const vazirmatn = Vazirmatn({
  variable: "--font-vazirmatn",
  subsets: ["arabic", "latin"],
  display: "swap",
});

const SITE_NAME = "Rootwood Group (کرفتدرات)";

function getMetadataBase() {
  try {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000");
  } catch {
    return new URL("http://localhost:3000");
  }
}

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: {
    default: "Rootwood Group · کرفتدرات — مبلمان چوبی دست‌ساز",
    template: "%s | " + SITE_NAME,
  },
  description:
    "مبلمان دست‌ساز از بلوط ایرانی، گردوی آمریکایی، گیلاس آمریکایی و توت ایرانی. میز، نشیمن، ذخیره‌سازی و دکور برای زندگی روزمره.",
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "مبلمان",
  keywords: [
    "مبلمان دست‌ساز",
    "مبلمان چوبی",
    "بلوط ایرانی",
    "گردوی آمریکایی",
    "توت ایرانی",
    "کارگاه چوب",
  ],
  openGraph: {
    type: "website",
    locale: "fa_IR",
    siteName: SITE_NAME,
    title: SITE_NAME + " — مبلمان چوبی دست‌ساز",
    description:
      "مبلمان دست‌ساز از بلوط ایرانی، گردوی آمریکایی، گیلاس آمریکایی و توت ایرانی. میز، نشیمن، ذخیره‌سازی و دکور برای زندگی روزمره.",
    url: "/",
    images: [{ url: "/images/oak-dining-table.webp", alt: "دوخته چوبی دست‌ساز روت‌وود گروپ" }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME + " — مبلمان چوبی دست‌ساز",
    description:
      "مبلمان دست‌ساز از بلوط ایرانی، گردوی آمریکایی، گیلاس آمریکایی و توت ایرانی. میز، نشیمن، ذخیره‌سازی و دکور برای زندگی روزمره.",
    images: ["/images/oak-dining-table.webp"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "/",
    languages: {
      fa: "/",
      "fa-IR": "/",
    },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f2ea" },
    { media: "(prefers-color-scheme: dark)", color: "#1f1a15" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="fa"
      dir="rtl"
      className={`${vazirmatn.variable} h-full antialiased`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col antialiased">
        <CartProvider>
          <AuthProvider>
            <ToastProvider>
              <StoreDialogsProvider>
                <SiteHeader />
                <main className="flex-1">{children}</main>
                <SiteFooter />
              </StoreDialogsProvider>
            </ToastProvider>
          </AuthProvider>
        </CartProvider>
      </body>
    </html>
  );
}
