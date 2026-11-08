import type { Metadata } from "next";
import { AdminDashboard } from "./admin-dashboard";

export const metadata: Metadata = {
  title: "پنل مدیریت",
  description: "مدیریت سفارش‌ها، نظرات و پیام‌های کارگاه کرفتدرات.",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminDashboard />;
}
