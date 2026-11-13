"use client";

import { FormEvent, useEffect, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { adminLogin, getAdminUser, setAdminSession } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@classifieds.local");
  const [password, setPassword] = useState("Admin@12345");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getAdminUser()) router.replace("/dashboard");
  }, [router]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await adminLogin(email.trim(), password);
      setAdminSession(res.accessToken, res.user, res.refreshToken);
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background:
          "linear-gradient(160deg, #002f34 0%, #0a4a52 45%, #f2f4f5 45%)",
      }}
    >
      <form
        onSubmit={onSubmit}
        className="card"
        style={{ width: "100%", maxWidth: 420, padding: 28 }}
      >
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: 0.08,
              textTransform: "uppercase",
              color: "var(--muted)",
            }}
          >
            Classifieds
          </div>
          <h1 style={{ margin: "8px 0 0", fontSize: 28 }}>Admin login</h1>
          <p className="muted" style={{ marginTop: 8 }}>
            Review listings and category requests before they go live.
          </p>
        </div>

        <label style={{ display: "block", marginBottom: 14 }}>
          <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 13 }}>
            Email
          </div>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
            style={inputStyle}
          />
        </label>

        <label style={{ display: "block", marginBottom: 18 }}>
          <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 13 }}>
            Password
          </div>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
            style={inputStyle}
          />
        </label>

        {error ? (
          <p style={{ color: "var(--danger)", marginTop: 0 }}>{error}</p>
        ) : null}

        <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: "100%" }}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}

const inputStyle: CSSProperties = {
  width: "100%",
  height: 44,
  borderRadius: 8,
  border: "1px solid var(--border)",
  padding: "0 12px",
  background: "#fff",
};
