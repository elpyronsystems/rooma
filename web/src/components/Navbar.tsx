import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { NotificationBell } from "./NotificationBell";
import roomaLogo from "../assets/rooma-logo.png";
import "./Navbar.css";

const NAV_LINKS = [
  { label: "Home", to: "/" },
  { label: "Explore", to: "/explore" },
  { label: "Properties", to: "/properties" },
  { label: "Hotels", to: "/hotels" },
  { label: "Hostels", to: "/hostels" },
  { label: "For Institutions", to: "/institutions" },
  { label: "For C-Suite", to: "/c-suite" },
  { label: "About Us", to: "/about" },
];

const OWNER_ROLES = ["landlord", "agent", "hotel_manager", "admin"];

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  function handleLogout() {
    setMenuOpen(false);
    logout();
    navigate("/");
  }

  function goTo(path: string) {
    setMenuOpen(false);
    setMobileNavOpen(false);
    navigate(path);
  }

  return (
    <header className="navbar">
      <button
        className="navbar__hamburger"
        type="button"
        aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
        onClick={() => setMobileNavOpen((open) => !open)}
      >
        {mobileNavOpen ? (
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        )}
      </button>

      <Link to="/" className="navbar__brand" onClick={() => setMobileNavOpen(false)}>
        <img src={roomaLogo} alt="Rooma" className="navbar__logo-img" />
      </Link>

      <nav className="navbar__links">
        {NAV_LINKS.map((link) => (
          <Link key={link.to} to={link.to} className="navbar__link">
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="navbar__actions">
        <Link to="/support" className="navbar__icon-btn" aria-label="Support &amp; Contact">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M4 13v-1a8 8 0 0 1 16 0v1" />
            <rect x="2" y="13" width="4" height="6" rx="2" />
            <rect x="18" y="13" width="4" height="6" rx="2" />
            <path d="M18 19v1a3 3 0 0 1-3 3h-2" />
          </svg>
        </Link>
        <button className="navbar__lang" type="button">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="9" />
            <path d="M3 12h18M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18Z" />
          </svg>
          EN
        </button>

        {user ? (
          <>
            <NotificationBell />
            <Link to="/saved" className="navbar__icon-btn" aria-label="Saved listings">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 21s-7.5-4.6-10-9.1C.6 8.4 2.4 5 6 5c2 0 3.6 1.1 4.5 2.4C11.4 6.1 13 5 15 5c3.6 0 5.4 3.4 4 6.9C19.5 16.4 12 21 12 21Z" />
              </svg>
            </Link>

            <div className="navbar__user-wrap">
              <button
                className="navbar__user"
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
              >
                <div className="navbar__avatar">{user.fullName.charAt(0).toUpperCase()}</div>
                <span>Hello, {user.fullName.split(" ")[0]}</span>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>

              {menuOpen && (
                <div className="navbar__dropdown">
                  <button type="button" onClick={() => goTo("/bookings")}>
                    My Bookings
                  </button>

                  {OWNER_ROLES.includes(user.role) ? (
                    <>
                      <button type="button" onClick={() => goTo("/saved")}>
                        Saved Listings
                      </button>
                      <button type="button" onClick={() => goTo("/owner/bookings")}>
                        Booking Requests
                      </button>
                      <button type="button" onClick={() => goTo("/owner/payments")}>
                        Confirmed Payments
                      </button>
                      <button type="button" onClick={() => goTo("/listings/mine")}>
                        My Listings
                      </button>
                      <button type="button" onClick={() => goTo("/listings/new")}>
                        Create Listing
                      </button>
                      <button type="button" onClick={() => goTo("/owner/contact")}>
                        Contact Us
                      </button>
                      <button type="button" onClick={() => goTo("/owner/payout-settings")}>
                        Payout Settings
                      </button>
                      {user.role === "admin" && (
                        <button type="button" onClick={() => goTo("/admin")}>
                          Admin Panel
                        </button>
                      )}
                    </>
                  ) : (
                    <button type="button" onClick={() => goTo("/payments")}>
                      Payments
                    </button>
                  )}

                  <button type="button" className="navbar__dropdown-logout" onClick={handleLogout}>
                    Log out
                  </button>
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>

      {!user && (
        <div className="navbar__auth-buttons">
          <Link to="/login" className="btn-outline btn-outline--nav">
            Login
          </Link>
          <Link to="/signup" className="btn-primary--nav">
            Sign Up
          </Link>
        </div>
      )}

      {mobileNavOpen && (
        <nav className="navbar__mobile-panel">
          {NAV_LINKS.map((link) => (
            <Link key={link.to} to={link.to} onClick={() => setMobileNavOpen(false)}>
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
