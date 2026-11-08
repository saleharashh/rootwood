import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "سبد خرید",
  description: "سبد خرید خود را پیش از پرداخت بررسی کنید.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function CartLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
