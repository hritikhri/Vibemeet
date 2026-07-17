// src/components/ui/DemoBar.jsx
import { useState, useEffect } from 'react';
import { Copy, Check, X, Zap, Eye, EyeOff, ChevronUp } from 'lucide-react';

const DEMO_EMAIL    = 'demo@vibemeet.app';
const DEMO_PASSWORD = 'Demo@1234';

function CopyButton({ value }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const el = document.createElement('textarea');
      el.value = value;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={copy}
      title={copied ? 'Copied!' : `Copy ${value}`}
      className={`p-1.5 rounded-lg transition-all duration-200 flex-shrink-0
        ${copied
          ? 'bg-green-500/20 text-green-400'
          : 'bg-white/10 hover:bg-white/20 text-white/60 hover:text-white'}`}
    >
      {copied
        ? <Check size={12} strokeWidth={2.5} />
        : <Copy size={12} strokeWidth={2} />}
    </button>
  );
}

export default function DemoBar() {
  const [visible,    setVisible]    = useState(true);
  const [collapsed,  setCollapsed]  = useState(false);
  const [showPass,   setShowPass]   = useState(false);
  const [copiedAll,  setCopiedAll]  = useState(false);
  const [mounted,    setMounted]    = useState(false);

  // Entrance animation
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 300);
    return () => clearTimeout(t);
  }, []);

  const copyAll = async () => {
    const text = `Email: ${DEMO_EMAIL}\nPassword: ${DEMO_PASSWORD}`;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  if (!visible) return null;

  return (
    <div
      className={`
        fixed bottom-5 left-1/2 z-[9999]
        transition-all duration-500 ease-out
        ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
      `}
      style={{ transform: `translateX(-50%) translateY(${mounted ? '0' : '2rem'})` }}
    >
      <div className={`
        relative rounded-2xl shadow-2xl overflow-hidden
        transition-all duration-300 ease-in-out
        ${collapsed ? 'w-48' : 'w-[340px] sm:w-[380px]'}
      `}>

        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#7C3AED] to-[#EC4899]" />

        {/* Noise texture overlay for depth */}
        <div className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Glow blob inside */}
        <div className="absolute -top-6 -right-6 w-24 h-24 bg-pink-400/40 rounded-full blur-2xl pointer-events-none" />

        {/* ── Collapsed state ── */}
        {collapsed ? (
          <button
            onClick={() => setCollapsed(false)}
            className="relative w-full flex items-center justify-center gap-2 px-4 py-3 text-white"
          >
            <Zap size={14} className="text-yellow-300" fill="currentColor" />
            <span className="text-[13px] font-semibold font-poppins">Try Demo</span>
            <ChevronUp size={14} className="text-white/70 rotate-180" />
          </button>
        ) : (
          /* ── Expanded state ── */
          <div className="relative px-4 pt-4 pb-4">

            {/* Top row: label + actions */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-yellow-400/20">
                  <Zap size={11} className="text-yellow-300" fill="currentColor" />
                </span>
                <span className="text-white font-semibold text-[13px] font-poppins tracking-wide">
                  Try Demo Account
                </span>
              </div>

              <div className="flex items-center gap-1">
                {/* Copy all */}
                {/* <button
                  onClick={copyAll}
                  title="Copy all credentials"
                  className={`text-[10px] font-medium px-2 py-1 rounded-lg transition-all duration-200 flex items-center gap-1
                    ${copiedAll
                      ? 'bg-green-500/25 text-green-300'
                      : 'bg-white/10 hover:bg-white/20 text-white/70 hover:text-white'}`}
                >
                  {copiedAll ? <><Check size={10} /> Copied!</> : <><Copy size={10} /> Copy all</>}
                </button> */}

                {/* Collapse */}
                <button
                  onClick={() => setCollapsed(true)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-colors"
                  title="Minimize"
                >
                  <ChevronUp size={12} />
                </button>

                {/* Dismiss */}
                <button
                  onClick={() => setVisible(false)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-red-500/40 text-white/60 hover:text-white transition-colors"
                  title="Dismiss"
                >
                  <X size={12} />
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-white/10 mb-3" />

            {/* Credentials */}
            <div className="space-y-2">

              {/* Email row */}
              <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2.5">
                <div className="flex-1 min-w-0">
                  <p className="text-white/50 text-[9px] font-semibold uppercase tracking-widest mb-0.5">
                    Email
                  </p>
                  <p className="text-white text-[13px] font-medium font-mono truncate">
                    {DEMO_EMAIL}
                  </p>
                </div>
                <CopyButton value={DEMO_EMAIL} />
              </div>

              {/* Password row */}
              <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2.5">
                <div className="flex-1 min-w-0">
                  <p className="text-white/50 text-[9px] font-semibold uppercase tracking-widest mb-0.5">
                    Password
                  </p>
                  <p className="text-white text-[13px] font-medium font-mono tracking-wider truncate">
                    {showPass ? DEMO_PASSWORD : '•'.repeat(DEMO_PASSWORD.length)}
                  </p>
                </div>
                {/* Show/hide toggle */}
                <button
                  onClick={() => setShowPass(v => !v)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-colors flex-shrink-0"
                  title={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? <EyeOff size={12} /> : <Eye size={12} />}
                </button>
                <CopyButton value={DEMO_PASSWORD} />
              </div>
            </div>

            {/* Footer note */}
            <p className="text-white/40 text-[10px] text-center mt-3 leading-relaxed">
              Read-only demo account · No real data stored
            </p>
          </div>
        )}
      </div>
    </div>
  );
}