import { Toaster } from "react-hot-toast";
import { RouterProvider } from "react-router-dom";
import { useEffect, useState } from "react";

import { router } from "./router";
import { useAuthStore } from "./store/useAuthStore";

function App() {
  const { loadUser, isLoading,disconnectSocket } = useAuthStore();
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      await loadUser();
      setAppReady(true);
    };

    initializeApp();
    return () => {
      // Optional: cleanup on app unmount
      disconnectSocket();
    };
    
  }, [loadUser]);

  // Show a simple loading screen while auth is being checked
  if (!appReady || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f7f4]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-[#4a9c6e] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading your vibes...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <RouterProvider router={router} />
      <Toaster position="top-center" richColors closeButton />
    </>
  );
}

export default App;
