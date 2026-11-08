import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "تماس با ما",
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
