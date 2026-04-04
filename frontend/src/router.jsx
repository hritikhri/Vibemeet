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


export const router = createBrowserRouter([
  { path: "/", element: <Landing /> },
  { path: "/login", element: <Login /> },
  { path: "/signup", element: <Signup /> },
  { path: "/verify-otp", element: <OtpVerification /> },

  // Protected Routes
  { 
    path: "/home", 
    element: <ProtectedRoute><HomeFeed /></ProtectedRoute> 
  },
  { 
    path: "/explore", 
    element: <ProtectedRoute><Explore /></ProtectedRoute> 
  },
  { 
    path: "/activity/:id", 
    element: <ProtectedRoute><ActivityDetail /></ProtectedRoute> 
  },
  { 
    path: "/chat", 
    element: <ProtectedRoute><ChatPage /></ProtectedRoute> 
  },
  { 
    path: "/notifications", 
    element: <ProtectedRoute><Notifications /></ProtectedRoute> 
  },
  { 
    path: "/profile", 
    element: <ProtectedRoute><Profile /></ProtectedRoute> 
  },
  { 
    path: "/profile/:id",           // ← NEW: Dynamic profile route
    element: <ProtectedRoute><Profile /></ProtectedRoute> 
  },
  { 
    path: "/edit-profile", 
    element: <ProtectedRoute><EditProfile /></ProtectedRoute> 
  },
  { path: "/chat/private/:otherUserId", element: <ProtectedRoute><PrivateChat /></ProtectedRoute> }
]);

