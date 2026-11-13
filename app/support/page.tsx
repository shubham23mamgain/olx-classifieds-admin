"use client";

import { FormEvent, useEffect, useMemo, useState, type CSSProperties } from "react";
import { AdminShell } from "@/components/AdminShell";
import {
  fetchSupportConversations,
  fetchSupportMessages,
  getAdminUser,
  markSupportRead,
  mediaUrl,
  sendSupportMessage,
  type SupportConversation,
  type SupportMessage,
} from "@/lib/api";

export default function SupportPage() {
  const [items, setItems] = useState<SupportConversation[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const active = useMemo(
    () => items.find((item) => item._id === activeId) || null,
    [items, activeId]
  );

  const loadInbox = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetchSupportConversations();
      setItems(res.items);
      if (!activeId && res.items[0]?._id) {
        setActiveId(res.items[0]._id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load support inbox");
    } finally {
      setLoading(false);
    }
  };

  const loadThread = async (id: string) => {
    if (!id) return;
    setLoadingThread(true);
    try {
      const res = await fetchSupportMessages(id);
      setMessages(res.items);
      await markSupportRead(id);
      setItems((prev) =>
        prev.map((item) =>
          item._id === id ? { ...item, sellerUnread: 0 } : item
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load messages");
    } finally {
      setLoadingThread(false);
    }
  };

  useEffect(() => {
    loadInbox();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeId) loadThread(activeId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  const onSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!activeId || !text.trim() || sending) return;
    setSending(true);
    try {
      const res = await sendSupportMessage(activeId, text.trim());
      setMessages((prev) => [...prev, res.message]);
      setText("");
      setItems((prev) => {
        const next = prev.map((item) =>
          item._id === activeId
            ? {
                ...item,
                lastMessageText: res.message.text || "",
                lastMessageAt: res.message.createdAt,
                sellerUnread: 0,
              }
            : item
        );
        return [...next].sort(
          (a, b) =>
            new Date(b.lastMessageAt || 0).getTime() -
            new Date(a.lastMessageAt || 0).getTime()
        );
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Send failed");
    } finally {
      setSending(false);
    }
  };

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
          <h1 style={{ margin: 0 }}>Support chat</h1>
          <p className="muted" style={{ marginTop: 6 }}>
            Reply to users who open Help & support from the mobile Account screen.
            History is saved permanently.
          </p>
        </div>
        <button className="btn btn-ghost" onClick={loadInbox}>
          Refresh
        </button>
      </div>

      {error ? <p style={{ color: "var(--danger)" }}>{error}</p> : null}

      <div
        className="card"
        style={{
          marginTop: 18,
          display: "grid",
          gridTemplateColumns: "320px 1fr",
          minHeight: 560,
          overflow: "hidden",
        }}
      >
        <aside style={{ borderRight: "1px solid var(--border)", overflow: "auto" }}>
          {loading ? (
            <p className="muted" style={{ padding: 16 }}>
              Loading…
            </p>
          ) : items.length === 0 ? (
            <p className="muted" style={{ padding: 16 }}>
              No support chats yet.
            </p>
          ) : (
            items.map((item) => {
              const selected = item._id === activeId;
              return (
                <button
                  key={item._id}
                  type="button"
                  onClick={() => setActiveId(item._id)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    border: "none",
                    borderBottom: "1px solid var(--border)",
                    background: selected ? "#eef6f7" : "#fff",
                    padding: 14,
                    cursor: "pointer",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <strong>{item.buyer?.name || "User"}</strong>
                    {(item.sellerUnread || 0) > 0 ? (
                      <span className="badge badge-pending">{item.sellerUnread}</span>
                    ) : null}
                  </div>
                  <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                    {item.buyer?.phone || item.buyer?.email || "—"}
                  </div>
                  <div style={{ fontSize: 13, marginTop: 6 }}>
                    {item.lastMessageText || "No messages yet"}
                  </div>
                </button>
              );
            })
          )}
        </aside>

        <section style={{ display: "grid", gridTemplateRows: "auto 1fr auto" }}>
          <div style={{ padding: 16, borderBottom: "1px solid var(--border)" }}>
            {active ? (
              <>
                <strong>{active.buyer?.name || "User"}</strong>
                <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                  {active.buyer?.phone || active.buyer?.email || "—"}
                </div>
              </>
            ) : (
              <span className="muted">Select a conversation</span>
            )}
          </div>

          <div style={{ padding: 16, overflow: "auto", background: "#f7fafb" }}>
            {loadingThread ? (
              <p className="muted">Loading messages…</p>
            ) : !activeId ? (
              <p className="muted">Pick a support chat from the left.</p>
            ) : messages.length === 0 ? (
              <p className="muted">No messages yet. Wait for the user or say hello.</p>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {messages.map((msg) => {
                  const admin = getAdminUser();
                  const adminId = admin?.id || admin?._id;
                  const mine = Boolean(
                    msg.sender?._id &&
                      (String(msg.sender._id) === String(adminId) ||
                        String(msg.sender._id) === String(active?.seller?._id))
                  );
                  const image = mediaUrl(msg.imageUrl);
                  return (
                    <div
                      key={msg._id}
                      style={{
                        justifySelf: mine ? "end" : "start",
                        maxWidth: "75%",
                        background: mine ? "var(--brand)" : "#fff",
                        color: mine ? "#fff" : "var(--text)",
                        border: mine ? "none" : "1px solid var(--border)",
                        borderRadius: 12,
                        padding: "10px 12px",
                      }}
                    >
                      {msg.type === "image" && image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={image}
                          alt="Support attachment"
                          style={{
                            width: "100%",
                            maxWidth: 240,
                            borderRadius: 8,
                            display: "block",
                            marginBottom: msg.text ? 8 : 0,
                          }}
                        />
                      ) : null}
                      {msg.text ? <div>{msg.text}</div> : null}
                      <div
                        style={{
                          marginTop: 6,
                          fontSize: 11,
                          opacity: 0.75,
                        }}
                      >
                        {new Date(msg.createdAt).toLocaleString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <form
            onSubmit={onSend}
            style={{
              display: "flex",
              gap: 8,
              padding: 14,
              borderTop: "1px solid var(--border)",
              background: "#fff",
            }}
          >
            <input
              style={inputStyle}
              placeholder={activeId ? "Reply to user…" : "Select a chat first"}
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={!activeId || sending}
            />
            <button
              className="btn btn-primary"
              type="submit"
              disabled={!activeId || sending || !text.trim()}
            >
              {sending ? "Sending…" : "Send"}
            </button>
          </form>
        </section>
      </div>
    </AdminShell>
  );
}

const inputStyle: CSSProperties = {
  flex: 1,
  height: 42,
  borderRadius: 8,
  border: "1px solid var(--border)",
  padding: "0 12px",
};
