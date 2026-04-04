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

let socket;

export default function PrivateChat() {
  const { otherUserId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [otherUser, setOtherUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [online, setOnline] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // ==================== INITIAL SETUP ====================
  useEffect(() => {
    if (!user?._id) return;

    socket = io('http://localhost:5000', { reconnection: true });

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('authenticate', user._id);
      socket.emit('joinPrivateChat', { userId: otherUserId });
      socket.emit('getOnlineStatus', otherUserId);
    });

    socket.on('disconnect', () => setIsConnected(false));

    // Receive real message from other user
    socket.on('newPrivateMessage', (msg) => {
      setMessages(prev => {
        // Prevent duplicate
        if (prev.some(m => m._id === msg._id)) return prev;
        return [...prev, { ...msg, isMe: false }];
      });
    });

    // Load chat history + other user
    const loadData = async () => {
      try {
        const [userRes, chatRes] = await Promise.all([
          api.get(`/users/${otherUserId}`),
          api.get(`/chats/private/${otherUserId}`)
        ]);

        setOtherUser(userRes.data);
        setMessages(chatRes.data.messages || []);
      } catch (err) {
        console.error("Failed to load chat:", err);
      }
    };

    loadData();

    return () => socket?.disconnect();
  }, [otherUserId, user?._id]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ==================== SEND MESSAGE ====================
  const sendMessage = () => {
    if (!newMessage.trim() || !socket) return;

    const tempId = `temp-${Date.now()}`;

    const optimisticMsg = {
      _id: tempId,
      text: newMessage.trim(),
      from: user._id,
      isMe: true,
      createdAt: new Date()
    };

    // Optimistic update
    setMessages(prev => [...prev, optimisticMsg]);

    // Send to socket
    socket.emit('sendPrivateMessage', {
      toUserId: otherUserId,
      text: newMessage.trim()
    });

    setNewMessage('');
  };

  // ==================== TYPING ====================
  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    socket.emit('typing', { toUserId: otherUserId, isTyping: true });

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing', { toUserId: otherUserId, isTyping: false });
    }, 1500);
  };

  // Check if message belongs to current user
  const isMyMessage = (msg) => {
    return msg.isMe || msg.from === user?._id || msg.from?._id === user?._id;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b z-50 px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)}><ArrowLeft size={24} /></button>
        {otherUser && (
          <div className="flex items-center gap-3 flex-1">
            <div className="relative">
              <Avatar src={otherUser.avatar} size="md" />
              {online && <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />}
            </div>
            <div>
              <p className="font-medium">{otherUser.name}</p>
              <p className="text-xs text-gray-500">
                @{otherUser.username} {isTyping && <span className="text-primary">• typing...</span>}
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
              <div className={`max-w-[75%] px-5 py-3 rounded-3xl ${
                isMe 
                  ? 'bg-primary text-white rounded-br-none' 
                  : 'bg-white shadow-sm rounded-bl-none'
              }`}>
                <p className="text-[15px] leading-relaxed">{msg.text}</p>
                <p className="text-[10px] mt-1 opacity-70 text-right">
                  {new Date(msg.createdAt).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
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
          <Button onClick={sendMessage} disabled={!newMessage.trim()}>
            <Send size={20} />
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}        