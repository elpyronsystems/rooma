import type { ReactNode } from "react";
import { Navbar } from "./Navbar";
import "./AuthLayout.css";

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <>
      <Navbar />
      <div className="auth-layout">
        <div className="auth-layout__panel">
          <div className="auth-layout__glow auth-layout__glow--one" aria-hidden="true" />
          <div className="auth-layout__glow auth-layout__glow--two" aria-hidden="true" />
          <div className="auth-layout__pattern" aria-hidden="true">
            <svg viewBox="0 0 200 400" preserveAspectRatio="none">
              {Array.from({ length: 10 }).map((_, row) =>
                Array.from({ length: 5 }).map((_, col) => (
                  <rect
                    key={`${row}-${col}`}
                    x={col * 40}
                    y={row * 40}
                    width={40}
                    height={40}
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.18)"
                    strokeWidth={1}
                    transform={`rotate(45 ${col * 40 + 20} ${row * 40 + 20})`}
                  />
                ))
              )}
            </svg>
          </div>
          <div className="auth-layout__panel-content fade-in-up">
            <span className="auth-layout__wordmark">Rooma</span>
            <h1 className="auth-layout__headline">
              Find your next
              <br />
              place to stay
            </h1>
            <p className="auth-layout__subhead">
              Hostels, hotels, rentals, and homes for sale — one place to search across
              Ghana.
            </p>
            <div className="auth-layout__badges">
              <span className="auth-layout__badge">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 13l4 4L19 7" />
                </svg>
                Verified listings
              </span>
              <span className="auth-layout__badge">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2 4 5v6c0 5 3.4 8.4 8 11 4.6-2.6 8-6 8-11V5l-8-3Z" />
                </svg>
                Secure booking
              </span>
            </div>
          </div>
        </div>

        <div className="auth-layout__form-side">
          <div className="auth-layout__form-wrap fade-in-up">{children}</div>
        </div>
      </div>
    </>
  );
}
