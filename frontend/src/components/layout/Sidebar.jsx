import { useState, useRef, useEffect } from 'react';
import { Home, Compass, MessageCircle, Bell, User, MoreHorizontal, LogOut, Settings } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';

const navItems = [
  { to: '/home', icon: Home, label: 'Home' },
  { to: '/explore', icon: Compass, label: 'Explore' },
  { to: '/chat', icon: MessageCircle, label: 'Chat' },
  { to: '/notifications', icon: Bell, label: 'Alerts' },
];

export default function Sidebar() {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const menuRef = useRef(null);

  // Close dropdown if clicked outside
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
    localStorage.removeItem('token'); // Remove token
    navigate('/login'); // Redirect to login page
  };

  const handleSettings = () => {
    navigate('/settings'); // Redirect to settings page
  };

  return (
    <div className="hidden sm:flex fixed left-4 top-1/2 -translate-y-1/2 z-50">
      {/* Sidebar Container */}
      <div className="group flex flex-col justify-between h-[65vh] bg-white/70 backdrop-blur-xl border border-white/40 shadow-xl rounded-2xl
                      px-2 py-3 transition-all duration-300 w-16 hover:w-48">

        {/* Navigation Items */}
        <div className="flex flex-col gap-2"> {/* Reduced gap for professional look */}
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-2 py-2 rounded-xl transition-all duration-300 overflow-hidden
                 ${isActive
                   ? 'bg-primary text-white shadow-md scale-[1.05]'
                   : 'text-gray-600 hover:bg-white hover:shadow hover:scale-[1.05]'
                 }`
              }
            >
              <Icon size={22} className="flex-shrink-0 transition-transform duration-300 group-hover:rotate-6" />
              <span className="whitespace-nowrap text-sm font-medium opacity-0 translate-x-[-10px] group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                {label}
              </span>
            </NavLink>
          ))}
        </div>

        {/* Profile + More Options */}
        <div className="flex flex-col gap-1 relative" ref={menuRef}> {/* Reduced gap for professional spacing */}
          {/* Profile */}
          <NavLink
            to="/profile"
            className="flex items-center gap-3 px-2 py-2 rounded-xl text-gray-600 hover:bg-white hover:shadow hover:scale-[1.05] transition-all duration-300 overflow-hidden"
          >
            <User size={22} className="flex-shrink-0" />
            <span className="whitespace-nowrap text-sm font-medium opacity-0 translate-x-[-10px] group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
              Profile
            </span>
          </NavLink>

          {/* More / Dropdown Trigger */}
          <button
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className="flex items-center gap-3 px-2 py-2 rounded-xl text-gray-600 hover:bg-white hover:shadow hover:scale-[1.05] transition-all duration-300 overflow-hidden"
          >
            <MoreHorizontal size={22} className="flex-shrink-0" />
            <span className="whitespace-nowrap text-sm font-medium opacity-0 translate-x-[-10px] group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
              More
            </span>
          </button>

          {/* Dropdown Menu */}
          <div
            className={`absolute bottom-12 left-0 w-40 flex flex-col bg-white border border-gray-200 rounded-xl shadow-md overflow-hidden
                        transition-all duration-300 transform ${
                          profileMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
                        }`}
          >
            <button
              onClick={handleSettings}
              className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 transition-all duration-200"
            >
              <Settings size={18} /> Settings
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 transition-all duration-200"
            >
              <LogOut size={18} /> Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}