// src/components/chat/MessageBubble.jsx
import { Reply, Download, Trash2, Check, CheckCheck } from "lucide-react";
import VoiceNotePlayer from "./VoiceNotePlayer";

export default function MessageBubble({
  message,
  currentUserId,
  otherUser,
  onReply,
  onDelete,
  onScrollToReply,
}) {
  const fromId = typeof message.from === "object" ? message.from?._id : message.from;
  const isMe = String(fromId) === String(currentUserId);

  const timeStr = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const renderStatus = () => {
    if (!isMe) return null;
    if (message.status === "read")
      return <CheckCheck size={12} className="text-emerald-400" />;
    if (message.status === "delivered")
      return <CheckCheck size={12} className="text-black/30" />;
    return <Check size={12} className="text-black/30" />;
  };

  if (message.deleted) {
    return (
      <div className={`flex ${isMe ? "justify-end" : "justify-start"} py-0.5`}>
        <p className="text-xs italic px-4 py-2 rounded-2xl bg-black/5 text-black/25 border border-black/5">
          🚫 Message deleted
        </p>
      </div>
    );
  }

  const replyPreviewText = message.replyTo?.text
    || (message.replyTo?.image ? "📷 Photo"
    : message.replyTo?.voiceNote ? "🎤 Voice message"
    : null);

  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"} group py-0.5`}>
      <div className={`flex gap-2 max-w-[78%] ${isMe ? "flex-row-reverse" : ""}`}>

        {/* Other user avatar */}
        {!isMe && (
          <div className="shrink-0 self-end mb-1">
            {otherUser?.avatar ? (
              <img
                src={otherUser.avatar}
                alt={otherUser.name}
                className="w-8 h-8 rounded-xl object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-black text-xs font-bold">
                {(otherUser?.name || "?")[0].toUpperCase()}
              </div>
            )}
          </div>
        )}

        {/* Bubble */}
        <div className="flex flex-col gap-0.5">
          {/* Reply reference */}
          {message.replyTo && replyPreviewText && (
            <div
              className={`
                text-xs px-3 py-1.5 rounded-xl cursor-pointer border-l-2 mb-0.5
                ${isMe
                  ? "bg-black/8 border-emerald-400/60 text-black/50 self-end"
                  : "bg-black/5 border-black/20 text-black/40 self-start"}
              `}
              onClick={() =>
                onScrollToReply?.(message.replyTo._id || message.replyTo)
              }
            >
              <span className="block text-[10px] uppercase tracking-wide font-semibold mb-0.5 opacity-60">
                ↩ Reply
              </span>
              <span className="truncate block max-w-[180px]">{replyPreviewText}</span>
            </div>
          )}

          <div
            className={`
              relative px-4 py-2.5 rounded-2xl
              ${isMe
                ? "bg-emerald-500 text-black rounded-br-sm"
                : "bg-[#F1F5F9] border border-black/6 text-black/90 rounded-bl-sm"}
            `}
          >
            {/* Image */}
            {message.image && (
              <div className="mb-2 rounded-xl overflow-hidden relative group/img">
                <img
                  src={message.image}
                  alt="sent"
                  className="max-h-64 w-full object-cover rounded-xl"
                  loading="lazy"
                />
                <a
                  href={message.image}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-lg opacity-0 group-hover/img:opacity-100 transition"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Download size={13} className="text-black" />
                </a>
              </div>
            )}

            {/* Voice note */}
            {message.voiceNote && (
              <VoiceNotePlayer
                src={message.voiceNote}
                isMe={isMe}
                duration={message.voiceDuration}
              />
            )}

            {/* Text */}
            {message.text && (
              <p className="text-[14px] leading-relaxed break-words">
                {message.text}
              </p>
            )}

            {/* Time + status */}
            <div
              className={`flex items-center justify-end gap-1 mt-1 ${
                isMe ? "text-black/50" : "text-black/20"
              }`}
            >
              <span className="text-[10px]">{timeStr}</span>
              {renderStatus()}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div
          className={`
            flex flex-col gap-1 self-end pb-1 opacity-0 group-hover:opacity-100
            transition-opacity duration-150
            ${isMe ? "items-end" : "items-start"}
          `}
        >
          <button
            onClick={onReply}
            className="p-1.5 hover:bg-black/10 rounded-lg cursor-pointer transition"
            title="Reply"
          >
            <Reply size={14} className="text-black/40" />
          </button>
          {isMe && (
            <button
              onClick={() => onDelete?.(message._id)}
              className="p-1.5 hover:bg-red-500/15 rounded-lg cursor-pointer transition"
              title="Delete"
            >
              <Trash2 size={14} className="text-red-400/60" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}