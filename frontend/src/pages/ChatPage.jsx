// frontend/src/pages/PrivateChat.jsx
import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import api from '../lib/api';
import BottomNav from '../components/layout/BottomNav';
import Avatar from '../components/common/Avatar';
import { ArrowLeft, Send } from 'lucide-react';
import Button from '../components/ui/Button';

let socket;

export default function PrivateChat() {
  const { otherUserId } = useParams();
  const navigate = useNavigate();

  const [otherUser, setOtherUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [online, setOnline] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Initialize Socket
  useEffect(() => {
    socket = io('http://localhost:5000', {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Authenticate user
    const userId = localStorage.getItem('userId') || ''; // Better to get from auth store
    if (userId) socket.emit('authenticate', userId);

    socket.emit('joinPrivateChat', { userId: otherUserId });

    // Listen for new private messages
    socket.on('newPrivateMessage', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    // Listen for typing indicator
    socket.on('typing', ({ isTyping: typingStatus }) => {
      setIsTyping(typingStatus);
    });

    // Listen for online status
    socket.on('userOnlineStatus', ({ userId, isOnline }) => {
      if (userId === otherUserId) setOnline(isOnline);
    });

    // Load chat history + other user info
    const loadChat = async () => {
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

    loadChat();

    return () => {
      if (socket) {
        socket.off('newPrivateMessage');
        socket.off('typing');
        socket.off('userOnlineStatus');
        socket.disconnect();
      }
    };
  }, [otherUserId]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!newMessage.trim() || !socket) return;

    const messageData = {
      toUserId: otherUserId,
      text: newMessage.trim(),
      createdAt: new Date()
    };

    // Optimistic update
    setMessages(prev => [...prev, {
      text: newMessage.trim(),
      isMe: true,
      createdAt: new Date(),
      sender: { _id: 'me' }
    }]);

    socket.emit('sendPrivateMessage', messageData);
    setNewMessage('');
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b z-50 px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2">
          <ArrowLeft size={24} />
        </button>

        {otherUser && (
          <div className="flex items-center gap-3 flex-1">
            <div className="relative">
              <Avatar src={otherUser.avatar} size="md" />
              {online && (
                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />
              )}
            </div>
            <div>
              <p className="font-medium">{otherUser.name}</p>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                @{otherUser.username}
                {isTyping && <span className="text-primary">• typing...</span>}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-gray-50">
        {messages.map((msg, index) => {
          const isMe = msg.isMe || msg.sender?._id === 'me' || msg.fromMe;
          return (
            <div key={index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
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

      {/* Input Area */}
      <div className="p-4 border-t bg-white">
        <div className="flex gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={handleTyping}
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

      <BottomNav />
    </div>
  );
}