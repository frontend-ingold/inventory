import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { MnsLogo } from "../components/MnsLogo";
import { useAuth } from "../context/AuthContext";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState("avijit@gmail.com");
  const [password, setPassword] = useState("12345678");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const redirectPath = location.state?.from?.pathname || "/dashboard";

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      await login(email, password);
      navigate(redirectPath, { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-hero">
        <MnsLogo />
        <h2>Inventory management for purchasing, sales, and stock control.</h2>
        <p>
          Sign in to access the MNS inventory workspace, manage products, and track every movement
          from purchase to sale.
        </p>
      </div>
      <div className="auth-panel">
        <div className="panel auth-card">
          <p className="eyebrow">Secure Access</p>
          <h1>Sign in to MNS</h1>
          <p className="section-description">Use the seeded admin account or your database user record.</p>
          <form className="stack-form" onSubmit={handleSubmit}>
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="username"
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
            </label>
            {error ? <div className="error-panel">{error}</div> : null}
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </form>
   
        </div>
      </div>
    </div>
  );
}
