import { useEffect, useState } from "react";
import { AdminLayout } from "../components/AdminLayout";
import { useAuth } from "../context/AuthContext";
import { getAnalytics, type AdminAnalytics } from "../api/admin";
import "./AdminAnalyticsPage.css";

function BarList({ items }: { items: { label: string; count: number }[] }) {
  const max = Math.max(1, ...items.map((i) => i.count));
  return (
    <div className="analytics-barlist">
      {items.map((item) => (
        <div className="analytics-barlist__row" key={item.label}>
          <span className="analytics-barlist__label">{item.label.replace(/_/g, " ")}</span>
          <div className="analytics-barlist__track">
            <div className="analytics-barlist__fill" style={{ width: `${(item.count / max) * 100}%` }} />
          </div>
          <span className="analytics-barlist__count">{item.count}</span>
        </div>
      ))}
    </div>
  );
}

function MiniChart({ data, label }: { data: { date: string; count: number }[]; label: string }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="analytics-minichart">
      <p className="analytics-card__title">{label}</p>
      <div className="analytics-minichart__bars">
        {data.map((d) => (
          <div
            key={d.date}
            className="analytics-minichart__bar"
            style={{ height: `${(d.count / max) * 100}%` }}
            title={`${d.date}: ${d.count}`}
          />
        ))}
      </div>
    </div>
  );
}

export function AdminAnalyticsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<AdminAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || user.role !== "admin") {
      setIsLoading(false);
      return;
    }
    let cancelled = false;

    getAnalytics()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch(() => {
        if (!cancelled) setLoadError("Couldn't load analytics right now.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user || user.role !== "admin") {
    return (
      <AdminLayout>
        <p className="admin-status">This area is for admin accounts only.</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {isLoading && <p className="admin-status">Loading analytics…</p>}
      {!isLoading && loadError && <p className="admin-status admin-status--error">{loadError}</p>}

      {!isLoading && !loadError && data && (
        <>
          <div className="analytics-summary-grid">
            <div className="analytics-summary-card">
              <p className="analytics-summary-card__value">{data.totalUsers}</p>
              <p className="analytics-summary-card__label">Total Users</p>
            </div>
            <div className="analytics-summary-card">
              <p className="analytics-summary-card__value">{data.totalListings}</p>
              <p className="analytics-summary-card__label">Total Listings</p>
            </div>
            <div className="analytics-summary-card">
              <p className="analytics-summary-card__value">{data.totalBookings}</p>
              <p className="analytics-summary-card__label">Total Bookings</p>
            </div>
            <div className="analytics-summary-card">
              <p className="analytics-summary-card__value">{data.unresolvedSupportMessages}</p>
              <p className="analytics-summary-card__label">Unresolved Support</p>
            </div>
          </div>

          <div className="analytics-charts-row">
            <MiniChart data={data.signupsLast30Days} label="Signups — last 30 days" />
            <MiniChart data={data.bookingsLast30Days} label="Bookings — last 30 days" />
          </div>

          <div className="analytics-cards-grid">
            <div className="analytics-card">
              <p className="analytics-card__title">Users by Role</p>
              <BarList items={data.usersByRole.map((r) => ({ label: r.role, count: r.count }))} />
            </div>
            <div className="analytics-card">
              <p className="analytics-card__title">Listings by Type</p>
              <BarList items={data.listingsByType.map((r) => ({ label: r.type, count: r.count }))} />
            </div>
            <div className="analytics-card">
              <p className="analytics-card__title">Listings by Status</p>
              <BarList items={data.listingsByStatus.map((r) => ({ label: r.status, count: r.count }))} />
            </div>
            <div className="analytics-card">
              <p className="analytics-card__title">Bookings by Status</p>
              <BarList items={data.bookingsByStatus.map((r) => ({ label: r.status, count: r.count }))} />
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
