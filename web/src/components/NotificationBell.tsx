import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getMyBookings, getOwnerBookings } from "../api/bookings";
import type { Booking } from "../api/types";
import "./NotificationBell.css";

const OWNER_ROLES = ["landlord", "agent", "hotel_manager", "admin"];
const POLL_INTERVAL_MS = 60000;

export function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<Booking[]>([]);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    if (!user) return;

    const owner = OWNER_ROLES.includes(user.role);
    setIsOwner(owner);

    async function load() {
      try {
        if (owner) {
          const bookings = await getOwnerBookings();
          setItems(bookings.filter((b) => b.status === "pending"));
        } else {
          const bookings = await getMyBookings();
          // Surface bookings that have moved out of "pending" — the
          // seeker hasn't necessarily seen the outcome yet.
          setItems(bookings.filter((b) => b.status === "confirmed" || b.status === "rejected"));
        }
      } catch {
        // Silently skip a failed poll — the bell just won't update this cycle.
      }
    }

    load();
    const timer = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [user]);

  if (!user) return null;

  function handleItemClick() {
    setIsOpen(false);
    navigate(isOwner ? "/owner/bookings" : "/bookings");
  }

  return (
    <div className="notification-bell">
      <button
        className="notification-bell__trigger"
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label="Notifications"
      >
        <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
        {items.length > 0 && <span className="notification-bell__badge">{items.length > 9 ? "9+" : items.length}</span>}
      </button>

      {isOpen && (
        <div className="notification-bell__panel">
          <p className="notification-bell__title">
            {isOwner ? "Pending Booking Requests" : "Booking Updates"}
          </p>

          {items.length === 0 ? (
            <p className="notification-bell__empty">
              {isOwner ? "No pending requests right now." : "Nothing new right now."}
            </p>
          ) : (
            <div className="notification-bell__list">
              {items.slice(0, 5).map((item) => (
                <button key={item.id} type="button" className="notification-bell__item" onClick={handleItemClick}>
                  <span className={`notification-bell__dot notification-bell__dot--${item.status}`} />
                  <span>
                    {isOwner
                      ? `New request for ${item.listing?.title ?? "a listing"}`
                      : `${item.listing?.title ?? "Your booking"} was ${item.status}`}
                  </span>
                </button>
              ))}
            </div>
          )}

          <button type="button" className="notification-bell__view-all" onClick={handleItemClick}>
            {isOwner ? "View all requests" : "View my bookings"}
          </button>
        </div>
      )}
    </div>
  );
}
