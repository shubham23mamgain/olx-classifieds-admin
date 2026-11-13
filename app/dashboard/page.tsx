"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/AdminShell";
import { fetchStats } from "@/lib/api";

export default function DashboardPage() {
  const [stats, setStats] = useState<{
    pendingListings: number;
    activeListings: number;
    rejectedListings: number;
    pendingCategories: number;
    users: number;
  } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchStats()
      .then((res) => setStats(res.stats))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load stats")
      );
  }, []);

  const cards = [
    {
      label: "Pending listings",
      value: stats?.pendingListings,
      href: "/listings?status=pending",
    },
    {
      label: "Active listings",
      value: stats?.activeListings,
      href: "/listings?status=active",
    },
    {
      label: "Rejected",
      value: stats?.rejectedListings,
      href: "/listings?status=rejected",
    },
    {
      label: "Pending categories",
      value: stats?.pendingCategories,
      href: "/categories",
    },
    { label: "Users", value: stats?.users, href: "/dashboard" },
  ];

  return (
    <AdminShell>
      <h1 style={{ marginTop: 0 }}>Dashboard</h1>
      <p className="muted" style={{ marginTop: -4 }}>
        Approve products before they appear on Home.
      </p>
      {error ? <p style={{ color: "var(--danger)" }}>{error}</p> : null}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 14,
          marginTop: 20,
        }}
      >
        {cards.map((card) => (
          <Link key={card.label} href={card.href} className="card" style={{ padding: 18 }}>
            <div className="muted" style={{ fontSize: 13, fontWeight: 700 }}>
              {card.label}
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, marginTop: 10 }}>
              {card.value ?? "—"}
            </div>
          </Link>
        ))}
      </div>
    </AdminShell>
  );
}
