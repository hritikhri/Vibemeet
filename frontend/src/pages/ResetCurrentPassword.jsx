import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, ArrowLeft, ShieldCheck } from 'lucide-react';

export default function ResetPassword() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (formData.newPassword !== formData.confirmPassword) {
      setError("New passwords do not match");
      setIsLoading(false);
      return;
    }

    if (formData.newPassword.length < 6) {
      setError("New password must be at least 6 characters long");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/auth/reset-password-with-current', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => navigate('/profile'), 1800);
      } else {
        setError(data.message || 'Failed to update password');
      }
    } catch (err) {
      setError('Network error. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-12 text-center">
          <div className="mx-auto w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-8">
            <ShieldCheck className="w-12 h-12 text-emerald-600" />
          </div>
          <h2 className="text-3xl font-semibold text-gray-900 mb-3">Password Updated</h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Your password has been successfully changed.<br />
            You will be redirected to your profile shortly.
          </p>
          <div className="w-8 h-1 bg-emerald-500 mx-auto rounded-full animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="w-full">
        <div className="overflow-hidden">
          
          {/* Header */}
          <div className="px-8 pb-8 border-b">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center">
                <Lock className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Change Password</h1>
                <p className="text-sm text-gray-500">Keep your account secure</p>
              </div>
            </div>
          </div>

          <div className="p-8">
            <p className="text-gray-600 text-sm mb-8">
              Please enter your current password and choose a strong new password.
            </p>

            <form onSubmit={handleSubmit} className="space-y-7">
              
              {/* Current Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type={showCurrent ? "text" : "password"}
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    required
                    className="w-full pl-11 pr-12 py-4 border border-gray-200 rounded-2xl focus:outline-none focus:border-indigo-500 bg-gray-50 focus:bg-white transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute inset-y-0 right-0 pr-5 text-gray-400 hover:text-gray-600 transition"
                  >
                    {showCurrent ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type={showNew ? "text" : "password"}
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    required
                    className="w-full pl-11 pr-12 py-4 border border-gray-200 rounded-2xl focus:outline-none focus:border-indigo-500 bg-gray-50 focus:bg-white transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute inset-y-0 right-0 pr-5 text-gray-400 hover:text-gray-600 transition"
                  >
                    {showNew ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type={showConfirm ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className="w-full pl-11 pr-12 py-4 border border-gray-200 rounded-2xl focus:outline-none focus:border-indigo-500 bg-gray-50 focus:bg-white transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute inset-y-0 right-0 pr-5 text-gray-400 hover:text-gray-600 transition"
                  >
                    {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 text-sm p-4 rounded-2xl">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-2xl transition-all active:scale-[0.985] disabled:opacity-70 shadow-lg shadow-indigo-200"
              >
                {isLoading ? 'Updating Password...' : 'Update Password'}
              </button>
            </form>

            {/* Links */}
            <div className="flex justify-between items-center mt-10 text-sm">
              <Link
                to="/forgot-password"
                className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 hover:underline transition"
              >
                Forgot your password?
              </Link>

              <Link
                to="/profile"
                className="text-gray-500 hover:text-gray-700 flex items-center gap-1 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Profile
              </Link>
            </div>
          </div>
        </div>

        {/* Subtle Footer */}
        <p className="text-center text-gray-400 text-xs mt-8">
          Vibe Meet • Secure Account Management
        </p>
      </div>
    </div>
  );
}