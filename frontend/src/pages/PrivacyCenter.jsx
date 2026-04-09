// ================= PRIVACY CENTER PAGE =================
import { useState, useRef, useEffect } from 'react';
import { Shield, Eye, Lock, Trash2, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function PrivacyCenter() {
  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [password, setPassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  const modalRef = useRef(null);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setShowDeleteModal(false);
        setPassword('');
        setError('');
      }
    };

    if (showDeleteModal) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDeleteModal]);

  const handleDeleteAccount = async () => {
    if (!password) {
      setError("Please enter your password to confirm");
      return;
    }

    setIsDeleting(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/auth/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.clear();
        alert("Your account has been deleted successfully.");
        navigate('/login');
      } else {
        setError(data.message || "Failed to delete account");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen justify-center">
      <div className="max-w-3xl w-full  p-8">
        
        <h1 className="text-3xl font-bold mb-8 text-gray-800">Privacy Center 🔒</h1>

        <div className="space-y-6">
          <div className="flex gap-4 p-5 rounded-2xl bg-gray-50 border border-gray-100">
            <Shield className="text-indigo-500 mt-1" size={24} />
            <div>
              <h3 className="font-semibold text-lg">Data Protection</h3>
              <p className="text-gray-600 text-sm">Your personal data is securely stored and encrypted.</p>
            </div>
          </div>

          <div className="flex gap-4 p-5 rounded-2xl bg-gray-50 border border-gray-100">
            <Eye className="text-indigo-500 mt-1" size={24} />
            <div>
              <h3 className="font-semibold text-lg">Profile Visibility</h3>
              <p className="text-gray-600 text-sm">Control who can see your profile and activities.</p>
            </div>
          </div>

          <div className="flex gap-4 p-5 rounded-2xl bg-gray-50 border border-gray-100">
            <Lock className="text-indigo-500 mt-1" size={24} />
            <div>
              <h3 className="font-semibold text-lg">Account Security</h3>
              <p className="text-gray-600 text-sm">Enable strong passwords and keep your account safe.</p>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="mt-12 pt-8 border-t border-red-100">
          <h2 className="text-xl font-semibold text-red-600 mb-4">Danger Zone</h2>
          <p className="text-gray-600 text-sm mb-6">
            Once you delete your account, all your data will be permanently removed and cannot be recovered.
          </p>

          <button 
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-medium transition-all active:scale-95"
          >
            <Trash2 size={20} />
            Delete My Account
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[200] p-4">
          <div 
            ref={modalRef}
            className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden"
          >
            <div className="p-8">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center">
                  <AlertTriangle className="text-red-600" size={32} />
                </div>
              </div>

              <h2 className="text-2xl font-semibold text-center text-gray-900 mb-2">
                Delete Account?
              </h2>
              <p className="text-center text-gray-600 mb-8 text-sm">
                This action is permanent and cannot be undone.<br />
                All your vibes, chats, and data will be deleted.
              </p>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter your password to confirm
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:border-red-500"
                  placeholder="Your current password"
                />
              </div>

              {error && (
                <p className="text-red-600 text-sm mb-4 text-center">{error}</p>
              )}

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setPassword('');
                    setError('');
                  }}
                  className="flex-1 py-3.5 border border-gray-300 rounded-2xl font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={isDeleting || !password}
                  className="flex-1 py-3.5 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium rounded-2xl transition"
                >
                  {isDeleting ? "Deleting..." : "Yes, Delete Account"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}