"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/loading";
import { useStoreDialogs } from "@/components/store-dialogs";

export default function CartPage() {
  const { openCart } = useStoreDialogs();
  const router = useRouter();

  useEffect(() => {
    openCart();
    router.replace("/");
  }, [openCart, router]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}
