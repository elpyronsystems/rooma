import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../api/apiError";
import "./OAuthButtons.css";

// Loaded at build time — leave blank in .env to hide that provider's
// button entirely rather than show one that can't work yet.
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
const MICROSOFT_CLIENT_ID = import.meta.env.VITE_MICROSOFT_CLIENT_ID || "";

// Google Identity Services attaches itself to window at runtime — no
// official npm types for the global, so this stays intentionally loose
// rather than hand-typing their whole SDK surface.
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (response: { credential: string }) => void }) => void;
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

interface OAuthButtonsProps {
  redirectTo?: string;
}

export function OAuthButtons({ redirectTo }: OAuthButtonsProps) {
  const { loginWithOAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [msLoading, setMsLoading] = useState(false);

  const target = redirectTo ?? (location.state as { redirectTo?: string } | null)?.redirectTo ?? "/";

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    function initGoogle() {
      if (!window.google || !googleButtonRef.current) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response) => {
          setError(null);
          try {
            await loginWithOAuth("google", response.credential);
            navigate(target, { replace: true });
          } catch (err) {
            setError(err instanceof ApiError ? err.message : "Couldn't sign in with Google.");
          }
        },
      });
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "outline",
        size: "large",
        width: 300,
      });
    }

    if (window.google) {
      initGoogle();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = initGoogle;
    document.body.appendChild(script);
  }, [loginWithOAuth, navigate, target]);

  async function handleMicrosoftLogin() {
    if (!MICROSOFT_CLIENT_ID) return;
    setError(null);
    setMsLoading(true);
    try {
      const { PublicClientApplication } = await import("@azure/msal-browser");
      const msalInstance = new PublicClientApplication({
        auth: {
          clientId: MICROSOFT_CLIENT_ID,
          authority: "https://login.microsoftonline.com/common",
          redirectUri: window.location.origin,
        },
      });
      await msalInstance.initialize();
      const result = await msalInstance.loginPopup({ scopes: ["openid", "profile", "email"] });
      if (!result.idToken) throw new Error("No ID token returned from Microsoft");
      await loginWithOAuth("microsoft", result.idToken);
      navigate(target, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't sign in with Microsoft.");
    } finally {
      setMsLoading(false);
    }
  }

  if (!GOOGLE_CLIENT_ID && !MICROSOFT_CLIENT_ID) return null;

  return (
    <div className="oauth-buttons">
      <div className="oauth-buttons__divider">
        <span>or continue with</span>
      </div>

      {error && <div className="form-error">{error}</div>}

      <div className="oauth-buttons__row">
        {GOOGLE_CLIENT_ID && <div ref={googleButtonRef} className="oauth-buttons__google" />}

        {MICROSOFT_CLIENT_ID && (
          <button
            type="button"
            className="oauth-buttons__microsoft"
            onClick={handleMicrosoftLogin}
            disabled={msLoading}
          >
            <svg viewBox="0 0 21 21" width="18" height="18">
              <rect x="1" y="1" width="9" height="9" fill="#f25022" />
              <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
              <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
              <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
            </svg>
            {msLoading ? "Signing in…" : "Continue with Microsoft"}
          </button>
        )}
      </div>
    </div>
  );
}
