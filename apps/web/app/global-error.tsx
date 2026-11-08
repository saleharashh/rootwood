"use client";

import Link from "next/link";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fa" dir="rtl">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background:
            "radial-gradient(120% 90% at 85% 0%, #f3e6d2 0%, rgba(243, 230, 210, 0) 60%), radial-gradient(100% 80% at 0% 100%, #e9dcc6 0%, rgba(233, 220, 198, 0) 55%), linear-gradient(160deg, #f8f4ec 0%, #f1e9dc 55%, #ece0cc 100%)",
          color: "#2a2520",
          fontFamily: "Tahoma, Arial, sans-serif",
        }}
      >
        <main
          style={{
            width: "100%",
            maxWidth: "36rem",
            margin: "1.5rem",
            padding: "2.5rem",
            textAlign: "center",
            borderRadius: "2rem",
            border: "1px solid rgba(255, 255, 255, 0.7)",
            background:
              "linear-gradient(150deg, rgba(255, 252, 246, 0.82), rgba(249, 243, 233, 0.6))",
            boxShadow:
              "0 28px 60px -30px rgba(74, 50, 28, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.8)",
            WebkitBackdropFilter: "blur(18px)",
            backdropFilter: "blur(18px)",
          }}
        >
          <p
            style={{
              display: "inline-block",
              margin: 0,
              padding: "0.35rem 0.9rem",
              borderRadius: "999px",
              border: "1px solid rgba(255, 255, 255, 0.6)",
              background: "rgba(154, 58, 43, 0.1)",
              color: "#9a3a2b",
              fontWeight: 700,
              fontSize: "0.85rem",
            }}
          >
            خطای غیرمنتظره
          </p>
          <h1 style={{ color: "#7a4a24", fontSize: "2rem", marginBottom: "0.5rem" }}>
            کرفتدرات در دسترس نیست
          </h1>
          <p style={{ color: "#6b6054", lineHeight: 2, marginTop: 0 }}>
            مشکلی در بارگذاری سایت پیش آمده است. لطفاً دوباره تلاش کنید.
          </p>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: "0.75rem",
              marginTop: "2rem",
            }}
          >
            <button
              type="button"
              onClick={reset}
              style={{
                border: 0,
                borderRadius: "0.75rem",
                background: "linear-gradient(145deg, #8a5a2b, #5f3a1c)",
                color: "#fffaf2",
                cursor: "pointer",
                padding: "0.75rem 1.125rem",
                font: "inherit",
                boxShadow: "0 10px 24px -12px rgba(74, 50, 28, 0.6)",
              }}
            >
              تلاش دوباره
            </button>
            <Link
              href="/"
              style={{
                border: "1px solid rgba(255, 255, 255, 0.7)",
                borderRadius: "0.75rem",
                background: "rgba(255, 255, 255, 0.35)",
                color: "#2a2520",
                padding: "0.75rem 1.125rem",
                textDecoration: "none",
              }}
            >
              صفحه اصلی
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}
