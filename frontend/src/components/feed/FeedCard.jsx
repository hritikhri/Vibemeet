// frontend/src/components/feed/FeedCard.jsx
import {
  Heart,
  MessageCircle,
  MapPin,
  Edit3,
  X,
  Trash2,
  Send,
  ChevronDown,
  ChevronUp,
  Users,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Avatar from "../common/Avatar";
import Button from "../ui/Button";
import Card from "../ui/Card";
import { useNavigate } from "react-router-dom";
import api from "../../lib/api";
import { useAuthStore } from "../../store/useAuthStore";
import { useState, useRef, useEffect } from "react";

export default function FeedCard({ activity, onJoin, onUpdate, onDelete }) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [currentActivity, setCurrentActivity] = useState(activity);
  const [isLiking, setIsLiking] = useState(false);

  // ── Image Carousel State ───────────────────────────────────────────────────
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const imageContainerRef = useRef(null);

  // ── Comments ────────────────────────────────────────────────────────────────
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);
  const commentInputRef = useRef(null);
  const commentsContainerRef = useRef(null);

  // ── Join, Edit, Delete states (unchanged) ───────────────────────────────────
  const [isJoining, setIsJoining] = useState(false);
  const [joinStatus, setJoinStatus] = useState(() => {
    const parts = currentActivity.participants || [];
    const pend = currentActivity.pendingRequests || [];
    const uid = user?._id;
    if (parts.some((p) => (p._id || p) === uid)) return "joined";
    if (pend.some((p) => (p._id || p) === uid)) return "pending";
    return "none";
  });

  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editForm, setEditForm] = useState({
    title: activity.title,
    description: activity.description,
    interests: activity.interests ? activity.interests.join(", ") : "",
  });

  const isCreator = currentActivity.creator?._id === user?._id;
  const isLiked = currentActivity.likes?.some(
    (id) => (id._id || id) === user?._id,
  );

  const isEdited =
    currentActivity.updatedAt &&
    new Date(currentActivity.updatedAt) > new Date(currentActivity.createdAt);

  const images =
    currentActivity.images && currentActivity.images.length > 0
      ? currentActivity.images
      : currentActivity.image
        ? [currentActivity.image]
        : [];

  // ── Image Carousel Handlers ─────────────────────────────────────────────────
  const scrollToImage = (index) => {
    if (imageContainerRef.current && images.length > 0) {
      const scrollAmount = imageContainerRef.current.offsetWidth * index;
      imageContainerRef.current.scrollTo({
        left: scrollAmount,
        behavior: "smooth",
      });
      setCurrentImageIndex(index);
    }
  };

  const handleScroll = () => {
    if (!imageContainerRef.current || images.length === 0) return;
    const scrollPosition = imageContainerRef.current.scrollLeft;
    const imageWidth = imageContainerRef.current.offsetWidth;
    const newIndex = Math.round(scrollPosition / imageWidth);
    setCurrentImageIndex(Math.min(Math.max(newIndex, 0), images.length - 1));
  };

  // Update current index when images change
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [images]);

  // Auto scroll comments (unchanged)
  useEffect(() => {
    if (showComments && commentsContainerRef.current) {
      setTimeout(() => {
        commentsContainerRef.current.scrollTo({
          top: commentsContainerRef.current.scrollHeight,
          behavior: "smooth",
        });
      }, 150);
    }
  }, [showComments, currentActivity.comments]);

  useEffect(() => {
    if (showComments) {
      setTimeout(() => commentInputRef.current?.focus(), 300);
    }
  }, [showComments]);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    try {
      await api.post(`/activities/${currentActivity._id}/like`);
      setCurrentActivity((prev) => ({
        ...prev,
        likes: isLiked
          ? prev.likes.filter((id) => (id._id || id) !== user._id)
          : [...(prev.likes || []), user._id],
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setIsLiking(false);
    }
  };

  const handleComment = async () => {
    const text = commentText.trim();
    if (!text || isCommenting) return;
    setIsCommenting(true);
    try {
      const { data } = await api.post(
        `/activities/${currentActivity._id}/comment`,
        { text },
      );
      setCurrentActivity(data);
      setCommentText("");
    } catch (err) {
      console.error(err);
    } finally {
      setIsCommenting(false);
    }
  };

  const handleJoin = async () => {
    if (isJoining || joinStatus === "joined") return;
    setIsJoining(true);
    try {
      await api.post(`/activities/${currentActivity._id}/join`);
      setJoinStatus("pending");
      setCurrentActivity((prev) => ({
        ...prev,
        pendingRequests: [...(prev.pendingRequests || []), user._id],
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setIsJoining(false);
    }
    navigate(`/activity/${currentActivity._id}`);
  };

  const handleCreatorClick = (e) => {
    e.stopPropagation();
    navigate(`/profile/${currentActivity.creator._id}`);
  };

  const handleEditClick = () => {
    setEditForm({
      title: currentActivity.title,
      description: currentActivity.description,
      interests: currentActivity.interests
        ? currentActivity.interests.join(", ")
        : "",
    });
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!editForm.title.trim() || !editForm.description.trim()) return;
    setIsSaving(true);
    try {
      const interests = editForm.interests
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const { data } = await api.put(`/activities/${currentActivity._id}`, {
        title: editForm.title.trim(),
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
    if (isJoining) return "Joining…";
    if (isCreator || joinStatus === "joined") return "Open Chat";
    if (joinStatus === "pending") return "Pending…";
    return "Join Vibe";
  };

  // ── Distance ─────────────────────────────────────────────────────────────────
  const distLabel =
    currentActivity.distance != null
      ? `${Number(currentActivity.distance).toFixed(1)} km away`
      : null;

  // ── Time formatter ───────────────────────────────────────────────────────────
  const fmtTime = (d) => {
    const diff = Date.now() - new Date(d);
    if (diff < 60_000) return "just now";
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h`;
    return new Date(d).toLocaleDateString([], {
      month: "short",
      day: "numeric",
    });
  };

  // Close modal when clicking backdrop
  const closeEditModal = () => setIsEditing(false);
  const closeDeleteModal = () => setShowDeleteConfirm(false);

  return (
    <>
      <Card className="mb-4 sm:mb-5 overflow-hidden border border-gray-100 hover:shadow-md transition-shadow">
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
                      <MapPin
                        size={10}
                        className="text-primary flex-shrink-0"
                      />
                      {distLabel}
                    </span>
                  )}
                  {/* Post creation time with fmtTime */}
                  <span className="text-[11px] text-gray-400">
                    · {fmtTime(currentActivity.createdAt)}
                  </span>
                  {isEdited && (
                    <span className="text-[10px] uppercase tracking-wider font-bold text-gray-300 flex items-center gap-1">
                      <Edit3 size={9} /> Edited
                    </span>
                  )}
                </div>
              </div>
            </div>

            {isCreator && (
              <div className="flex items-center gap-0.5 bg-gray-50 rounded-full px-1 flex-shrink-0">
                <button
                  onClick={handleEditClick}
                  className="p-1.5 text-gray-400 hover:text-primary transition-colors"
                  title="Edit"
                >
                  <Edit3 size={16} />
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>

          {/* ── Body ───────────────────────────────────────────────────────── */}
          <div className="mb-3">
            <h3 className="font-bold text-gray-900 text-base sm:text-lg leading-snug mb-1">
              {currentActivity.title}
            </h3>
            <p className="text-gray-500 text-sm leading-relaxed line-clamp-3">
              {currentActivity.description}
            </p>
          </div>

          {/* Interest tags */}
          {currentActivity.interests?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {currentActivity.interests.map((tag, i) => (
                <span
                  key={i}
                  className="px-2.5 py-0.5 text-[11px] font-medium bg-gray-50 text-gray-500 rounded-full border border-gray-100"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* ── Instagram-style Image Carousel ──────────────────────────────────── */}
          {images.length > 0 && (
            <div className="relative mb-3 rounded-xl overflow-hidden group">
              {/* Scrollable Container */}
              <div
                ref={imageContainerRef}
                onScroll={handleScroll}
                className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide scroll-smooth"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {images.map((img, index) => (
                  <div
                    key={index}
                    className="flex-shrink-0 w-full aspect-[4/3] snap-start bg-gray-100"
                  >
                    <img
                      src={img}
                      alt={`Activity image ${index + 1}`}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>

              {/* Navigation Buttons (Show on hover) */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => scrollToImage(currentImageIndex - 1)}
                    disabled={currentImageIndex === 0}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={22} />
                  </button>

                  <button
                    onClick={() => scrollToImage(currentImageIndex + 1)}
                    disabled={currentImageIndex === images.length - 1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={22} />
                  </button>
                </>
              )}

              {/* Dots Indicator */}
              {images.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => scrollToImage(index)}
                      className={`w-2 h-2 rounded-full transition-all duration-200 ${
                        index === currentImageIndex
                          ? "bg-white scale-110"
                          : "bg-white/60 hover:bg-white/80"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Participants */}
          {(currentActivity.participants?.length ?? 0) > 0 && (
            <div className="flex items-center gap-1.5 mb-3">
              <div className="flex -space-x-2">
                {(currentActivity.participants || [])
                  .slice(0, 4)
                  .map((p, pi) => (
                    <div
                      key={pi}
                      style={{ zIndex: 4 - pi }}
                      className="w-6 h-6 rounded-full border-2 border-white bg-gray-200 overflow-hidden"
                    >
                      {p.avatar && (
                        <img
                          src={p.avatar}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      )}
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
                  className={`transition-all ${isLiked ? "fill-red-500 text-red-500 scale-110" : "group-hover:scale-110"}`}
                />
                <span className="text-xs font-semibold">
                  {currentActivity.likes?.length || 0}
                </span>
              </button>

              {/* Comment toggle with smooth animation */}
              <button
                onClick={() => setShowComments((v) => !v)}
                className="flex items-center gap-1.5 text-gray-400 hover:text-primary transition-colors group"
              >
                <MessageCircle
                  size={19}
                  className="group-hover:scale-110 transition-transform"
                />
                <span className="text-xs font-semibold">
                  {currentActivity.comments?.length || 0}
                </span>
                <div className="transition-transform duration-300">
                  {showComments ? (
                    <ChevronUp size={12} className="text-gray-300" />
                  ) : (
                    <ChevronDown size={12} className="text-gray-300" />
                  )}
                </div>
              </button>
            </div>

            {/* Join Button */}
            <button
              onClick={handleJoin}
              disabled={isJoining}
              className={`
                flex items-center gap-2 px-5 py-2 rounded-full font-semibold text-xs sm:text-sm
                transition-all active:scale-95
                ${
                  joinStatus === "joined" || isCreator
                    ? "bg-green-500 text-white hover:bg-green-600 shadow-md shadow-green-200"
                    : joinStatus === "pending"
                      ? "bg-amber-100 text-amber-700 border border-amber-200"
                      : "bg-gradient-to-br from-primary to-primary/80 text-white shadow-md shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5"
                }
              `}
            >
              {joinLabel()}
            </button>
          </div>

          {/* ── Inline Comments Panel with Smooth Animation ───────────────────── */}
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              showComments
                ? "max-h-[420px] opacity-100 mt-4"
                : "max-h-0 opacity-0"
            }`}
          >
            <div className="border-t border-gray-50 pt-4 space-y-3">
              {/* Comments List */}
              {(currentActivity.comments || []).length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">
                  No comments yet — be the first!
                </p>
              ) : (
                <div
                  ref={commentsContainerRef}
                  className="space-y-3 max-h-52 overflow-y-auto pr-1 custom-scroll"
                >
                  {currentActivity.comments.map((c, i) => (
                    <div key={c._id || i} className="flex gap-2.5">
                      <Avatar src={c.user?.avatar} size="sm" />
                      <div className="flex-1 bg-gray-50 rounded-2xl rounded-tl-none px-3 py-2">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="text-[12px] font-semibold text-gray-800">
                            {c.user?.name || "Unknown User"}
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

              {/* Comment Input */}
              <div className="flex gap-2 pt-1">
                <Avatar src={user?.avatar} size="sm" />
                <div className="flex-1 flex items-center gap-2 bg-gray-100 rounded-full px-4 py-1.5">
                  <input
                    ref={commentInputRef}
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && !e.shiftKey && handleComment()
                    }
                    placeholder="Write a comment…"
                    className="flex-1 bg-transparent outline-none text-[13px] text-gray-700 placeholder-gray-400"
                  />
                  <button
                    onClick={handleComment}
                    disabled={!commentText.trim() || isCommenting}
                    className="text-primary disabled:opacity-30 transition-opacity flex-shrink-0"
                  >
                    {isCommenting ? (
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send size={15} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
      {/* ── Edit Modal ──────────────────────────────────────────────────────── */}
      {isEditing && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center z-[100] p-0 sm:p-4 transition-opacity duration-300"
          onClick={closeEditModal}
        >
          <div
            className="bg-[var(--surface)] rounded-t-[2.5rem] sm:rounded-[2rem] w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border)]">
              <div>
                <h2 className="text-xl font-bold text-[var(--text)]">
                  Edit Activity
                </h2>
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  Update your activity details
                </p>
              </div>
              <button
                onClick={closeEditModal}
                className="p-2 text-[var(--muted)] hover:bg-[var(--surface2)] rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5 flex-1 overflow-y-auto">
              {/* Image Preview (View Only) */}
              {currentActivity.images?.length > 0 && (
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] mb-2">
                    Activity Images
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {currentActivity.images.slice(0, 3).map((img, index) => (
                      <div
                        key={index}
                        className="aspect-square bg-[var(--surface2)] rounded-2xl overflow-hidden border border-[var(--border)]"
                      >
                        <img
                          src={img}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                  {currentActivity.images.length > 3 && (
                    <p className="text-[10px] text-[var(--muted)] mt-1.5 text-center">
                      +{currentActivity.images.length - 3} more
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] mb-1.5">
                  Title
                </label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) =>
                    setEditForm({ ...editForm, title: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-[var(--surface2)] border border-[var(--border)] rounded-2xl focus:ring-4 focus:ring-[var(--primary)]/10 focus:border-[var(--primary)] focus:bg-white outline-none transition-all text-sm font-medium"
                  placeholder="What are you up to?"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] mb-1.5">
                  Description
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm({ ...editForm, description: e.target.value })
                  }
                  rows={4}
                  className="w-full px-4 py-3 bg-[var(--surface2)] border border-[var(--border)] rounded-2xl focus:ring-4 focus:ring-[var(--primary)]/10 focus:border-[var(--primary)] focus:bg-white outline-none transition-all text-sm resize-none leading-relaxed"
                  placeholder="Tell people more about it…"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] mb-1.5">
                  Tags (comma-separated) •{" "}
                  {editForm.interests.split(",").filter(Boolean).length} tags
                </label>
                <input
                  type="text"
                  value={editForm.interests}
                  onChange={(e) =>
                    setEditForm({ ...editForm, interests: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-[var(--surface2)] border border-[var(--border)] rounded-2xl focus:ring-4 focus:ring-[var(--primary)]/10 focus:border-[var(--primary)] focus:bg-white outline-none transition-all text-sm"
                  placeholder="coding, music, cricket…"
                />
              </div>
            </div>

            <div className="p-5 flex gap-3 border-t border-[var(--border)]">
              <Button
                variant="secondary"
                onClick={closeEditModal}
                className="flex-1 bg-[var(--surface)] border rounded-xl py-3 font-bold"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveEdit}
                disabled={
                  isSaving ||
                  !editForm.title.trim() ||
                  !editForm.description.trim()
                }
                className="flex-1 rounded-xl py-3 font-bold bg-[var(--accent)] text-white shadow-lg shadow-[var(--primary)]/25"
              >
                {isSaving ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Saving…
                  </span>
                ) : (
                  "Save changes"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ─────────────────────────────────────────────── */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-6 transition-opacity duration-300"
          onClick={closeDeleteModal}
        >
          <div
            className="bg-[var(--surface)] rounded-[2.5rem] w-full max-w-sm p-8 text-center shadow-2xl border border-[var(--border)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="w-18 h-18 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5 ring-8 ring-red-50/50"
              style={{ width: 72, height: 72 }}
            >
              <Trash2 size={30} className="text-red-500" />
            </div>
            <h3 className="text-xl font-black text-[var(--text)] mb-2">
              Delete activity?
            </h3>
            <p className="text-[var(--muted)] text-sm leading-relaxed mb-7">
              This will permanently remove the activity, all joins, and all chat
              messages.
            </p>
            <div className="flex flex-col gap-3">
              <Button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest bg-red-500 text-white shadow-lg shadow-red-200 hover:bg-red-600"
              >
                {isDeleting ? "Deleting…" : "Yes, delete it"}
              </Button>
              <Button
                variant="secondary"
                onClick={closeDeleteModal}
                className="w-full py-3.5 rounded-2xl font-bold text-sm text-[var(--muted)] hover:text-[var(--text2)]"
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
