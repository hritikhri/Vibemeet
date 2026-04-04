import Card from '../ui/Card';
import Button from '../ui/Button';
import Avatar from '../common/Avatar';

export default function ActivityCard({ activity }) {
  return (
    <Card>
      <div className="p-6">
        <h3 className="font-semibold text-xl mb-2">{activity.title}</h3>
        <p className="text-gray-600 text-sm line-clamp-2 mb-6">{activity.description}</p>
        <div className="flex items-center justify-between">
          <div className="flex -space-x-2">
            {activity.participants?.slice(0, 3).map((p, i) => (
              <Avatar key={i} src={p.avatar} size="sm" />
            ))}
          </div>
          <Button size="sm">Join</Button>
        </div>
      </div>
    </Card>
  );
}