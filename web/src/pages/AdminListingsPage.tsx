import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "../components/AdminLayout";
import { useAuth } from "../context/AuthContext";
import { getAdminListings } from "../api/admin";
import { updateListing } from "../api/listings";
import { ApiError } from "../api/apiError";
import type { Listing } from "../api/types";
import "./AdminUsersPage.css";

const STATUS_FILTERS = ["all", "pending_review", "active", "inactive", "archived"] as const;

export function AdminListingsPage() {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || user.role !== "admin") {
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    setIsLoading(true);

    getAdminListings(statusFilter === "all" ? undefined : statusFilter)
      .then((data) => {
        if (!cancelled) setListings(data);
      })
      .catch(() => {
        if (!cancelled) setLoadError("Couldn't load listings right now.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user, statusFilter]);

  async function handleStatusChange(listing: Listing, status: string) {
    setActionError(null);
    setBusyId(listing.id);
    try {
      const updated = await updateListing(listing.id, {
        status: status as "draft" | "pending_review" | "active" | "inactive" | "archived",
      });
      setListings((prev) => prev.map((l) => (l.id === listing.id ? { ...l, status: updated.status } : l)));
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Couldn't update this listing.");
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
      <div className="admin-filter-row">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            type="button"
            className={`admin-filter-pill${statusFilter === s ? " admin-filter-pill--active" : ""}`}
            onClick={() => setStatusFilter(s)}
          >
            {s.replace("_", " ")}
          </button>
        ))}
      </div>

      {isLoading && <p className="admin-status">Loading listings…</p>}
      {!isLoading && loadError && <p className="admin-status admin-status--error">{loadError}</p>}
      {actionError && <p className="admin-status admin-status--error">{actionError}</p>}

      {!isLoading && !loadError && listings.length === 0 && (
        <p className="admin-status">No listings match this filter.</p>
      )}

      {!isLoading && !loadError && listings.length > 0 && (
        <div className="admin-table">
          <div className="admin-table__head" style={{ gridTemplateColumns: "1.6fr 1fr 1fr 1fr 1fr" }}>
            <span>Listing</span>
            <span>Owner</span>
            <span>Type</span>
            <span>Status</span>
            <span></span>
          </div>

          {listings.map((listing) => (
            <div className="admin-table__row" key={listing.id} style={{ gridTemplateColumns: "1.6fr 1fr 1fr 1fr 1fr" }}>
              <Link to={`/listings/${listing.id}`} className="admin-table__name">
                {listing.title}
              </Link>
              <span className="admin-table__contact">
                {listing.owner?.fullName ?? "—"}
                {listing.owner?.phoneNumber && <><br />{listing.owner.phoneNumber}</>}
              </span>
              <span style={{ textTransform: "capitalize" }}>{listing.type}</span>
              <span>
                <select
                  value={listing.status}
                  disabled={busyId === listing.id}
                  onChange={(e) => handleStatusChange(listing, e.target.value)}
                >
                  <option value="pending_review">Pending review</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="archived">Archived</option>
                </select>
              </span>
              <span />
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
