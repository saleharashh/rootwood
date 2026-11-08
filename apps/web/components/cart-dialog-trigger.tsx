"use client";

import { useStoreDialogs } from "@/components/store-dialogs";

export function CartDialogTrigger({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const { openCart } = useStoreDialogs();

  return (
    <button
      type="button"
      onClick={openCart}
      aria-haspopup="dialog"
      className={`cursor-pointer ${className ?? ""}`}
    >
      {children}
    </button>
  );
}
