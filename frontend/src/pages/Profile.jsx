// frontend/src/pages/Profile.jsx
import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import BottomNav from '../components/layout/BottomNav';
import Avatar from '../components/common/Avatar';
import Button from '../components/ui/Button';
import FeedCard from '../components/feed/FeedCard';
import api from '../lib/api';
import { MessageCircle, UserPlus, Edit3, Users, Calendar, UserMinus } from 'lucide-react';

export default function Profile() {
  const { id } = useParams();
  const { user: currentUser } = useAuthStore();
  const navigate = useNavigate();

  const activitiesRef = useRef(null);

  const [profileUser, setProfileUser] = useState(null);
  const [activities, setActivities] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [friendStatus, setFriendStatus] = useState('none');
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [showUnfriendConfirm, setShowUnfriendConfirm] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState(null);

  const isOwnProfile = !id || id === currentUser?._id;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userId = id || currentUser?._id;
        const { data: userData } = await api.get(`/users/${userId}`);

        setProfileUser(userData);
        setFriends(userData.friends || []);
        console.log(userData.friends)  // i am getting the friends

        const { data: userActivities } = await api.get(`/users/${userId}/activities`);
        setActivities(userActivities || []);

        // Determine friend status
        if (userData.friends?.some(f => f._id === currentUser?._id)) {
          setFriendStatus('friends');
        } else if (userData.friendRequests?.some(f => f._id === currentUser?._id)) {
          setFriendStatus('sent');
        } else {
          setFriendStatus('none');
        }
      } catch (err) {
        console.error("Profile fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id, currentUser]);

  const handleFriendRequest = async () => {
    if (friendStatus !== 'none') return;
    try {
      await api.post(`/users/${id}/friend-request`);
      setFriendStatus('sent');
    } catch (err) {
      alert(err.response?.data?.message || "Failed to send friend request");
    }
  };

  const scrollToActivities = () => {
    activitiesRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  };

  const openFriendsModal = () => setShowFriendsModal(true);
  const closeFriendsModal = () => setShowFriendsModal(false);

  // Unfriend Functions
  const openUnfriendConfirm = (friend) => {
    setSelectedFriend(friend);
    setShowUnfriendConfirm(true);
  };

  const closeUnfriendConfirm = () => {
    setShowUnfriendConfirm(false);
    setSelectedFriend(null);
  };

  const handleUnfriend = async () => {
    if (!selectedFriend) return;

    try {
      await api.post(`/users/unfriend`, { friendId: selectedFriend._id });

      // Update local friends list
      setFriends(prev => prev.filter(f => f._id !== selectedFriend._id));

      // Update profileUser friends count
      if (profileUser) {
        setProfileUser(prev => ({
          ...prev,
          friends: prev.friends.filter(f => f._id !== selectedFriend._id)
        }));
      }

      alert(`You have unfriended ${selectedFriend.name}`);
      closeUnfriendConfirm();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to unfriend");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Cover Photo */}
      <div className="h-60 bg-gradient-to-br from-primary via-accent to-purple-600 relative">
        <div className="absolute -bottom-12 left-6">
          <div className="ring-4 ring-white rounded-full">
            <Avatar src={profileUser?.avatar} size="lg" />
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 pt-20">
        
        {/* Name + Actions */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-semibold font-poppins tracking-tight text-gray-900">
              {profileUser?.name}
            </h1>
            <p className="text-gray-500 text-lg mt-1">@{profileUser?.username}</p>
          </div>

          <div className="flex gap-3 pt-2">
            {!isOwnProfile && (
              <>
                <Button
                  onClick={handleFriendRequest}
                  variant={friendStatus === 'friends' ? "secondary" : "primary"}
                  disabled={friendStatus === 'friends' || friendStatus === 'sent'}
                  className="flex items-center gap-2"
                >
                  {friendStatus === 'friends' ? (
                    <>Friends ✓</>
                  ) : friendStatus === 'sent' ? (
                    <>Request Sent</>
                  ) : (
                    <>
                      <UserPlus size={18} />
                      Add Friend
                    </>
                  )}
                </Button>

                <Button 
                  onClick={() => navigate(`/chat/private/${id}`)}
                  className="flex items-center gap-2"
                >
                  <MessageCircle size={18} />
                  Message
                </Button>
              </>
            )}

            {isOwnProfile && (
              <Button 
                variant="secondary" 
                onClick={() => navigate('/edit-profile')}
                className="flex items-center gap-2"
              >
                <Edit3 size={18} />
                Edit Profile
              </Button>
            )}
          </div>
        </div>

        {/* Bio */}
        <div className="mt-8">
          <p className="text-gray-700 leading-relaxed text-[15.5px]">
            {profileUser?.bio || "No bio added yet."}
          </p>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 gap-6 mt-10">
          <div 
            onClick={scrollToActivities}
            className="bg-white rounded-3xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-[0.985]"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                <Calendar size={28} />
              </div>
              <div>
                <p className="text-4xl font-semibold text-primary">{activities.length}</p>
                <p className="text-sm text-gray-500 font-medium">Activities</p>
              </div>
            </div>
          </div>

          <div 
            onClick={openFriendsModal}
            className="bg-white rounded-3xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-[0.985]"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                <Users size={28} />
              </div>
              <div>
                <p className="text-4xl font-semibold text-primary">{profileUser?.friends?.length || 0}</p>
                <p className="text-sm text-gray-500 font-medium">Friends</p>
              </div>
            </div>
          </div>
        </div>

        {/* Activities Section */}
        <div ref={activitiesRef} className="mt-14 scroll-mt-24">
          <h3 className="font-semibold text-2xl mb-6 text-gray-900">
            {isOwnProfile ? "My Activities" : `${profileUser?.name.split(' ')[0]}'s Activities`}
          </h3>

          {activities.length === 0 ? (
            <div className="bg-white rounded-3xl py-16 text-center border border-gray-100">
              <div className="text-6xl mb-4">🏞️</div>
              <p className="text-gray-500 text-lg">No activities yet</p>
              {isOwnProfile && (
                <p className="text-sm text-gray-400 mt-2">Create your first vibe to get started</p>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {activities.map((activity) => (
                <FeedCard 
                  key={activity._id} 
                  activity={activity} 
                  onJoin={() => navigate(`/activity/${activity._id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav />

      {/* Friends List Modal */}
      {showFriendsModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xl flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b">
              <h2 className="text-2xl font-semibold">Friends ({friends.length})</h2>
              <button 
                onClick={closeFriendsModal}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="max-h-[420px] overflow-y-auto p-6 space-y-3">
              {friends.length === 0 ? (
                <p className="text-center text-gray-500 py-12">No friends yet</p>
              ) : (
                friends.map((friend) => (
                  <div 
                    key={friend._id}
                    className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-2xl group"
                  >
                    <Avatar src={friend.avatar} size="md" />
                    <div 
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => {
                        closeFriendsModal();
                        navigate(`/profile/${friend._id}`);
                      }}
                    >
                      <p className="font-medium truncate">{friend.name}</p>
                      <p className="text-sm text-gray-500 truncate">@{friend.username}</p>
                    </div>

                    {isOwnProfile && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openUnfriendConfirm(friend);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <UserMinus size={20} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Unfriend Confirmation Modal */}
      {showUnfriendConfirm && selectedFriend && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xl flex items-center justify-center z-[110] p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <UserMinus size={32} className="text-red-600" />
            </div>

            <h3 className="text-2xl font-semibold mb-2">Unfriend {selectedFriend.name}?</h3>
            <p className="text-gray-600 mb-8">
              Are you sure you want to remove {selectedFriend.name} from your friends list?
            </p>

            <div className="flex gap-3">
              <Button 
                variant="secondary" 
                onClick={closeUnfriendConfirm}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleUnfriend}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                Unfriend
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}