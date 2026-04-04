// frontend/src/pages/ActivityDetail.jsx
import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import io from 'socket.io-client';
import api from '../lib/api';
import BottomNav from '../components/layout/BottomNav';
import Avatar from '../components/common/Avatar';
import Button from '../components/ui/Button';
import { Heart, MessageCircle, Calendar, MapPin, ArrowLeft, Send } from 'lucide-react';

let socket;

export default function ActivityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [activity, setActivity] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(true);

  const messagesEndRef = useRef(null);

  // Socket Connection
  useEffect(() => {
    socket = io('http://localhost:5000');
    socket.emit('joinActivity', id);

    socket.on('newMessage', (msg) => {
      setMessages((prev) => {
        if (prev.some((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
    });

    return () => {
      if (socket) socket.disconnect();
    };
  }, [id]);

  // Load Activity & Messages
  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const { data } = await api.get(`/activities/${id}`);
        setActivity(data);
        setLiked(data.likes?.some((like) => like.toString() === user?._id));

        // Normalize messages
        const normalized = (data.messages || []).map((msg) => ({
          ...msg,
          sender: msg.sender || { _id: null, name: 'Unknown' },
        }));
        setMessages(normalized);
      } catch (err) {
        console.error('Failed to load activity:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchActivity();
  }, [id, user]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Check if message belongs to current user
  const isMyMessage = (msg) => {
    if (!msg || !user) return false;
    const senderId = msg.sender?._id || msg.sender;
    return (
      senderId?.toString() === user._id?.toString() ||
      msg.sender?.name === user.name
    );
  };

  // Safe time formatter
  const formatTime = (dateStr) => {
    if (!dateStr) return 'Just now';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Just now';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Send Message with Optimistic Update
  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    const optimisticMsg = {
      _id: tempId,
      text: newMessage.trim(),
      sender: {
        _id: user._id,
        name: user.name,
        avatar: user.avatar,
      },
      createdAt: new Date().toISOString(),
    };

    // Add optimistic message (shows on right side immediately)
    setMessages((prev) => [...prev, optimisticMsg]);
    const messageText = newMessage.trim();
    setNewMessage('');

    try {
      const { data } = await api.post(`/activities/${id}/messages`, { text: messageText });

      // Replace temp message with real server message
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === tempId ? (data.message || data) : msg
        )
      );
    } catch (err) {
      console.error('Failed to send message:', err);
      // Remove failed optimistic message
      setMessages((prev) => prev.filter((msg) => msg._id !== tempId));
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-lg">Loading vibe...</div>;
  }
  if (!activity) {
    return <div className="min-h-screen flex items-center justify-center">Activity not found</div>;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b z-50">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2">
            <ArrowLeft size={24} />
          </button>
          <h1 className="font-poppins font-semibold text-xl flex-1 truncate">
            {activity.title}
          </h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 pt-6 space-y-6">
        {/* Activity Info */}
        <div className="bg-white rounded-3xl p-6 shadow-soft">
          <div
            onClick={() => navigate(`/profile/${activity.creator._id}`)}
            className="flex items-center gap-4 cursor-pointer mb-6 hover:opacity-80"
          >
            <Avatar src={activity.creator.avatar} />
            <div>
              <p className="font-medium">{activity.creator.name}</p>
              <p className="text-xs text-gray-500">Creator</p>
            </div>
          </div>

          <h2 className="text-2xl font-semibold mb-3">{activity.title}</h2>
          <p className="text-gray-700 mb-6 leading-relaxed">{activity.description}</p>

          <div className="flex gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-primary" />
              {new Date(activity.time).toLocaleDateString()}
            </div>
            <div className="flex items-center gap-2">
              <MapPin size={18} className="text-primary" />
              {activity.distance?.toFixed(1) || '5'} km away
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => {/* like handler */}}
            className="flex-1 flex items-center justify-center gap-2"
          >
            <Heart size={22} className={liked ? 'fill-accent text-accent' : ''} />
            Like ({activity.likes?.length || 0})
          </Button>
          <Button className="flex-1">Join Vibe</Button>
        </div>

        {/* Group Chat */}
        <div className="bg-white rounded-3xl shadow-soft overflow-hidden">
          <div className="px-6 py-4 border-b font-semibold flex items-center gap-2">
            <MessageCircle size={20} className="text-primary" />
            Group Chat
          </div>

          <div className="h-[420px] p-6 overflow-y-auto space-y-6 bg-gray-50">
            {messages.map((msg, index) => {
              const isMine = isMyMessage(msg);
              // Safe unique key
              const key = msg._id || `msg-${index}-${msg.createdAt || Date.now()}`;

              return (
                <div
                  key={key}
                  className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-3 max-w-[75%] ${isMine ? 'flex-row-reverse' : ''}`}>
                    {/* Avatar only for others */}
                    {!isMine && (
                      <div className="flex-shrink-0 pt-1">
                        <Avatar src={msg.sender?.avatar} size="sm" />
                      </div>
                    )}

                    <div className="flex flex-col">
                      {/* Name only for others */}
                      {!isMine && msg.sender?.name && (
                        <p className="text-xs text-gray-500 mb-1 ml-1">
                          {msg.sender.name}
                        </p>
                      )}

                      {/* Message Bubble */}
                      <div
                        className={`px-5 py-3 rounded-3xl text-[15px] leading-relaxed
                          ${isMine
                            ? 'bg-primary text-white rounded-br-none'
                            : 'bg-white shadow-sm rounded-bl-none border border-gray-100'
                          }`}
                      >
                        {msg.text}
                      </div>

                      {/* Time */}
                      <p
                        className={`text-[10px] text-gray-400 mt-1 px-2 ${
                          isMine ? 'text-right' : ''
                        }`}
                      >
                        {formatTime(msg.createdAt)}
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
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 bg-gray-100 rounded-2xl px-6 py-3.5 focus:outline-none focus:ring-2 focus:ring-primary text-base"
              />
              <Button
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                className="px-6"
              >
                <Send size={20} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}