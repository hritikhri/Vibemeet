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
    { id: 'privacy', label: 'Privacy Center', icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex overflow-hidden">
      
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-white rounded-2xl shadow-lg border border-gray-100"
      >
        <Menu className="w-6 h-6 text-gray-700" />
      </button>

      {/* Sidebar - Fixed & Floating */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-100 
        shadow-xl lg:shadow-none transition-transform duration-300 ease-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        
        <div className="h-full flex flex-col p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
              <p className="text-xs text-gray-500">Manage your account</p>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 space-y-1">
            {menu.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileOpen(false); // Close mobile menu
                  }}
                  className={`
                    w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl text-left 
                    transition-all duration-300 group
                    ${isActive 
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-200' 
                      : 'hover:bg-gray-100 text-gray-700'
                    }
                  `}
                >
                  <div className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                    <Icon size={20} />
                  </div>
                  <span className="font-medium text-[15px]">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Bottom Info */}
          <div className="mt-auto pt-8 border-t border-gray-100">
            <p className="text-xs text-gray-500 text-center">
              Vibe Meet © 2026
            </p>
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Main Content Area - Scrollable Only */}
      <div className="flex-1 overflow-auto h-screen">
        <div className="max-w-4xl mx-auto p-6 lg:p-10 pt-20 lg:pt-10">
          
          {/* Dynamic Content with Fade Animation */}
          <div className="transition-opacity duration-300 ease-in-out">
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