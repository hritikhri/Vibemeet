import { useState, useRef } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Camera, Save, ArrowLeft, Loader2 } from 'lucide-react';
import Button from '../components/ui/Button';
import api from '../lib/api';

export default function EditProfile() {
  const { user, setUser } = useAuthStore();   // Important: use setUser to update store

  const [form, setForm] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    interests: user?.interests?.join(', ') || '',
    mood: user?.mood || 'social',
  });

  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || null);
  const [selectedFile, setSelectedFile] = useState(null);   // Store actual file for upload
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [editingField, setEditingField] = useState(null);

  const fileInputRef = useRef(null);

  // Handle Avatar Click
  const handleAvatarClick = () => {
    fileInputRef.current.click();
  };

  // Handle File Selection + Preview
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith('image/')) return;

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setAvatarPreview(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Toggle Edit Mode
  const toggleEdit = (field) => {
    setEditingField(editingField === field ? null : field);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ====================== UPLOAD AVATAR TO CLOUDINARY ======================
  const uploadAvatar = async (file) => {
    if (!file) return user?.avatar;

    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const res = await api.post('/users/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      return res.data.avatar;   // Cloudinary URL returned from backend
    } catch (error) {
      console.error("Avatar upload failed:", error);
      alert("Failed to upload avatar. Please try again.");
      return user?.avatar;
    } finally {
      setUploadingAvatar(false);
    }
  };

  // ====================== SAVE PROFILE ======================
  const handleSave = async () => {
    setIsSaving(true);

    try {
      let avatarUrl = user?.avatar;

      // Upload new avatar if selected
      if (selectedFile) {
        avatarUrl = await uploadAvatar(selectedFile);
      }

      const payload = {
        name: form.name,
        bio: form.bio,
        interests: form.interests.split(',').map(i => i.trim()).filter(Boolean),
        mood: form.mood,
        avatar: avatarUrl,           // Send new avatar URL
      };

      const res = await api.put('/users/profile', payload);

      // Update auth store
      setUser(res.data);

      alert('Profile updated successfully ✨');
      window.location.href = '/profile';
    } catch (error) {
      console.error(error);
      alert('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        
        {/* Back Button */}
        <button 
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-8 font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Profile
        </button>

        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          
          {/* Cover + Avatar Section */}
          <div className="h-48 bg-gradient-to-r from-indigo-600 to-purple-600 relative">
            <div 
              onClick={handleAvatarClick}
              className="absolute -bottom-14 left-8 w-32 h-32 bg-white p-1.5 rounded-3xl shadow-xl cursor-pointer hover:ring-4 hover:ring-indigo-200 transition-all group"
            >
              <div className="w-full h-full rounded-3xl overflow-hidden relative">
                {avatarPreview ? (
                  <img 
                    src={avatarPreview} 
                    alt="Avatar" 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                    <span className="text-6xl">👋</span>
                  </div>
                )}
                
                {/* Camera Overlay */}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl">
                  {uploadingAvatar ? (
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  ) : (
                    <Camera className="w-8 h-8 text-white" />
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-20 pb-10 px-8">
            <div className="space-y-10">

              {/* Name */}
              <div>
                <label className="text-xs font-semibold tracking-widest text-gray-500 mb-1 block">NAME</label>
                {editingField === 'name' ? (
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    onBlur={() => toggleEdit('name')}
                    autoFocus
                    className="w-full text-3xl font-semibold bg-transparent border-b-2 border-indigo-500 focus:outline-none py-1"
                  />
                ) : (
                  <div 
                    onClick={() => toggleEdit('name')}
                    className="text-3xl font-semibold text-gray-900 cursor-pointer hover:text-indigo-600 transition-colors py-1"
                  >
                    {form.name || "Add your name"}
                  </div>
                )}
              </div>

              {/* Bio */}
              <div>
                <label className="text-xs font-semibold tracking-widest text-gray-500 mb-2 block">BIO</label>
                {editingField === 'bio' ? (
                  <textarea
                    name="bio"
                    value={form.bio}
                    onChange={handleChange}
                    onBlur={() => toggleEdit('bio')}
                    rows={3}
                    autoFocus
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 focus:outline-none focus:border-indigo-500"
                  />
                ) : (
                  <div 
                    onClick={() => toggleEdit('bio')}
                    className="text-gray-600 leading-relaxed cursor-pointer hover:bg-gray-50 p-4 rounded-2xl transition-all min-h-[80px]"
                  >
                    {form.bio || "Click to add a bio..."}
                  </div>
                )}
              </div>

              {/* Interests */}
              <div>
                <label className="text-xs font-semibold tracking-widest text-gray-500 mb-2 block">INTERESTS</label>
                {editingField === 'interests' ? (
                  <input
                    type="text"
                    name="interests"
                    value={form.interests}
                    onChange={handleChange}
                    onBlur={() => toggleEdit('interests')}
                    autoFocus
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 focus:outline-none focus:border-indigo-500"
                    placeholder="hiking, photography, music..."
                  />
                ) : (
                  <div 
                    onClick={() => toggleEdit('interests')}
                    className="bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-gray-600 cursor-pointer hover:border-gray-300 transition-all"
                  >
                    {form.interests || "Click to add interests (comma separated)"}
                  </div>
                )}
              </div>

              {/* Mood */}
              <div>
                <label className="text-xs font-semibold tracking-widest text-gray-500 mb-2 block">CURRENT VIBE</label>
                {editingField === 'mood' ? (
                  <select
                    name="mood"
                    value={form.mood}
                    onChange={handleChange}
                    onBlur={() => toggleEdit('mood')}
                    autoFocus
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="social">😄 Social & Outgoing</option>
                    <option value="exploring">🌍 Exploring</option>
                    <option value="chill">☕ Chill & Relaxed</option>
                    <option value="bored">😐 Looking for fun</option>
                    <option value="lonely">🤍 Feeling lonely</option>
                  </select>
                ) : (
                  <div 
                    onClick={() => toggleEdit('mood')}
                    className="bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 cursor-pointer hover:border-gray-300 transition-all"
                  >
                    {form.mood === 'social' && '😄 Social & Outgoing'}
                    {form.mood === 'exploring' && '🌍 Exploring'}
                    {form.mood === 'chill' && '☕ Chill & Relaxed'}
                    {form.mood === 'bored' && '😐 Looking for fun'}
                    {form.mood === 'lonely' && '🤍 Feeling lonely'}
                  </div>
                )}
              </div>

              {/* Hidden File Input */}
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleFileChange}
              />

              {/* Save Button */}
              <div className="pt-6">
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full py-4 text-lg font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-2xl shadow-lg transition-all active:scale-[0.985]"
                >
                  {isSaving ? 'Saving Profile...' : 'Save All Changes'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}