import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../lib/api';

export default function OtpVerification() {
  const [otp, setOtp] = useState(Array(6).fill(''));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);

  const inputsRef = useRef([]);
  const navigate = useNavigate();
  const { state } = useLocation();

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleChange = (value, index) => {
    if (!/^[0-9]?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputsRef.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    // Backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputsRef.current[index - 1].focus();
    }

    // ENTER → verify
    if (e.key === 'Enter') {
      handleVerify();
    }
  };

  const handleVerify = async () => {
    const finalOtp = otp.join('');
    if (finalOtp.length !== 6) return;

    setLoading(true);
    setError('');
    try {
      await api.post('/auth/verify-otp', {
        email: state?.email,
        otp: finalOtp
      });
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-white to-secondary/10 px-4">

      <div className="w-full max-w-xs sm:max-w-sm md:max-w-md bg-white rounded-2xl shadow-lg md:shadow-xl p-6 md:p-8 text-center transition-all">

        {/* Branding */}
        <h2 className="text-xs text-gray-400">Welcome to</h2>
        <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-primary to-secondary text-transparent bg-clip-text mb-2">
          VibeMeet
        </h1>

        {/* Title */}
        <p className="text-sm md:text-base font-medium text-gray-700">
          Verify your email
        </p>
        <p className="text-xs md:text-sm text-gray-500 mb-5 break-all">
          Code sent to {state?.email}
        </p>

        {/* OTP Boxes */}
        <div className="flex justify-center gap-2 md:gap-3 mb-5">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputsRef.current[index] = el)}
              type="text"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(e.target.value, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className="w-10 h-10 md:w-12 md:h-12 text-center text-lg md:text-xl font-semibold border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
            />
          ))}
        </div>

        {error && (
          <p className="text-red-500 text-xs mb-3">{error}</p>
        )}

        {/* Button */}
        <button
          onClick={handleVerify}
          disabled={loading}
          className="w-full py-2.5 md:py-3 text-sm md:text-base bg-primary text-white rounded-xl font-medium shadow hover:shadow-md hover:scale-[1.02] transition-all disabled:opacity-50"
        >
          {loading ? 'Verifying...' : 'Verify Code'}
        </button>

        {/* Resend */}
        <p className="text-xs md:text-sm mt-4 text-gray-500">
          Didn’t receive the code?
          <button
            onClick={handleResend}
            disabled={resendTimer > 0}
            className="ml-1 text-primary font-medium hover:underline disabled:opacity-50"
          >
            Resend {resendTimer > 0 ? `(${resendTimer}s)` : ''}
          </button>
        </p>

      </div>
    </div>
  );
}