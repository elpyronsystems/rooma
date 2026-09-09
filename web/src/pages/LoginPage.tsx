import { useState, type FormEvent } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { AuthLayout } from "../components/AuthLayout";
import { PasswordField } from "../components/PasswordField";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../api/apiError";
import "./AuthForms.css";

interface LoginLocationState {
  redirectTo?: string;
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const redirectTo = (location.state as LoginLocationState | null)?.redirectTo ?? "/";

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    setIsLoading(true);
    try {
      await login(identifier.trim(), password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthLayout>
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Log in</h2>
        <p className="auth-form__intro">Welcome back — enter your details to continue.</p>

        <div className="auth-form__fields">
          <div className="field">
            <label htmlFor="identifier">Phone number, email, or full name</label>
            <input
              id="identifier"
              type="text"
              placeholder="0244000000, you@email.com, or your full name"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <PasswordField id="password" value={password} onChange={setPassword} required />
          </div>
        </div>

        {formError && <div className="form-error">{formError}</div>}

        <button className="btn-primary" type="submit" disabled={isLoading}>
          {isLoading ? "Logging in…" : "Log in"}
        </button>

        <p className="auth-form__switch">
          Don't have an account? <Link to="/signup">Sign up</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
