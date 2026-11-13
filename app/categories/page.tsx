"use client";

import { FormEvent, useEffect, useMemo, useState, type CSSProperties } from "react";
import { AdminShell } from "@/components/AdminShell";
import {
  approveCategory,
  createCategory,
  deleteCategory,
  fetchActiveCategories,
  fetchAdminCategories,
  mediaUrl,
  mergeCategory,
  updateCategory,
  uploadCategoryIcon,
  type CategoryItem,
} from "@/lib/api";

type FlatCategory = { _id: string; name: string; path: string };

function flattenCategories(
  cats: Array<{
    _id: string;
    name: string;
    children?: Array<{ _id: string; name: string; children?: never[] }>;
  }>,
  prefix = ""
): FlatCategory[] {
  const out: FlatCategory[] = [];
  for (const cat of cats) {
    const path = prefix ? `${prefix} / ${cat.name}` : cat.name;
    out.push({ _id: cat._id, name: cat.name, path });
    if (cat.children?.length) {
      out.push(
        ...flattenCategories(
          cat.children as Array<{
            _id: string;
            name: string;
            children?: Array<{ _id: string; name: string }>;
          }>,
          path
        )
      );
    }
  }
  return out;
}

function isImageIcon(icon?: string) {
  if (!icon) return false;
  return (
    icon.startsWith("http://") ||
    icon.startsWith("https://") ||
    icon.startsWith("/uploads/") ||
    icon.includes("res.cloudinary.com")
  );
}

