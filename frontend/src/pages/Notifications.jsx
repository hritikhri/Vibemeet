// frontend/src/pages/Notifications.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/layout/BottomNav';
import Avatar from '../components/common/Avatar';
import Button from '../components/ui/Button';
import api from '../lib/api';
import { Bell, UserPlus, Heart, MessageCircle, Users, Calendar } from 'lucide-react';

export default function Notifications() {
  const [groupedNotifications, setGroupedNotifications] = useState({});
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

  // Simple pull-to-refresh implementation (works on mobile)
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

      // Mark all as read when opening the tab
      await api.put('/notifications/read-all').catch(() => {});

      // Get notifications
      const { data: notifs = [] } = await api.get('/notifications');

      // Get friend requests from current user
      const { data: currentUser } = await api.get('/auth/me').catch(() => ({ data: { friendRequests: [] } }));
      const friendRequests = currentUser.friendRequests || [];

      // Format friend requests as notifications
      const formattedFR = friendRequests.map((reqId, idx) => ({
        _id: `fr-${reqId}-${idx}`,
        type: 'friend_request',
        fromUser: { _id: reqId, name: 'New User', avatar: `https://i.pravatar.cc/300?u=${reqId}` },
        message: 'Sent you a friend request',
        createdAt: new Date(Date.now() - idx * 300000).toISOString(), // recent
        read: false,
      }));

      const allItems = [
        ...notifs.map(n => ({ ...n, type: n.type || 'notification' })),
        ...formattedFR,
      ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      // Group by time periods
      const groups = groupByTime(allItems);
      setGroupedNotifications(groups);
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

      if (itemDay.getTime() === today.getTime()) {
        groups.Today.push(item);
      } else if (itemDay.getTime() === yesterday.getTime()) {
        groups.Yesterday.push(item);
      } else if (itemDate > oneWeekAgo) {
        groups['This Week'].push(item);
      } else if (itemDate > oneMonthAgo) {
        groups['Last Month'].push(item);
      } else {
        groups.Older.push(item);
      }
    });

    // Remove empty groups
    return Object.fromEntries(
      Object.entries(groups).filter(([_, arr]) => arr.length > 0)
    );
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'friend_request': return 'bg-blue-100 text-blue-600';
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
      case 'friend_request': return UserPlus;
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

  if (loading && Object.keys(groupedNotifications).length === 0) {
    return <div className="min-h-screen flex items-center justify-center text-lg">Loading notifications...</div>;
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
      </header>

      <div 
        ref={containerRef}
        className="max-w-2xl mx-auto px-6 pt-6 min-h-[calc(100vh-140px)] overflow-y-auto"
      >
        {refreshing && (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
          </div>
        )}

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
                  const isFriendRequest = item.type === 'friend_request';
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
                              <p className="text-sm text-gray-600 mt-1">
                                {item.fromUser.name}
                              </p>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 whitespace-nowrap">
                            {formatRelativeTime(item.createdAt)}
                          </p>
                        </div>

                        {/* Avatar + View Profile */}
                        {(item.fromUser?._id || isFriendRequest) && (
                          <div 
                            className="mt-3 flex items-center gap-3 cursor-pointer"
                            onClick={() => goToProfile(item.fromUser?._id)}
                          >
                            <Avatar 
                              src={item.fromUser?.avatar} 
                              size="sm" 
                            />
                            <span className="text-sm text-primary font-medium">View Profile</span>
                          </div>
                        )}

                        {/* Friend Request Actions */}
                        {isFriendRequest && (
                          <div className="flex gap-3 mt-4">
                            <Button 
                              size="sm" 
                              className="flex-1"
                              onClick={() => acceptFriendRequest(item.fromUser?._id)}
                            >
                              Accept
                            </Button>
                            <Button 
                              variant="secondary" 
                              size="sm" 
                              className="flex-1"
                              onClick={() => rejectFriendRequest(item.fromUser?._id)}
                            >
                              Reject
                            </Button>
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
      </div>

      <BottomNav />
    </div>
  );
}