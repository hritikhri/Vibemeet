import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';

export default function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 flex flex-col">

      {/* Floating Gradient Blobs */}
      <div className="absolute top-0 -left-32 w-96 h-96 bg-purple-400/30 rounded-full filter blur-3xl animate-blob mix-blend-multiply"></div>
      <div className="absolute top-1/3 -right-32 w-96 h-96 bg-pink-400/30 rounded-full filter blur-3xl animate-blob animation-delay-2000 mix-blend-multiply"></div>
      <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-yellow-300/30 rounded-full filter blur-3xl animate-blob animation-delay-4000 mix-blend-multiply"></div>

      {/* Hero Content */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-6 text-center space-y-6 z-10">
        <h1 className="text-7xl font-poppins font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent drop-shadow-lg animate-fadeIn">
          VibeMeet
        </h1>

        <p className="text-2xl text-text/80 max-w-lg animate-fadeIn delay-200">
          Find your people.<br />
          Meet in real life.
        </p>

        <div className="space-y-4 w-full max-w-xs animate-fadeIn delay-400">
          <Link to="/login">
            <Button className="w-full text-lg py-4 hover:scale-105 transition-transform shadow-lg">
              Get Started
            </Button>
          </Link>
          <Link to="/signup">
            <Button variant="secondary" className="w-full text-lg py-4 hover:scale-105 transition-transform shadow-lg">
              Create Account
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pb-8 text-sm text-text/50 relative z-10">
        Made with <span className="text-red-500">❤️</span> for real connections
      </div>
    </div>
  );
}