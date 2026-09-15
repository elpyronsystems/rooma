import { useEffect, useState } from "react";
import { AdminLayout } from "../components/AdminLayout";
import { useAuth } from "../context/AuthContext";
import { getUsers, updateUser, deleteUser, type AdminUser } from "../api/admin";
import { ApiError } from "../api/apiError";
import type { UserRole } from "../api/types";
import "./AdminUsersPage.css";

const ROLE_OPTIONS: UserRole[] = ["seeker", "landlord", "agent", "hotel_manager", "admin"];

export function AdminUsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || user.role !== "admin") {
      setIsLoading(false);
      return;
    }
    let cancelled = false;

    getUsers()
      .then((data) => {
        if (!cancelled) setUsers(data);
      })
      .catch(() => {
        if (!cancelled) setLoadError("Couldn't load users right now.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  async function handleRoleChange(target: AdminUser, role: UserRole) {
    setActionError(null);
    setBusyId(target.id);
    try {
      const updated = await updateUser(target.id, { role });
      setUsers((prev) => prev.map((u) => (u.id === target.id ? updated : u)));
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Couldn't update this user.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleToggleSuspend(target: AdminUser) {
    setActionError(null);
    setBusyId(target.id);
    try {
      const updated = await updateUser(target.id, { isSuspended: !target.isSuspended });
      setUsers((prev) => prev.map((u) => (u.id === target.id ? updated : u)));
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Couldn't update this user.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(target: AdminUser) {
    if (
      !window.confirm(
        `Permanently delete ${target.fullName}'s account? This can't be undone. This only works for accounts with no listings, bookings, saved listings, or reviews.`
      )
    ) {
      return;
    }

    setActionError(null);
    setBusyId(target.id);
    try {
      await deleteUser(target.id);
      setUsers((prev) => prev.filter((u) => u.id !== target.id));
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Couldn't delete this user.");
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

  return (
    <AdminLayout>
      {isLoading && <p className="admin-status">Loading users…</p>}
      {!isLoading && loadError && <p className="admin-status admin-status--error">{loadError}</p>}
      {actionError && <p className="admin-status admin-status--error">{actionError}</p>}

      {!isLoading && !loadError && (
        <div className="admin-table">
          <div className="admin-table__head">
            <span>Name</span>
            <span>Phone / Email</span>
            <span>Role</span>
            <span>Status</span>
            <span>Joined</span>
            <span></span>
          </div>

          {users.map((u) => (
            <div className="admin-table__row" key={u.id}>
              <span className="admin-table__name">{u.fullName}</span>
              <span className="admin-table__contact">
                {u.phoneNumber ?? "—"}
                {u.email && <><br />{u.email}</>}
              </span>
              <span>
                <select
                  value={u.role}
                  disabled={busyId === u.id}
                  onChange={(e) => handleRoleChange(u, e.target.value as UserRole)}
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r} value={r}>
                      {r.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </span>
              <span>
                <span className={`admin-badge${u.isSuspended ? " admin-badge--suspended" : " admin-badge--active"}`}>
                  {u.isSuspended ? "Suspended" : "Active"}
                </span>
              </span>
              <span className="admin-table__date">
                {new Date(u.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
              </span>
              <span className="admin-table__actions-group">
                <button
                  type="button"
                  className="admin-table__action"
                  disabled={busyId === u.id}
                  onClick={() => handleToggleSuspend(u)}
                >
                  {u.isSuspended ? "Reinstate" : "Suspend"}
                </button>
                <button
                  type="button"
                  className="admin-table__action admin-table__action--danger"
                  disabled={busyId === u.id}
                  onClick={() => handleDelete(u)}
                >
                  Delete
                </button>
              </span>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
