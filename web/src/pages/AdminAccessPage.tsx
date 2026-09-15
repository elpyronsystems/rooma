import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { AuthLayout } from "../components/AuthLayout";
import { PasswordField } from "../components/PasswordField";
import { useAuth } from "../context/AuthContext";
import { adminSignup } from "../api/auth";
import { ApiError } from "../api/apiError";
import "./AuthForms.css";

// This is a UI convenience gate only — it's compiled into the public
// bundle, so it isn't a secret once the site ships. Real enforcement
// happens server-side: /auth/admin-signup independently checks
// ADMIN_ACCESS_CODE before ever creating an admin-role account.
const ADMIN_ACCESS_CODE = "rooma-elpi-1";

export function AdminAccessPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [step, setStep] = useState<"gate" | "login" | "signup">("gate");
  const [codeInput, setCodeInput] = useState("");
  const [gateError, setGateError] = useState<string | null>(null);

  // Login fields
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  // Signup fields
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function handleGateSubmit(event: FormEvent) {
    event.preventDefault();
    if (codeInput.trim() === ADMIN_ACCESS_CODE) {
      setGateError(null);
      setStep("login");
    } else {
      setGateError("Invalid access code.");
    }
  }

  async function handleLoginSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    setIsLoading(true);
    try {
      const loggedInUser = await login(identifier.trim(), password);
      if (loggedInUser.role !== "admin") {
        setFormError("This account doesn't have admin access.");
        return;
      }
      navigate("/admin", { replace: true });
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSignupSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});

    const errors: Record<string, string> = {};
    if (fullName.trim().length < 2) errors.fullName = "Enter your full name";
    if (!/^0\d{9}$/.test(phoneNumber.trim())) errors.phoneNumber = "Enter a valid 10-digit number, e.g. 0244000000";
    if (signupPassword.length < 8) errors.password = "Password must be at least 8 characters";
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsLoading(true);
    try {
      const userId = await adminSignup({
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
        password: signupPassword,
        email: email.trim() || undefined,
        accessCode: ADMIN_ACCESS_CODE,
      });
      navigate("/verify", { state: { userId, phoneNumber: phoneNumber.trim() } });
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthLayout>
      {step === "gate" && (
        <form className="auth-form" onSubmit={handleGateSubmit}>
          <h2>Admin Access</h2>
          <p className="auth-form__intro">Enter the admin access code to continue.</p>

          <div className="auth-form__fields">
            <div className="field">
              <label htmlFor="accessCode">Access code</label>
              <input
                id="accessCode"
                type="password"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                required
                autoFocus
              />
            </div>
          </div>

          {gateError && <div className="form-error">{gateError}</div>}

          <button className="btn-primary" type="submit">
            Continue
          </button>
        </form>
      )}

      {step !== "gate" && (
        <form className="auth-form" onSubmit={step === "login" ? handleLoginSubmit : handleSignupSubmit}>
          <h2>{step === "login" ? "Admin Login" : "Create Admin Account"}</h2>
          <p className="auth-form__intro">
            {step === "login" ? "Log in with an existing admin account." : "Self-provision a new admin account."}
          </p>

          {step === "login" ? (
            <div className="auth-form__fields">
              <div className="field">
                <label htmlFor="identifier">Phone number, email, or full name</label>
                <input id="identifier" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required />
              </div>
              <div className="field">
                <label htmlFor="password">Password</label>
                <PasswordField id="password" value={password} onChange={setPassword} required />
              </div>
            </div>
          ) : (
            <div className="auth-form__fields">
              <div className="field">
                <label htmlFor="fullName">Full name</label>
                <input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                {fieldErrors.fullName && <span className="field__error">{fieldErrors.fullName}</span>}
              </div>
              <div className="field">
                <label htmlFor="phoneNumber">Phone number</label>
                <input id="phoneNumber" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required />
                {fieldErrors.phoneNumber && <span className="field__error">{fieldErrors.phoneNumber}</span>}
              </div>
              <div className="field">
                <label htmlFor="email">Email (optional)</label>
                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="signupPassword">Password</label>
                <PasswordField id="signupPassword" value={signupPassword} onChange={setSignupPassword} required />
                {fieldErrors.password && <span className="field__error">{fieldErrors.password}</span>}
              </div>
            </div>
          )}

          {formError && <div className="form-error">{formError}</div>}

          <button className="btn-primary" type="submit" disabled={isLoading}>
            {isLoading ? "Please wait…" : step === "login" ? "Log in" : "Create account"}
          </button>

          <p className="auth-form__switch">
            {step === "login" ? (
              <button type="button" onClick={() => { setStep("signup"); setFormError(null); }}>
                Need to create an admin account instead?
              </button>
            ) : (
              <button type="button" onClick={() => { setStep("login"); setFormError(null); }}>
                Already have an admin account? Log in
              </button>
            )}
          </p>
        </form>
      )}
    </AuthLayout>
  );
}
