// frontend/src/components/feed/FeedCard.jsx
import { Heart, MessageCircle, MapPin, Edit3, X, Trash2, ArrowRight } from 'lucide-react';
import Avatar from '../common/Avatar';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { useAuthStore } from '../../store/useAuthStore';
import { useState } from 'react';

export default function FeedCard({ activity, onJoin, onUpdate, onDelete }) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [currentActivity, setCurrentActivity] = useState(activity);
  const [isLiking, setIsLiking] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [editForm, setEditForm] = useState({
    title: activity.title,
    description: activity.description,
    interests: activity.interests ? activity.interests.join(', ') : ''
  });

  const isCreator = currentActivity.creator?._id === user?._id;
  const isEdited = currentActivity.updatedAt && 
                   new Date(currentActivity.updatedAt) > new Date(currentActivity.createdAt);

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    try {
      await api.post(`/activities/${currentActivity._id}/like`);
      setCurrentActivity(prev => ({
        ...prev,
        likes: prev.likes?.includes(user._id)
          ? prev.likes.filter(id => id !== user._id)
          : [...(prev.likes || []), user._id]
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setIsLiking(false);
    }
  };

  const handleCreatorClick = (e) => {
    e.stopPropagation();
    navigate(`/profile/${currentActivity.creator._id}`);
  };

  const handleEditClick = () => {
    setEditForm({
      title: currentActivity.title,
      description: currentActivity.description,
      interests: currentActivity.interests ? currentActivity.interests.join(', ') : ''
    });
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!editForm.title.trim() || !editForm.description.trim()) return;

    setIsSaving(true);
    try {
      const interestsArray = editForm.interests
        .split(',')
        .map(tag => tag.trim())
        .filter(Boolean);

      const { data } = await api.put(`/activities/${currentActivity._id}`, {
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        interests: interestsArray
      });

      setCurrentActivity(data);
      if (onUpdate) onUpdate(data);
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      alert("Failed to update activity. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/activities/${currentActivity._id}`);
      if (onDelete) onDelete(currentActivity._id);
      setShowDeleteConfirm(false);
    } catch (err) {
      console.error(err);
      alert("Failed to delete activity. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const isLiked = currentActivity.likes?.includes(user?._id);

  return (
    <>
      <Card className="mb-4 sm:mb-6 overflow-hidden border border-gray-100 hover:shadow-md transition-shadow">
        <div className="p-4 sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div 
              onClick={handleCreatorClick}
              className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity flex-1"
            >
              <Avatar src={currentActivity.creator?.avatar} size="sm" className="sm:w-10 sm:h-10" />
              <div>
                <p className="font-semibold text-sm sm:text-base text-gray-900 leading-tight">
                  {currentActivity.creator?.name}
                </p>
                <p className="text-[11px] sm:text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                  <MapPin size={12} className="text-primary" /> 
                  {currentActivity.distance?.toFixed(1) || '5'} km away
                </p>
              </div>
            </div>

            {isCreator && (
              <div className="flex items-center gap-1 bg-gray-50 rounded-full px-1">
                <button
                  onClick={handleEditClick}
                  className="p-1.5 text-gray-400 hover:text-primary transition-colors"
                  title="Edit"
                >
                  <Edit3 size={18} />
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                  title="Delete"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            )}
          </div>

          {/* Content Body */}
          <div className="space-y-1 sm:space-y-2 mb-4">
            {isEdited && (
              <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-gray-300">
                <Edit3 size={10} />
                <span>Edited</span>
              </div>
            )}
            <h3 className="font-poppins text-lg sm:text-lg font-bold text-gray-800 leading-tight">
              {currentActivity.title}
            </h3>
            <p className="text-gray-600 text-sm sm:text-base line-clamp-2 sm:line-clamp-3 leading-relaxed">
              {currentActivity.description}
            </p>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            {currentActivity.interests?.map((tag, i) => (
              <span key={i} className="px-3 py-0.5 text-[10px] sm:text-xs font-medium bg-gray-50 text-gray-500 rounded-full border border-gray-100">
                #{tag}
              </span>
            ))}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between border-t border-gray-50">
            <div className="flex gap-4 sm:gap-6">
              <button 
                onClick={handleLike}
                disabled={isLiking}
                className="flex items-center gap-1.5 text-gray-500 hover:text-red-500 transition-colors group"
              >
                <Heart 
                  size={20} 
                  className={`transition-all ${isLiked ? "fill-red-500 text-red-500 scale-110" : "group-hover:scale-110"}`} 
                />
                <span className="text-xs sm:text-sm font-bold">{currentActivity.likes?.length || 0}</span>
              </button>

              <button 
                onClick={() => navigate(`/activity/${currentActivity._id}`)}
                className="flex items-center gap-1.5 text-gray-500 hover:text-primary transition-colors group"
              >
                <MessageCircle size={20} className="group-hover:scale-110 transition-transform" />
                <span className="text-xs sm:text-sm font-bold">{currentActivity.comments?.length || 0}</span>
              </button>
            </div>

            {/* Enhanced Join Button */}
            <Button 
              onClick={onJoin} 
              className="
                group relative flex items-center gap-2 overflow-hidden
                bg-gradient-to-br from-primary to-primary/80 
                hover:shadow-lg hover:shadow-primary/30 
                text-white px-5 sm:px-7 py-2 rounded-full 
                font-bold text-xs sm:text-sm transition-all 
                hover:-translate-y-0.5 active:scale-95
              "
            >
              <span>Join Vibe</span>
              {/* <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" /> */}
            </Button>
          </div>
        </div>
      </Card>

      {/* Edit Modal */}
      {/* Edit Modal */}
{isEditing && (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center z-[100] p-0 sm:p-4 transition-all">
    <div className="bg-white rounded-t-[2.5rem] sm:rounded-[2rem] w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom sm:zoom-in-95 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Edit Activity</h2>
          <p className="text-xs text-gray-400 mt-0.5">Update your activity details</p>
        </div>
        <button 
          onClick={() => setIsEditing(false)} 
          className="p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-full transition-colors"
        >
          <X size={22} />
        </button>
      </div>

      {/* Body */}
      <div className="p-6 space-y-5 flex-1 overflow-y-auto">
        <div className="group">
          <label className="block text-[11px] font-black uppercase tracking-wider text-gray-400 mb-2 ml-1 transition-colors group-focus-within:text-primary">
            Activity Title
          </label>
          <input
            type="text"
            value={editForm.title}
            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary focus:bg-white outline-none transition-all text-sm font-medium"
            placeholder="What are you up to?"
          />
        </div>

        <div className="group">
          <label className="block text-[11px] font-black uppercase tracking-wider text-gray-400 mb-2 ml-1 transition-colors group-focus-within:text-primary">
            Description
          </label>
          <textarea
            value={editForm.description}
            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
            rows={4}
            className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary focus:bg-white outline-none transition-all text-sm resize-none leading-relaxed"
            placeholder="Tell people more about it..."
          />
        </div>

        <div className="group">
          <label className="block text-[11px] font-black uppercase tracking-wider text-gray-400 mb-2 ml-1 transition-colors group-focus-within:text-primary">
            Interests & Tags
          </label>
          <div className="relative">
            <input
              type="text"
              value={editForm.interests}
              onChange={(e) => setEditForm({ ...editForm, interests: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary focus:bg-white outline-none transition-all text-sm pr-10"
              placeholder="coding, music, cricket..."
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300">
              <Edit3 size={16} />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 bg-gray-50/80 backdrop-blur-sm flex gap-3 border-t border-gray-100">
        <Button 
          variant="secondary" 
          onClick={() => setIsEditing(false)} 
          className="flex-1 rounded-xl py-3 font-bold text-gray-600 hover:bg-gray-200"
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSaveEdit}
          disabled={isSaving || !editForm.title.trim() || !editForm.description.trim()}
          className="flex-1 rounded-xl py-3 font-bold bg-primary text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 active:scale-[0.98]"
        >
          {isSaving ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Saving...</span>
            </div>
          ) : 'Update Vibe'}
        </Button>
      </div>
    </div>
  </div>
)}

{/* Delete Confirmation Modal */}
{showDeleteConfirm && (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-6 transition-all">
    <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 text-center shadow-2xl animate-in zoom-in-95 duration-200 border border-gray-100">
      <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ring-red-50/50">
        <Trash2 size={32} className="text-red-500 animate-pulse" />
      </div>
      <h3 className="text-2xl font-black text-gray-800 mb-2">Wait a second!</h3>
      <p className="text-gray-500 text-sm leading-relaxed mb-8 px-2">
        Are you sure you want to delete this activity? This will permanently remove all joins and chats.
      </p>
      <div className="flex flex-col gap-3">
        <Button 
          variant="danger" 
          onClick={confirmDelete}
          disabled={isDeleting}
          className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs bg-red-500 text-white shadow-xl shadow-red-500/30 hover:bg-red-600 active:scale-95 transition-all"
        >
          {isDeleting ? 'Removing...' : 'Yes, Delete it'}
        </Button>
        <Button 
          variant="secondary" 
          onClick={() => setShowDeleteConfirm(false)}
          className="w-full py-4 rounded-2xl font-bold text-sm text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
        >
          No, keep it
        </Button>
      </div>
    </div>
  </div>
)}
    </>
  );
}