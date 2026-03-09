import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function EmailLinkHandler() {
  const { completeSignInWithLink } = useAuth();
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const finish = async () => {
      try {
        await completeSignInWithLink(window.location.href);
        navigate('/');
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to verify email link');
      }
    };
    finish();
  }, [completeSignInWithLink, navigate]);

  if (error) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-error">{error}</div>
          <button className="btn btn-primary" onClick={() => navigate('/login')}>
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="loading-screen">
      <div className="loading-spinner" />
      <p>Verifying your email link...</p>
    </div>
  );
}
