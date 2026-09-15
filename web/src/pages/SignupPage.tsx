import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthLayout } from "../components/AuthLayout";
import { PasswordField } from "../components/PasswordField";
import { OAuthButtons } from "../components/OAuthButtons";
import { signup } from "../api/auth";
import { ApiError } from "../api/apiError";
import type { UserRole } from "../api/types";
import "./AuthForms.css";

const PHONE_PATTERN = /^0\d{9}$/;

// "admin" is intentionally excluded here — matches the backend's
// validation, which never allows a signup request to self-assign admin access.
const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "seeker", label: "Seeker (student, traveller, home buyer)" },
  { value: "landlord", label: "Landlord" },
  { value: "agent", label: "Agent" },
  { value: "hotel_manager", label: "Hotel Manager" },
];

export function SignupPage() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("seeker");

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  function validate(): boolean {
    const errors: Record<string, string> = {};

    if (fullName.trim().length < 2) errors.fullName = "Enter your full name";
    if (!PHONE_PATTERN.test(phoneNumber.trim())) {
      errors.phoneNumber = "Enter a valid 10-digit number, e.g. 0244000000";
    }
    if (password.length < 8) errors.password = "Password must be at least 8 characters";

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    if (!validate()) return;

    setIsLoading(true);
    try {
      const userId = await signup({
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
        password,
        email: email.trim() || undefined,
        role,
      });
      navigate("/verify", { state: { userId, phoneNumber: phoneNumber.trim() } });
    } catch (err) {
      if (err instanceof ApiError && err.issues && err.issues.length > 0) {
        const backendErrors: Record<string, string> = {};
        for (const issue of err.issues) {
          backendErrors[issue.field] = issue.message;
        }
        setFieldErrors((prev) => ({ ...prev, ...backendErrors }));
      } else {
        setFormError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthLayout>
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Create your account</h2>
        <p className="auth-form__intro">It only takes a minute.</p>

        <div className="auth-form__fields">
          <div className="field">
            <label htmlFor="fullName">Full name</label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
            {fieldErrors.fullName && <span className="field__error">{fieldErrors.fullName}</span>}
          </div>

          <div className="field">
            <label htmlFor="phoneNumber">Phone number</label>
            <input
              id="phoneNumber"
              type="tel"
              placeholder="0244000000"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
            />
            {fieldErrors.phoneNumber && <span className="field__error">{fieldErrors.phoneNumber}</span>}
          </div>

          <div className="field">
            <label htmlFor="email">Email (optional)</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <PasswordField id="password" value={password} onChange={setPassword} required />
            <span className="field__hint">At least 8 characters</span>
            {fieldErrors.password && <span className="field__error">{fieldErrors.password}</span>}
          </div>

          <div className="field">
            <label htmlFor="role">I am a...</label>
            <select id="role" value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {formError && <div className="form-error">{formError}</div>}

        <button className="btn-primary" type="submit" disabled={isLoading}>
          {isLoading ? "Creating account…" : "Sign up"}
        </button>

        <p className="auth-form__switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>

        <OAuthButtons />
      </form>
    </AuthLayout>
  );
}
