"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AdminShell } from "@/components/AdminShell";
import {
  approveListing,
  fetchAdminListings,
  mediaUrl,
  rejectListing,
} from "@/lib/api";

const STATUSES = ["pending", "active", "rejected", "all"] as const;

export default function ListingsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const status = (searchParams.get("status") || "pending") as string;
  const [items, setItems] = useState<
    Awaited<ReturnType<typeof fetchAdminListings>>["items"]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetchAdminListings(status);
      setItems(res.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load listings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const title = useMemo(
    () => `${status === "all" ? "All" : status} listings`,
    [status]
  );

  return (
    <AdminShell>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 16,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1 style={{ margin: 0, textTransform: "capitalize" }}>{title}</h1>
          <p className="muted" style={{ marginTop: 6 }}>
            Approve to publish on Home. Reject to keep off the marketplace.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {STATUSES.map((s) => (
            <button
              key={s}
              className={`btn ${status === s ? "btn-primary" : "btn-ghost"}`}
              onClick={() => router.push(`/listings?status=${s}`)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {error ? <p style={{ color: "var(--danger)" }}>{error}</p> : null}

      <div className="card" style={{ marginTop: 18, overflow: "auto" }}>
        {loading ? (
          <p style={{ padding: 20 }} className="muted">
            Loading…
          </p>
        ) : items.length === 0 ? (
          <p style={{ padding: 20 }} className="muted">
            No listings in this queue.
          </p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Ad</th>
                <th>Seller</th>
                <th>Category</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const image = mediaUrl(item.images?.[0]?.url);
                return (
                  <tr key={item._id}>
                    <td>
                      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        <div
                          style={{
                            width: 56,
                            height: 56,
                            borderRadius: 8,
                            background: "#e8eeee",
                            backgroundImage: image ? `url(${image})` : undefined,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            flexShrink: 0,
                          }}
                        />
                        <div>
                          <Link
                            href={`/listings/${item._id}`}
                            style={{ fontWeight: 700 }}
                          >
                            {item.title}
                          </Link>
                          <div className="muted" style={{ fontSize: 13 }}>
                            ₹ {item.price.toLocaleString("en-IN")} ·{" "}
                            {item.location?.locality
                              ? `${item.location.locality}, `
                              : ""}
                            {item.location?.city}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>
                        {item.seller?.name || "Seller"}
                      </div>
                      <div className="muted" style={{ fontSize: 13 }}>
                        {item.seller?.phone || item.seller?.email || "—"}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        {item.category?.icon &&
                        (item.category.icon.startsWith("http") ||
                          item.category.icon.includes("cloudinary") ||
                          item.category.icon.startsWith("/uploads/")) ? (
                          <div
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 6,
                              background: `#e8eeee url(${mediaUrl(item.category.icon)}) center/cover`,
                              flexShrink: 0,
                            }}
                          />
                        ) : null}
                        <div>
                          <div>{item.category?.name || "—"}</div>
                          {item.category?.isPending ? (
                            <div className="muted" style={{ fontSize: 12 }}>
                              Category pending
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge badge-${item.status}`}>{item.status}</span>
                      {item.rejectionReason ? (
                        <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                          {item.rejectionReason}
                        </div>
                      ) : null}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <Link
                          href={`/listings/${item._id}`}
                          className="btn btn-ghost"
                        >
                          Details
                        </Link>
                        {item.status !== "active" ? (
                          <button
                            className="btn btn-accent"
                            disabled={busyId === item._id}
                            onClick={async () => {
                              setBusyId(item._id);
                              try {
                                await approveListing(item._id);
                                await load();
                              } catch (err) {
                                alert(
                                  err instanceof Error
                                    ? err.message
                                    : "Approve failed"
                                );
                              } finally {
                                setBusyId("");
                              }
                            }}
                          >
                            Approve
                          </button>
                        ) : null}
                        {item.status !== "rejected" ? (
                          <button
                            className="btn btn-danger"
                            disabled={busyId === item._id}
                            onClick={async () => {
                              const reason =
                                window.prompt("Rejection reason (optional)") || "";
                              setBusyId(item._id);
                              try {
                                await rejectListing(item._id, reason);
                                await load();
                              } catch (err) {
                                alert(
                                  err instanceof Error
                                    ? err.message
                                    : "Reject failed"
                                );
                              } finally {
                                setBusyId("");
                              }
                            }}
                          >
                            Reject
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </AdminShell>
  );
}
