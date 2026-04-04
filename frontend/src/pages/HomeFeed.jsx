// frontend/src/pages/HomeFeed.jsx
import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useFeedStore } from '../store/useFeedStore';
import BottomNav from '../components/layout/BottomNav';
import Avatar from '../components/common/Avatar';
import CreateActivityModal from '../components/activity/CreateActivityModal';
import FeedCard from '../components/feed/FeedCard';
import { Plus } from 'lucide-react';

export default function HomeFeed() {
  const { user } = useAuthStore();
  const { activities, loading, loadFeed } = useFeedStore();
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  const handleActivityCreated = () => {
    loadFeed(); // Refresh the feed after creating new activity
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 bg-white/90 backdrop-blur-lg border-b z-50">
        <div className="max-w-2xl mx-auto px-6 py-5 flex items-center justify-between">
          <h1 className="text-3xl font-poppins font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            VibeMeet
          </h1>
          <div className="flex items-center gap-3">
            <span className="px-4 py-1.5 bg-secondary/50 rounded-3xl text-sm font-medium">
              {user?.mood || 'social'}
            </span>
            <Avatar src={user?.avatar} size="md" />
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 pt-6">
        {loading ? (
          <div className="space-y-6">
            {[1,2,3].map(i => (
              <div key={i} className="h-80 bg-white rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            No activities yet. Create one!
          </div>
        ) : (
          activities.map(activity => (
            <FeedCard 
              key={activity._id} 
              activity={activity} 
              onJoin={() => window.location.href = `/activity/${activity._id}`}
            />
          ))
        )}
      </div>

      {/* Floating Create Button */}
      <button
        onClick={() => setShowCreateModal(true)}
        className="fixed bottom-24 right-6 w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full shadow-2xl flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all z-50"
      >
        <Plus size={32} strokeWidth={3} />
      </button>

      {/* Create Activity Modal */}
      <CreateActivityModal 
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onActivityCreated={handleActivityCreated}
      />

      <BottomNav />
    </div>
  );
}