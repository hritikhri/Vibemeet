// src/pages/ChatLayout.jsx
import { useEffect, useState, useRef, useCallback } from "react";
import ConversationList from "../components/chat/ConversationList";
import { useParams, useNavigate } from "react-router-dom";
import MessageList from "../components/chat/MessageList";
import BottomNav from "../components/layout/BottomNav";
import ChatHeader from "../components/chat/ChatHeader";
import { useAuthStore } from "../store/useAuthStore";
import ChatInput from "../components/chat/ChatInput";
import api from "../lib/api";

export default function ChatLayout() {
  const { socket, user } = useAuthStore();
  const { otherUserId } = useParams();
  const navigate = useNavigate();

  const [conversations, setConversations]   = useState([]);
  const [convoLoading, setConvoLoading]     = useState(true);
  const [onlineUsers,  setOnlineUsers]      = useState(new Set());

  const [messages,     setMessages]         = useState([]);
  const [otherUser,    setOtherUser]        = useState(null);
  const [isTyping,     setIsTyping]         = useState(false);
  const [online,       setOnline]           = useState(false);
  const [lastSeen,     setLastSeen]         = useState(null);
  const [loading,      setLoading]          = useState(false);
  const [newMessage,   setNewMessage]       = useState("");
  const [replyTo,      setReplyTo]          = useState(null);
  const [imagePreview, setImagePreview]     = useState(null);
  const [imageFile,    setImageFile]        = useState(null);
  const [sending,      setSending]          = useState(false);
  const [searchQuery,  setSearchQuery]      = useState("");

  // Safety-net: auto-clear typing if isTyping=false never arrives
  const typingClearTimer   = useRef(null);
  // Debounce: emit isTyping=false after user stops typing
  const stopTypingDebounce = useRef(null);

  // ── Conversations ───────────────────────────────────────────────────────────
  const loadConversations = useCallback(async () => {
    setConvoLoading(true);
    try {
      const { data } = await api.get("/chats");
      setConversations(data);
    } catch (err) {
      console.error(err);
    } finally {
      setConvoLoading(false);
    }
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  // ── Active chat ─────────────────────────────────────────────────────────────
  const loadChat = useCallback(async () => {
    if (!otherUserId) return;
    setLoading(true);
    setMessages([]);
    setIsTyping(false);
    setOnline(false);
    setLastSeen(null);
    if (typingClearTimer.current) clearTimeout(typingClearTimer.current);

    try {
      const [chatRes, userRes] = await Promise.all([
        api.get(`${import.meta.env.VITE_SOCKET_URL}/chats/private/${otherUserId}`),
        api.get(`${import.meta.env.VITE_SOCKET_URL}/users/${otherUserId}`),
      ]);
      setMessages(chatRes.data.messages || []);
      setOtherUser(userRes.data);
      if (userRes.data?.lastSeen) setLastSeen(userRes.data.lastSeen);

      setConversations((prev) =>
        prev.map((c) =>
          String(c.otherUser._id) === String(otherUserId)
            ? { ...c, unreadCount: 0 }
            : c
        )
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [otherUserId]);

  useEffect(() => { loadChat(); }, [loadChat]);

  // ── Global socket (sidebar updates) ────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const onOnlineStatus = ({ userId, online: isOnline }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        if (isOnline) next.add(String(userId));
        else next.delete(String(userId));
        return next;
      });
    };

    const onGlobalNewMsg = (msg) => {
      setConversations((prev) => {
        const fromId    = String(typeof msg.from === "object" ? msg.from._id : msg.from);
        const toId      = String(typeof msg.to   === "object" ? msg.to._id   : msg.to);
        const partnerId = fromId === String(user?._id) ? toId : fromId;
        const isCurrent = String(otherUserId) === partnerId;
        const isFromMe  = fromId === String(user?._id);
        const existing  = prev.find((c) => String(c.otherUser._id) === partnerId);

        const updated = {
          otherUser: existing?.otherUser || { _id: partnerId },
          lastMessage: {
            text: msg.text, image: msg.image,
            voiceNote: msg.voiceNote, createdAt: msg.createdAt, fromMe: isFromMe,
          },
          lastMessageAt: msg.createdAt,
          unreadCount: isCurrent || isFromMe ? 0 : (existing?.unreadCount || 0) + 1,
        };
        return [updated, ...prev.filter((c) => String(c.otherUser._id) !== partnerId)];
      });
    };

    socket.on("userOnlineStatus",  onOnlineStatus);
    socket.on("newPrivateMessage", onGlobalNewMsg);
    return () => {
      socket.off("userOnlineStatus",  onOnlineStatus);
      socket.off("newPrivateMessage", onGlobalNewMsg);
    };
  }, [socket, user?._id, otherUserId]);

  // ── Per-chat socket ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket || !otherUserId) return;

    socket.emit("joinPrivateChat",      otherUserId);
    socket.emit("getOnlineStatus",      otherUserId);
    socket.emit("markConversationRead", { fromUserId: otherUserId });

    // ── TYPING — with safety-net auto-clear ────────────────────────────────
    const onTyping = ({ fromUserId, isTyping: typing }) => {
      if (String(fromUserId) !== String(otherUserId)) return;

      // Always reset the safety-net timer
      if (typingClearTimer.current) clearTimeout(typingClearTimer.current);

      if (typing) {
        setIsTyping(true);
        // If we never receive a stop event, clear after 4 s
        typingClearTimer.current = setTimeout(() => setIsTyping(false), 4000);
      } else {
        // Explicit stop received — clear immediately
        setIsTyping(false);
      }
    };

    // ── ONLINE STATUS with lastSeen ────────────────────────────────────────
    const onOnlineStatus = ({ userId, online: isOnline, lastSeen: ls }) => {
      if (String(userId) !== String(otherUserId)) return;
      setOnline(isOnline ?? false);
      if (!isOnline && ls) setLastSeen(ls);
      if (isOnline)        setLastSeen(null);
    };

    const onNewMessage = (msg) => {
      const fromId = String(typeof msg.from === "object" ? msg.from?._id : msg.from);
      const toId   = String(typeof msg.to   === "object" ? msg.to?._id   : msg.to);
      if (fromId !== String(otherUserId) && toId !== String(otherUserId)) return;
      setMessages((prev) => {
        if (prev.some((m) => String(m._id) === String(msg._id))) return prev;
        return [...prev, msg];
      });
      if (fromId === String(otherUserId))
        socket.emit("markMessageAsRead", { messageId: msg._id });
    };

    const onMessageRead      = ({ messageId }) =>
      setMessages((prev) => prev.map((m) =>
        String(m._id) === String(messageId) ? { ...m, status: "read" } : m));

    const onMessageDelivered = ({ messageId }) =>
      setMessages((prev) => prev.map((m) =>
        String(m._id) === String(messageId) ? { ...m, status: "delivered" } : m));

    const onConversationRead = ({ byUserId }) => {
      if (String(byUserId) !== String(otherUserId)) return;
      setMessages((prev) => prev.map((m) => {
        const fid = String(typeof m.from === "object" ? m.from?._id : m.from);
        return fid === String(user?._id) ? { ...m, status: "read" } : m;
      }));
    };

    const onMessageDeleted = ({ messageId }) =>
      setMessages((prev) => prev.map((m) =>
        String(m._id) === String(messageId) ? { ...m, deleted: true, text: "" } : m));

    socket.on("newPrivateMessage",  onNewMessage);
    socket.on("messageRead",        onMessageRead);
    socket.on("messageDelivered",   onMessageDelivered);
    socket.on("conversationRead",   onConversationRead);
    socket.on("typing",             onTyping);
    socket.on("userOnlineStatus",   onOnlineStatus);
    socket.on("messageDeleted",     onMessageDeleted);

    return () => {
      if (typingClearTimer.current)   clearTimeout(typingClearTimer.current);
      if (stopTypingDebounce.current) clearTimeout(stopTypingDebounce.current);
      socket.off("newPrivateMessage",  onNewMessage);
      socket.off("messageRead",        onMessageRead);
      socket.off("messageDelivered",   onMessageDelivered);
      socket.off("conversationRead",   onConversationRead);
      socket.off("typing",             onTyping);
      socket.off("userOnlineStatus",   onOnlineStatus);
      socket.off("messageDeleted",     onMessageDeleted);
    };
  }, [socket, otherUserId, user?._id]);

  // ── Typing emit (debounced stop) ────────────────────────────────────────────
  const handleTyping = (value) => {
    setNewMessage(value);
    if (!socket || !otherUserId) return;

    if (value.length > 0) {
      socket.emit("typing", { toUserId: otherUserId, isTyping: true });

      // Debounce stop: emit isTyping=false 1.5 s after last keystroke
      if (stopTypingDebounce.current) clearTimeout(stopTypingDebounce.current);
      stopTypingDebounce.current = setTimeout(() => {
        socket.emit("typing", { toUserId: otherUserId, isTyping: false });
      }, 1500);
    } else {
      // Field cleared — stop immediately
      if (stopTypingDebounce.current) clearTimeout(stopTypingDebounce.current);
      socket.emit("typing", { toUserId: otherUserId, isTyping: false });
    }
  };

  // ── Send ────────────────────────────────────────────────────────────────────
  const sendMessage = async () => {
    if ((!newMessage.trim() && !imagePreview) || sending) return;
    if (!socket) return;

    // Stop typing immediately on send
    if (stopTypingDebounce.current) clearTimeout(stopTypingDebounce.current);
    socket.emit("typing", { toUserId: otherUserId, isTyping: false });

    setSending(true);
    try {
      if (imageFile) {
        const fd = new FormData();
        fd.append("image", imageFile);
        if (newMessage.trim()) fd.append("text", newMessage.trim());
        if (replyTo?._id)      fd.append("replyTo", replyTo._id);
        await api.post(`/chats/private/${otherUserId}/image`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setNewMessage(""); setImagePreview(null); setImageFile(null); setReplyTo(null);
        return;
      }

      socket.emit(
        "sendPrivateMessage",
        { toUserId: otherUserId, text: newMessage.trim(), replyTo: replyTo?._id ?? null },
        (res) => {
          if (res?.success)
            setMessages((prev) =>
              prev.some((m) => String(m._id) === String(res.message._id))
                ? prev
                : [...prev, res.message]
            );
        }
      );
      setNewMessage(""); setReplyTo(null);
    } finally {
      setSending(false);
    }
  };

  const deleteMessage = useCallback((messageId) => {
    if (!socket) return;
    socket.emit("deletePrivateMessage", { messageId }, (res) => {
      if (res?.success)
        setMessages((prev) =>
          prev.map((m) =>
            String(m._id) === String(messageId) ? { ...m, deleted: true, text: "" } : m
          )
        );
    });
  }, [socket]);

  const handleImageSelect = (file) => {
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const filtered = conversations.filter(
    (c) =>
      c.otherUser?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.otherUser?.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const hasActiveChat = !!otherUserId;

  return (
    <div className="flex h-screen overflow-hidden">

      {/* LEFT SIDEBAR */}
      <aside className={`flex flex-col border-r border-white/5 bg-white-900 dark::bg-[#13131a] transition-all duration-300 ${hasActiveChat ? "hidden md:flex md:w-[340px] lg:w-[380px]" : "flex w-full md:w-[340px] lg:w-[380px]"}`}>
        <div className="px-5 pt-6 pb-4">
          <div className="flex items-center justify-between mb-5">
            <h1 className="text-xl font-bold text-green-500 tracking-tight">Messages</h1>
            <button className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 transition text-white/60 hover:text-white">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
          <div className="relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-black/25" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="m21 21-4.35-4.35"/>
            </svg>
            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations…"
              className="w-full bg-black/5 border border-white/8 rounded-xl pl-10 pr-4 py-2.5 text-sm text-black placeholder-black/25 focus:outline-none focus:border-emerald-500/50 transition" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-3 pb-24 md:pb-4 space-y-0.5">
          <ConversationList
            conversations={filtered} loading={convoLoading}
            currentUserId={user?._id} activeId={otherUserId}
            onlineUsers={onlineUsers} onSelect={(id) => navigate(`/chat/${id}`)} />
        </div>
      </aside>

      {/* RIGHT PANEL */}
      <main className={`flex-1 flex flex-col min-w-0 ${!hasActiveChat ? "hidden md:flex" : "flex"}`}>
        {hasActiveChat ? (
          <>
            <ChatHeader
              otherUser={otherUser} isTyping={isTyping}
              online={online || onlineUsers.has(String(otherUserId))}
              lastSeen={lastSeen} onBack={() => navigate("/chat")} />
            <MessageList
              messages={messages} currentUserId={user?._id} otherUser={otherUser}
              isTyping={isTyping} replyTo={replyTo} setReplyTo={setReplyTo}
              loading={loading} onDeleteMessage={deleteMessage} />
            <ChatInput
              newMessage={newMessage} setNewMessage={handleTyping}
              imagePreview={imagePreview}
              setImagePreview={(v) => { setImagePreview(v); if (!v) setImageFile(null); }}
              replyTo={replyTo} onCancelReply={() => setReplyTo(null)}
              onSend={sendMessage} onImageSelect={handleImageSelect} sending={sending} />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 px-8">
            <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 flex items-center justify-center mb-2">
              <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="text-emerald-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <p className="text-black/80 font-semibold text-lg">Your messages</p>
            <p className="text-black/30 text-sm max-w-xs">Select a conversation to start chatting</p>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}