// frontend/src/components/activity/CreateActivityModal.jsx
import { useState, useRef, useEffect } from 'react';
import { X, Sparkles, MapPin } from 'lucide-react';
import Button from '../ui/Button';
import api from '../../lib/api';

export default function CreateActivityModal({ isOpen, onClose, onActivityCreated }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    interests: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const modalRef = useRef(null);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const interestsArray = form.interests
        .split(',')
        .map(i => i.trim())
        .filter(Boolean);

      const activityData = {
        title: form.title,
        description: form.description,
        time: new Date().toISOString(),
        interests: interestsArray,
        location: { lat: 28.6139, lng: 77.2090 } // Default Delhi
      };

      const { data } = await api.post('/activities', activityData);
      onActivityCreated(data);
      onClose();

      // Reset form
      setForm({ title: '', description: '', interests: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create vibe');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div 
        ref={modalRef}
        className="bg-white rounded-3xl w-full max-w-lg shadow-xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gray-100 rounded-2xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-gray-700" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Create New Vibe</h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-7">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Vibe Title</label>
            <input
              type="text"
              placeholder="Morning Trail Run in Lodhi Garden"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-4 py-3.5 border border-gray-300 rounded-2xl focus:outline-none focus:border-gray-500 bg-gray-50 focus:bg-white transition text-base"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Description</label>
            <textarea
              rows={4}
              placeholder="Tell everyone what this vibe is about..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-3.5 border border-gray-300 rounded-2xl focus:outline-none focus:border-gray-500 bg-gray-50 focus:bg-white transition resize-y min-h-[110px]"
              required
            />
          </div>

          {/* Interests */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Interests / Tags</label>
            <input
              type="text"
              placeholder="running, fitness, nature, photography"
              value={form.interests}
              onChange={(e) => setForm({ ...form, interests: e.target.value })}
              className="w-full px-4 py-3.5 border border-gray-300 rounded-2xl focus:outline-none focus:border-gray-500 bg-gray-50 focus:bg-white transition"
            />
            <p className="text-xs text-gray-500 mt-1.5">Separate multiple interests with commas</p>
          </div>

          {/* Location Info */}
          <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-2xl p-4">
            <MapPin className="w-5 h-5 text-gray-500" />
            <div>
              <p className="text-sm font-medium text-gray-700">Delhi, India</p>
              <p className="text-xs text-gray-500">Default location • Can be updated later</p>
            </div>
          </div>

          {error && (
            <p className="text-red-600 text-sm bg-red-50 p-3 rounded-xl border border-red-100">
              {error}
            </p>
          )}

          {/* Submit Button */}
          <Button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 text-base font-medium bg-gray-900 hover:bg-black text-white rounded-2xl transition active:scale-[0.985]"
          >
            {loading ? 'Creating Vibe...' : 'Create Vibe'}
          </Button>
        </form>
      </div>
    </div>
  );
}