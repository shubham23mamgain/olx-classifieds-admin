"use client";

import { FormEvent, useEffect, useState, type CSSProperties } from "react";
import { AdminShell } from "@/components/AdminShell";
import {
  createBanner,
  deleteBanner,
  fetchAdminBanners,
  mediaUrl,
  updateBanner,
  uploadBannerImage,
  type BannerItem,
} from "@/lib/api";

const emptyForm = {
  title: "",
  subtitle: "",
  imageUrl: "",
  publicId: "",
  linkTarget: "none" as BannerItem["linkTarget"],
  linkUrl: "",
  sortOrder: 0,
  isActive: true,
};

export default function BannersPage() {
  const [items, setItems] = useState<BannerItem[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetchAdminBanners();
      setItems(res.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load banners");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.imageUrl.trim()) {
      setError("Title and image URL are required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (editingId) {
        await updateBanner(editingId, form);
      } else {
        await createBanner(form);
      }
      setForm(emptyForm);
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const onUpload = async (file?: File | null) => {
    if (!file) return;
    setSaving(true);
    try {
      const res = await uploadBannerImage(file);
      setForm((prev) => ({
        ...prev,
        imageUrl: res.imageUrl,
        publicId: res.publicId,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminShell>
      <h1 style={{ marginTop: 0 }}>Home carousel banners</h1>
      <p className="muted" style={{ marginTop: -4 }}>
        Add, edit, or remove banners shown on the mobile Home screen.
      </p>
      {error ? <p style={{ color: "var(--danger)" }}>{error}</p> : null}

      <form
        className="card"
        onSubmit={onSubmit}
        style={{ marginTop: 18, padding: 18, display: "grid", gap: 12 }}
      >
        <strong>{editingId ? "Edit banner" : "Add banner"}</strong>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <label>
            <div style={labelStyle}>Title</div>
            <input
              style={inputStyle}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </label>
          <label>
            <div style={labelStyle}>Subtitle</div>
            <input
              style={inputStyle}
              value={form.subtitle}
              onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
            />
          </label>
          <label style={{ gridColumn: "1 / -1" }}>
            <div style={labelStyle}>Image URL</div>
            <input
              style={inputStyle}
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              placeholder="https://… or /uploads/…"
              required
            />
          </label>
          <label>
            <div style={labelStyle}>Upload image</div>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => onUpload(e.target.files?.[0])}
            />
          </label>
          <label>
            <div style={labelStyle}>Sort order</div>
            <input
              style={inputStyle}
              type="number"
              value={form.sortOrder}
              onChange={(e) =>
                setForm({ ...form, sortOrder: Number(e.target.value) || 0 })
              }
            />
          </label>
          <label>
            <div style={labelStyle}>Link target</div>
            <select
              style={inputStyle}
              value={form.linkTarget}
              onChange={(e) =>
                setForm({
                  ...form,
                  linkTarget: e.target.value as BannerItem["linkTarget"],
                })
              }
            >
              <option value="none">None</option>
              <option value="sell">Sell</option>
              <option value="search">Search</option>
              <option value="chats">Chats</option>
              <option value="custom">Custom path</option>
            </select>
          </label>
          <label>
            <div style={labelStyle}>Custom link path</div>
            <input
              style={inputStyle}
              value={form.linkUrl}
              onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
              placeholder="/search"
              disabled={form.linkTarget !== "custom"}
            />
          </label>
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
          />
          Active on Home
        </label>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? "Saving…" : editingId ? "Update banner" : "Add banner"}
          </button>
          {editingId ? (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm);
              }}
            >
              Cancel
            </button>
          ) : null}
        </div>
      </form>

      <div className="card" style={{ marginTop: 18, overflow: "auto" }}>
        {loading ? (
          <p style={{ padding: 20 }} className="muted">
            Loading…
          </p>
        ) : items.length === 0 ? (
          <p style={{ padding: 20 }} className="muted">
            No banners yet.
          </p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Preview</th>
                <th>Content</th>
                <th>Link</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const preview = mediaUrl(item.imageUrl);
                return (
                  <tr key={item._id}>
                    <td>
                      <div
                        style={{
                          width: 120,
                          height: 64,
                          borderRadius: 8,
                          background: "#e8eeee",
                          backgroundImage: preview ? `url(${preview})` : undefined,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }}
                      />
                    </td>
                    <td>
                      <div style={{ fontWeight: 700 }}>{item.title}</div>
                      <div className="muted" style={{ fontSize: 13 }}>
                        {item.subtitle || "—"}
                      </div>
                      <div className="muted" style={{ fontSize: 12 }}>
                        Order {item.sortOrder ?? 0}
                      </div>
                    </td>
                    <td>
                      {item.linkTarget}
                      {item.linkUrl ? ` · ${item.linkUrl}` : ""}
                    </td>
                    <td>
                      <span
                        className={`badge ${item.isActive ? "badge-active" : "badge-rejected"}`}
                      >
                        {item.isActive ? "active" : "hidden"}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button
                          className="btn btn-ghost"
                          onClick={() => {
                            setEditingId(item._id);
                            setForm({
                              title: item.title,
                              subtitle: item.subtitle || "",
                              imageUrl: item.imageUrl,
                              publicId: item.publicId || "",
                              linkTarget: item.linkTarget || "none",
                              linkUrl: item.linkUrl || "",
                              sortOrder: item.sortOrder || 0,
                              isActive: item.isActive !== false,
                            });
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={async () => {
                            if (!confirm("Delete this banner?")) return;
                            await deleteBanner(item._id);
                            await load();
                          }}
                        >
                          Remove
                        </button>
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

const labelStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  marginBottom: 6,
};

const inputStyle: CSSProperties = {
  width: "100%",
  height: 40,
  borderRadius: 8,
  border: "1px solid var(--border)",
  padding: "0 10px",
};