export default function CategoriesPage() {
  const [tab, setTab] = useState<"all" | "requests">("all");
  const [pending, setPending] = useState<CategoryItem[]>([]);
  const [allCats, setAllCats] = useState<CategoryItem[]>([]);
  const [targets, setTargets] = useState<FlatCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [mergeMap, setMergeMap] = useState<Record<string, string>>({});
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  const [editing, setEditing] = useState<CategoryItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editIconKey, setEditIconKey] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [pendingRes, allRes, tree] = await Promise.all([
        fetchAdminCategories(true),
        fetchAdminCategories(false),
        fetchActiveCategories(),
      ]);
      setPending(pendingRes.items);
      setAllCats(
        allRes.items
          .filter((c) => !c.isPending)
          .sort((a, b) => {
            const ao = a.sortOrder ?? 0;
            const bo = b.sortOrder ?? 0;
            if (ao !== bo) return ao - bo;
            return a.name.localeCompare(b.name);
          })
      );
      setTargets(flattenCategories(tree.categories));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const emptyPending = useMemo(
    () => !loading && pending.length === 0,
    [loading, pending.length]
  );

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusyId("create");
    try {
      await createCategory({
        name: name.trim(),
        parentId: parentId || undefined,
      });
      setName("");
      setParentId("");
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Create failed");
    } finally {
      setBusyId("");
    }
  };

  const openEdit = (item: CategoryItem) => {
    setEditing(item);
    setEditName(item.name);
    setEditIconKey(isImageIcon(item.icon) ? "" : item.icon || "");
  };

  const saveEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setBusyId(editing._id);
    try {
      const payload: { name?: string; icon?: string; iconPublicId?: string } = {
        name: editName.trim(),
      };
      if (editIconKey.trim()) {
        payload.icon = editIconKey.trim();
        payload.iconPublicId = "";
      }
      await updateCategory(editing._id, payload);
      setEditing(null);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusyId("");
    }
  };

  const onUploadLogo = async (file?: File | null) => {
    if (!editing || !file) return;
    setBusyId(editing._id);
    try {
      const res = await uploadCategoryIcon(editing._id, file);
      setEditing(res.category);
      setEditIconKey("");
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Logo upload failed");
    } finally {
      setBusyId("");
    }
  };

  return (
    <AdminShell>
      <h1 style={{ marginTop: 0 }}>Categories</h1>
      <p className="muted" style={{ marginTop: -4 }}>
        Add or remove marketplace categories, edit logos, and review user requests.
      </p>

      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <button
          className={`btn ${tab === "all" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setTab("all")}
        >
          All categories
        </button>
        <button
          className={`btn ${tab === "requests" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setTab("requests")}
        >
          Requests ({pending.length})
        </button>
      </div>

      {error ? <p style={{ color: "var(--danger)" }}>{error}</p> : null}

      {tab === "all" ? (
        <>
          <form
            className="card"
            onSubmit={onCreate}
            style={{ marginTop: 18, padding: 18, display: "grid", gap: 12 }}
          >
            <strong>Add category</strong>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <input
                style={inputStyle}
                placeholder="Category name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <select
                style={inputStyle}
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
              >
                <option value="">Top level</option>
                {targets.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.path}
                  </option>
                ))}
              </select>
            </div>
            <button className="btn btn-primary" type="submit" disabled={busyId === "create"}>
              Add category
            </button>
          </form>

          {editing ? (
            <form
              className="card"
              onSubmit={saveEdit}
              style={{ marginTop: 18, padding: 18, display: "grid", gap: 12 }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  alignItems: "center",
                }}
              >
                <strong>Edit logo · {editing.name}</strong>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setEditing(null)}
                >
                  Close
                </button>
              </div>
              <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 16,
                    background: "#e8eeee",
                    backgroundImage: isImageIcon(editing.icon)
                      ? `url(${mediaUrl(editing.icon)})`
                      : undefined,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    display: "grid",
                    placeItems: "center",
                    fontWeight: 800,
                    color: "var(--muted)",
                  }}
                >
                  {!isImageIcon(editing.icon) ? (editing.icon || "•") : null}
                </div>
                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>Upload logo image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => onUploadLogo(e.target.files?.[0])}
                  />
                  <span className="muted" style={{ fontSize: 12 }}>
                    Saved to Cloudinary and shown on Home / listings.
                  </span>
                </label>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <label>
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Name</div>
                  <input
                    style={inputStyle}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                  />
                </label>
                <label>
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                    Icon key fallback (optional)
                  </div>
                  <input
                    style={inputStyle}
                    placeholder="e.g. car, smartphone"
                    value={editIconKey}
                    onChange={(e) => setEditIconKey(e.target.value)}
                  />
                </label>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled={busyId === editing._id}
                >
                  Save changes
                </button>
                {isImageIcon(editing.icon) ? (
                  <button
                    type="button"
                    className="btn btn-danger"
                    disabled={busyId === editing._id}
                    onClick={async () => {
                      setBusyId(editing._id);
                      try {
                        await updateCategory(editing._id, {
                          icon: "",
                          iconPublicId: "",
                        });
                        setEditing({ ...editing, icon: "", iconPublicId: "" });
                        await load();
                      } catch (err) {
                        alert(err instanceof Error ? err.message : "Remove failed");
                      } finally {
                        setBusyId("");
                      }
                    }}
                  >
                    Remove logo
                  </button>
                ) : null}
              </div>
            </form>
          ) : null}

          <div className="card" style={{ marginTop: 18, overflow: "auto" }}>
            {loading ? (
              <p style={{ padding: 20 }} className="muted">
                Loading…
              </p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Logo</th>
                    <th>Name</th>
                    <th>Parent</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allCats.map((item) => {
                    const logo = isImageIcon(item.icon)
                      ? mediaUrl(item.icon)
                      : undefined;
                    return (
                      <tr key={item._id}>
                        <td>
                          <div
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: 10,
                              background: "#e8eeee",
                              backgroundImage: logo ? `url(${logo})` : undefined,
                              backgroundSize: "cover",
                              backgroundPosition: "center",
                              display: "grid",
                              placeItems: "center",
                              fontSize: 11,
                              fontWeight: 700,
                              color: "var(--muted)",
                            }}
                          >
                            {!logo ? item.icon || "—" : null}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 700 }}>{item.name}</div>
                          <div className="muted" style={{ fontSize: 12 }}>
                            {item.slug}
                          </div>
                        </td>
                        <td>{item.parent?.name || "Top level"}</td>
                        <td>
                          <span
                            className={`badge ${item.isActive ? "badge-active" : "badge-rejected"}`}
                          >
                            {item.isActive ? "active" : "inactive"}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <button
                              className="btn btn-accent"
                              disabled={busyId === item._id}
                              onClick={() => openEdit(item)}
                            >
                              Edit logo
                            </button>
                            <button
                              className="btn btn-ghost"
                              disabled={busyId === item._id}
                              onClick={async () => {
                                setBusyId(item._id);
                                try {
                                  await updateCategory(item._id, {
                                    isActive: !item.isActive,
                                  });
                                  await load();
                                } catch (err) {
                                  alert(
                                    err instanceof Error ? err.message : "Update failed"
                                  );
                                } finally {
                                  setBusyId("");
                                }
                              }}
                            >
                              {item.isActive ? "Disable" : "Enable"}
                            </button>
                            <button
                              className="btn btn-danger"
                              disabled={busyId === item._id}
                              onClick={async () => {
                                if (!confirm(`Delete category "${item.name}"?`)) return;
                                setBusyId(item._id);
                                try {
                                  await deleteCategory(item._id);
                                  await load();
                                } catch (err) {
                                  alert(
                                    err instanceof Error ? err.message : "Delete failed"
                                  );
                                } finally {
                                  setBusyId("");
                                }
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
        </>
      ) : (
        <div className="card" style={{ marginTop: 18, overflow: "auto" }}>
          {loading ? (
            <p style={{ padding: 20 }} className="muted">
              Loading…
            </p>
          ) : emptyPending ? (
            <p style={{ padding: 20 }} className="muted">
              No pending category requests.
            </p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Requested</th>
                  <th>By</th>
                  <th>Parent</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pending.map((item) => (
                  <tr key={item._id}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{item.name}</div>
                      <div className="muted" style={{ fontSize: 12 }}>
                        {item.slug}
                      </div>
                    </td>
                    <td>
                      <div>{item.requestedBy?.name || "User"}</div>
                      <div className="muted" style={{ fontSize: 12 }}>
                        {item.requestedBy?.phone || item.requestedBy?.email || "—"}
                      </div>
                    </td>
                    <td>{item.parent?.name || "Top level"}</td>
                    <td>
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          flexWrap: "wrap",
                          alignItems: "center",
                        }}
                      >
                        <button
                          className="btn btn-accent"
                          disabled={busyId === item._id}
                          onClick={async () => {
                            setBusyId(item._id);
                            try {
                              await approveCategory(item._id);
                              await load();
                            } catch (err) {
                              alert(
                                err instanceof Error ? err.message : "Approve failed"
                              );
                            } finally {
                              setBusyId("");
                            }
                          }}
                        >
                          Approve
                        </button>
                        <select
                          value={mergeMap[item._id] || ""}
                          onChange={(e) =>
                            setMergeMap((prev) => ({
                              ...prev,
                              [item._id]: e.target.value,
                            }))
                          }
                          style={{ ...inputStyle, minWidth: 180 }}
                        >
                          <option value="">Merge into…</option>
                          {targets.map((t) => (
                            <option key={t._id} value={t._id}>
                              {t.path}
                            </option>
                          ))}
                        </select>
                        <button
                          className="btn btn-ghost"
                          disabled={busyId === item._id || !mergeMap[item._id]}
                          onClick={async () => {
                            const target = mergeMap[item._id];
                            if (!target) return;
                            setBusyId(item._id);
                            try {
                              await mergeCategory(item._id, target);
                              await load();
                            } catch (err) {
                              alert(
                                err instanceof Error ? err.message : "Merge failed"
                              );
                            } finally {
                              setBusyId("");
                            }
                          }}
                        >
                          Merge
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </AdminShell>
  );
}

const inputStyle: CSSProperties = {
  width: "100%",
  height: 40,
  borderRadius: 8,
  border: "1px solid var(--border)",
  padding: "0 10px",
};
