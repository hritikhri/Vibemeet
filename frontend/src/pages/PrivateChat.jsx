// frontend/src/pages/PrivateChat.jsx
import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import api from '../lib/api';
import BottomNav from '../components/layout/BottomNav';
import Avatar from '../components/common/Avatar';
import { ArrowLeft, Send, Image as ImageIcon, X, Check } from 'lucide-react';
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
  const [isSendingImage, setIsSendingImage] = useState(false);

  const [selectedImage, setSelectedImage] = useState(null);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const messageIdsRef = useRef(new Set());

  // ====================== SOCKET SETUP ======================
  useEffect(() => {
    if (!otherUserId || !user?._id) return;

    const socket = io(SOCKET_URL, {
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 10000,
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
      if (messageIdsRef.current.has(msg._id)) return;
      messageIdsRef.current.add(msg._id);

      setMessages((prev) => {
        if (prev.some(m => m._id === msg._id)) return prev;
        return [...prev, msg];
      });

      if (msg.from !== user._id && socketRef.current) {
        socketRef.current.emit('markMessageAsDelivered', { messageId: msg._id });
      }
    });

    socket.on('messageDelivered', ({ messageId }) => {
      setMessages((prev) =>
        prev.map((msg) => (msg._id === messageId ? { ...msg, delivered: true } : msg))
      );
    });

    socket.on('messageRead', ({ messageId }) => {
      setMessages((prev) =>
        prev.map((msg) => (msg._id === messageId ? { ...msg, isRead: true } : msg))
      );
    });

    socket.on('typing', ({ isTyping: status }) => setIsTyping(status));

    socket.on('userOnlineStatus', ({ userId, isOnline, lastSeen: ls }) => {
      if (userId === otherUserId) {
        setOnline(isOnline);
        if (!isOnline && ls) setLastSeen(ls);
      }
    });

    const loadChatData = async () => {
      try {
        const [userRes, chatRes] = await Promise.all([
          api.get(`/users/${otherUserId}`),
          api.get(`/chats/private/${otherUserId}`),
        ]);
        setOtherUser(userRes.data);
        const loadedMessages = chatRes.data.messages || [];
        setMessages(loadedMessages);
        loadedMessages.forEach(msg => messageIdsRef.current.add(msg._id));
      } catch (err) {
        console.error("Failed to load chat data:", err);
      }
    };

    loadChatData();

    return () => {
      socket.disconnect();
      messageIdsRef.current.clear();
    };
  }, [otherUserId, user?._id]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Cleanup preview URL
  useEffect(() => {
    return () => {
      if (selectedImage?.previewUrl) URL.revokeObjectURL(selectedImage.previewUrl);
    };
  }, [selectedImage]);

  // ====================== DATE GROUPING HELPERS ======================
  const getDateLabel = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Reset time for comparison
    const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const yesterdayDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

    if (msgDate.getTime() === todayDate.getTime()) return "Today";
    if (msgDate.getTime() === yesterdayDate.getTime()) return "Yesterday";

    // Format as "22 Jan 2025"
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, msg) => {
    const dateKey = new Date(msg.createdAt).toDateString(); // e.g., "Thu Jan 22 2025"
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(msg);
    return groups;
  }, {});

  const sortedDateKeys = Object.keys(groupedMessages).sort((a, b) => 
    new Date(a) - new Date(b)
  );

  // ====================== IMAGE PREVIEW ======================
  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

    if (selectedImage?.previewUrl) URL.revokeObjectURL(selectedImage.previewUrl);

    const previewUrl = URL.createObjectURL(file);
    setSelectedImage({ file, previewUrl });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImagePreview = () => {
    if (selectedImage?.previewUrl) URL.revokeObjectURL(selectedImage.previewUrl);
    setSelectedImage(null);
  };

  // ====================== SEND MESSAGE ======================
  const sendMessage = async () => {
    if ((!newMessage.trim() && !selectedImage) || !socketRef.current) return;

    const tempId = `temp-${Date.now()}`;
    const text = newMessage.trim();

    const optimisticMsg = {
      _id: tempId,
      from: user._id,
      text: text || undefined,
      image: selectedImage ? URL.createObjectURL(selectedImage.file) : undefined,
      createdAt: new Date().toISOString(),
      status: 'sending',
      delivered: false,
      isRead: false,
      isMe: true,
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setNewMessage('');

    const currentImage = selectedImage;
    setSelectedImage(null);

    if (currentImage) {
      setIsSendingImage(true);
      const formData = new FormData();
      formData.append('image', currentImage.file);
      if (text) formData.append('text', text);

      try {
        const res = await api.post(`/chats/private/${otherUserId}/image`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        if (res.data?.message) {
          setMessages((prev) =>
            prev.map((msg) => (msg._id === tempId ? { ...res.data.message, isMe: true } : msg))
          );
        }
      } catch (err) {
        console.error("Image upload failed:", err);
        setMessages((prev) =>
          prev.map((msg) => (msg._id === tempId ? { ...msg, status: 'failed' } : msg))
        );
      } finally {
        setIsSendingImage(false);
        if (currentImage?.previewUrl) URL.revokeObjectURL(currentImage.previewUrl);
      }
    } else {
      socketRef.current.emit('sendPrivateMessage', { toUserId: otherUserId, text }, (response) => {
        if (response?.success && response.message) {
          setMessages((prev) =>
            prev.map((msg) => (msg._id === tempId ? { ...response.message, isMe: true } : msg))
          );
        } else {
          setMessages((prev) =>
            prev.map((msg) => (msg._id === tempId ? { ...msg, status: 'failed' } : msg))
          );
        }
      });
    }
  };

  const handleTyping = useCallback((e) => {
    const value = e.target.value;
    setNewMessage(value);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socketRef.current?.emit('typing', { toUserId: otherUserId, isTyping: true });

    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit('typing', { toUserId: otherUserId, isTyping: false });
    }, 1200);
  }, [otherUserId]);

  const goToProfile = () => {
    if (otherUser) navigate(`/profile/${otherUser._id}`);
  };

  const isMyMessage = (msg) => msg.isMe || msg.from === user?._id || msg.from?._id === user?._id;

  const renderMessageStatus = (msg) => {
    if (!isMyMessage(msg)) return null;

    if (msg.status === 'sending') return <span className="text-[10px] text-gray-400">sending...</span>;
    if (msg.status === 'failed') return <span className="text-[10px] text-red-500">× failed</span>;

    const isDelivered = msg.delivered || msg.isRead;
    const isRead = msg.isRead;

    return (
      <div className="flex items-center gap-0.5 text-[13px] mt-0.5">
        <Check size={13} className={`transition-all ${isRead ? 'text-blue-500' : isDelivered ? 'text-gray-400' : 'text-gray-300'}`} />
        {(isDelivered || isRead) && (
          <Check size={13} className={`-ml-1 transition-all ${isRead ? 'text-blue-500' : 'text-gray-400'}`} />
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-2xl mx-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b z-50 px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2">
          <ArrowLeft size={24} />
        </button>

        {otherUser && (
          <div onClick={goToProfile} className="flex items-center gap-3 flex-1 cursor-pointer hover:opacity-80 active:opacity-70">
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
                {isTyping ? <span className="text-primary font-medium ml-2">• typing...</span> :
                 online ? <span className="text-green-600 ml-2">• online</span> :
                 lastSeen && <span className="ml-2">• last seen {new Date(lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Messages Area with Date Groups */}
      <div className="flex-1 p-6 max-h-[70vh] overflow-y-auto space-y-8 bg-gray-50">
        {sortedDateKeys.map((dateKey) => (
          <div key={dateKey}>
            {/* Date Separator */}
            <div className="flex justify-center my-6">
              <div className="bg-white px-4 py-1 rounded-full text-xs font-medium text-gray-500 shadow-sm border border-gray-100">
                {getDateLabel(dateKey)}
              </div>
            </div>

            {/* Messages for this date */}
            <div className="space-y-6">
              {groupedMessages[dateKey].map((msg) => {
                const isMe = isMyMessage(msg);
                return (
                  <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className="flex gap-3 max-w-[80%]">
                      {!isMe && <Avatar src={otherUser?.avatar} size="sm" className="mt-1" />}
                      <div className={`px-5 py-3 rounded-3xl relative ${
                        isMe 
                          ? 'bg-primary text-white rounded-br-none' 
                          : 'bg-white shadow-sm rounded-bl-none'
                      }`}>
                        {msg.image ? (
                          <div className="relative mb-2">
                            <div className="absolute inset-0 bg-gray-200 rounded-2xl animate-pulse" />
                            <img 
                              src={msg.image} 
                              alt="sent" 
                              className="max-w-[150px] max-h-[150px] rounded-2xl mb-2 relative z-10"
                              onLoad={(e) => { e.target.previousSibling.style.display = 'none'; }}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.previousSibling.style.display = 'none';
                              }}
                            />
                          </div>
                        ) : (
                          <p className="text-[15px] leading-relaxed break-words">{msg.text}</p>
                        )}

                        <div className="flex items-center justify-end gap-2 mt-1">
                          <p className="text-[10px] opacity-70">
                            {new Date(msg.createdAt).toLocaleTimeString([], { 
                              hour: '2-digit', minute: '2-digit' 
                            })}
                          </p>
                          {renderMessageStatus(msg)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Image Preview */}
      {selectedImage && (
        <div className="px-4 pt-2 pb-1 bg-white border-t">
          <div className="relative inline-block">
            <img
              src={selectedImage.previewUrl}
              alt="preview"
              className="h-20 w-auto rounded-2xl object-cover border border-gray-200 shadow-sm"
            />
            <button
              onClick={removeImagePreview}
              className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">Tap send to share image</p>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t bg-white">
        <div className="flex gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={handleTyping}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
            placeholder="Type a message..."
            className="flex-1 bg-gray-100 rounded-2xl px-6 py-3.5 focus:outline-none focus:ring-2 focus:ring-primary text-[15px]"
            disabled={isSendingImage}
          />

          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImageSelect}
              className="hidden"
              disabled={isSendingImage}
            />
            <div className={`p-3.5 bg-gray-100 rounded-2xl hover:bg-gray-200 active:bg-gray-300 transition-all ${isSendingImage ? 'opacity-50 pointer-events-none' : ''}`}>
              <ImageIcon size={22} className="text-gray-600" />
            </div>
          </label>

          <Button 
            onClick={sendMessage} 
            disabled={(!newMessage.trim() && !selectedImage) || isSendingImage}
            className="px-6 flex items-center justify-center"
          >
            <Send size={20} />
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}