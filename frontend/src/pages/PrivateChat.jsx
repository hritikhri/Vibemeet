// frontend/src/pages/PrivateChat.jsx
import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import api from '../lib/api';
import BottomNav from '../components/layout/BottomNav';
import Avatar from '../components/common/Avatar';
import { ArrowLeft, Send, Image as ImageIcon, X, MessageCircle } from 'lucide-react';
import Button from '../components/ui/Button';
import { useAuthStore } from '../store/useAuthStore';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now  = new Date();
  const diff = now - date;

  if (diff < 60_000)             return 'just now';
  if (diff < 3_600_000)          return `${Math.floor(diff / 60_000)}m`;
  if (diff < 86_400_000)         return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diff < 7 * 86_400_000)    return date.toLocaleDateString([], { weekday: 'short' });
  return date.toLocaleDateString([], { day: 'numeric', month: 'short' });
}

function lastMessagePreview(lastMessage, myId) {
  if (!lastMessage) return 'No messages yet';
  const prefix = lastMessage.fromMe ? 'You: ' : '';
  if (lastMessage.image && !lastMessage.text) return `${prefix}📷 Photo`;
  return `${prefix}${lastMessage.text || ''}`;
}

// ─── Chat List Item ───────────────────────────────────────────────────────────

function ChatListItem({ conversation, isActive, onClick }) {
  const { otherUser, lastMessage, unreadCount } = conversation;

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl cursor-pointer transition-all mb-1
        ${isActive ? 'bg-primary/10' : 'hover:bg-gray-50'}`}
    >
      <div className="relative flex-shrink-0">
        <Avatar src={otherUser.avatar} size="md" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className={`font-medium truncate ${unreadCount > 0 ? 'text-gray-900' : 'text-gray-700'}`}>
            {otherUser.name}
          </p>
          <span className="text-[11px] text-gray-400 flex-shrink-0">
            {formatTime(lastMessage?.createdAt)}
          </span>
        </div>
        <p className={`text-sm truncate mt-0.5 ${unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
          {lastMessagePreview(lastMessage)}
        </p>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PrivateChat() {
  const { otherUserId } = useParams();
  const navigate        = useNavigate();
  const { user }        = useAuthStore();

  // Chat list
  const [conversations,    setConversations]    = useState([]);
  const [chatsLoading,     setChatsLoading]     = useState(true);

  // Active chat
  const [otherUser,        setOtherUser]        = useState(null);
  const [messages,         setMessages]         = useState([]);
  const [newMessage,       setNewMessage]       = useState('');
  const [isTyping,         setIsTyping]         = useState(false);
  const [online,           setOnline]           = useState(false);
  const [isConnected,      setIsConnected]      = useState(false);
  const [imagePreview,     setImagePreview]     = useState(null);
  const [chatLoading,      setChatLoading]      = useState(false);

  const socketRef        = useRef(null);
  const messagesEndRef   = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef     = useRef(null);

  // ── Load conversation list ────────────────────────────────────────────────
  const loadConversations = useCallback(async () => {
    try {
      const { data } = await api.get('/chats');
      setConversations(data);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setChatsLoading(false);
    }
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  // ── Socket setup ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?._id) return;

    const socket = io(SOCKET_URL, { reconnection: true, reconnectionAttempts: 5 });
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('authenticate', { userId: user._id, name: user.name, avatar: user.avatar });
    });

    socket.on('disconnect', () => setIsConnected(false));

    socket.on('newPrivateMessage', (msg) => {
      // Add to current chat window if relevant
      if (
        otherUserId &&
        (msg.from === otherUserId || msg.from?._id === otherUserId ||
         msg.to   === otherUserId || msg.to?._id   === otherUserId)
      ) {
        setMessages(prev => [...prev, msg]);
      }

      // Refresh chat list so last message + unread count update
      loadConversations();
    });

    socket.on('typing', ({ isTyping: status, fromUserId }) => {
      if (fromUserId === otherUserId) setIsTyping(status);
    });

    socket.on('userOnlineStatus', ({ userId, isOnline }) => {
      if (userId === otherUserId) setOnline(isOnline);
    });

    return () => socket.disconnect();
  }, [user?._id, otherUserId, loadConversations]);

  // ── Load active chat messages ─────────────────────────────────────────────
  useEffect(() => {
    if (!otherUserId) return;

    const loadChat = async () => {
      setChatLoading(true);
      try {
        const [userRes, chatRes] = await Promise.all([
          api.get(`/users/${otherUserId}`),
          api.get(`/chats/private/${otherUserId}`),
        ]);
        setOtherUser(userRes.data);
        setMessages(chatRes.data.messages || []);

        // Clear unread badge for this conversation optimistically
        setConversations(prev =>
          prev.map(c =>
            c.otherUser._id === otherUserId ? { ...c, unreadCount: 0 } : c
          )
        );

        socketRef.current?.emit('joinPrivateChat', otherUserId);
        socketRef.current?.emit('getOnlineStatus', otherUserId);
      } catch (err) {
        console.error('Failed to load chat:', err);
      } finally {
        setChatLoading(false);
      }
    };

    loadChat();
  }, [otherUserId]);

  // ── Auto-scroll ───────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Send message ──────────────────────────────────────────────────────────
  const sendMessage = () => {
    if ((!newMessage.trim() && !imagePreview) || !socketRef.current) return;

    const tempId = `temp-${Date.now()}`;
    const text   = newMessage.trim();

    const optimisticMsg = {
      _id: tempId,
      from: user._id,
      text,
      image: imagePreview,
      createdAt: new Date().toISOString(),
      status: 'sending',
      isMe: true,
    };

    setMessages(prev => [...prev, optimisticMsg]);
    setNewMessage('');
    setImagePreview(null);

    socketRef.current.emit('sendPrivateMessage', { toUserId: otherUserId, text, image: imagePreview }, (response) => {
      if (response?.success) {
        setMessages(prev => prev.map(m => m._id === tempId ? response.message : m));
        loadConversations(); // refresh list with new last message
      } else {
        setMessages(prev => prev.map(m => m._id === tempId ? { ...m, status: 'failed' } : m));
      }
    });
  };

  // ── Typing handler ────────────────────────────────────────────────────────
  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socketRef.current?.emit('typing', { toUserId: otherUserId, isTyping: true });
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit('typing', { toUserId: otherUserId, isTyping: false });
    }, 1500);
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const isMyMessage = (msg) =>
    msg.isMe || msg.from === user?._id || msg.from?._id === user?._id;

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="h-screen bg-background pl -10 flex overflow-hidden">

      {/* ── LEFT SIDEBAR — Conversation List ── */}
      <div className={`
        flex flex-col border-r border-gray-100 bg-white
        w-full lg:w-96 flex-shrink-0
        ${otherUserId ? 'hidden lg:flex' : 'flex'}
      `}>
        {/* Header */}
        <div className="px-6 py-5 border-b">
          <h1 className="text-2xl font-bold  font-poppins text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
            Messages
          </h1>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-3">
          {chatsLoading ? (
            // Skeleton loader
            <div className="space-y-2 p-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-2/3" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16 text-gray-400">
              <MessageCircle size={48} className="mb-4 opacity-30" />
              <p className="font-medium">No conversations yet</p>
              <p className="text-sm mt-1">Find friends and start chatting</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <ChatListItem
                key={conv.otherUser._id}
                conversation={conv}
                isActive={conv.otherUser._id === otherUserId}
                onClick={() => navigate(`/chat/private/${conv.otherUser._id}`)}
              />
            ))
          )}
        </div>
      </div>

      {/* ── RIGHT — Chat Window ── */}
      <div className={`
        flex-1 flex flex-col min-w-0
        ${!otherUserId ? 'hidden lg:flex' : 'flex'}
      `}>

        {/* No chat selected (desktop empty state) */}
        {!otherUserId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <MessageCircle size={64} className="mb-4 opacity-20" />
            <p className="text-xl font-medium">Select a conversation</p>
            <p className="text-sm mt-1">Choose from your messages on the left</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="sticky top-0 bg-white border-b z-50 px-4 py-3 flex items-center gap-3">
              <button
                onClick={() => navigate('/chat')}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft size={22} />
              </button>

              {otherUser && (
                <div
                  onClick={() => navigate(`/profile/${otherUser._id}`)}
                  className="flex items-center gap-3 flex-1 cursor-pointer hover:opacity-80"
                >
                  <div className="relative">
                    <Avatar src={otherUser.avatar} size="md" />
                    {online && (
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{otherUser.name}</p>
                    <p className="text-xs text-gray-500">
                      {isTyping
                        ? <span className="text-primary font-medium">typing…</span>
                        : online ? 'Online' : `@${otherUser.username}`}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-gray-50">
              {chatLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <p className="text-sm">No messages yet. Say hi! 👋</p>
                </div>
              ) : (
                messages.map((msg, i) => {
                  const isMe = isMyMessage(msg);
                  return (
                    <div key={msg._id || i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className="flex gap-2 max-w-[78%]">
                        {!isMe && <Avatar src={otherUser?.avatar} size="sm" className="mt-auto mb-1 flex-shrink-0" />}
                        <div className={`px-4 py-2.5 rounded-3xl ${
                          isMe
                            ? 'bg-primary text-white rounded-br-sm'
                            : 'bg-white shadow-sm rounded-bl-sm'
                        }`}>
                          {msg.image && (
                            <img
                              src={msg.image}
                              alt="sent"
                              className="max-w-full rounded-2xl mb-1"
                              onError={(e) => e.target.style.display = 'none'}
                            />
                          )}
                          {msg.text && (
                            <p className="text-[15px] leading-relaxed">{msg.text}</p>
                          )}
                          <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-white/60' : 'text-gray-400'}`}>
                            {formatTime(msg.createdAt)}
                            {isMe && msg.status === 'failed' && (
                              <span className="ml-1 text-red-300">✕ Failed</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 md:p-4 border-t bg-white">
              {imagePreview && (
                <div className="mb-2 bg-gray-100 p-2.5 rounded-2xl flex items-center gap-3">
                  <img src={imagePreview} alt="preview" className="w-14 h-14 object-cover rounded-xl" />
                  <p className="flex-1 text-sm text-gray-600">Image ready to send</p>
                  <button onClick={() => setImagePreview(null)} className="p-1 hover:bg-gray-200 rounded-full">
                    <X size={16} />
                  </button>
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={handleTyping}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder="Type a message…"
                  className="flex-1 bg-gray-100 rounded-2xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-primary text-[15px]"
                />

                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <div className="p-3 bg-gray-100 rounded-2xl hover:bg-gray-200 transition-all">
                    <ImageIcon size={20} className="text-gray-600" />
                  </div>
                </label>

                <Button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() && !imagePreview}
                  className="px-5"
                >
                  <Send size={18} />
                </Button>
              </div>
            </div>

            <BottomNav />
          </>
        )}
      </div>
    </div>
  );
}