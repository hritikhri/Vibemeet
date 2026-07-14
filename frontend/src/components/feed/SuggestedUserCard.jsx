// frontend/src/components/feed/SuggestedUserCard.jsx
import Avatar from '../common/Avatar';
import Button from '../ui/Button';
import { useNavigate } from 'react-router-dom';

export default function SuggestedUserCard({ user }) {
  const navigate = useNavigate();

  const handleConnect = () => {
    // You can later change this to send friend request
    navigate(`/profile/${user._id}`);
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-soft hover:shadow-md transition-all duration-300 min-w-[160px] flex flex-col items-center">
      <div className="relative">
        <Avatar 
          src={user.avatar} 
          size="lg" 
          className="ring-2 ring-primary/20"
        />
        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white" />
      </div>

      <div className="mt-5 text-center">
        <p className="font-semibold text-base leading-tight">{user.name}</p>
        <p className="text-xs text-gray-500 mt-0.5">@{user.username}</p>
      </div>

      <div className="mt-2 text-center">
        <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
          <span>📍</span> 
          {user.distance ? user.distance.toFixed(1) : '5'} km away
        </p>
      </div>

      <Button 
        variant="secondary" 
        className="w-full mt-6 text-sm py-2.5 font-medium"
        onClick={handleConnect}
      >
        View Profile
      </Button>
    </div>
  );
}