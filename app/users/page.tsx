"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import {
  fetchAdminUsers,
  setUserBlocked,
  type ManagedUser,
} from "@/lib/api";

export default function UsersPage() {
  const [items, setItems] = useState<ManagedUser[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  const load = async (query = q) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetchAdminUsers(query);
      setItems(res.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AdminShell>
      <h1 style={{ marginTop: 0 }}>Users</h1>
      <p className="muted" style={{ marginTop: -4 }}>
        Block or unblock users. Blocked users cannot authenticate.
      </p>

      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, phone, email"
          style={{
            flex: 1,
            height: 40,
            borderRadius: 8,
            border: "1px solid var(--border)",
            padding: "0 12px",
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") load(q);
          }}
        />
        <button className="btn btn-primary" onClick={() => load(q)}>
          Search
        </button>
      </div>

      {error ? <p style={{ color: "var(--danger)" }}>{error}</p> : null}

      <div className="card" style={{ marginTop: 18, overflow: "auto" }}>
        {loading ? (
          <p style={{ padding: 20 }} className="muted">
            Loading…
          </p>
        ) : items.length === 0 ? (
          <p style={{ padding: 20 }} className="muted">
            No users found.
          </p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Contact</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((user) => (
                <tr key={user._id}>
                  <td>
                    <div style={{ fontWeight: 700 }}>{user.name || "User"}</div>
                    <div className="muted" style={{ fontSize: 12 }}>
                      {user.role || "user"}
                      {user.isPhoneVerified ? " · verified" : ""}
                    </div>
                  </td>
                  <td>
                    <div>{user.phone ? `+91 ${user.phone}` : "—"}</div>
                    <div className="muted" style={{ fontSize: 12 }}>
                      {user.email || "—"}
                    </div>
                  </td>
                  <td>
                    <span
                      className={`badge ${user.isBlocked ? "badge-rejected" : "badge-active"}`}
                    >
                      {user.isBlocked ? "blocked" : "active"}
                    </span>
                  </td>
                  <td>
                    <button
                      className={`btn ${user.isBlocked ? "btn-accent" : "btn-danger"}`}
                      disabled={busyId === user._id}
                      onClick={async () => {
                        const next = !user.isBlocked;
                        if (
                          next &&
                          !confirm(`Block ${user.name || user.phone || "this user"}?`)
                        ) {
                          return;
                        }
                        setBusyId(user._id);
                        try {
                          await setUserBlocked(user._id, next);
                          await load(q);
                        } catch (err) {
                          alert(err instanceof Error ? err.message : "Failed");
                        } finally {
                          setBusyId("");
                        }
                      }}
                    >
                      {user.isBlocked ? "Unblock" : "Block"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminShell>
  );
}
