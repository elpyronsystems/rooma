import "./BookingStatusBadge.css";

const STATUS_STYLES: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "#d97706" },
  confirmed: { label: "Confirmed", color: "#16a34a" },
  rejected: { label: "Rejected", color: "#dc2626" },
  cancelled: { label: "Cancelled", color: "#6b7280" },
  completed: { label: "Completed", color: "#2563eb" },
};

export function BookingStatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? { label: status, color: "#6b7280" };
  return (
    <span className="booking-status-badge" style={{ backgroundColor: `${style.color}1a`, color: style.color }}>
      {style.label}
    </span>
  );
}
