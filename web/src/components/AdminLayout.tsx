import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { Navbar } from "./Navbar";
import roomaLogo from "../assets/rooma-logo.png";
import "./AdminLayout.css";

const TABS = [
  { to: "/admin/users", label: "Users" },
  { to: "/admin/listings", label: "Listings" },
  { to: "/admin/documents", label: "Documents" },
  { to: "/admin/support", label: "Support Inbox" },
  { to: "/admin/analytics", label: "Analytics" },
  { to: "/admin/payout-settings", label: "Payout Settings" },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="admin-layout">
      <Navbar />

      <div className="admin-layout__hero">
        <div className="admin-layout__hero-glow" aria-hidden="true" />
        <img src={roomaLogo} alt="Rooma" className="admin-layout__hero-logo" />
        <h1 className="admin-layout__hero-title">Welcome to the Admin Panel</h1>
        <p className="admin-layout__hero-subtitle">Everything you need to keep Rooma running smoothly.</p>
      </div>

      <div className="admin-layout__header">
        <nav className="admin-layout__tabs">
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) => `admin-layout__tab${isActive ? " admin-layout__tab--active" : ""}`}
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="admin-layout__body">{children}</div>
    </div>
  );
}
