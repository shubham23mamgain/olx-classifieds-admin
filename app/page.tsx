"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAdminUser } from "@/lib/api";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const user = getAdminUser();
    router.replace(user ? "/dashboard" : "/login");
  }, [router]);

  return (
    <main style={{ padding: 40 }} className="muted">
      Loading admin…
    </main>
  );
}
