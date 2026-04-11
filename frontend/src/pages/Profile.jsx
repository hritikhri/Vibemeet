// frontend/src/pages/Profile.jsx
import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import BottomNav from '../components/layout/BottomNav';
import Avatar from '../components/common/Avatar';
import Button from '../components/ui/Button';
import FeedCard from '../components/feed/FeedCard';
import api from '../lib/api';
import {
  MessageCircle, UserPlus, Edit3, Users,
  Calendar, UserMinus, Settings, UserCheck, Rss
} from 'lucide-react';

export default function Profile() {
  const { id } = useParams();
  const { user: currentUser } = useAuthStore();
  const navigate = useNavigate();

  const activitiesRef = useRef(null);
  const modalRef      = useRef(null);

  const [profileUser,         setProfileUser]         = useState(null);
  const [activities,          setActivities]           = useState([]);
  const [friends,             setFriends]              = useState([]);
  const [loading,             setLoading]              = useState(true);

  // ── Social state ────────────────────────────────────────────────────────────
  // friendStatus: 'none' | 'sent' | 'friends'
  const [friendStatus,        setFriendStatus]         = useState('none');
  // isFollowing: whether currentUser follows this profile
  const [isFollowing,         setIsFollowing]          = useState(false);
  const [followLoading,       setFollowLoading]        = useState(false);
  const [friendLoading,       setFriendLoading]        = useState(false);

  const [showFriendsModal,    setShowFriendsModal]     = useState(false);
  const [showFollowersModal,  setShowFollowersModal]   = useState(false);
  const [showFollowingModal,  setShowFollowingModal]   = useState(false);
  const [showUnfriendConfirm, setShowUnfriendConfirm] = useState(false);
  const [selectedFriend,      setSelectedFriend]       = useState(null);

  const isOwnProfile = !id || id === currentUser?._id;

  // ── Close modal on outside click ────────────────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        closeAllModals();
      }
    };
    const anyModalOpen = showFriendsModal || showFollowersModal || showFollowingModal;
    if (anyModalOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFriendsModal, showFollowersModal, showFollowingModal]);

  // ── Fetch profile ────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userId = id || currentUser?._id;
        const { data: userData } = await api.get(`/users/${userId}`);
        setProfileUser(userData);
        setFriends(userData.friends || []);

        if (!isOwnProfile) {
          // Friend status
          if (userData.friends?.some(f => f._id === currentUser?._id)) {
            setFriendStatus('friends');
          } else if (userData.friendRequests?.some(f => f._id === currentUser?._id)) {
            setFriendStatus('sent');
          } else {
            setFriendStatus('none');
          }

          // Follow status — check if currentUser is in this profile's followers list
          setIsFollowing(
            userData.followers?.some(f => f._id === currentUser?._id) ?? false
          );
        }

        const { data: userActivities } = await api.get(`/users/${userId}/activities`);
        setActivities(userActivities || []);
      } catch (err) {
        console.error("Profile fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id, currentUser]);

  // ── Follow / Unfollow ────────────────────────────────────────────────────────
  const handleToggleFollow = async () => {
    setFollowLoading(true);
    try {
      const { data } = await api.post(`/users/${id}/follow`);
      setIsFollowing(data.following);
      // Update follower count optimistically
      setProfileUser(prev => ({
        ...prev,
        followers: data.following
          ? [...(prev.followers || []), { _id: currentUser._id }]
          : (prev.followers || []).filter(f => f._id !== currentUser._id),
      }));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update follow");
    } finally {
      setFollowLoading(false);
    }
  };

  // ── Friend Request ───────────────────────────────────────────────────────────
  const handleFriendRequest = async () => {
    if (friendStatus !== 'none') return;
    setFriendLoading(true);
    try {
      await api.post(`/users/${id}/friend-request`);
      setFriendStatus('sent');
      // Also flip follow state since sending a request auto-follows
      setIsFollowing(true);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to send friend request");
    } finally {
      setFriendLoading(false);
    }
  };

  // ── Unfriend ─────────────────────────────────────────────────────────────────
  const handleUnfriend = async () => {
    if (!selectedFriend) return;
    try {
      await api.post(`/users/unfriend`, { friendId: selectedFriend._id });
      setFriends(prev => prev.filter(f => f._id !== selectedFriend._id));
      setProfileUser(prev => ({
        ...prev,
        friends: prev.friends.filter(f => f._id !== selectedFriend._id),
      }));
      // If we unfriended the profile we're viewing, reset status
      if (selectedFriend._id === id) setFriendStatus('none');
      closeUnfriendConfirm();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to unfriend");
    }
  };

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const scrollToActivities = () =>
    activitiesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const closeAllModals = () => {
    setShowFriendsModal(false);
    setShowFollowersModal(false);
    setShowFollowingModal(false);
  };

  const openUnfriendConfirm = (friend) => {
    setSelectedFriend(friend);
    setShowUnfriendConfirm(true);
  };

  const closeUnfriendConfirm = () => {
    setShowUnfriendConfirm(false);
    setSelectedFriend(null);
  };

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  // ── Derived counts ───────────────────────────────────────────────────────────
  const followerCount  = profileUser?.followers?.length  ?? 0;
  const followingCount = profileUser?.following?.length  ?? 0;
  const friendCount    = profileUser?.friends?.length    ?? 0;

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background pb-20">

      {/* Cover */}
      <div className="h-15 md:h-24 bg-gradient-to-br from-primary via-accent to-purple-600 relative">
        {isOwnProfile && (
          <button
            onClick={() => navigate('/setting')}
            className="absolute top-4 right-4 md:hidden z-10 bg-white/90 backdrop-blur-md p-2.5 rounded-full shadow-lg hover:bg-white transition-all active:scale-95"
            aria-label="Settings"
          >
            <Settings size={22} className="text-gray-700" />
          </button>
        )}
      </div>

      {/* Main content */}
      <div className="max-w-3xl mx-auto px-4 md:px-6 pt-10 md:pt-12">

        {/* Avatar + Name + Actions */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">

          {/* Avatar */}
          <div className="flex-shrink-0 -mt-16 md:-mt-20 relative z-10">
            <Avatar src={profileUser?.avatar} size="xl" />
          </div>

          {/* Name + Buttons */}
          <div className="flex-1 mt-2 md:mt-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-semibold font-poppins tracking-tight text-gray-900">
                  {profileUser?.name}
                </h1>
                <p className="text-gray-500 text-lg">@{profileUser?.username}</p>
              </div>

              {/* ── Action buttons ── */}
              <div className="flex gap-3 flex-wrap">

                {/* ── Other user ── */}
                {!isOwnProfile && (
                  <>
                    {/* Follow / Unfollow */}
                    <Button
                      onClick={handleToggleFollow}
                      disabled={followLoading}
                      variant={isFollowing ? "secondary" : "primary"}
                      className="flex items-center gap-2"
                    >
                      {followLoading ? (
                        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : isFollowing ? (
                        <><Rss size={16} />Following</>
                      ) : (
                        <><Rss size={16} />Follow</>
                      )}
                    </Button>

                    {/* Add Friend / Request Sent / Friends */}
                    <Button
                      onClick={handleFriendRequest}
                      variant={friendStatus === 'friends' ? "secondary" : "primary"}
                      disabled={friendStatus === 'friends' || friendStatus === 'sent' || friendLoading}
                      className="flex items-center gap-2"
                    >
                      {friendLoading ? (
                        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : friendStatus === 'friends' ? (
                        <><UserCheck size={18} />Friends</>
                      ) : friendStatus === 'sent' ? (
                        <>Request Sent</>
                      ) : (
                        <><UserPlus size={18} />Add Friend</>
                      )}
                    </Button>

                    {/* Message */}
                    <Button
                      onClick={() => navigate(`/chat/private/${id}`)}
                      className="flex items-center gap-2"
                    >
                      <MessageCircle size={18} />
                      Message
                    </Button>
                  </>
                )}

                {/* ── Own profile ── */}
                {isOwnProfile && (
                  <Button
                    variant="secondary"
                    onClick={() => navigate('/setting')}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 rounded-2xl font-medium shadow-sm transition-all"
                  >
                    <Edit3 size={18} />
                    Edit Profile
                  </Button>
                )}
              </div>
            </div>

            {/* Bio */}
            <div className="mt-6">
              <p className="text-gray-700 leading-relaxed text-[15.5px] tracking-tight">
                {profileUser?.bio || "No bio added yet."}
              </p>
            </div>

            {/* Interests */}
            {profileUser?.interests?.length > 0 && (
              <div className="mt-6">
                <p className="text-xs uppercase tracking-widest text-gray-400 font-medium mb-3">
                  INTERESTS
                </p>
                <div className="flex flex-wrap gap-2">
                  {profileUser.interests.map((interest, index) => (
                    <span
                      key={index}
                      className="px-4 py-1.5 text-sm bg-white border border-gray-100 text-gray-700 rounded-2xl hover:bg-gray-50 transition-colors"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Stats row ── */}
        <div className="grid grid-cols-4 gap-3 mt-10">

          {/* Activities */}
          <div
            onClick={scrollToActivities}
            className="bg-white rounded-3xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-[0.985] text-center"
          >
            <p className="text-3xl font-semibold text-primary">{activities.length}</p>
            <p className="text-xs text-gray-500 font-medium mt-1">Activities</p>
          </div>

          {/* Friends */}
          <div
            onClick={() => setShowFriendsModal(true)}
            className="bg-white rounded-3xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-[0.985] text-center"
          >
            <p className="text-3xl font-semibold text-primary">{friendCount}</p>
            <p className="text-xs text-gray-500 font-medium mt-1">Friends</p>
          </div>

          {/* Followers */}
          <div
            onClick={() => setShowFollowersModal(true)}
            className="bg-white rounded-3xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-[0.985] text-center"
          >
            <p className="text-3xl font-semibold text-primary">{followerCount}</p>
            <p className="text-xs text-gray-500 font-medium mt-1">Followers</p>
          </div>

          {/* Following */}
          <div
            onClick={() => setShowFollowingModal(true)}
            className="bg-white rounded-3xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-[0.985] text-center"
          >
            <p className="text-3xl font-semibold text-primary">{followingCount}</p>
            <p className="text-xs text-gray-500 font-medium mt-1">Following</p>
          </div>
        </div>

        {/* ── Activities section ── */}
        <div ref={activitiesRef} className="mt-14 scroll-mt-24">
          <h3 className="font-semibold text-2xl mb-6 text-gray-900">
            {isOwnProfile ? "My Activities" : `${profileUser?.name?.split(' ')[0]}'s Activities`}
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

      {/* ── Reusable user list modal ── */}
      {[
        { show: showFriendsModal,   list: friends,                    title: `Friends (${friendCount})`,      close: () => setShowFriendsModal(false),   showUnfriend: isOwnProfile },
        { show: showFollowersModal, list: profileUser?.followers??[], title: `Followers (${followerCount})`,  close: () => setShowFollowersModal(false),  showUnfriend: false },
        { show: showFollowingModal, list: profileUser?.following??[], title: `Following (${followingCount})`, close: () => setShowFollowingModal(false),  showUnfriend: false },
      ].map(({ show, list, title, close, showUnfriend }) =>
        show ? (
          <div key={title} className="fixed inset-0 bg-black/70 backdrop-blur-xl flex items-center justify-center z-[100] p-4">
            <div ref={modalRef} className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-5 border-b">
                <h2 className="text-2xl font-semibold">{title}</h2>
                <button onClick={close} className="p-2 hover:bg-gray-100 rounded-full transition-colors">✕</button>
              </div>
              <div className="max-h-[420px] overflow-y-auto p-6 space-y-3">
                {list.length === 0 ? (
                  <p className="text-center text-gray-500 py-12">No users yet</p>
                ) : (
                  list.map((person) => (
                    <div key={person._id} className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-2xl group">
                      <Avatar src={person.avatar} size="md" />
                      <div
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => { close(); navigate(`/profile/${person._id}`); }}
                      >
                        <p className="font-medium truncate">{person.name}</p>
                        <p className="text-sm text-gray-500 truncate">@{person.username}</p>
                      </div>
                      {showUnfriend && (
                        <button
                          onClick={(e) => { e.stopPropagation(); openUnfriendConfirm(person); }}
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
        ) : null
      )}

      {/* ── Unfriend confirmation ── */}
      {showUnfriendConfirm && selectedFriend && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xl flex items-center justify-center z-[110] p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <UserMinus size={32} className="text-red-600" />
            </div>
            <h3 className="text-2xl font-semibold mb-2">Unfriend {selectedFriend.name}?</h3>
            <p className="text-gray-600 mb-8">
              They will stay in each other's followers. Only the friend connection will be removed.
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={closeUnfriendConfirm} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleUnfriend} className="flex-1 bg-red-600 hover:bg-red-700">
                Unfriend
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}