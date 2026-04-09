import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useFeedStore } from '../store/useFeedStore';
import BottomNav from '../components/layout/BottomNav';
import Avatar from '../components/common/Avatar';
import CreateActivityModal from '../components/activity/CreateActivityModal';
import FeedCard from '../components/feed/FeedCard';
import { Plus } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import { useNavigate } from 'react-router-dom';

export default function HomeFeed() {
    const navigate = useNavigate();
  const { user } = useAuthStore();
  const { activities, loading, loadFeed } = useFeedStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  const handleActivityCreated = () => {
    loadFeed();
  };
    const handleCreatorClick = (e) => {
    e.stopPropagation();
    navigate(`/profile/${user._id}`);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
        <Sidebar />
      {/* Header */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          
          {/* Logo */}
          <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            VibeMeet
          </h1>

          {/* Right Section */}
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="px-3 py-1 text-xs sm:text-sm bg-secondary/50 rounded-full">
              {user?.mood || 'add Your Mood'}
            </span>
            <div onClick={handleCreatorClick}>
            <Avatar src={user?.avatar} size="sm" />
            </div>
          </div>
        </div>
      </header>

      {/* Feed */}
      <main className="bg-background max-w-3xl mx-auto px-3 sm:px-6 pt-5">
        {loading ? (
          <div className="space-y-4 sm:space-y-6">
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className="h-60 sm:h-72 bg-white rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-20">
  <div className="w-20 h-20 bg-gradient-to-br from-primary/10 to-accent/10 rounded-3xl flex items-center justify-center mb-6">
    <span className="text-5xl">🏞️</span>
  </div>
  <p className="text-2xl font-semibold text-gray-900 mb-2">No activities yet</p>
  <p className="text-gray-500 max-w-xs">
    Start creating your first vibe and share amazing moments with friends
  </p>

</div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {activities.map(activity => (
              <FeedCard
                key={activity._id}
                activity={activity}
                onJoin={() =>
                  window.location.href = `/activity/${activity._id}`
                }
              />
            ))}
          </div>
        )}
      </main>

      {/* Floating Button */}
      <button
        onClick={() => setShowCreateModal(true)}
        className="fixed bottom-24 right-4 sm:right-6 w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-primary to-accent rounded-full shadow-xl flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all z-50"
      >
        <Plus size={26} className="sm:size-7" />
      </button>

      {/* Modal */}
      <CreateActivityModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onActivityCreated={handleActivityCreated}
      />

      <BottomNav />
    </div>
  );
}