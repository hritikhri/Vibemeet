// src/components/chat/MessageList.jsx
import { useEffect, useRef, useCallback } from "react";
import MessageBubble from "./MessageBubble";
import TypingBubble from "./TypingBubble";

export default function MessageList({
  messages,
  currentUserId,
  otherUser,
  isTyping,
  setReplyTo,
  loading,
  onDeleteMessage,
}) {
  const messagesEndRef = useRef(null);
  const messageRefs = useRef({});

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const scrollToMessage = useCallback((messageId) => {
    const el = messageRefs.current[String(messageId)];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("msg-highlight");
      setTimeout(() => el.classList.remove("msg-highlight"), 1500);
    }
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0f0f13]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-7 h-7 border-2 border-white/10 border-t-emerald-500 rounded-full animate-spin" />
          <span className="text-white/25 text-sm">Loading messages…</span>
        </div>
      </div>
    );
  }

  // Group messages by date
  const grouped = [];
  let lastDate = null;
  for (const msg of messages) {
    const d = new Date(msg.createdAt).toDateString();
    if (d !== lastDate) {
      grouped.push({ type: "date", label: formatDateLabel(d), key: `date-${d}` });
      lastDate = d;
    }
    grouped.push({ type: "msg", msg, key: String(msg._id) });
  }

  return (
    <>
      <style>{`
        .msg-highlight { animation: msgFlash 1.5s ease-out; }
        @keyframes msgFlash {
          0%   { background: rgba(16,185,129,0.18); border-radius: 14px; }
          100% { background: transparent; }
        }
      `}</style>

      <div className="flex-1 overflow-y-auto bg-[#0f0f13] px-4 py-4 space-y-0.5">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-20">
            <span className="text-4xl">👋</span>
            <p className="text-white/30 text-sm">No messages yet — say hello!</p>
          </div>
        )}

        {grouped.map((item) => {
          if (item.type === "date") {
            return (
              <div key={item.key} className="flex items-center gap-3 py-3">
                <div className="flex-1 h-px bg-white/5" />
                <span className="text-[11px] text-white/20 font-medium px-2">
                  {item.label}
                </span>
                <div className="flex-1 h-px bg-white/5" />
              </div>
            );
          }
          return (
            <div
              key={item.key}
              ref={(el) => { if (el) messageRefs.current[item.key] = el; }}
            >
              <MessageBubble
                message={item.msg}
                currentUserId={currentUserId}
                otherUser={otherUser}
                onReply={() => setReplyTo(item.msg)}
                onDelete={onDeleteMessage}
                onScrollToReply={scrollToMessage}
              />
            </div>
          );
        })}

        {isTyping && <TypingBubble />}
        <div ref={messagesEndRef} />
      </div>
    </>
  );
}

function formatDateLabel(dateStr) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
}