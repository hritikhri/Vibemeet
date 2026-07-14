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
    <div className="min-h-screen bg-zinc-950 text-white py-12 px-6">
      <div className="max-w-3xl mx-auto">
        
        <div className="flex items-center gap-4 mb-12">
          <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center">
            <Shield className="w-7 h-7 text-blue-500" />
          </div>
          <h1 className="text-4xl font-semibold">Privacy Center</h1>
        </div>

        <div className="space-y-6">
          <div className="flex gap-5 p-7 bg-zinc-900 border border-zinc-800 rounded-3xl">
            <Shield className="text-blue-500 mt-1 flex-shrink-0" size={28} />
            <div>
              <h3 className="font-semibold text-xl mb-2">Data Protection</h3>
              <p className="text-gray-400">Your personal data is securely stored and encrypted using industry standards.</p>
            </div>
          </div>

          <div className="flex gap-5 p-7 bg-zinc-900 border border-zinc-800 rounded-3xl">
            <Eye className="text-blue-500 mt-1 flex-shrink-0" size={28} />
            <div>
              <h3 className="font-semibold text-xl mb-2">Profile Visibility</h3>
              <p className="text-gray-400">Control who can see your profile, vibes, and activities.</p>
            </div>
          </div>

          <div className="flex gap-5 p-7 bg-zinc-900 border border-zinc-800 rounded-3xl">
            <Lock className="text-blue-500 mt-1 flex-shrink-0" size={28} />
            <div>
              <h3 className="font-semibold text-xl mb-2">Account Security</h3>
              <p className="text-gray-400">We recommend using strong, unique passwords and enabling additional security where available.</p>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="mt-16 pt-10 border-t border-zinc-800">
          <h2 className="text-xl font-semibold text-red-500 mb-3">Danger Zone</h2>
          <p className="text-gray-400 mb-8">
            Once you delete your account, all your data including vibes, chats, and connections will be permanently removed and cannot be recovered.
          </p>

          <button 
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-3 px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-2xl transition-all active:scale-[0.985]"
          >
            <Trash2 size={22} />
            Delete My Account
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[200] p-6">
          <div 
            ref={modalRef}
            className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-md w-full overflow-hidden"
          >
            <div className="p-10">
              <div className="flex justify-center mb-8">
                <div className="w-20 h-20 bg-red-500/10 rounded-2xl flex items-center justify-center">
                  <AlertTriangle className="text-red-500" size={40} />
                </div>
              </div>

              <h2 className="text-2xl font-semibold text-center mb-3">Delete Account?</h2>
              <p className="text-center text-gray-400 mb-10 text-sm leading-relaxed">
                This action is permanent and cannot be undone.<br />
                All your data will be permanently deleted.
              </p>

              <div className="mb-8">
                <label className="block text-xs font-semibold tracking-widest text-gray-500 mb-2">
                  ENTER YOUR PASSWORD TO CONFIRM
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-6 py-4 bg-zinc-950 border border-zinc-700 rounded-2xl focus:outline-none focus:border-red-500 text-base placeholder-gray-600"
                  placeholder="Your current password"
                />
              </div>

              {error && (
                <p className="text-red-400 text-sm mb-6 text-center">{error}</p>
              )}

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setPassword('');
                    setError('');
                  }}
                  className="flex-1 py-4 border border-zinc-700 rounded-2xl font-medium hover:bg-zinc-800 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={isDeleting || !password}
                  className="flex-1 py-4 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold rounded-2xl transition"
                >
                  {isDeleting ? "Deleting Account..." : "Yes, Delete Account"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}