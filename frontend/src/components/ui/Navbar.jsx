import { Link } from 'react-router-dom';
import Avatar from '../common/Avatar';

export default function Navbar({ user }) {
  return (
    <nav className="hidden md:flex sticky top-0 bg-white border-b z-50">
      <div className="max-w-6xl mx-auto w-full px-8 py-5 flex items-center justify-between">
        <Link to="/home" className="text-3xl font-poppins font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          VibeMeet
        </Link>
        
        <div className="flex items-center gap-8">
          <Link to="/explore" className="font-medium hover:text-primary transition-colors">Explore</Link>
          <Link to="/chat" className="font-medium hover:text-primary transition-colors">Messages</Link>
          <Link to="/notifications" className="font-medium hover:text-primary transition-colors">Notifications</Link>
          
          <div className="flex items-center gap-4">
            <Avatar src={user?.avatar} size="md" />
            <span className="font-medium">{user?.name?.split(" ")[0]}</span>
          </div>
        </div>
      </div>
    </nav>
  );
}