// src/components/chat/ChatHeader.jsx
import { ArrowLeft, Phone, Video, MoreVertical } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Format lastSeen into a human-friendly string
function formatLastSeen(lastSeen) {
  if (!lastSeen) return null;
  const date = new Date(lastSeen);
  const now  = new Date();
  const diffMs   = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHrs  = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1)  return "last seen just now";
  if (diffMins < 60) return `last seen ${diffMins}m ago`;
  if (diffHrs  < 24) return `last seen ${diffHrs}h ago`;
  if (diffDays === 1) return "last seen yesterday";
  if (diffDays < 7)  return `last seen ${diffDays} days ago`;
  return `last seen ${date.toLocaleDateString([], { month: "short", day: "numeric" })}`;
}

export default function ChatHeader({ otherUser, isTyping, online, lastSeen, onBack }) {
  const navigate = useNavigate();
  const initial  = (otherUser?.name || "?")[0].toUpperCase();

  // Subtext priority: typing > online > lastSeen > username
  const renderSubtext = () => {
    if (isTyping) return <span className="text-emerald-400 animate-pulse">typing…</span>;
    if (online)   return <span className="text-emerald-400">Online</span>;
    const ls = formatLastSeen(lastSeen);
    if (ls)       return <span className="text-black/30">{ls}</span>;
    return <span className="text-black/30">@{otherUser?.username}</span>;
  };

  return (
    <div className="shrink-0 bg-white border-b border-black/5 px-4 py-3 flex items-center gap-3 z-10">
      {/* Back (mobile) */}
      <button
        onClick={onBack}
        className="p-2 hover:bg-white/8 rounded-xl transition text-black/60 hover:text-black md:hidden"
        aria-label="Go back"
      >
        <ArrowLeft size={20} />
      </button>

      {otherUser ? (
        <>
          {/* Avatar + info */}
          <div
            className="flex items-center gap-3 flex-1 cursor-pointer min-w-0"
            onClick={() => navigate(`/profile/${otherUser._id}`)}
          >
            <div className="relative shrink-0">
              {otherUser.avatar ? (
                <img
                  src={otherUser.avatar}
                  alt={otherUser.name}
                  className="w-10 h-10 rounded-xl object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-black font-bold text-sm">
                  {initial}
                </div>
              )}

              {/* Online dot — only when actually online (not just typing) */}
              {online && !isTyping && (
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-[#13131a] rounded-full shadow-sm shadow-emerald-500/60" />
              )}
            </div>

            <div className="min-w-0">
              <p className="font-semibold text-[15px] text-black truncate leading-tight">
                {otherUser.name}
              </p>
              <p className="text-xs truncate leading-tight mt-0.5">
                {renderSubtext()}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <button className="p-2 hover:bg-black/60 rounded-xl transition text-black/40 hover:text-white" aria-label="Voice call">
              <Phone size={18} />
            </button>
            <button className="p-2 hover:bg-black/60 rounded-xl transition text-black/40 hover:text-white" aria-label="Video call">
              <Video size={18} />
            </button>
            <button className="p-2 hover:bg-black/60 rounded-xl transition text-black/40 hover:text-white" aria-label="More options">
              <MoreVertical size={18} />
            </button>
          </div>
        </>
      ) : (
        /* Skeleton */
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-xl bg-white/5 animate-pulse" />
          <div className="space-y-2 flex-1">
            <div className="h-3.5 bg-white/8 rounded-full w-28 animate-pulse" />
            <div className="h-3 bg-white/5 rounded-full w-20 animate-pulse" />
          </div>
        </div>
      )}
    </div>
  );
}