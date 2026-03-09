import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function LoginPage() {
  const { signInWithEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    try {
      setLoading(true);
      setError('');
      await signInWithEmail(email.trim(), password.trim());
      navigate('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg-shapes">
        <div className="shape shape-1" />
        <div className="shape shape-2" />
        <div className="shape shape-3" />
      </div>

      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="24" cy="24" r="22" fill="url(#logo-grad)" opacity="0.15" />
              <path
                d="M24 8C17 8 13 14 13 20C13 26 17 32 24 40C31 32 35 26 35 20C35 14 31 8 24 8Z"
                fill="url(#logo-grad)"
              />
              <defs>
                <linearGradient id="logo-grad" x1="13" y1="8" x2="35" y2="40">
                  <stop stopColor="#FF6B9D" />
                  <stop offset="1" stopColor="#C44AFF" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1>Flo Cycle</h1>
          <p>Track your cycle with confidence</p>
        </div>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit} className="email-form">
          <div className="input-group">
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="input-group">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !email.trim() || !password.trim()}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="login-footer">
          Secure & private — your data stays yours
        </p>
      </div>
    </div>
  );
}
