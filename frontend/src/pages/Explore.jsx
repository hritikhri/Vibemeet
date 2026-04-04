// frontend/src/pages/Explore.jsx
import { useState, useEffect, useCallback } from 'react';
import { Search, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/layout/BottomNav';
import Avatar from '../components/common/Avatar';
import Button from '../components/ui/Button';
import api from '../lib/api';

export default function Explore() {
  const [activities, setActivities] = useState([]);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [radius, setRadius] = useState(15);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchExplore = async (searchTerm = search) => {
    setLoading(true);
    try {
      const { data } = await api.get(
        `/activities/explore?radius=${radius}&search=${encodeURIComponent(searchTerm)}`
      );

      const fetchedActivities = Array.isArray(data) ? data : [];

      // Extract unique users only when search term exists
      let extractedUsers = [];
      if (searchTerm.trim() !== '') {
        const userMap = new Map();

        fetchedActivities.forEach((act) => {
          const creator = act.creator;
          if (creator && creator._id && !userMap.has(creator._id)) {
            userMap.set(creator._id, {
              _id: creator._id,
              name: creator.name,
              avatar: creator.avatar,
            });
          }
        });

        extractedUsers = Array.from(userMap.values());
      }

      setActivities(fetchedActivities);
      setUsers(extractedUsers);
    } catch (err) {
      console.error("Failed to fetch explore data:", err);
      setActivities([]);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  const debouncedFetch = useCallback(
    debounce((term) => {
      fetchExplore(term);
    }, 500),
    [radius]
  );

  useEffect(() => {
    debouncedFetch(search);
  }, [search, radius]);

  // Initial load - only activities
  useEffect(() => {
    fetchExplore('');
  }, []);

  const handleAddFriend = async (userId) => {
    try {
      await api.post(`/users/friend-request/${userId}`);
      alert("Friend request sent!");
      // Optionally refresh or update UI
    } catch (err) {
      console.error(err);
      alert("Failed to send friend request");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 bg-white border-b z-50">
        <div className="max-w-2xl mx-auto px-6 py-5">
          <h1 className="text-3xl font-poppins font-bold mb-6">Explore Vibes</h1>

          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-5 top-4 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search activities or people..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-white rounded-3xl border border-gray-100 focus:border-primary outline-none text-base"
            />
          </div>

          {/* Radius Filter */}
          <div className="flex gap-3 overflow-x-auto pb-3">
            {[5, 10, 15, 30, 50].map((r) => (
              <button
                key={r}
                onClick={() => setRadius(r)}
                className={`px-6 py-2.5 rounded-3xl whitespace-nowrap text-sm font-medium transition-all ${
                  radius === r
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-white border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {r} km
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 pt-6">
        {loading ? (
          <div className="space-y-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-white rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* USERS SECTION - Only show when searching */}
            {search.trim() !== '' && users.length > 0 && (
              <div className="mb-10">
                <h2 className="text-xl font-semibold mb-5 flex items-center gap-2">
                  People
                </h2>

                <div className="space-y-4">
                  {users.map((user) => (
                    <div
                      key={user._id}
                      className="bg-white rounded-3xl p-5 flex items-center gap-4"
                    >
                      <Avatar src={user.avatar} size="lg" />

                      <div className="flex-1">
                        <p className="font-semibold text-lg">{user.name}</p>
                      </div>

                      <Button
                        size="sm"
                        onClick={() => handleAddFriend(user._id)}
                      >
                        Add Friend
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ACTIVITIES SECTION - Always visible */}
            {activities.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-5 flex items-center gap-2">
                  <MapPin size={22} className="text-primary" />
                  Activities
                </h2>

                <div className="space-y-6">
                  {activities.map((act) => (
                    <div
                      key={act._id}
                      className="bg-white rounded-3xl p-6 shadow-soft"
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <Avatar src={act.creator?.avatar} size="md" />
                        <div>
                          <p className="font-medium">{act.creator?.name}</p>
                          <p className="text-xs text-gray-500">
                            {act.distance ? act.distance.toFixed(1) : '?'} km away
                          </p>
                        </div>
                      </div>

                      <h3 className="font-semibold text-xl mb-3">{act.title}</h3>
                      <p className="text-gray-600 mb-5 line-clamp-3">{act.description}</p>

                      {act.interests?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-6">
                          {act.interests.map((interest, idx) => (
                            <span
                              key={idx}
                              className="text-xs px-4 py-1.5 bg-primary/10 text-primary rounded-2xl"
                            >
                              #{interest}
                            </span>
                          ))}
                        </div>
                      )}

                      <Button
                        onClick={() => navigate(`/activity/${act._id}`)}
                        className="w-full"
                      >
                        View Details
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {activities.length === 0 && (search.trim() === '' || users.length === 0) && !loading && (
              <div className="text-center py-20">
                <MapPin size={56} className="mx-auto text-gray-300 mb-4" />
                <p className="text-xl text-gray-500">No activities found</p>
                <p className="text-gray-400 mt-2">
                  Try increasing radius or different search term
                </p>
              </div>
            )}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

// Debounce helper
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}