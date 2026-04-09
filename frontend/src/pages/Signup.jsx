import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { GoogleLogin } from '@react-oauth/google';

export default function Signup() {
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validate = () => {
    const e = {};
    if (!form.name) e.name = 'Name is required';
    if (!form.username || form.username.length < 3) e.username = 'Min 3 chars';
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email required';
    if (!form.password || form.password.length < 6) e.password = 'Min 6 chars';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await api.post('/auth/register', form);
      navigate('/verify-otp', { state: { email: form.email } });
    } catch (err) {
      setErrors({ general: err.response?.data?.message || 'Signup failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async (credential) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/google', { credential });
      localStorage.setItem('token', data.token);
      navigate('/home');
    } catch {
      setErrors({ general: 'Google signup failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 via-pink-100 to-violet-100  px-2">
      
      <div className="max-w-xs sm:max-w-sm w-full bg-white rounded-2xl shadow-md p-5">

        {/* Branding */}
        <h2 className="text-center text-xs text-gray-400">Join</h2>
        <h1 className="text-xl sm:text-2xl font-bold text-center mb-3 bg-gradient-to-r from-primary to-secondary text-transparent bg-clip-text">
          VibeMeet
        </h1>
        <p className="text-center text-gray-500 text-xs sm:text-sm mb-4">
          Create your account
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">

          <input
            placeholder="Full Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-2.5 py-2 text-xs sm:text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
          {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}

          <input
            placeholder="Username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            className="w-full px-2.5 py-2 text-xs sm:text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
          {errors.username && <p className="text-red-500 text-xs">{errors.username}</p>}

          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full px-2.5 py-2 text-xs sm:text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
          {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-2.5 py-2 text-xs sm:text-sm border rounded-lg pr-10 focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {errors.password && <p className="text-red-500 text-xs">{errors.password}</p>}

          {errors.general && (
            <p className="text-red-500 text-xs text-center">{errors.general}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 text-xs sm:text-sm bg-primary text-white rounded-lg hover:scale-[1.02] transition"
          >
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </form>

        <div className="my-4 text-center text-xs text-gray-400">OR</div>

        <GoogleLogin
          onSuccess={(res) => handleGoogle(res.credential)}
          onError={() => setErrors({ general: 'Google signup failed' })}
          useOneTap
          render={(props) => (
            <button
              onClick={props.onClick}
              disabled={loading}
              className="w-full py-2 text-xs sm:text-sm border rounded-lg hover:bg-gray-50"
            >
              Continue with Google
            </button>
          )}
        />

        <p className="text-center text-xs mt-4 text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}