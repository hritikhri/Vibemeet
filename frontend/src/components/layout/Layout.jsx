import { Outlet } from 'react-router-dom';
import Navbar from '../ui/Navbar';
import { useAuthStore } from '../../store/useAuthStore';

export default function Layout() {
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />
      <Outlet />
    </div>
  );
}