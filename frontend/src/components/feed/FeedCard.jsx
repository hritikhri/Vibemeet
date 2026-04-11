// frontend/src/components/feed/FeedCard.jsx
import {
  Heart, MessageCircle, MapPin, Edit3, X,
  Trash2, Send, ChevronDown, ChevronUp, Users
} from 'lucide-react';
import Avatar from '../common/Avatar';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { useAuthStore } from '../../store/useAuthStore';
import { useState, useRef, useEffect } from 'react';

export default function FeedCard({ activity, onJoin, onUpdate, onDelete }) {
  const navigate  = useNavigate();
  const { user }  = useAuthStore();

  const [currentActivity, setCurrentActivity] = useState(activity);
  const [isLiking,         setIsLiking]         = useState(false);

  // ── Comments ────────────────────────────────────────────────────────────────
  const [showComments,   setShowComments]   = useState(false);
  const [commentText,    setCommentText]    = useState('');
  const [isCommenting,   setIsCommenting]   = useState(false);
  const commentInputRef = useRef(null);

  // ── Join ─────────────────────────────────────────────────────────────────────
  const [isJoining,      setIsJoining]      = useState(false);
  const [joinStatus,     setJoinStatus]     = useState(() => {
    const parts = currentActivity.participants || [];
    const pend  = currentActivity.pendingRequests || [];
    const uid   = user?._id;
    if (parts.some(p => (p._id || p) === uid)) return 'joined';
    if (pend.some(p  => (p._id || p) === uid)) return 'pending';
    return 'none';
  });

  // ── Edit / Delete ────────────────────────────────────────────────────────────
  const [isEditing,        setIsEditing]        = useState(false);
  const [showDeleteConfirm,setShowDeleteConfirm] = useState(false);
  const [isSaving,         setIsSaving]          = useState(false);
  const [isDeleting,       setIsDeleting]        = useState(false);
  const [editForm,         setEditForm]          = useState({
    title:       activity.title,
    description: activity.description,
    interests:   activity.interests ? activity.interests.join(', ') : '',
  });

  const isCreator = currentActivity.creator?._id === user?._id;
  const isLiked   = currentActivity.likes?.some(id => (id._id || id) === user?._id);
  const isEdited  = currentActivity.updatedAt &&
    new Date(currentActivity.updatedAt) > new Date(currentActivity.createdAt);

  // focus comment input when panel opens
  useEffect(() => {
    if (showComments) setTimeout(() => commentInputRef.current?.focus(), 120);
  }, [showComments]);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    try {
      await api.post(`/activities/${currentActivity._id}/like`);
      setCurrentActivity(prev => ({
        ...prev,
        likes: isLiked
          ? prev.likes.filter(id => (id._id || id) !== user._id)
          : [...(prev.likes || []), user._id],
      }));
    } catch (err) { console.error(err); }
    finally { setIsLiking(false); }
  };

  const handleComment = async () => {
    const text = commentText.trim();
    if (!text || isCommenting) return;
    setIsCommenting(true);
    try {
      const { data } = await api.post(`/activities/${currentActivity._id}/comment`, { text });
      // backend returns the updated activity with populated comments
      setCurrentActivity(data);
      setCommentText('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsCommenting(false);
    }
  };

  const handleJoin = async () => {
    if (isJoining || joinStatus === 'joined') return;

    // If already a participant → go straight to group chat
    if (joinStatus === 'joined') {
      navigate(`/activity/${currentActivity._id}`);
      return;
    }

    setIsJoining(true);
    try {
      await api.post(`/activities/${currentActivity._id}/join`);
      setJoinStatus('pending');
      setCurrentActivity(prev => ({
        ...prev,
        pendingRequests: [...(prev.pendingRequests || []), user._id],
      }));
    } catch (err) {
      // If already joined / request already sent, fall through to activity page
      console.error(err);
    } finally {
      setIsJoining(false);
    }

    // Always navigate to the activity page so they see the group chat
    navigate(`/activity/${currentActivity._id}`);
  };

  const handleCreatorClick = (e) => {
    e.stopPropagation();
    navigate(`/profile/${currentActivity.creator._id}`);
  };

  const handleEditClick = () => {
    setEditForm({
      title:       currentActivity.title,
      description: currentActivity.description,
      interests:   currentActivity.interests ? currentActivity.interests.join(', ') : '',
    });
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!editForm.title.trim() || !editForm.description.trim()) return;
    setIsSaving(true);
    try {
      const interests = editForm.interests.split(',').map(t => t.trim()).filter(Boolean);
      const { data }  = await api.put(`/activities/${currentActivity._id}`, {
        title:       editForm.title.trim(),
        description: editForm.description.trim(),
        interests,
      });
      setCurrentActivity(data);
      if (onUpdate) onUpdate(data);
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      alert("Failed to update activity.");
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/activities/${currentActivity._id}`);
      if (onDelete) onDelete(currentActivity._id);
    } catch (err) {
      console.error(err);
      alert("Failed to delete activity.");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // ── Join button label ────────────────────────────────────────────────────────
  const joinLabel = () => {
    if (isJoining)         return 'Joining…';
    if (isCreator)         return 'Open Chat';
    if (joinStatus === 'joined')  return 'Open Chat';
    if (joinStatus === 'pending') return 'Pending…';
    return 'Join Vibe';
  };

  // ── Distance ─────────────────────────────────────────────────────────────────
  const distLabel = currentActivity.distance != null
    ? `${Number(currentActivity.distance).toFixed(1)} km away`
    : null;

  // ── Comment time format ───────────────────────────────────────────────────────
  const fmtTime = (d) => {
    const diff = Date.now() - new Date(d);
    if (diff < 60_000)       return 'just now';
    if (diff < 3_600_000)    return `${Math.floor(diff / 60_000)}m`;
    if (diff < 86_400_000)   return `${Math.floor(diff / 3_600_000)}h`;
    return new Date(d).toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <>
      <Card className="mb-4 sm:mb-5  overflow-hidden border border-gray-100 hover:shadow-md transition-shadow">
        <div className="p-4 sm:p-5">

          {/* ── Header ─────────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between mb-4">
            <div
              onClick={handleCreatorClick}
              className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity flex-1 min-w-0"
            >
              <Avatar src={currentActivity.creator?.avatar} size="sm" />
              <div className="min-w-0">
                <p className="font-semibold text-sm text-gray-900 leading-tight truncate">
                  {currentActivity.creator?.name}
                </p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {distLabel && (
                    <span className="text-[11px] text-gray-400 flex items-center gap-1">
                      <MapPin size={10} className="text-primary flex-shrink-0" />
                      {distLabel}
                    </span>
                  )}
                  {currentActivity.time && (
                    <span className="text-[11px] text-gray-400">
                      · {new Date(currentActivity.time).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {isCreator && (
              <div className="flex items-center gap-0.5 bg-gray-50 rounded-full px-1 flex-shrink-0">
                <button onClick={handleEditClick} className="p-1.5 text-gray-400 hover:text-primary transition-colors" title="Edit">
                  <Edit3 size={16} />
                </button>
                <button onClick={() => setShowDeleteConfirm(true)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors" title="Delete">
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>

          {/* ── Body ───────────────────────────────────────────────────────── */}
          <div className="mb-3">
            {isEdited && (
              <span className="text-[10px] uppercase tracking-wider font-bold text-gray-300 flex items-center gap-1 mb-1">
                <Edit3 size={9} /> Edited
              </span>
            )}
            <h3 className="font-bold text-gray-900 text-base sm:text-lg leading-snug mb-1">
              {currentActivity.title}
            </h3>
            <p className="text-gray-500 text-sm leading-relaxed line-clamp-3">
              {currentActivity.description}
            </p>
          </div>

          {/* ── Interest tags ───────────────────────────────────────────────── */}
          {currentActivity.interests?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {currentActivity.interests.map((tag, i) => (
                <span key={i} className="px-2.5 py-0.5 text-[11px] font-medium bg-gray-50 text-gray-500 rounded-full border border-gray-100">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* ── Participant count ───────────────────────────────────────────── */}
          {(currentActivity.participants?.length ?? 0) > 0 && (
            <div className="flex items-center gap-1.5 mb-3">
              <div className="flex -space-x-2">
                {(currentActivity.participants || []).slice(0, 4).map((p, pi) => (
                  <div key={pi} style={{ zIndex: 4 - pi }}
                    className="w-6 h-6 rounded-full border-2 border-white bg-gray-200 overflow-hidden">
                    {(p.avatar || p) && typeof p === 'object' && p.avatar
                      ? <img src={p.avatar} alt="" className="w-full h-full object-cover" />
                      : null}
                  </div>
                ))}
              </div>
              <span className="text-[11px] text-gray-400 flex items-center gap-1">
                <Users size={10} />
                {currentActivity.participants.length} joined
              </span>
            </div>
          )}

          {/* ── Footer actions ──────────────────────────────────────────────── */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-50">
            <div className="flex items-center gap-4">
              {/* Like */}
              <button
                onClick={handleLike}
                disabled={isLiking}
                className="flex items-center gap-1.5 text-gray-400 hover:text-red-500 transition-colors group"
              >
                <Heart
                  size={19}
                  className={`transition-all ${isLiked ? 'fill-red-500 text-red-500 scale-110' : 'group-hover:scale-110'}`}
                />
                <span className="text-xs font-semibold">{currentActivity.likes?.length || 0}</span>
              </button>

              {/* Comment toggle */}
              <button
                onClick={() => setShowComments(v => !v)}
                className="flex items-center gap-1.5 text-gray-400 hover:text-primary transition-colors group"
              >
                <MessageCircle size={19} className="group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold">{currentActivity.comments?.length || 0}</span>
                {showComments
                  ? <ChevronUp size={12} className="text-gray-300" />
                  : <ChevronDown size={12} className="text-gray-300" />}
              </button>
            </div>

            {/* Join / Open Chat */}
            <button
              onClick={handleJoin}
              disabled={isJoining}
              className={`
                flex items-center gap-2 px-5 py-2 rounded-full font-semibold text-xs sm:text-sm
                transition-all active:scale-95
                ${joinStatus === 'joined' || isCreator
                  ? 'bg-green-500 text-white hover:bg-green-600 shadow-md shadow-green-200'
                  : joinStatus === 'pending'
                    ? 'bg-amber-100 text-amber-700 border border-amber-200'
                    : 'bg-gradient-to-br from-primary to-primary/80 text-white shadow-md shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5'
                }
              `}
            >
              {joinLabel()}
            </button>
          </div>

          {/* ── Inline Comments Panel ──────────────────────────────────────── */}
          {showComments && (
            <div className="mt-4 border-t border-gray-50 pt-4 space-y-3">

              {/* Existing comments */}
              {(currentActivity.comments || []).length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-2">
                  No comments yet — be the first!
                </p>
              ) : (
                <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
                  {currentActivity.comments.map((c, i) => (
  <div key={c._id || i} className="flex gap-2.5">
    <Avatar src={c.user?.avatar} size="sm" />
    <div className="flex-1 bg-gray-50 rounded-2xl rounded-tl-none px-3 py-2">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-[12px] font-semibold text-gray-800">
          {c.user?.name || 'Unknown User'}
        </p>
        <span className="text-[10px] text-gray-400 flex-shrink-0">
          {fmtTime(c.createdAt)}
        </span>
      </div>
      <p className="text-[13px] text-gray-600 leading-relaxed mt-0.5">
        {c.text}
      </p>
    </div>
  </div>
))}
                </div>
              )}

              {/* New comment input */}
              <div className="flex gap-2 pt-1">
                <Avatar src={user?.avatar} size="sm" />
                <div className="flex-1 flex items-center gap-2 bg-gray-100 rounded-full px-4 py-1.5">
                  <input
                    ref={commentInputRef}
                    type="text"
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleComment()}
                    placeholder="Write a comment…"
                    className="flex-1 bg-transparent outline-none text-[13px] text-gray-700 placeholder-gray-400"
                  />
                  <button
                    onClick={handleComment}
                    disabled={!commentText.trim() || isCommenting}
                    className="text-primary disabled:opacity-30 transition-opacity flex-shrink-0"
                  >
                    {isCommenting
                      ? <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      : <Send size={15} />}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </Card>

      {/* ── Edit Modal ──────────────────────────────────────────────────────── */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center z-[100] p-0 sm:p-4">
          <div className="bg-white rounded-t-[2.5rem] sm:rounded-[2rem] w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Edit Activity</h2>
                <p className="text-xs text-gray-400 mt-0.5">Update your activity details</p>
              </div>
              <button onClick={() => setIsEditing(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4 flex-1 overflow-y-auto">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Title</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary focus:bg-white outline-none transition-all text-sm font-medium"
                  placeholder="What are you up to?"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary focus:bg-white outline-none transition-all text-sm resize-none leading-relaxed"
                  placeholder="Tell people more about it…"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={editForm.interests}
                  onChange={e => setEditForm({ ...editForm, interests: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary focus:bg-white outline-none transition-all text-sm"
                  placeholder="coding, music, cricket…"
                />
              </div>
            </div>

            <div className="p-5 bg-gray-50 flex gap-3 border-t border-gray-100">
              <Button variant="secondary" onClick={() => setIsEditing(false)} className="flex-1 rounded-xl py-3 font-bold">
                Cancel
              </Button>
              <Button
                onClick={handleSaveEdit}
                disabled={isSaving || !editForm.title.trim() || !editForm.description.trim()}
                className="flex-1 rounded-xl py-3 font-bold bg-primary text-white shadow-lg shadow-primary/25"
              >
                {isSaving
                  ? <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Saving…
                    </span>
                  : 'Save changes'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ─────────────────────────────────────────────── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-6">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 text-center shadow-2xl border border-gray-100">
            <div className="w-18 h-18 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5 ring-8 ring-red-50/50" style={{ width: 72, height: 72 }}>
              <Trash2 size={30} className="text-red-500" />
            </div>
            <h3 className="text-xl font-black text-gray-800 mb-2">Delete activity?</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-7">
              This will permanently remove the activity, all joins, and all chat messages.
            </p>
            <div className="flex flex-col gap-3">
              <Button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest bg-red-500 text-white shadow-lg shadow-red-200 hover:bg-red-600"
              >
                {isDeleting ? 'Deleting…' : 'Yes, delete it'}
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowDeleteConfirm(false)}
                className="w-full py-3.5 rounded-2xl font-bold text-sm text-gray-400 hover:text-gray-600"
              >
                Keep it
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}