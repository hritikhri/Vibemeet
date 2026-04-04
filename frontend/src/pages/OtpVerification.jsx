import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../lib/api';
import Button from '../components/ui/Button';

export default function OtpVerification() {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const navigate = useNavigate();
  const { state } = useLocation(); // email passed from signup

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleVerify = async () => {
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/verify-otp', { email: state?.email, otp });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendTimer(60);
    await api.post('/auth/resend-otp', { email: state?.email });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-card p-10 text-center">
        <h1 className="text-3xl font-poppins font-semibold mb-2">Verify your email</h1>
        <p className="text-gray-500 mb-8">We sent a 6-digit code to {state?.email}</p>

        <input
          type="text"
          maxLength={6}
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          className="input-field text-center text-3xl tracking-widest mb-6"
          placeholder="000000"
        />

        {error && <p className="error-text">{error}</p>}

        <Button onClick={handleVerify} disabled={loading || otp.length !== 6} className="w-full py-4">
          {loading ? 'Verifying...' : 'Verify OTP'}
        </Button>

        <div className="mt-8 text-sm">
          Didn’t receive the code? 
          <button 
            onClick={handleResend} 
            disabled={resendTimer > 0}
            className="text-primary font-medium ml-1"
          >
            Resend {resendTimer > 0 ? `(${resendTimer}s)` : ''}
          </button>
        </div>
      </div>
    </div>
  );
}