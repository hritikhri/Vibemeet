import { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import Button from '../components/ui/Button';
import api from '../lib/api';

export default function EditProfile() {
  const { user } = useAuthStore();
  const [form, setForm] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    interests: user?.interests?.join(', ') || '',
    mood: user?.mood || 'social'
  });

  const handleSave = async () => {
    await api.put('/users/profile', {
      ...form,
      interests: form.interests.split(',').map(i => i.trim())
    });
    alert('Profile updated successfully ✨');
    window.location.href = '/profile';
  };
  
  return (
    <div className="min-h-screen bg-background p-6">
      <h1 className="text-3xl font-poppins font-semibold mb-8">Edit Profile</h1>

      <div className="space-y-8 max-w-2xl mx-auto">
        <div>
          <label className="block text-sm mb-2">Name</label>
          <input 
            value={form.name}
            onChange={(e) => setForm({...form, name: e.target.value})}
            className="w-full px-6 py-4 rounded-3xl border border-gray-200 focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-sm mb-2">Bio</label>
          <textarea 
            value={form.bio}
            onChange={(e) => setForm({...form, bio: e.target.value})}
            rows={4}
            className="w-full px-6 py-4 rounded-3xl border border-gray-200 focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-sm mb-2">Interests (comma separated)</label>
          <input 
            value={form.interests}
            onChange={(e) => setForm({...form, interests: e.target.value})}
            className="w-full px-6 py-4 rounded-3xl border border-gray-200 focus:border-primary"
            placeholder="hiking, photography, coding..."
          />
        </div>

        <div>
          <label className="block text-sm mb-2">Current Mood</label>
          <select 
            value={form.mood}
            onChange={(e) => setForm({...form, mood: e.target.value})}
            className="w-full px-6 py-4 rounded-3xl border border-gray-200 focus:border-primary"
          >
            <option value="lonely">Feeling Lonely</option>
            <option value="bored">Bored</option>
            <option value="social">Social</option>
            <option value="exploring">Exploring</option>
          </select>
        </div>

        <Button onClick={handleSave} className="w-full py-4 text-lg">
          Save Changes
        </Button>
      </div>
    </div>
  );
}