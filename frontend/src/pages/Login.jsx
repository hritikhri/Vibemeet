import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { GoogleLogin } from '@react-oauth/google';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-violet-100 flex items-center justify-center px-3">
      <div className="max-w-sm w-full bg-white rounded-2xl shadow-md p-6">

        {/* Branding */}
        <h2 className="text-center text-xs text-gray-400 mb-1">Welcome to</h2>
        <h1 className="text-2xl sm:text-3xl font-bold text-center mb-4 bg-gradient-to-r from-primary to-secondary text-transparent bg-clip-text">
          VibeMeet
        </h1>

        {/* Subtitle */}
        <p className="text-center text-gray-500 text-xs sm:text-sm mb-5">
          Sign in to continue
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Email */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">📧</span>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/50"
              required
            />
          </div>

          {/* Password */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔒</span>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-9 pr-10 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/50"
              required
            />

            {/* Show/Hide */}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>

          {/* Forgot Password */}
          <div className="text-right text-xs">
            <Link to="/forgot-password" className="text-primary hover:underline">
              Forgot password?
            </Link>
          </div>

          {error && <p className="text-red-500 text-xs text-center">{error}</p>}

          {/* Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 text-sm bg-primary text-white rounded-lg font-medium hover:scale-[1.02] transition"
          >
            {loading ? (
              <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mx-auto" />
            ) : 'Sign In'}
          </button>
        </form>

        {/* Divider */}
        <div className="my-4 text-center text-xs text-gray-400">OR</div>

        {/* Google */}
        <GoogleLogin
          onSuccess={(res) => handleGoogle(res.credential)}
          onError={() => setError('Google login failed')}
          useOneTap
          render={(props) => (
            <button
              onClick={props.onClick}
              className="w-full py-2.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Continue with Google
            </button>
          )}
        />

        {/* Signup */}
        <p className="text-center text-xs mt-5 text-gray-500">
          Don't have an account?{' '}
          <Link to="/signup" className="text-primary font-medium hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
