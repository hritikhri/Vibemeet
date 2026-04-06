// frontend/src/pages/PrivateChat.jsx
import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import api from '../lib/api';
import BottomNav from '../components/layout/BottomNav';
import Avatar from '../components/common/Avatar';
import { ArrowLeft, Send } from 'lucide-react';
import Button from '../components/ui/Button';
import { useAuthStore } from '../store/useAuthStore';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export default function PrivateChat() {
  const { otherUserId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [otherUser, setOtherUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [online, setOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // ====================== SOCKET SETUP ======================
  useEffect(() => {
    if (!otherUserId || !user?._id) return;

    const socket = io(SOCKET_URL, {
      reconnection: true,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('authenticate', {
        userId: user._id,
        name: user.name,
        avatar: user.avatar,
      });
      socket.emit('joinPrivateChat', otherUserId);
      socket.emit('getOnlineStatus', otherUserId);
    });

    socket.on('disconnect', () => setIsConnected(false));

    socket.on('newPrivateMessage', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on('typing', ({ isTyping: status }) => {
      setIsTyping(status);
    });

    socket.on('userOnlineStatus', ({ userId, isOnline, lastSeen: ls }) => {
      if (userId === otherUserId) {
        setOnline(isOnline);
        if (!isOnline && ls) setLastSeen(ls);
      }
    });

    // Load user info + chat history
    const loadChatData = async () => {
      try {
        const [userRes, chatRes] = await Promise.all([
          api.get(`/users/${otherUserId}`),
          api.get(`/chats/private/${otherUserId}`),
        ]);

        setOtherUser(userRes.data);
        setMessages(chatRes.data.messages || []);
      } catch (err) {
        console.error("Failed to load chat data:", err);
      }
    };

    loadChatData();

    return () => {
      socket.disconnect();
    };
  }, [otherUserId, user?._id]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send Message with Optimistic Update
  const sendMessage = () => {
    if (!newMessage.trim() || !socketRef.current) return;

    const tempId = `temp-${Date.now()}`;
    const text = newMessage.trim();

    // Optimistic message
    const optimisticMsg = {
      _id: tempId,
      from: user._id,
      text,
      createdAt: new Date().toISOString(),
      status: 'sending',
      isMe: true,
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setNewMessage('');

    socketRef.current.emit('sendPrivateMessage', { toUserId: otherUserId, text }, (response) => {
      if (response?.success) {
        setMessages((prev) =>
          prev.map((msg) => (msg._id === tempId ? response.message : msg))
        );
      } else {
        setMessages((prev) =>
          prev.map((msg) => (msg._id === tempId ? { ...msg, status: 'failed' } : msg))
        );
      }
    });
  };

  // Typing Handler
  const handleTyping = (e) => {
    const value = e.target.value;
    setNewMessage(value);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    socketRef.current?.emit('typing', { toUserId: otherUserId, isTyping: true });

    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit('typing', { toUserId: otherUserId, isTyping: false });
    }, 1500);
  };

  const goToProfile = () => {
    if (otherUser) navigate(`/profile/${otherUser._id}`);
  };

  const isMyMessage = (msg) => {
    return msg.isMe || msg.from === user?._id || msg.from?._id === user?._id;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-2xl mx-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b z-50 px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2">
          <ArrowLeft size={24} />
        </button>

        {otherUser && (
          <div
            onClick={goToProfile}
            className="flex items-center gap-3 flex-1 cursor-pointer hover:opacity-80"
          >
            <div className="relative">
              <Avatar src={otherUser.avatar} size="md" />
              {online ? (
                <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
              ) : lastSeen && (
                <div className="absolute bottom-0 right-0 w-4 h-4 bg-gray-400 rounded-full border-2 border-white" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{otherUser.name}</p>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                @{otherUser.username || 'user'}
                {isTyping ? (
                  <span className="text-primary font-medium ml-2">• typing...</span>
                ) : online ? (
                  <span className="text-green-600 ml-2">• online</span>
                ) : lastSeen ? (
                  <span className="ml-2">
                    • last seen {new Date(lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                ) : null}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-gray-50">
        {messages.map((msg, i) => {
          const isMe = isMyMessage(msg);
          return (
            <div key={msg._id || i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className="flex gap-3 max-w-[80%]">
                {!isMe && <Avatar src={otherUser?.avatar} size="sm" className="mt-1" />}
                <div className={`px-5 py-3 rounded-3xl ${
                  isMe ? 'bg-primary text-white rounded-br-none' : 'bg-white shadow-sm rounded-bl-none'
                }`}>
                  <p className="text-[15px] leading-relaxed">{msg.text}</p>
                  <p className="text-[10px] mt-1 opacity-70 text-right">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-white">
        <div className="flex gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={handleTyping}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 bg-gray-100 rounded-2xl px-6 py-3.5 focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <Button onClick={sendMessage} disabled={!newMessage.trim()} className="px-6">
            <Send size={20} />
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}