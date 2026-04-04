// frontend/src/components/activity/CreateActivityModal.jsx
import { useState } from 'react';
import { X } from 'lucide-react';
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
        time: new Date().toISOString(),           // ← Auto current date & time
        interests: interestsArray,
        location: { lat: 28.6139, lng: 77.2090 } // Default location (Delhi)
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
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b">
          <h2 className="text-2xl font-poppins font-semibold">Create New Vibe</h2>
          <button onClick={onClose} className="p-2 hover:bg-soft rounded-full">
            <X size={26} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Vibe Title</label>
            <input
              type="text"
              placeholder="Sunday Morning Trail Run"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              rows={4}
              placeholder="Tell everyone what this vibe is about..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Interests / Tags</label>
            <input
              type="text"
              placeholder="hiking, coffee, photography, music"
              value={form.interests}
              onChange={(e) => setForm({ ...form, interests: e.target.value })}
              className="input-field"
            />
            <p className="text-xs text-gray-500 mt-1">Separate with commas</p>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <Button type="submit" disabled={loading} className="w-full py-4 text-lg">
            {loading ? 'Creating Vibe...' : 'Create Vibe'}
          </Button>
        </form>
      </div>
    </div>
  );
}