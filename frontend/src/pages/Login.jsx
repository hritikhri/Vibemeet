import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { GoogleLogin } from '@react-oauth/google';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, googleLogin } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/home');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async (credential) => {
    setLoading(true);
    try {
      await googleLogin(credential);
      navigate('/home');
    } catch {
      setError('Google login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-card p-8">
        <h1 className="text-4xl font-poppins font-semibold text-center mb-8">Welcome back</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              required
            />
          </div>

          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              required
            />
          </div>

          {error && <p className="error-text">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
            ) : 'Sign In'}
          </button>
        </form>

        <div className="my-8 text-center text-sm text-gray-400">OR</div>

        <GoogleLogin
          onSuccess={(res) => handleGoogle(res.credential)}
          onError={() => setError('Google login failed')}
          useOneTap
          render={(props) => (
            <button onClick={props.onClick} className="w-full py-4 border border-gray-300 rounded-3xl hover:bg-soft">
              Continue with Google
            </button>
          )}
        />

        <p className="text-center text-sm mt-8">
          Don't have an account? <Link to="/signup" className="text-primary font-medium">Sign up</Link>
        </p>
      </div>
    </div>
  );
}