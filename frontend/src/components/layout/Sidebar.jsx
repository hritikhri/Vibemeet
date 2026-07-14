// src/components/layout/Sidebar.jsx
import { useState, useRef, useEffect } from 'react';
import { 
  Home, Compass, MessageCircle, Bell, User, 
  MoreHorizontal, LogOut, Settings, Shield, 
  HelpCircle, Bookmark, Moon, Sun 
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import Avatar from '../common/Avatar';

const navItems = [
  { to: '/', icon: Home, label: 'Home', badge: null },
  { to: '/explore', icon: Compass, label: 'Explore', badge: null },
  { to: '/chat', icon: MessageCircle, label: 'Chat', badge: 3 },
  { to: '/notifications', icon: Bell, label: 'Activity', badge: 5 },
];

export default function Sidebar() {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [theme, setTheme] = useState('light');
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const { user, logout } = useAuthStore();

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <aside className="hidden lg:flex xl:flex sticky left-0 top-0 h-screen border-r border-gray-200 bg-[#f8f7f4] z-40">
      {/* Sidebar Container */}
      <div className="flex flex-col w-64 px-3 py-4">
        
        {/* Logo */}
        <div className="flex items-center gap-2 px-3 mt-5 mb-10">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#4a9c6e] to-[#6ab8a0] 
            flex items-center justify-center flex-shrink-0 shadow-md shadow-[#4a9c6e]/20">
            <span className="text-white font-bold text-sm">B</span>
          </div>
          <span className="font-serif font-bold text-base bg-gradient-to-r from-[#4a9c6e] to-[#6ab8a0] 
            bg-clip-text text-transparent whitespace-nowrap">
            BondCircle
          </span>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 flex flex-col gap-1">
          {navItems.map(({ to, icon: Icon, label, badge }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `relative flex items-center gap-2.5 px-3 py-2.5 rounded-lg overflow-hidden
                 transition-all duration-200 ease-out
                 ${isActive
                   ? 'bg-[#e8f5e9] text-[#2e7d32] font-medium'
                   : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                 }`
              }
            >
              {/* Icon with badge */}
              <div className="relative flex-shrink-0">
                <Icon
                  size={18}
                  strokeWidth={2}
                />
                {badge && (
                  <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-red-500 
                    text-white text-[9px] font-bold rounded-full 
                    flex items-center justify-center shadow-sm">
                    {badge}
                  </span>
                )}
              </div>

              {/* Label */}
              <span className="text-sm font-medium">
                {label}
              </span>
            </NavLink>
          ))}
        </nav>

        {/* Bottom Section */}
        <div className="flex flex-col gap-1 relative" ref={menuRef}>
          {/* User Profile Preview */}
          {/* <div className="px-3 py-2 mb-1">
            <div className="flex items-center gap-2.5">
              <Avatar 
                src={user?.avatar} 
                alt={user?.name}
                size="sm"
                className="ring-1 ring-[#4a9c6e]/20"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-gray-800 truncate">
                  {user?.name || 'User'}
                </p>
                <p className="text-[10px] text-gray-500 truncate">
                  @{user?.username || 'username'}
                </p>
              </div>
            </div>
          </div> */}

          {/* Profile Button */}
          <NavLink
            to={`/profile/${user?._id}`}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg 
              text-gray-600 hover:bg-gray-50 hover:text-gray-900
              transition-all duration-200"
          >
            <User size={18} strokeWidth={2} className="flex-shrink-0" />
            <span className="text-sm font-medium">Profile</span>
          </NavLink>

          {/* More Options */}
          <button
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg 
              text-gray-600 hover:bg-gray-50 hover:text-gray-900
              transition-all duration-200"
          >
            <MoreHorizontal size={18} strokeWidth={2} className="flex-shrink-0" />
            <span className="text-sm font-medium">More</span>
          </button>

          {/* Dropdown Menu */}
          <div
            className={`absolute bottom-16 left-0 w-52 
              bg-white border border-gray-200 
              rounded-xl shadow-lg shadow-gray-200/50
              overflow-hidden
              transition-all duration-200 ease-out transform origin-bottom-left ${
                profileMenuOpen
                  ? 'opacity-100 translate-y-0 scale-100'
                  : 'opacity-0 translate-y-2 scale-95 pointer-events-none'
              }`}
          >
            {/* Menu Header */}
            <div className="px-3 py-2 border-b border-gray-100">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                Quick Actions
              </p>
            </div>

            {/* Menu Items */}
            <div className="py-1">
              <button
                onClick={() => {
                  navigate('/settings');
                  setProfileMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2
                  text-gray-600 hover:bg-gray-50 hover:text-gray-900
                  transition-all duration-200 text-xs font-medium"
              >
                <Settings size={16} />
                <span>Settings</span>
              </button>

              <button
                onClick={() => {
                  navigate('/saved');
                  setProfileMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2
                  text-gray-600 hover:bg-gray-50 hover:text-gray-900
                  transition-all duration-200 text-xs font-medium"
              >
                <Bookmark size={16} />
                <span>Saved</span>
              </button>

              <button
                onClick={toggleTheme}
                className="w-full flex items-center gap-2.5 px-3 py-2
                  text-gray-600 hover:bg-gray-50 hover:text-gray-900
                  transition-all duration-200 text-xs font-medium"
              >
                {theme === 'light' ? (
                  <>
                    <Moon size={16} />
                    <span>Dark Mode</span>
                  </>
                ) : (
                  <>
                    <Sun size={16} />
                    <span>Light Mode</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  navigate('/privacy');
                  setProfileMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2
                  text-gray-600 hover:bg-gray-50 hover:text-gray-900
                  transition-all duration-200 text-xs font-medium"
              >
                <Shield size={16} />
                <span>Privacy</span>
              </button>

              <button
                onClick={() => {
                  navigate('/help');
                  setProfileMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2
                  text-gray-600 hover:bg-gray-50 hover:text-gray-900
                  transition-all duration-200 text-xs font-medium"
              >
                <HelpCircle size={16} />
                <span>Help & Support</span>
              </button>
            </div>

            {/* Logout */}
            <div className="border-t border-gray-100 py-1">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2
                  text-red-600 hover:bg-red-50
                  transition-all duration-200 text-xs font-medium"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}