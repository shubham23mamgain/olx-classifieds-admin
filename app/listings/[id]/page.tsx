"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AdminShell } from "@/components/AdminShell";
import {
  approveListing,
  fetchAdminListing,
  mediaUrl,
  rejectListing,
  type AdminListingDetail,
} from "@/lib/api";

export default function ListingDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;
  const [listing, setListing] = useState<AdminListingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetchAdminListing(id);
      setListing(res.listing);
      setActiveImage(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load listing");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const images = useMemo(
    () =>
      (listing?.images || [])
        .slice()
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)),
    [listing]
  );

  const attributeEntries = useMemo(() => {
    const attrs = listing?.attributes || {};
    return Object.entries(attrs).filter(
      ([, value]) => value !== undefined && value !== null && value !== ""
    );
  }, [listing]);

  const locationLabel = useMemo(() => {
    if (!listing?.location) return "—";
    const parts = [
      listing.location.locality,
      listing.location.city,
      listing.location.state,
    ].filter(Boolean);
    return parts.join(", ") || "—";
  }, [listing]);

  if (loading) {
    return (
      <AdminShell>
        <p className="muted">Loading listing…</p>
      </AdminShell>
    );
  }

  if (error || !listing) {
    return (
      <AdminShell>
        <p style={{ color: "var(--danger)" }}>{error || "Listing not found"}</p>
        <Link href="/listings" className="btn btn-ghost">
          Back to listings
        </Link>
      </AdminShell>
    );
  }

  const hero = mediaUrl(images[activeImage]?.url || images[0]?.url);

  return (
    <AdminShell>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 16,
          alignItems: "flex-start",
          flexWrap: "wrap",
        }}
      >
        <div>
          <Link href="/listings" className="muted" style={{ fontSize: 14 }}>
            ← Back to listings
          </Link>
          <h1 style={{ margin: "8px 0 6px" }}>{listing.title}</h1>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <span className={`badge badge-${listing.status}`}>{listing.status}</span>
            <strong style={{ fontSize: 22 }}>
              ₹ {Number(listing.price || 0).toLocaleString("en-IN")}
            </strong>
            {listing.negotiable ? (
              <span className="muted" style={{ fontSize: 13 }}>
                Negotiable
              </span>
            ) : null}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {listing.status !== "active" ? (
            <button
              className="btn btn-accent"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await approveListing(listing._id);
                  await load();
                } catch (err) {
                  alert(err instanceof Error ? err.message : "Approve failed");
                } finally {
                  setBusy(false);
                }
              }}
            >
              Approve
            </button>
          ) : null}
          {listing.status !== "rejected" ? (
            <button
              className="btn btn-danger"
              disabled={busy}
              onClick={async () => {
                const reason =
                  window.prompt("Rejection reason (optional)") || "";
                setBusy(true);
                try {
                  await rejectListing(listing._id, reason);
                  await load();
                } catch (err) {
                  alert(err instanceof Error ? err.message : "Reject failed");
                } finally {
                  setBusy(false);
                }
              }}
            >
              Reject
            </button>
          ) : null}
          <button className="btn btn-ghost" onClick={() => router.refresh()}>
            Refresh
          </button>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(280px, 1.2fr) minmax(280px, 1fr)",
          gap: 18,
          marginTop: 20,
        }}
      >
        <section className="card" style={{ padding: 16 }}>
          <div
            style={{
              width: "100%",
              aspectRatio: "4 / 3",
              borderRadius: 12,
              background: "#e8eeee",
              backgroundImage: hero ? `url(${hero})` : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          {images.length > 1 ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(72px, 1fr))",
                gap: 8,
                marginTop: 12,
              }}
            >
              {images.map((img, index) => {
                const thumb = mediaUrl(img.url);
                return (
                  <button
                    key={img._id || `${img.url}-${index}`}
                    type="button"
                    onClick={() => setActiveImage(index)}
                    style={{
                      height: 72,
                      borderRadius: 8,
                      border:
                        index === activeImage
                          ? "2px solid var(--accent)"
                          : "1px solid var(--border)",
                      background: "#e8eeee",
                      backgroundImage: thumb ? `url(${thumb})` : undefined,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      cursor: "pointer",
                      padding: 0,
                    }}
                    aria-label={`Photo ${index + 1}`}
                  />
                );
              })}
            </div>
          ) : null}
          <p className="muted" style={{ marginTop: 12, fontSize: 13 }}>
            {images.length} photo{images.length === 1 ? "" : "s"}
          </p>
        </section>

        <section className="card" style={{ padding: 16, display: "grid", gap: 14 }}>
          <div>
            <div className="muted" style={{ fontSize: 12, textTransform: "uppercase" }}>
              Description
            </div>
            <p style={{ margin: "6px 0 0", whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
              {listing.description?.trim() || "No description provided."}
            </p>
          </div>

          <div>
            <div className="muted" style={{ fontSize: 12, textTransform: "uppercase" }}>
              Details
            </div>
            <dl style={{ margin: "8px 0 0", display: "grid", gap: 8 }}>
              <Row label="Condition" value={listing.condition || "—"} />
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "140px 1fr",
                  gap: 10,
                  alignItems: "center",
                }}
              >
                <div className="muted" style={{ fontSize: 13 }}>
                  Category
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 600 }}>
                  {listing.category?.icon &&
                  (listing.category.icon.startsWith("http") ||
                    listing.category.icon.includes("cloudinary") ||
                    listing.category.icon.startsWith("/uploads/")) ? (
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 6,
                        background: `#e8eeee url(${mediaUrl(listing.category.icon)}) center/cover`,
                      }}
                    />
                  ) : null}
                  {listing.category?.name || "—"}
                </div>
              </div>
              <Row label="Location" value={locationLabel} />
              <Row label="Views" value={String(listing.views ?? 0)} />
              <Row
                label="Created"
                value={
                  listing.createdAt
                    ? new Date(listing.createdAt).toLocaleString()
                    : "—"
                }
              />
              <Row
                label="Published"
                value={
                  listing.publishedAt
                    ? new Date(listing.publishedAt).toLocaleString()
                    : "—"
                }
              />
              {listing.rejectionReason ? (
                <Row label="Rejection" value={listing.rejectionReason} />
              ) : null}
            </dl>
          </div>

          <div>
            <div className="muted" style={{ fontSize: 12, textTransform: "uppercase" }}>
              Attributes
            </div>
            {attributeEntries.length === 0 ? (
              <p className="muted" style={{ margin: "6px 0 0" }}>
                No attributes.
              </p>
            ) : (
              <dl style={{ margin: "8px 0 0", display: "grid", gap: 8 }}>
                {attributeEntries.map(([key, value]) => (
                  <Row
                    key={key}
                    label={key}
                    value={
                      Array.isArray(value)
                        ? value.join(", ")
                        : typeof value === "object"
                          ? JSON.stringify(value)
                          : String(value)
                    }
                  />
                ))}
              </dl>
            )}
          </div>

          <div>
            <div className="muted" style={{ fontSize: 12, textTransform: "uppercase" }}>
              Seller
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 8, alignItems: "center" }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: "#dfe8e9",
                  backgroundImage: listing.seller?.avatarUrl
                    ? `url(${mediaUrl(listing.seller.avatarUrl)})`
                    : undefined,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  flexShrink: 0,
                }}
              />
              <div>
                <div style={{ fontWeight: 700 }}>
                  {listing.seller?.name || "Seller"}
                  {listing.seller?.isPhoneVerified ? " · verified" : ""}
                </div>
                <div className="muted" style={{ fontSize: 13 }}>
                  {listing.seller?.phone || listing.seller?.email || "—"}
                </div>
                {listing.seller?.bio ? (
                  <div style={{ fontSize: 13, marginTop: 4 }}>{listing.seller.bio}</div>
                ) : null}
              </div>
            </div>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "140px 1fr",
        gap: 10,
        alignItems: "start",
      }}
    >
      <dt className="muted" style={{ fontSize: 13, textTransform: "capitalize" }}>
        {label}
      </dt>
      <dd style={{ margin: 0, fontWeight: 600 }}>{value}</dd>
    </div>
  );
}
