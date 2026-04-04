import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { useAuthStore } from './store/useAuthStore';
import { useEffect } from 'react';

function App() {
  const { loadUser } = useAuthStore();

  useEffect(() => {
    loadUser();
  }, []);

  return <RouterProvider router={router} />;
}

export default App;