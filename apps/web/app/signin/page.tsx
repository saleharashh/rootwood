"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Spinner } from "@/components/loading";
import { useAuth } from "@/components/auth-provider";
import { useStoreDialogs } from "@/components/store-dialogs";

/** Only same-site paths are honoured, so `?redirect=` cannot be abused. */
function safeRedirect(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/account";
  }
  return value;
}

function SignInLauncher() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading } = useAuth();
  const { openAuth } = useStoreDialogs();
  const redirect = safeRedirect(searchParams.get("redirect"));

  useEffect(() => {
    if (loading) return;
    if (user) {
      router.replace(redirect);
      return;
    }
    openAuth({ redirect });
    router.replace("/");
  }, [loading, user, redirect, openAuth, router]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <Spinner size="lg" />
        </div>
      }
    >
      <SignInLauncher />
    </Suspense>
  );
}
