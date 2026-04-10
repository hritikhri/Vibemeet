// frontend/src/pages/ActivityDetail.jsx
import { Heart, MessageCircle, Calendar, MapPin, ArrowLeft, Send, Users, X, Image as ImageIcon } from 'lucide-react';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import io from 'socket.io-client';
import api from '../lib/api';
import BottomNav from '../components/layout/BottomNav';
import Avatar from '../components/common/Avatar';
import Button from '../components/ui/Button';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export default function ActivityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [activity, setActivity] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [onlineCount, setOnlineCount] = useState(1);
  const [onlineUsersList, setOnlineUsersList] = useState([]);
  const [showOnlineModal, setShowOnlineModal] = useState(false);

  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [uploading, setUploading] = useState(false);

  // New states for image preview (only added these)
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);

  // ====================== SOCKET CONNECTION ======================
  useEffect(() => {
    const socket = io(SOCKET_URL, {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      if (user) {
        socket.emit('authenticate', {
          userId: user._id,
          name: user.name,
          avatar: user.avatar,
        });
      }
      socket.emit('joinActivity', id);
    });

    socket.on('disconnect', () => setIsConnected(false));

    socket.on('activityOnlineCount', ({ activityId, count }) => {
      if (activityId === id) setOnlineCount(count);
    });

    socket.on('activityOnlineUsers', ({ activityId, users }) => {
      if (activityId === id) setOnlineUsersList(users);
    });

    socket.on('newMessage', (msg) => {
      setMessages((prev) => {
        if (prev.some((m) => m._id === msg._id)) return prev;
        return [...prev, { ...msg, status: 'sent' }];
      });
    });

    socket.on('typing', ({ name, isTyping }) => {
      setTypingUsers((prev) => {
        const newSet = new Set(prev);
        if (isTyping) newSet.add(name || 'Someone');
        else newSet.delete(name || 'Someone');
        return newSet;
      });
    });
                                  
    return () => {
      socket.disconnect();
    };
  }, [id, user]);

  // ====================== FETCH ACTIVITY ======================
  const fetchActivity = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      const { data } = await api.get(`/activities/${id}`);
      setActivity(data);
      setLiked(data.likes?.some((like) => like.toString() === user._id));
      const normalized = (data.messages || []).map((msg) => ({
        ...msg,
        status: 'sent',
      }));
      setMessages(normalized);
    } catch (err) {
      console.error('Failed to load activity:', err);
      setError('Failed to load activity. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ====================== HELPERS ======================
  const isMyMessage = (msg) => {
    if (!msg || !user) return false;
    return (msg.sender?._id || msg.sender)?.toString() === user._id?.toString();
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return 'Just now';
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? 'Just now' : date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // ====================== SEND MESSAGE (unchanged) ======================
  const sendMessage = () => {
    if ((!newMessage.trim() && !imagePreview) || !socketRef.current) return;

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    
    const optimisticMsg = {
      _id: tempId,
      sender: { _id: user._id, name: user.name, avatar: user.avatar },
      text: newMessage.trim(),
      image: imagePreview,           // include preview image
      createdAt: new Date().toISOString(),
      status: 'sending',
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setNewMessage('');
    setImagePreview(null);           // clear preview after send
    setSelectedImage(null);

    // Send text + image together
    socketRef.current.emit('sendMessage', { 
      activityId: id, 
      text: newMessage.trim(),
      image: imagePreview 
    }, (response) => {
      if (response?.success) {
        setMessages((prev) =>
          prev.map((msg) => msg._id === tempId ? { ...response.message, status: 'sent' } : msg)
        );
      } else {
        setMessages((prev) =>
          prev.map((msg) => msg._id === tempId ? { ...msg, status: 'failed' } : msg)
        );
      }
    });
  };

  // New: Handle Image Selection + Preview (only added this)
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedImage(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target.result);   // base64 preview
    };
    reader.readAsDataURL(file);
  };

  // Remove preview
  const removeImagePreview = () => {
    setImagePreview(null);
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Typing Handler (unchanged)
  const handleTyping = () => {
    if (!socketRef.current) return;

    socketRef.current.emit('typing', { 
      activityId: id, 
      isTyping: true 
    });

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current.emit('typing', { activityId: id, isTyping: false });
    }, 1300);
  };

  // ====================== RENDER ======================
  if (loading) return <div className="min-h-screen flex items-center justify-center text-lg">Loading vibe...</div>;

  if (error || !activity) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6">
        <p className="text-red-500">{error || 'Activity not found'}</p>
        <Button onClick={fetchActivity}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header - unchanged */}
      <div className="sticky top-0 bg-white border-b z-50">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-xl">
            <ArrowLeft size={24} />
          </button>

          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-xl truncate">{activity.title}</h1>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
              {isConnected ? 'Live • Everyone can see messages' : 'Connecting...'}
            </div>
          </div>

          <button
            onClick={() => setShowOnlineModal(true)}
            className="flex items-center gap-2 px-5 py-2 bg-gray-100 hover:bg-gray-200 rounded-2xl text-sm font-medium transition-all"
          >
            <Users size={19} />
            <span>{onlineCount} online</span>
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 pt-6 space-y-6">
        {/* Activity Info - unchanged */}
        <div className="bg-white rounded-3xl p-6 shadow-soft">
          <div onClick={() => navigate(`/profile/${activity.creator._id}`)} className="flex items-center gap-4 cursor-pointer mb-6 hover:opacity-80">
            <Avatar src={activity.creator.avatar} size="lg" />
            <div>
              <p className="font-medium">{activity.creator.name}</p>
              <p className="text-xs text-gray-500">Organizer</p>
            </div>
          </div>

          <h2 className="text-2xl font-semibold mb-3">{activity.title}</h2>
          <p className="text-gray-700 mb-6 leading-relaxed">{activity.description}</p>

          <div className="flex gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-primary" />
              {new Date(activity.time).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
            <div className="flex items-center gap-2">
              <MapPin size={18} className="text-primary" />
              {activity.distance?.toFixed(1) || '5'} km away
            </div>
          </div>
        </div>

        {/* Action Buttons - unchanged */}
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setLiked(!liked)} className="flex-1 flex items-center justify-center gap-2">
            <Heart size={22} className={liked ? 'fill-red-500 text-red-500' : ''} />
            Like ({activity.likes?.length || 0})
          </Button>
          <Button className="flex-1">Join Vibe</Button>
        </div>

        {/* Group Chat */}
        <div className="bg-white rounded-3xl shadow-soft overflow-hidden flex flex-col h-[520px]">
          <div className="px-6 py-4 border-b font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle size={20} className="text-primary" />
              Group Chat
            </div>
            {typingUsers.size > 0 && (
              <div className="text-xs text-primary animate-pulse">
                {Array.from(typingUsers).join(', ')} typing...
              </div>
            )}
          </div>

          {/* Messages Area - unchanged (image already supported) */}
          <div className="flex-1 p-6 overflow-y-auto bg-gray-50 space-y-6">
            {messages.map((msg, index) => {
              const isMine = isMyMessage(msg);
              const key = msg._id || `msg-${index}`;

              return (
                <div key={key} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex gap-3 max-w-[78%] ${isMine ? 'flex-row-reverse' : ''}`}>
                    {!isMine && (
                      <div className="flex-shrink-0 pt-1">
                        <Avatar src={msg.sender?.avatar} size="sm" />
                      </div>
                    )}

                    <div className="flex flex-col">
                      {!isMine && msg.sender?.name && (
                        <p className="text-xs text-gray-500 mb-1 ml-1">{msg.sender.name}</p>
                      )}

                      <div className={`px-5 py-3 rounded-3xl text-[15px] leading-relaxed
                        ${isMine ? 'bg-primary text-white rounded-br-none' : 'bg-white shadow-sm rounded-bl-none border border-gray-100'}`}>

                        {msg.image ? (
                          <img 
                            src={msg.image} 
                            alt="group image" 
                            className="max-w-full rounded-2xl mb-2" 
                          />
                        ) : (
                          <p>{msg.text}</p>
                        )}
                      </div>

                      <p className={`text-[10px] text-gray-400 mt-1 px-2 ${isMine ? 'text-right' : ''}`}>
                        {formatTime(msg.createdAt)}
                        {isMine && (
                          <span className="ml-2">
                            {msg.status === 'sending' && '⋯'}
                            {msg.status === 'sent' && '✓'}
                            {msg.status === 'failed' && '✕'}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area with Image Preview */}
          <div className="p-4 border-t bg-white">
            {/* Image Preview (shown above input when selected) */}
            {imagePreview && (
              <div className="mb-3 bg-gray-100 p-3 rounded-2xl flex items-center gap-3">
                <img 
                  src={imagePreview} 
                  alt="preview" 
                  className="w-16 h-16 object-cover rounded-xl" 
                />
                <div className="flex-1 text-sm text-gray-600">Image selected</div>
                <button 
                  onClick={removeImagePreview}
                  className="p-1 hover:bg-gray-200 rounded-full"
                >
                  <X size={18} />
                </button>
              </div>
            )}

            <div className="flex gap-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  handleTyping();
                }}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
                placeholder="Type a message... (Enter to send)"
                className="flex-1 bg-gray-100 rounded-2xl px-6 py-3.5 focus:outline-none focus:ring-2 focus:ring-primary text-base"
              />

              {/* Image Upload Button */}
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                  className="hidden"
                  disabled={uploading}
                />
                <div className={`p-3.5 bg-gray-100 rounded-2xl hover:bg-gray-200 transition-all ${uploading ? 'opacity-50' : ''}`}>
                  <ImageIcon size={22} className="text-gray-600" />
                </div>
              </label>

              <Button onClick={sendMessage} disabled={!newMessage.trim() && !imagePreview} className="px-6">
                <Send size={20} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Online Users Modal - unchanged */}
      {showOnlineModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl w-full max-w-md max-h-[85vh] overflow-hidden shadow-2xl">
            <div className="px-6 py-5 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users size={26} className="text-primary" />
                <div>
                  <p className="font-semibold text-xl">Online in this Vibe</p>
                  <p className="text-sm text-gray-500">{onlineCount} people here right now</p>
                </div>
              </div>
              <button onClick={() => setShowOnlineModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X size={26} />
              </button>
            </div>

            <div className="p-3 max-h-[62vh] overflow-y-auto">
              {onlineUsersList.length > 0 ? (
                onlineUsersList.map((u, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-2xl mx-2 my-1">
                    <Avatar src={u.avatar} size="lg" />
                    <div>
                      <p className="font-medium text-lg">{u.name}</p>
                      <p className="text-green-600 text-sm flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
                        Online now
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-16 text-gray-500">No one is online at the moment</div>
              )}
            </div>

            <div className="p-4 border-t bg-white">
              <Button onClick={() => setShowOnlineModal(false)} className="w-full" variant="secondary">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}