// frontend/src/pages/Profile.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import BottomNav from '../components/layout/BottomNav';
import Avatar from '../components/common/Avatar';
import Button from '../components/ui/Button';
import FeedCard from '../components/feed/FeedCard';
import api from '../lib/api';

export default function Profile() {
  const { id } = useParams(); // undefined = own profile
  const { user: currentUser } = useAuthStore();
  const navigate = useNavigate();

  const [profileUser, setProfileUser] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [friendStatus, setFriendStatus] = useState('none'); // 'none', 'sent', 'friends'

  const isOwnProfile = !id || id === currentUser?._id;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userId = id || currentUser?._id;
        const { data: userData } = await api.get(`/users/${userId}`);
        setProfileUser(userData);

        const { data: userActivities } = await api.get(`/users/${userId}/activities`);
        setActivities(userActivities);

        // Determine friend button status
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
      alert("Friend request sent successfully!");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to send friend request");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Cover + Avatar */}
      <div className="h-56 bg-gradient-to-br from-primary to-accent relative">
        <div className="absolute -bottom-14 left-6">
          <Avatar src={profileUser?.avatar} size="lg" />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 pt-16">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-poppins font-semibold">{profileUser?.name}</h1>
            <p className="text-gray-500">@{profileUser?.username}</p>
          </div>

          {/* Action Buttons */}
          {!isOwnProfile && (
            <div className="flex gap-3">
              <Button 
                onClick={handleFriendRequest}
                variant={friendStatus === 'sent' ? "secondary" : "primary"}
                disabled={friendStatus === 'friends'}
              >
                {friendStatus === 'friends' 
                  ? 'Friends ✓' 
                  : friendStatus === 'sent' 
                    ? 'Request Sent' 
                    : 'Send Request'}
              </Button>

              <Button onClick={() => navigate(`/chat/private/${id}`)}>
                Send Message
              </Button>
            </div>
          )}

          {isOwnProfile && (
            <Button 
              variant="secondary" 
              onClick={() => navigate('/edit-profile')}
            >
              Edit Profile
            </Button>
          )}
        </div>

        {/* Bio */}
        <p className="mt-6 text-gray-700 leading-relaxed">
          {profileUser?.bio || "No bio added yet."}
        </p>

        {/* Stats */}
        <div className="flex gap-8 mt-10 text-center">
          <div>
            <p className="text-3xl font-semibold text-primary">{activities.length}</p>
            <p className="text-sm text-gray-500">Activities</p>
          </div>
          <div>
            <p className="text-3xl font-semibold text-primary">{profileUser?.friends?.length || 0}</p>
            <p className="text-sm text-gray-500">Friends</p>
          </div>
        </div>

        {/* Activities Section */}
        <div className="mt-12">
          <h3 className="font-semibold text-xl mb-6 border-b pb-3">
            {isOwnProfile ? "My Activities" : `${profileUser?.name}'s Activities`}
          </h3>

          {activities.length === 0 ? (
            <div className="text-center py-12 text-gray-500 bg-white rounded-3xl">
              No activities yet
            </div>
          ) : (
            activities.map((activity) => (
              <FeedCard 
                key={activity._id} 
                activity={activity} 
                onJoin={() => navigate(`/activity/${activity._id}`)}
              />
            ))
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}