// frontend/src/pages/Notifications.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/layout/BottomNav';
import Avatar from '../components/common/Avatar';
import Button from '../components/ui/Button';
import api from '../lib/api';
import { Bell, UserPlus, Heart, MessageCircle, Users, Calendar } from 'lucide-react';

export default function Notifications() {
  const [activeTab, setActiveTab] = useState('notifications');
  const [groupedNotifications, setGroupedNotifications] = useState({});
  const [friendRequests, setFriendRequests] = useState([]); 
  const [unreadFriendRequestCount, setUnreadFriendRequestCount] = useState(0); // New state for badge
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();
  const containerRef = useRef(null);

  // Pull to Refresh Logic
  const handlePullToRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  // Pull-to-refresh touch handlers
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let startY = 0;
    let currentY = 0;
    let isPulling = false;

    const handleTouchStart = (e) => {
      if (container.scrollTop === 0) {
        startY = e.touches[0].clientY;
        isPulling = true;
      }
    };

    const handleTouchMove = (e) => {
      if (!isPulling) return;
      currentY = e.touches[0].clientY;
      const diff = currentY - startY;
      if (diff > 0 && diff < 120) {
        container.style.transform = `translateY(${diff / 3}px)`;
      }
    };

    const handleTouchEnd = async () => {
      if (!isPulling) return;
      const diff = currentY - startY;
      if (diff > 80) {
        await handlePullToRefresh();
      }
      container.style.transform = 'translateY(0)';
      isPulling = false;
    };

    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchmove', handleTouchMove);
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);

      // Mark all as read
      await api.put('/notifications/read-all').catch(() => {});

      // Get normal notifications
      const { data: notifs = [] } = await api.get('/notifications');

      // Get friend request IDs from current user
      const { data: currentUser } = await api.get('/auth/me').catch(() => ({ data: { friendRequests: [] } }));
      const requestIds = currentUser.friendRequests || [];

      // Fetch full user details for friend requests
      let fullUsers = [];
      if (requestIds.length > 0) {
        try {
          const { data: users } = await api.post('/users/batch', { userIds: requestIds });
          fullUsers = users || [];
        } catch (err) {
          console.error("Failed to fetch batch users:", err);
          fullUsers = requestIds.map(id => ({
            _id: id,
            name: `User ${String(id).slice(-6)}`,
            username: "user",
            avatar: `https://i.pravatar.cc/300?u=${id}`
          }));
        }
      }

      // Group normal notifications only
      const groups = groupByTime(notifs);
      setGroupedNotifications(groups);
      setFriendRequests(fullUsers);
      setUnreadFriendRequestCount(fullUsers.length);   // ← Set unread count

    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const groupByTime = (items) => {
    const groups = {
      Today: [],
      Yesterday: [],
      'This Week': [],
      'Last Month': [],
      Older: [],
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const oneMonthAgo = new Date(today);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    items.forEach(item => {
      const itemDate = new Date(item.createdAt);
      if (isNaN(itemDate.getTime())) {
        groups.Older.push(item);
        return;
      }

      const itemDay = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());

      if (itemDay.getTime() === today.getTime()) groups.Today.push(item);
      else if (itemDay.getTime() === yesterday.getTime()) groups.Yesterday.push(item);
      else if (itemDate > oneWeekAgo) groups['This Week'].push(item);
      else if (itemDate > oneMonthAgo) groups['Last Month'].push(item);
      else groups.Older.push(item);
    });

    return Object.fromEntries(
      Object.entries(groups).filter(([_, arr]) => arr.length > 0)
    );
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'like': return 'bg-pink-100 text-pink-600';
      case 'message': return 'bg-purple-100 text-purple-600';
      case 'join_request':
      case 'invite': return 'bg-green-100 text-green-600';
      case 'request_accepted': return 'bg-emerald-100 text-emerald-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'like': return Heart;
      case 'message': return MessageCircle;
      case 'join_request':
      case 'invite': return Users;
      case 'request_accepted': return UserPlus;
      default: return Bell;
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const acceptFriendRequest = async (requesterId) => {
    try {
      await api.post(`/users/friend-request/${requesterId}/accept`);
      fetchNotifications();
    } catch (err) {
      alert("Failed to accept request");
    }
  };

  const rejectFriendRequest = async (requesterId) => {
    try {
      await api.post(`/users/friend-request/${requesterId}/reject`);
      fetchNotifications();
    } catch (err) {
      alert("Failed to reject request");
    }
  };

  const goToProfile = (userId) => {
    if (userId) navigate(`/profile/${userId}`);
  };

  const formatRelativeTime = (dateStr) => {
    if (!dateStr) return 'Just now';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Just now';

    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // New: Mark friend requests as read when switching to requests tab
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'requests') {
      setUnreadFriendRequestCount(0); // Mark as read when tab is opened
    }
  };

  if (loading && Object.keys(groupedNotifications).length === 0 && friendRequests.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-6"></div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading Notifications</h3>
          <p className="text-gray-500 text-sm max-w-[240px] mx-auto">
            Please wait while we fetch your latest updates
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 bg-white border-b z-50">
        <div className="max-w-2xl mx-auto px-6 py-5">
          <h1 className="text-3xl font-poppins font-bold flex items-center gap-3">
            <Bell size={28} className="text-primary" />
            Notifications
          </h1>
        </div>

        {/* Tabs */}
        <div className="max-w-2xl mx-auto px-6">
          <div className="flex border-b">
            <button
              onClick={() => handleTabChange('notifications')}
              className={`flex-1 py-4 text-sm font-medium transition-all relative ${
                activeTab === 'notifications' ? 'text-primary' : 'text-gray-500'
              }`}
            >
              Notifications
              {activeTab === 'notifications' && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-0.5 bg-primary rounded" />
              )}
            </button>

            <button
              onClick={() => handleTabChange('requests')}
              className={`flex-1 py-4 text-sm font-medium transition-all relative flex items-center justify-center gap-1.5 ${
                activeTab === 'requests' ? 'text-primary' : 'text-gray-500'
              }`}
            >
              <UserPlus size={18} />
              Friend Requests
              {/* Real-time badge - shows only if there are unread requests */}
              {unreadFriendRequestCount > 0 && (
                <span className="ml-1 px-2 py-0.5 text-xs bg-red-500 text-white rounded-full font-medium">
                  {unreadFriendRequestCount}
                </span>
              )}
              {activeTab === 'requests' && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-0.5 bg-primary rounded" />
              )}
            </button>
          </div>
        </div>
      </header>

      <div 
        ref={containerRef}
        className="max-w-2xl mx-auto px-6 pt-6 min-h-[calc(100vh-180px)] overflow-y-auto"
      >
        {refreshing && (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
          </div>
        )}

        {/* ==================== NOTIFICATIONS TAB ==================== */}
        {activeTab === 'notifications' && (
          <>
            {Object.keys(groupedNotifications).length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center">
                <Bell size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No notifications yet</p>
              </div>
            ) : (
              Object.entries(groupedNotifications).map(([period, items]) => (
                <div key={period} className="mb-8">
                  <div className="flex items-center gap-2 mb-4 px-2">
                    <Calendar size={18} className="text-gray-400" />
                    <h2 className="font-semibold text-lg text-gray-700">{period}</h2>
                  </div>

                  <div className="space-y-4">
                    {items.map((item) => {
                      const Icon = getIcon(item.type);
                      const colorClass = getTypeColor(item.type);

                      return (
                        <div
                          key={item._id}
                          className="bg-white rounded-3xl p-5 flex gap-4 hover:shadow-soft transition-all"
                        >
                          <div className="flex-shrink-0 pt-1">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colorClass}`}>
                              <Icon size={24} />
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <p className="font-medium leading-tight">{item.message}</p>
                                {item.fromUser?.name && (
                                  <p 
                                    className="text-sm text-primary mt-1 cursor-pointer hover:underline"
                                    onClick={() => goToProfile(item.fromUser._id)}
                                  >
                                    {item.fromUser.name}
                                  </p>
                                )}
                              </div>
                              <p className="text-xs text-gray-400 whitespace-nowrap">
                                {formatRelativeTime(item.createdAt)}
                              </p>
                            </div>

                            {item.fromUser?._id && (
                              <div 
                                className="mt-3 flex items-center gap-3 cursor-pointer"
                                onClick={() => goToProfile(item.fromUser._id)}
                              >
                                <Avatar src={item.fromUser?.avatar} size="sm" />
                                <span className="text-sm text-primary font-medium">View Profile</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {/* ==================== FRIEND REQUESTS TAB ==================== */}
        {activeTab === 'requests' && (
          <>
            {friendRequests.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center">
                <UserPlus size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No friend requests yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {friendRequests.map((user) => (
                  <div
                    key={user._id}
                    className="bg-white rounded-3xl p-5 flex gap-4 hover:shadow-soft transition-all border border-gray-100"
                  >
                    <div 
                      className="flex-shrink-0 cursor-pointer"
                      onClick={() => goToProfile(user._id)}
                    >
                      <Avatar src={user.avatar} size="lg" />
                    </div>

                    <div className="flex-1 min-w-0 pt-1">
                      <div 
                        className="cursor-pointer"
                        onClick={() => goToProfile(user._id)}
                      >
                        <p className="font-semibold text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-500">@{user.username || 'user'}</p>
                      </div>

                      <p className="text-sm text-gray-600 mt-2">Sent you a friend request</p>

                      <div className="flex gap-3 mt-5">
                        <Button 
                          size="sm" 
                          className="flex-1"
                          onClick={() => acceptFriendRequest(user._id)}
                        >
                          Accept
                        </Button>
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => rejectFriendRequest(user._id)}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}