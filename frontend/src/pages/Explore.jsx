// frontend/src/pages/Explore.jsx
import { useState, useEffect, useCallback } from "react";
import { Search, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/layout/BottomNav";
import Avatar from "../components/common/Avatar";
import Button from "../components/ui/Button";
import api from "../lib/api";

export default function Explore() {
  const [activities, setActivities] = useState([]);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [radius, setRadius] = useState(15);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchExplore = async (searchTerm = search) => {
    setLoading(true);
    try {
      const { data } = await api.get(
        `/activities/explore?radius=${radius}&search=${encodeURIComponent(searchTerm)}`,
      );

      const fetchedActivities = Array.isArray(data) ? data : [];

      // Extract unique users only when search term exists
      let extractedUsers = [];
      if (searchTerm.trim() !== "") {
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
    [radius],
  );

  useEffect(() => {
    debouncedFetch(search);
  }, [search, radius]);

  // Initial load - only activities
  useEffect(() => {
    fetchExplore("");
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
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 bg-white z-50 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col gap-2">
          {/* LOGO + SEARCH */}
          <div className="flex items-center justify-between gap-3 relative">
            {/* TITLE */}
            <h1 className="text-lg sm:text-xl font-bold font-poppins text-gray-800 flex-shrink-0">
              Explore Vibes
            </h1>

            {/* SEARCH ICON & EXPANDABLE BAR */}
            <div className="relative flex-1 max-w-[40px] sm:max-w-md">
              <input
                type="text"
                placeholder="Search activities or people..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={(e) => e.target.parentElement.classList.add("w-full")}
                onBlur={(e) =>
                  e.target.parentElement.classList.remove("w-full")
                }
                className="w-10 sm:w-full pl-10 pr-3 py-1 sm:py-2 bg-gray-100 rounded-full border border-gray-200 focus:border-primary outline-none text-sm sm:text-sm transition-all duration-300 ease-in-out"
              />
              <Search
                className="absolute left-3 top-2.5 text-gray-400 cursor-pointer"
                size={18}
                onClick={() => document.querySelector("input").focus()}
              />
            </div>
          </div>

          {/* RADIUS FILTER */}
          <div className="flex gap-2 justify-start sm:justify-start flex-wrap sm:flex-nowrap py-1">
            {[5, 10, 15, 30, 50].map((r) => (
              <button
                key={r}
                onClick={() => setRadius(r)}
                className={`px-2 py-1 sm:px-2 sm:py-1 rounded-full text-xs sm:text-xs font-medium transition-all whitespace-nowrap ${
                  radius === r
                    ? "bg-primary text-white shadow-sm"
                    : "bg-white border border-gray-200 hover:bg-gray-50"
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
              <div
                key={i}
                className="h-64 bg-white rounded-3xl animate-pulse"
              />
            ))}
          </div>
        ) : (
          <>
            {/* USERS SECTION - Only show when searching */}
            {search.trim() !== "" && users.length > 0 && (
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
                        <div
                          onClick={() =>
                            navigate(`/profile/${act.creator._id}`)
                          }
                        >
                          <Avatar src={act.creator?.avatar} size="md" />
                        </div>
                        <div>
                          <p
                            className="font-medium"
                            onClick={() =>
                              navigate(`/profile/${act.creator._id}`)
                            }
                          >
                            {act.creator?.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {act.distance ? act.distance.toFixed(1) : "?"} km
                            away
                          </p>
                        </div>
                      </div>

                      <h3 className="font-semibold text-xl mb-3">
                        {act.title}
                      </h3>
                      <p className="text-gray-600 mb-5 line-clamp-3">
                        {act.description}
                      </p>

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
            {activities.length === 0 &&
              (search.trim() === "" || users.length === 0) &&
              !loading && (
                <div className="text-center bg-background py-20">
                  <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl flex items-center justify-center mb-6">
                    <MapPin size={42} className="text-blue-400" />
                  </div>
                  <p className="text-2xl font-semibold text-gray-900 mb-2">
                    No activities found
                  </p>
                  <p className="text-gray-500 max-w-sm mx-auto">
                    Try increasing the search radius or using a different
                    keyword
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
