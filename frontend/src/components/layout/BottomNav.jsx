import { Home, Compass, Users, Bell, User } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-primary/10 z-50 md:hidden">
      <div className="max-w-2xl mx-auto flex justify-around py-2">
        <NavLink to="/home" className={({isActive}) => `flex flex-col items-center ${isActive ? 'text-primary' : 'text-gray-500'}`}>
          <Home size={24} />
          <span className="text-xs mt-1">Home</span>
        </NavLink>
        <NavLink to="/explore" className={({isActive}) => `flex flex-col items-center ${isActive ? 'text-primary' : 'text-gray-500'}`}>
          <Compass size={24} />
          <span className="text-xs mt-1">Explore</span>
        </NavLink>
        <NavLink to="/chat" className={({isActive}) => `flex flex-col items-center ${isActive ? 'text-primary' : 'text-gray-500'}`}>
          <Users size={24} />
          <span className="text-xs mt-1">Chat</span>
        </NavLink>
        <NavLink to="/notifications" className={({isActive}) => `flex flex-col items-center ${isActive ? 'text-primary' : 'text-gray-500'}`}>
          <Bell size={24} />
          <span className="text-xs mt-1">Alerts</span>
        </NavLink>
        <NavLink to="/profile" className={({isActive}) => `flex flex-col items-center ${isActive ? 'text-primary' : 'text-gray-500'}`}>
          <User size={24} />
          <span className="text-xs mt-1">Me</span>
        </NavLink>
      </div>
    </nav>
  );
}