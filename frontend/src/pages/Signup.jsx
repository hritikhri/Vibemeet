import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { GoogleLogin } from '@react-oauth/google';
import Button from '../components/ui/Button';

export default function Signup() {
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validate = () => {
    const newErrors = {};
    if (!form.name) newErrors.name = "Name is required";
    if (!form.username || form.username.length < 3) newErrors.username = "Username must be at least 3 characters";
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) newErrors.email = "Valid email is required";
    if (!form.password || form.password.length < 6) newErrors.password = "Password must be at least 6 characters";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', form);
      // Redirect to OTP page with email
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
    } catch (err) {
      setErrors({ general: 'Google signup failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-card p-8">
        <h1 className="text-4xl font-poppins font-semibold text-center mb-2">Join VibeMeet</h1>
        <p className="text-center text-gray-500 mb-8">Find your people in real life</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="text"
            placeholder="Full Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="input-field"
          />
          {errors.name && <p className="error-text">{errors.name}</p>}

          <input
            type="text"
            placeholder="Username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            className="input-field"
          />
          {errors.username && <p className="error-text">{errors.username}</p>}

          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="input-field"
          />
          {errors.email && <p className="error-text">{errors.email}</p>}

          <input
            type="password"
            placeholder="Password (min 6 chars)"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="input-field"
          />
          {errors.password && <p className="error-text">{errors.password}</p>}

          {errors.general && <p className="error-text text-center">{errors.general}</p>}

          <Button type="submit" disabled={loading} className="w-full py-4">
            {loading ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>

        <div className="my-6 text-center text-sm text-gray-400">OR</div>

        <GoogleLogin
          onSuccess={(res) => handleGoogle(res.credential)}
          onError={() => setErrors({ general: 'Google signup failed' })}
          useOneTap
          render={(props) => (
            <button
              onClick={props.onClick}
              disabled={loading}
              className="w-full py-4 border-2 border-primary/30 rounded-3xl font-medium hover:bg-soft transition-all"
            >
              Continue with Google
            </button>
          )}
        />

        <p className="text-center text-sm mt-8">
          Already have an account? <Link to="/login" className="text-primary font-medium">Log in</Link>
        </p>
      </div>
    </div>
  );
}