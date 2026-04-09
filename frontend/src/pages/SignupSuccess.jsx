import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

export default function SignupSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/login');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 px-4">
      <div className="bg-white/90 backdrop-blur-lg shadow-2xl rounded-3xl p-8 max-w-md w-full text-center animate-fadeIn">
        
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <CheckCircle className="text-green-500 w-16 h-16 animate-bounce" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Registration Successful 🎉
        </h1>

        {/* Subtitle */}
        <p className="text-gray-600 mb-6">
          Your account has been created successfully.
          <br />
          Redirecting to login in <span className="font-semibold">5 seconds</span>...
        </p>

        {/* Login Button */}
        <button
          onClick={() => navigate('/login')}
          className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-3 rounded-xl font-semibold shadow-lg hover:scale-105 transition-transform duration-300"
        >
          Login Now →
        </button>

        {/* Small Note */}
        <p className="text-xs text-gray-500 mt-4">
          If you are not redirected automatically, click the button above.
        </p>
      </div>
    </div>
  );
}
