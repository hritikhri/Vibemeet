// frontend/src/pages/PrivateChat.jsx
import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import api from '../lib/api';
import BottomNav from '../components/layout/BottomNav';
import Avatar from '../components/common/Avatar';
import { ArrowLeft, Send, Image as ImageIcon } from 'lucide-react';
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
  const [uploading, setUploading] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);

  // ====================== SOCKET SETUP ======================
  useEffect(() => {
    if (!otherUserId || !user?._id) return;

    socket = io('http://localhost:5000');

    socket.on('connect', () => {
      socket.emit('authenticate', user._id);
      socket.emit('joinPrivateChat', otherUserId);
      socket.emit('getOnlineStatus', otherUserId);
    });

    socket.on('newPrivateMessage', (msg) => {
      setMessages(prev => {
        if (prev.some(m => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
    });

    socket.on('typing', ({ isTyping: status }) => {
      setIsTyping(status);
    });

    socket.on('userOnlineStatus', ({ userId, isOnline }) => {
      if (userId === otherUserId) setOnline(isOnline);
    });

    // Load chat data (persists on refresh)
    const loadChatData = async () => {
      try {
        const [userRes, chatRes] = await Promise.all([
          api.get(`/users/${otherUserId}`),
          api.get(`/chats/private/${otherUserId}`)
        ]);

        setOtherUser(userRes.data);
        setMessages(chatRes.data.messages || []);
      } catch (err) {
        console.error("Failed to load chat data:", err);
      }
    };

    loadChatData();

    return () => {
      if (socket) socket.disconnect();
    };
  }, [otherUserId, user?._id]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send Text Message
  const sendMessage = () => {
    if (!newMessage.trim() || !socket) return;

    const text = newMessage.trim();
    setNewMessage('');

    socket.emit('sendPrivateMessage', { toUserId: otherUserId, text });
  };

  // Send Image
  const sendImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const { data } = await api.post(`/chats/private/${otherUserId}/image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // The backend will broadcast the image message via socket
      console.log("Image uploaded:", data);
    } catch (err) {
      console.error("Image upload failed:", err);
      alert("Failed to send image");
    } finally {
      setUploading(false);
      fileInputRef.current.value = ''; // Reset input
    }
  };

  // Typing indicator
  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    socket.emit('typing', { toUserId: otherUserId, isTyping: true });

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing', { toUserId: otherUserId, isTyping: false });
    }, 1500);
  };

  const goToProfile = () => {
    if (otherUser) navigate(`/profile/${otherUser._id}`);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-2xl mx-auto">   {/* Compact width for sidebar */}

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
              {online && (
                <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
              )}
            </div>
            <div>
              <p className="font-medium">{otherUser.name}</p>
              <p className="text-xs text-gray-500">
                @{otherUser.username}
                {isTyping && <span className="text-primary ml-1">• typing...</span>}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-gray-50">
        {messages.map((msg, i) => {
          const isMe = msg.from === user?._id || msg.isMe;

          return (
            <div key={msg._id || i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className="flex gap-3 max-w-[75%]">
                {!isMe && <Avatar src={otherUser?.avatar} size="sm" className="mt-1" />}
                <div className={`px-5 py-3 rounded-3xl ${
                  isMe 
                    ? 'bg-primary text-white rounded-br-none' 
                    : 'bg-white shadow-sm rounded-bl-none'
                }`}>
                  {msg.image ? (
                    <img 
                      src={msg.image} 
                      alt="sent" 
                      className="max-w-full rounded-2xl mb-2" 
                    />
                  ) : (
                    <p className="text-[15px] leading-relaxed">{msg.text}</p>
                  )}
                  <p className="text-[10px] mt-1 opacity-70 text-right">
                    {new Date(msg.createdAt).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area with Image Upload */}
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

          {/* Image Upload Button */}
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={sendImage}
              className="hidden"
            />
            <div className="p-3 bg-gray-100 rounded-2xl hover:bg-gray-200 transition-all">
              <ImageIcon size={22} className="text-gray-600" />
            </div>
          </label>

          <Button 
            onClick={sendMessage} 
            disabled={!newMessage.trim()}
            className="px-6"
          >
            <Send size={20} />
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}