import { useState, type FormEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthLayout } from "../components/AuthLayout";
import { verifyOtp } from "../api/auth";
import { ApiError } from "../api/apiError";
import "./AuthForms.css";

interface LocationState {
  userId: string;
  phoneNumber: string;
}

export function OtpVerificationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;

  const [code, setCode] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // If someone lands here directly without signing up first, there's no
  // userId to verify against — send them back to start properly.
  if (!state?.userId) {
    navigate("/signup", { replace: true });
    return null;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    if (code.trim().length !== 6) {
      setFormError("Enter the 6-digit code");
      return;
    }

    setIsLoading(true);
    try {
      await verifyOtp(state!.userId, code.trim());
      navigate("/login", { replace: true, state: { justVerified: true } });
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthLayout>
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Verify your phone</h2>
        <p className="auth-form__intro">We sent a 6-digit code to {state.phoneNumber}.</p>

        <div className="auth-form__fields">
          <div className="field">
            <label htmlFor="code">Verification code</label>
            <input
              id="code"
              className="otp-input"
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              required
            />
          </div>
        </div>

        {formError && <div className="form-error">{formError}</div>}

        <button className="btn-primary" type="submit" disabled={isLoading}>
          {isLoading ? "Verifying…" : "Verify"}
        </button>
      </form>
    </AuthLayout>
  );
}
