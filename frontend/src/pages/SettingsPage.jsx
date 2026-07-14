import { useState } from 'react';
import { User, Lock, HelpCircle, Shield, Menu, X, Settings } from 'lucide-react';
import EditProfile from './EditProfile';
import { HelpCenter } from './HelpCenter';
import { PrivacyCenter } from './PrivacyCenter';
import ResetPassword from './ResetCurrentPassword';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const menu = [
    { id: 'profile', label: 'Edit Profile', icon: User },
    { id: 'password', label: 'Change Password', icon: Lock },
    { id: 'help', label: 'Help Center', icon: HelpCircle },
    { id: 'privacy', label: 'Privacy & Safety', icon: Shield },
  ];

  return (
    <div className="max-h-[100vh] bg-zinc-950 flex overflow-hidden">
      
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden z-100 fixed top-6 left-6 z-50 p-3 bg-zinc-900 rounded-2xl border border-zinc-800 text-white"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50 w-72 bg-zinc-900 border-r border-zinc-800 
        transition-transform duration-300 lg:translate-x-0
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        
        <div className="h-full flex flex-col p-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-12">
            <div className="w-11 h-11 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-white">Settings</h1>
              <p className="text-sm text-gray-500">Account Management</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2">
            {menu.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-left 
                    transition-all duration-200 group
                    ${isActive 
                      ? 'bg-zinc-800 text-white' 
                      : 'hover:bg-zinc-800/50 text-gray-400 hover:text-gray-200'
                    }
                  `}
                >
                  <Icon size={22} className={isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'} />
                  <span className="font-medium text-[15px]">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="mt-auto pt-10 border-t border-zinc-800">
            <p className="text-xs text-gray-600 text-center">
              Vibe Meet © 2026
            </p>
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/70 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-6 py-10 lg:py-12">
          <div className="transition-opacity duration-300">
            {activeTab === 'profile' && <EditProfile />}
            {activeTab === 'password' && <ResetPassword />}
            {activeTab === 'help' && <HelpCenter />}
            {activeTab === 'privacy' && <PrivacyCenter />}
          </div>
        </div>
      </div>
    </div>
  );
}