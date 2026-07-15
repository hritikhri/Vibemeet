// frontend/src/router.jsx
import { createBrowserRouter, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/layout/ProtectedRoute';
import { useAuthStore } from './store/useAuthStore';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import HomeFeed from './pages/HomeFeed';
import Explore from './pages/Explore';
import ActivityDetail from './pages/ActivityDetail';
import ChatPage from './pages/ChatPage';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';           // ← This will handle both /profile and /profile/:id
import EditProfile from './pages/EditProfile';
import OtpVerification from './pages/OtpVerification';
import PrivateChat from './pages/PrivateChat';
import OurMainLayout from './components/ui/OurMainLayout';
import SignupSuccess from './pages/SignupSuccess';
import ForgotPassword from './pages/ForgotPassword';
import SettingsPage from './pages/SettingsPage';
import NotFound from './pages/error/NotFound';
import Unauthorized from './pages/error/Unauthorized';
import ChatLayout from './pages/Chatlayout ';
import Terms from './pages/terms/Terms';
import Contact from './pages/terms/Contact';
import Privacy from './pages/terms/Privacy';

export default function RootRoute() {
  const { isAuthenticated, isCheckingAuth } = useAuthStore();

  if (isCheckingAuth) {
    return <div>Loading...</div>; // Replace with your loader/spinner
  }

  if (isAuthenticated) {
    return (
      <OurMainLayout>
        <HomeFeed />
      </OurMainLayout>
    );
  }

  return <Landing />;
}

export const router = createBrowserRouter([
  { path: "/", element: <RootRoute /> },
  { path: "/login", element: <Login /> },
  { path: "/signup", element: <Signup /> },
  { path: "/verify-otp", element: <OtpVerification /> },
  { path:"/verify-otp-success", element: <SignupSuccess/> },
  { path:"/forgot-password", element: <ForgotPassword/> },
  { path:"/setting", element: <SettingsPage/> },
  { path : "/contact", element:<Contact/> }, 
  { path:"privacy", element:<Privacy/> },
  { path:"/terms", element:<Terms/> },
  // { path: "/", 
  //   element: <ProtectedRoute><OurMainLayout><HomeFeed /></OurMainLayout></ProtectedRoute> 
  // },
  { path: "/explore", 
    element: <ProtectedRoute><OurMainLayout><Explore /></OurMainLayout></ProtectedRoute> 
  },
  { 
    path: "/activity/:id", 
    element: <ProtectedRoute><OurMainLayout><ActivityDetail /></OurMainLayout></ProtectedRoute> 
  },
  { 
    path: "/chat", 
    element: <ProtectedRoute><OurMainLayout><ChatLayout /></OurMainLayout></ProtectedRoute> 
  },
  { path: "/chat/:otherUserId", element: <ProtectedRoute><OurMainLayout><ChatLayout /></OurMainLayout></ProtectedRoute> },
  { 
    path: "/notifications", 
    element: <ProtectedRoute><OurMainLayout><Notifications /></OurMainLayout></ProtectedRoute> 
  },
  { 
    errorElement:<Unauthorized/>,
    path: "/profile", 
    element: <ProtectedRoute><OurMainLayout><Profile /></OurMainLayout></ProtectedRoute> 
  },
  { 
    path: "/profile/:id",
    element: <ProtectedRoute><OurMainLayout><Profile /></OurMainLayout></ProtectedRoute> 
  },
  { 
    // path: "/settings", 
    // element: <ProtectedRoute><EditProfile /></ProtectedRoute> 
  },
  {
    path:"*", element:<NotFound/>
  },
]);

