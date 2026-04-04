import Avatar from '../common/Avatar';
import Button from '../ui/Button';

export default function SuggestedUserCard({ user }) {
  return (
    <div className="bg-white rounded-3xl p-5 min-w-[150px] shadow-soft">
      <Avatar src={user.avatar} size="lg" />
      <p className="font-medium text-center mt-4">{user.name}</p>
      <p className="text-center text-xs text-gray-500 mt-1">{user.distance?.toFixed(1)} km</p>
      <Button variant="secondary" className="w-full mt-5 text-sm py-2.5">Connect</Button>
    </div>
  );
}