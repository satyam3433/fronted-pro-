import { useState } from "react";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, Utensils } from "lucide-react";
import { Link } from "react-router-dom";
import { resetDemoData } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";

const DEMO_ACCOUNTS = [
  { role: "Admin", email: "admin@dinesync.demo", password: "DineSyncDemo!2026" },
  { role: "Captain", email: "captain@dinesync.demo", password: "DineSyncCaptain!2026" }
];

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function chooseDemo(account) {
    setEmail(account.email);
    setPassword(account.password);
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login({ email, password });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-story">
        <Link className="brand login-brand" to="/" aria-label="DineSync home">
          <span className="brand-mark">d</span>
          <span className="brand-copy">
            <span className="brand-name">dinesync</span>
            <span className="brand-subtitle">RESTAURANT OPS</span>
          </span>
        </Link>
        <div className="login-story-content">
        <div className="login-story-badge"><span className="online-dot" /> INTERACTIVE DEMO</div>
          <h1>Make every<br /><em>service feel</em><br />in sync.</h1>
          <p>One calm workspace to keep your floor moving, your team aligned, and every bill in balance.</p>
          <div className="login-story-stats">
            <div><strong>01</strong><span>Know your floor</span></div>
            <div><strong>02</strong><span>Stay on top of orders</span></div>
            <div><strong>03</strong><span>Close every bill right</span></div>
          </div>
        </div>
        <div className="login-story-footer"><span>DINING, WELL ORCHESTRATED</span><span>© DineSync</span></div>
      </section>
      <section className="login-form-side">
        <div className="login-mobile-brand">
          <span className="brand-mark">d</span><span className="brand-name">dinesync</span>
        </div>
        <div className="login-card">
          <div className="login-heading-icon"><Utensils size={18} /></div>
          <div className="eyebrow">WELCOME BACK</div>
          <h2>Sign in to your workspace</h2>
          <p className="login-subtitle">Choose a demo role to explore the restaurant workspace.</p>
          <div className="demo-accounts" aria-label="Demo accounts">
            {DEMO_ACCOUNTS.map(account => (
              <button className="demo-account" type="button" key={account.role} onClick={() => chooseDemo(account)}>
                <strong>{account.role} demo</strong>
                <span>{account.email}</span>
                <small>{account.password}</small>
              </button>
            ))}
          </div>
          <form className="login-form" onSubmit={handleSubmit}>
            <label className="login-field">
              <span>Email address</span>
              <span className="login-input-wrap"><Mail size={16} /><input type="email" name="email" autoComplete="username" placeholder="you@restaurant.com" value={email} onChange={event => setEmail(event.target.value)} required /></span>
            </label>
            <label className="login-field">
              <span>Password</span>
              <span className="login-input-wrap"><LockKeyhole size={16} /><input type={showPassword ? "text" : "password"} name="password" autoComplete="current-password" placeholder="Enter your password" value={password} onChange={event => setPassword(event.target.value)} required /><button className="password-toggle" type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></span>
            </label>
            {error && <div className="login-error" role="alert">{error}</div>}
            <button className="button button-primary login-submit" type="submit" disabled={submitting}>{submitting ? "Signing in…" : "Sign in"} {!submitting && <ArrowRight size={16} />}</button>
          </form>
          <div className="login-security"><LockKeyhole size={13} /><span>Demo mode · changes are saved in this browser only.</span></div>
        </div>
        <button className="demo-reset" type="button" onClick={() => { resetDemoData(); setEmail(""); setPassword(""); setError(""); }}>Reset demo data</button>
      </section>
    </main>
  );
}
