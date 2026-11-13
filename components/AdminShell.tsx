"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { clearAdminSession, getAdminUser, type AdminUser } from "@/lib/api";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/listings", label: "Listings" },
  { href: "/banners", label: "Banners" },
  { href: "/categories", label: "Categories" },
  { href: "/support", label: "Support" },
  { href: "/users", label: "Users" },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    const current = getAdminUser();
    if (!current) {
      router.replace("/login");
      return;
    }
    setUser(current);
  }, [router]);

  if (!user) {
    return (
      <main style={{ padding: 40 }} className="muted">
        Checking session…
      </main>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", minHeight: "100vh" }}>
      <aside
        style={{
          background: "var(--brand)",
          color: "#fff",
          padding: "24px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <div style={{ padding: "0 8px 20px" }}>
          <div style={{ fontWeight: 800, fontSize: 18 }}>Classifieds</div>
          <div style={{ opacity: 0.75, fontSize: 13, marginTop: 4 }}>Admin panel</div>
        </div>
        {NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                padding: "12px 14px",
                borderRadius: 8,
                background: active ? "rgba(255,255,255,0.14)" : "transparent",
                fontWeight: active ? 800 : 600,
              }}
            >
              {item.label}
            </Link>
          );
        })}
        <div style={{ marginTop: "auto", padding: 8 }}>
          <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 10 }}>
            {user.email}
          </div>
          <button
            className="btn btn-ghost"
            style={{ width: "100%", color: "var(--brand)" }}
            onClick={() => {
              clearAdminSession();
              router.replace("/login");
            }}
          >
            Log out
          </button>
        </div>
      </aside>
      <main style={{ padding: 28 }}>{children}</main>
    </div>
  );
}
