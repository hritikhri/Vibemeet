// frontend/src/pages/ChatPage.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import BottomNav from '../components/layout/BottomNav';
import Avatar from '../components/common/Avatar';
import api from '../lib/api';
import { Search, MessageCircle } from 'lucide-react';

export default function ChatPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [friends, setFriends] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchFriends = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/users/me');
      
      console.log('Friends data received:', data?.friends?.length || 0, 'friends');
      
      // Safely set friends array
      const friendsList = Array.isArray(data?.friends) ? data.friends : [];
      setFriends(friendsList);
    } catch (err) {
      console.error("Failed to load friends:", err);
      setFriends([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  const filteredFriends = friends.filter(friend => 
    friend?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    friend?.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 bg-white border-b z-50">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            {/* Title */}
            <h1 className="text-2xl font-poppins font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent flex-shrink-0">
              Messages
            </h1>

            {/* Search Bar */}
            <div className="relative flex-1">
              <Search 
                className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" 
                size={20} 
              />
              <input
                type="text"
                placeholder="Search friends..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-14 pr-6 py-3 bg-white rounded-3xl border border-gray-100 focus:border-primary outline-none text-base transition-all"
              />
            </div>

            {/* Icon */}
            <div className="flex-shrink-0">
              <MessageCircle size={26} className="text-primary" />
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 pt-6">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={`skeleton-${i}`} className="h-20 bg-white rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : filteredFriends.length === 0 ? (
          <div className="text-center py-20">
            <div className="mx-auto w-20 h-20 bg-soft rounded-full flex items-center justify-center mb-6">
              <MessageCircle size={40} className="text-gray-400" />
            </div>
            <p className="text-gray-500 text-lg">
              {searchTerm ? 'No matching friends found' : 'No conversations yet'}
            </p>
            <p className="text-sm text-gray-400 mt-2">
              {searchTerm 
                ? 'Try a different search term' 
                : 'Add friends to start chatting'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredFriends.map((friend) => (
              <div
                key={friend._id}   // This MUST be unique
                onClick={() => navigate(`/chat/private/${friend._id}`)}
                className="bg-white rounded-3xl p-5 flex items-center gap-4 hover:shadow-soft active:scale-[0.985] transition-all cursor-pointer border border-transparent hover:border-gray-100"
              >
                <div className="relative flex-shrink-0">
                  <Avatar 
                    src={friend.avatar} 
                    alt={friend.name} 
                    size="md" 
                  />
                  <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-base truncate">{friend.name}</p>
                  <p className="text-sm text-gray-500 truncate">@{friend.username}</p>
                  <p className="text-sm text-gray-400 truncate mt-1">
                    Hey, how are you doing today?
                  </p>
                </div>

                <div className="text-right flex-shrink-0">
                  <div className="text-xs text-gray-400">Just now</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}