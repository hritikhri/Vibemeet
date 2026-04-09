// frontend/src/router.jsx
import { createBrowserRouter, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/layout/ProtectedRoute';

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


export const router = createBrowserRouter([
  { path: "/", element: <Landing /> },
  { path: "/login", element: <Login /> },
  { path: "/signup", element: <Signup /> },
  { path: "/verify-otp", element: <OtpVerification /> },
  { path:"/verify-otp-success", element: <SignupSuccess/> },
  { path:"/forgot-password", element: <ForgotPassword/> },
  { path:"/setting", element: <SettingsPage/> },
  { 
    path: "/home", 
    element: <ProtectedRoute><HomeFeed /></ProtectedRoute> 
  },
  { 
    path: "/explore", 
    element: <ProtectedRoute><OurMainLayout><Explore /></OurMainLayout></ProtectedRoute> 
  },
  { 
    path: "/activity/:id", 
    element: <ProtectedRoute><OurMainLayout><ActivityDetail /></OurMainLayout></ProtectedRoute> 
  },
  { 
    path: "/chat", 
    element: <ProtectedRoute><OurMainLayout><ChatPage /></OurMainLayout></ProtectedRoute> 
  },
  { 
    path: "/notifications", 
    element: <ProtectedRoute><OurMainLayout><Notifications /></OurMainLayout></ProtectedRoute> 
  },
  { 
    path: "/profile", 
    element: <ProtectedRoute><OurMainLayout><Profile /></OurMainLayout></ProtectedRoute> 
  },
  { 
    path: "/profile/:id",
    element: <ProtectedRoute><OurMainLayout><Profile /></OurMainLayout></ProtectedRoute> 
  },
  { 
    path: "/edit-profile", 
    element: <ProtectedRoute><EditProfile /></ProtectedRoute> 
  },
  { 
    path: "/settings", 
    element: <ProtectedRoute><EditProfile /></ProtectedRoute> 
  },
  { path: "/chat/private/:otherUserId", element: <ProtectedRoute><OurMainLayout><PrivateChat /></OurMainLayout></ProtectedRoute> }
]);

