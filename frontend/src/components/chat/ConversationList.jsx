// src/components/chat/ConversationList.jsx
import { formatDistanceToNowStrict } from "date-fns";

function ConversationSkeleton() {
  return (
    <div className="flex items-center gap-3 px-3 py-3 animate-pulse">
      <div className="w-12 h-12 rounded-2xl bg-white/8 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 bg-white/8 rounded-full w-32" />
        <div className="h-3 bg-white/5 rounded-full w-48" />
      </div>
      <div className="h-3 bg-white/5 rounded-full w-10" />
    </div>
  );
}

function getLastMessagePreview(lastMessage) {
  if (!lastMessage) return "";
  if (lastMessage.deleted) return "🚫 Message deleted";
  if (lastMessage.voiceNote) return "🎤 Voice message";
  if (lastMessage.image && !lastMessage.text) return "📷 Photo";
  if (lastMessage.image && lastMessage.text) return `📷 ${lastMessage.text}`;
  return lastMessage.text || "";
}

function formatTime(dateStr) {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = diffMs / 60000;
    const diffHours = diffMs / 3600000;
    const diffDays = diffMs / 86400000;

    if (diffMins < 1) return "now";
    if (diffMins < 60) return `${Math.floor(diffMins)}m`;
    if (diffHours < 24) return `${Math.floor(diffHours)}h`;
    if (diffDays < 7) return `${Math.floor(diffDays)}d`;
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

export default function ConversationList({
  conversations,
  loading,
  currentUserId,
  activeId,
  onlineUsers,
  onSelect,
}) {
  if (loading) {
    return (
      <div>
        {Array.from({ length: 6 }).map((_, i) => (
          <ConversationSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!loading && conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-4">
        <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-2xl">
          💬
        </div>
        <p className="text-black/40 text-sm">No conversations yet</p>
      </div>
    );
  }

  return (
    <div>
      {conversations.map((convo, idx) => {
        const { otherUser, lastMessage, lastMessageAt, unreadCount } = convo;
        if (!otherUser) return null;

        const isActive = String(otherUser._id) === String(activeId);
        const isOnline = onlineUsers?.has(String(otherUser._id));
        const hasUnread = unreadCount > 0;
        const preview = getLastMessagePreview(lastMessage);
        const time = formatTime(lastMessageAt);
        const initial = (otherUser.name || "?")[0].toUpperCase();

        return (
          <button
            key={otherUser._id}
            onClick={() => onSelect(otherUser._id)}
            style={{ animationDelay: `${idx * 40}ms` }}
            className={`
              w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-all duration-200
              animate-[fadeSlideIn_0.3s_ease_both]
              ${isActive
                ? "bg-emerald-500/15 border border-emerald-500/20"
                : "hover:bg-white/5 border border-transparent"
              }
            `}
          >
            {/* Avatar */}
            <div className="relative shrink-0">
              {otherUser.avatar ? (
                <img
                  src={otherUser.avatar}
                  alt={otherUser.name}
                  className="w-12 h-12 rounded-2xl object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white font-bold text-base">
                  {initial}
                </div>
              )}

              {/* Online dot */}
              {isOnline && (
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 border-2 border-[#13131a] rounded-full shadow-sm shadow-emerald-500/50" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center justify-between mb-0.5">
                <span
                  className={`text-[14px] font-semibold truncate ${
                    hasUnread ? "text-black" : "text-black/80"
                  }`}
                >
                  {otherUser.name}
                </span>
                <span
                  className={`text-[11px] shrink-0 ml-2 ${
                    hasUnread ? "text-emerald-400 font-medium" : "text-black/25"
                  }`}
                >
                  {time}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <p
                  className={`text-[13px] truncate ${
                    hasUnread ? "text-black/70 font-medium" : "text-black/30"
                  }`}
                >
                  {lastMessage?.fromMe && !lastMessage?.deleted && (
                    <span className="text-black/20 mr-1">You:</span>
                  )}
                  {preview || <span className="italic">Say hello 👋</span>}
                </p>

                {/* Unread badge */}
                {hasUnread && (
                  <span className="shrink-0 min-w-[20px] h-5 px-1.5 bg-emerald-500 rounded-full text-[11px] font-bold text-white flex items-center justify-center shadow-sm shadow-emerald-500/50">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateX(-8px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}