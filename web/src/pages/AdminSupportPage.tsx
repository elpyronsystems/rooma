import { useEffect, useState } from "react";
import { AdminLayout } from "../components/AdminLayout";
import { useAuth } from "../context/AuthContext";
import { getSupportMessages, updateSupportMessage, type SupportMessageAdmin } from "../api/admin";
import { ApiError } from "../api/apiError";
import "./AdminSupportPage.css";
import "./AdminUsersPage.css";

export function AdminSupportPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<SupportMessageAdmin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showResolved, setShowResolved] = useState(false);

  useEffect(() => {
    if (!user || user.role !== "admin") {
      setIsLoading(false);
      return;
    }
    let cancelled = false;

    getSupportMessages()
      .then((data) => {
        if (!cancelled) setMessages(data);
      })
      .catch(() => {
        if (!cancelled) setLoadError("Couldn't load support messages right now.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  async function handleToggleResolved(msg: SupportMessageAdmin) {
    setActionError(null);
    setBusyId(msg.id);
    try {
      const updated = await updateSupportMessage(msg.id, !msg.resolved);
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? updated : m)));
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Couldn't update this message.");
    } finally {
      setBusyId(null);
    }
  }

  if (!user || user.role !== "admin") {
    return (
      <AdminLayout>
        <p className="admin-status">This area is for admin accounts only.</p>
      </AdminLayout>
    );
  }

  const visible = messages.filter((m) => showResolved || !m.resolved);

  return (
    <AdminLayout>
      <label className="admin-support__toggle">
        <input type="checkbox" checked={showResolved} onChange={(e) => setShowResolved(e.target.checked)} />
        Show resolved messages
      </label>

      {isLoading && <p className="admin-status">Loading messages…</p>}
      {!isLoading && loadError && <p className="admin-status admin-status--error">{loadError}</p>}
      {actionError && <p className="admin-status admin-status--error">{actionError}</p>}

      {!isLoading && !loadError && visible.length === 0 && (
        <p className="admin-status">Nothing here right now.</p>
      )}

      <div className="admin-support-list">
        {visible.map((msg) => (
          <div className={`admin-support-card${msg.resolved ? " admin-support-card--resolved" : ""}`} key={msg.id}>
            <div className="admin-support-card__head">
              <div>
                <p className="admin-support-card__subject">{msg.subject}</p>
                <p className="admin-support-card__meta">
                  {msg.fullName} · {msg.email}
                  {msg.phoneNumber && ` · ${msg.phoneNumber}`}
                </p>
              </div>
              <span className="admin-support-card__category">{msg.category.replace(/_/g, " ")}</span>
            </div>

            <p className="admin-support-card__message">{msg.message}</p>

            <div className="admin-support-card__footer">
              <span className="admin-support-card__date">
                {new Date(msg.createdAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
              <button
                type="button"
                className="admin-table__action"
                disabled={busyId === msg.id}
                onClick={() => handleToggleResolved(msg)}
              >
                {msg.resolved ? "Mark unresolved" : "Mark resolved"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
