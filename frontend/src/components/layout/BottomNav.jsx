import { Home, Compass, Users, Bell, User } from "lucide-react";
import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/explore", icon: Compass, label: "Explore" },
  { to: "/chat", icon: Users, label: "Chat" },
  { to: "/notifications", icon: Bell, label: "Alerts" },
  { to: "/profile", icon: User, label: "Me" },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[95%] max-w-md bg-white/80 backdrop-blur-lg border border-gray-200 shadow-xl rounded-2xl px-2 py-2 z-50 md:hidden">
      
      <div className="flex justify-between items-center">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `relative flex flex-col items-center justify-center flex-1 py-2 rounded-xl transition-all duration-300 group ${
                isActive ? "text-[#4a9c6e]" : "text-gray-500"
              }`
            }
          >
            {({ isActive }) => (
              <>
                {/* Active background pill */}
                <span
                  className={`absolute inset-0 rounded-xl transition-all duration-300 ${
                    isActive
                      ? "bg-[#4a9c6e]/10 scale-100"
                      : "scale-0 group-hover:scale-75"
                  }`}
                ></span>

                {/* Icon */}
                <Icon
                  size={24}
                  className={`relative z-10 transition-transform duration-300 ${
                    isActive
                      ? "scale-110"
                      : "group-hover:scale-110"
                  }`}
                />

                {/* Label */}
                <span
                  className={`relative z-10 text-[11px] mt-1 transition-all duration-300 ${
                    isActive
                      ? "opacity-100 translate-y-0"
                      : "opacity-70 group-hover:opacity-100"
                  }`}
                >
                  {label}
                </span>

                {/* Active indicator dot */}
                <span
                  className={`absolute -bottom-1 h-1 w-1 rounded-full bg-[#4a9c6e] transition-all duration-300 ${
                    isActive ? "opacity-100 scale-100" : "opacity-0 scale-0"
                  }`}
                ></span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}