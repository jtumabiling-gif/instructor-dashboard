import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

export default function LoginPage() {
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage('');
    try {
      if (isRegistering) {
        const registration = await fetch(`${API_BASE}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });
        const result = await registration.json();
        if (!registration.ok) throw new Error(result.detail || 'Could not create student account.');
      }

      const response = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Sign in failed.');
      if (!['instructor', 'admin'].includes(data.role)) {
        throw new Error('This dashboard requires an instructor account.');
      }
      localStorage.setItem('username', data.user);
      localStorage.setItem('role', data.role);
      localStorage.setItem('access_token', data.access_token);
      navigate('/instructor', { replace: true });
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="instructor-login-page">
      <form className="instructor-login-card" onSubmit={submit}>
        <p className="instructor-login-kicker">WHARFINTEL / SIMULATION OPERATIONS</p>
        <h1>Instructor portal</h1>
        <p className="instructor-login-description">Sign in to manage trainees and vessel simulation scenarios.</p>
        <label>
          Username
          <input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" required />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={isRegistering ? 'new-password' : 'current-password'} required />
        </label>
        {message && <p className="instructor-login-message" role="alert">{message}</p>}
        <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Please wait…' : isRegistering ? 'Create student account' : 'Sign in'}</button>
        <button className="instructor-login-switch" type="button" onClick={() => { setIsRegistering((value) => !value); setMessage(''); }}>
          {isRegistering ? 'Already have a student account? Sign in' : 'Create a student account'}
        </button>
      </form>
    </main>
  );
}
