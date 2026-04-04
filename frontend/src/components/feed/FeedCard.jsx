// frontend/src/components/feed/FeedCard.jsx
import { Heart, MessageCircle, MapPin, Edit3, X, Trash2 } from 'lucide-react';
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

  // Edit Handlers
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

  // Delete Handlers
  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
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
      <Card className="mb-8">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div 
              onClick={handleCreatorClick}
              className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity flex-1"
            >
              <Avatar src={currentActivity.creator?.avatar} size="md" />
              <div>
                <p className="font-medium">{currentActivity.creator?.name}</p>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <MapPin size={14} /> {currentActivity.distance?.toFixed(1) || '5'} km away
                </p>
              </div>
            </div>

            {isCreator && (
              <div className="flex items-center gap-1">
                <button
                  onClick={handleEditClick}
                  className="p-2 text-gray-400 hover:text-primary transition-colors"
                  title="Edit"
                >
                  <Edit3 size={20} />
                </button>
                <button
                  onClick={handleDeleteClick}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  title="Delete"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            )}
          </div>

          {isEdited && (
            <div className="flex items-center gap-1 text-xs text-gray-400 mb-3">
              <Edit3 size={14} />
              <span>Edited</span>
            </div>
          )}

          <h3 className="font-poppins text-2xl font-semibold mb-3">{currentActivity.title}</h3>
          <p className="text-gray-600 line-clamp-3 mb-6">{currentActivity.description}</p>

          <div className="flex flex-wrap gap-2 mb-6">
            {currentActivity.interests?.map((tag, i) => (
              <span key={i} className="px-4 py-1 text-xs bg-primary/10 text-primary rounded-2xl">
                #{tag}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex gap-6">
              <button 
                onClick={handleLike}
                disabled={isLiking}
                className="flex items-center gap-2 text-gray-500 hover:text-accent transition-colors disabled:opacity-50"
              >
                <Heart size={22} className={isLiked ? "fill-accent text-accent" : ""} />
                <span className="text-sm">{currentActivity.likes?.length || 0}</span>
              </button>

              <button 
                onClick={() => navigate(`/activity/${currentActivity._id}`)}
                className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors"
              >
                <MessageCircle size={22} />
                <span className="text-sm">{currentActivity.comments?.length || 0}</span>
              </button>
            </div>

            <Button onClick={onJoin}>Join Vibe</Button>
          </div>
        </div>
      </Card>

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-semibold">Edit Activity</h2>
              <button onClick={() => setIsEditing(false)} className="p-2 text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-200 rounded-3xl focus:outline-none focus:border-primary resize-y"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Interests (comma separated)</label>
                <input
                  type="text"
                  value={editForm.interests}
                  onChange={(e) => setEditForm({ ...editForm, interests: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:border-primary"
                  placeholder="hiking, music, photography"
                />
              </div>
            </div>

            <div className="p-6 border-t flex gap-3">
              <Button variant="secondary" onClick={() => setIsEditing(false)} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={handleSaveEdit}
                disabled={isSaving || !editForm.title.trim() || !editForm.description.trim()}
                className="flex-1"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 text-center">
            <Trash2 size={48} className="mx-auto text-red-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Delete Activity?</h3>
            <p className="text-gray-600 mb-6">
              This action cannot be undone. All chats and joins will also be removed.
            </p>
            <div className="flex gap-3">
              <Button 
                variant="secondary" 
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                variant="danger" 
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex-1"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}