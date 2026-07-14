import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import Button from "../components/ui/Button";

// ─── Lenis Smooth Scroll Hook ─────────────────────────────────────────────────
function useLenis() {
  useEffect(() => {
    let lenis = null;
    let rafId = null;

    const initLenis = async () => {
      try {
        const Lenis = (await import("lenis")).default;

        lenis = new Lenis({
          duration: 1.4,
          easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          smoothWheel: true,
          touchMultiplier: 1.5,
        });

        function raf(time) {
          lenis.raf(time);
          rafId = requestAnimationFrame(raf);
        }

        rafId = requestAnimationFrame(raf);
      } catch (e) {
        console.warn("Lenis not available, using native scroll");
      }
    };

    initLenis();

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (lenis) lenis.destroy();
    };
  }, []);
}

// ─── Intersection Observer Hook ───────────────────────────────────────────────
function useInView(options = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.1, ...options }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, inView];
}

// ─── Animated Reveal Component ────────────────────────────────────────────────
function Reveal({ children, className = "", delay = 0, direction = "up" }) {
  const [ref, inView] = useInView();

  const transforms = {
    up: "translateY(40px)",
    down: "translateY(-40px)",
    left: "translateX(40px)",
    right: "translateX(-40px)",
    scale: "scale(0.9)",
  };

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0) translateX(0) scale(1)" : transforms[direction],
        transition: `opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// ─── Floating Particles ───────────────────────────────────────────────────────
function FloatingParticles() {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    size: Math.random() * 6 + 2,
    left: Math.random() * 100,
    delay: Math.random() * 8,
    duration: Math.random() * 10 + 10,
    opacity: Math.random() * 0.3 + 0.1,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full bg-primary/20"
          style={{
            width: `${p.size}px`,
            height: `${p.size}px`,
            left: `${p.left}%`,
            bottom: "-10px",
            opacity: p.opacity,
            animation: `floatUp ${p.duration}s linear ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Scroll Indicator ─────────────────────────────────────────────────────────
function ScrollIndicator() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY < 100);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 transition-opacity duration-500"
      style={{ opacity: visible ? 1 : 0 }}
    >
      <span className="text-xs text-text/40 tracking-widest uppercase">Scroll to explore</span>
      <div className="w-6 h-10 rounded-full border-2 border-text/20 flex items-start justify-center p-1.5">
        <div
          className="w-1.5 h-1.5 rounded-full bg-primary"
          style={{ animation: "scrollDot 2s ease-in-out infinite" }}
        />
      </div>
    </div>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const steps = [
  {
    number: "01",
    title: "Build your vibe profile",
    description: "Share your energy, your pace, and what kind of people you naturally click with.",
    gradient: "from-violet-500 to-purple-600",
    glow: "shadow-violet-500/20",
    iconBg: "bg-violet-500/10",
    iconColor: "text-violet-500",
  },
  {
    number: "02",
    title: "Get matched nearby",
    description: "See people and plans close to you, so making new friends feels easy and real.",
    gradient: "from-pink-500 to-rose-600",
    glow: "shadow-pink-500/20",
    iconBg: "bg-pink-500/10",
    iconColor: "text-pink-500",
  },
  {
    number: "03",
    title: "Meet IRL",
    description: "Turn good chats into coffee runs, walks, game nights, and actual friendships.",
    gradient: "from-amber-500 to-orange-600",
    glow: "shadow-amber-500/20",
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-500",
  },
];

const features = [
  {
    title: "Vibe Matching",
    description: "We match on personality and energy, not just interests.",
    gradient: "from-violet-500 to-indigo-600",
    emoji: "🎯",
  },
  {
    title: "Local Meetups",
    description: "Discover spontaneous events and hangouts near you every day.",
    gradient: "from-pink-500 to-rose-600",
    emoji: "📍",
  },
  {
    title: "Safe by Design",
    description: "Verified profiles, public check-ins, and a community that looks out for each other.",
    gradient: "from-emerald-500 to-teal-600",
    emoji: "🛡️",
  },
];

const testimonials = [
  {
    id: "t-lena",
    initial: "L",
    name: "Lena",
    city: "Austin, TX",
    quote: "I moved here knowing nobody. Two weeks on VibeMeet and I had brunch plans, a walking buddy, and a group chat that still pops off daily.",
    gradient: "from-violet-500 to-purple-600",
  },
  {
    id: "t-dev",
    initial: "D",
    name: "Dev",
    city: "Brooklyn, NY",
    quote: "The vibe matching is kind of wild. I met people who actually feel like my people, not just random profiles with the same hobbies.",
    gradient: "from-pink-500 to-rose-600",
  },
  {
    id: "t-sofia",
    initial: "S",
    name: "Sofia",
    city: "Chicago, IL",
    quote: "I loved that meetups felt safe and low-pressure. It got me off my phone, out of my apartment, and into real friendships fast.",
    gradient: "from-amber-500 to-orange-600",
  },
];

const socialAvatars = [
  { id: "a-a", initial: "A", gradient: "from-violet-500 to-purple-600" },
  { id: "a-m", initial: "M", gradient: "from-pink-500 to-rose-600" },
  { id: "a-j", initial: "J", gradient: "from-amber-500 to-orange-600" },
  { id: "a-r", initial: "R", gradient: "from-emerald-500 to-teal-600" },
];

// ─── Page Component ───────────────────────────────────────────────────────────
export default function Landing() {
  useLenis();

  const [heroLoaded, setHeroLoaded] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const timer = setTimeout(() => setHeroLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleMouseMove = useCallback((e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 20;
    const y = (e.clientY / window.innerHeight - 0.5) * 20;
    setMousePos({ x, y });
  }, []);

  const heroAnim = (delay) => ({
    opacity: heroLoaded ? 1 : 0,
    transform: heroLoaded
      ? "translateY(0) scale(1)"
      : "translateY(30px) scale(0.97)",
    transition: `all 0.9s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
  });

  return (
    <div className="relative bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">

      {/* ── Global keyframes ── */}
      <style>{`
        @keyframes floatUp {
          0% { transform: translateY(0) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; }
        }
        @keyframes scrollDot {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(12px); opacity: 1; }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(139, 92, 246, 0.15); }
          50% { box-shadow: 0 0 40px rgba(139, 92, 246, 0.3); }
        }
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>

      {/* ═══════════════════════════════════════════════════════════════════════
          FIRST 100VH — HERO
      ═══════════════════════════════════════════════════════════════════════ */}
      <section
        className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
        onMouseMove={handleMouseMove}
      >
        {/* Background blobs with parallax */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0">
          <div
            className="absolute top-1/4 -left-40 h-[500px] w-[500px] rounded-full bg-purple-500/20 filter blur-[100px] animate-blob mix-blend-multiply"
            style={{
              transform: `translate(${mousePos.x * 0.5}px, ${mousePos.y * 0.5}px)`,
              transition: "transform 0.3s ease-out",
            }}
          />
          <div
            className="absolute top-1/3 -right-40 h-[500px] w-[500px] rounded-full bg-pink-500/20 filter blur-[100px] animate-blob animation-delay-2000 mix-blend-multiply"
            style={{
              transform: `translate(${mousePos.x * -0.3}px, ${mousePos.y * -0.3}px)`,
              transition: "transform 0.3s ease-out",
            }}
          />
          <div
            className="absolute -bottom-20 left-1/3 h-[500px] w-[500px] rounded-full bg-yellow-400/15 filter blur-[100px] animate-blob animation-delay-4000 mix-blend-multiply"
            style={{
              transform: `translate(${mousePos.x * 0.2}px, ${mousePos.y * 0.4}px)`,
              transition: "transform 0.3s ease-out",
            }}
          />
        </div>

        <FloatingParticles />

        <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-6xl mx-auto">

          {/* Brand Name */}
          <div style={heroAnim(0)} className="mb-6">
            <span
              className="inline-block font-poppins text-lg md:text-xl font-bold tracking-[0.3em] uppercase"
              style={{
                background: "linear-gradient(135deg, #8b5cf6, #ec4899, #f59e0b, #8b5cf6)",
                backgroundSize: "300% 300%",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                animation: "gradientShift 4s ease infinite",
              }}
            >
              VibeMeet
            </span>
          </div>

          {/* Main Headline */}
          <h1
            className="font-poppins text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold leading-[1.05] tracking-tight"
            style={heroAnim(150)}
          >
            <span className="block text-text">Find your</span>
            <span
              className="block mt-1"
              style={{
                background: "linear-gradient(135deg, #8b5cf6, #ec4899, #f59e0b)",
                backgroundSize: "200% 200%",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                animation: "gradientShift 5s ease infinite",
              }}
            >
              people.
            </span>
            <span className="block text-text mt-1">Meet in real life.</span>
          </h1>

          {/* Subtitle */}
          <p
            className="mt-6 md:mt-8 text-lg md:text-xl text-text/60 max-w-2xl leading-relaxed"
            style={heroAnim(350)}
          >
            VibeMeet connects you with real humans nearby who share your energy
            — then gets you off the app and into the world.
          </p>

          {/* CTA Buttons */}
          <div
            className="mt-10 flex flex-col sm:flex-row items-center gap-4"
            style={heroAnim(500)}
          >
            <Link to="/login">
              <button
                className="group relative px-8 py-4 rounded-2xl font-poppins font-bold text-white text-lg overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl active:scale-[0.98]"
                style={{
                  background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
                  boxShadow: "0 8px 30px rgba(139, 92, 246, 0.35)",
                }}
              >
                <span className="relative z-10 flex items-center gap-2">
                  Get Started Free
                  <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #db2777)" }}
                />
              </button>
            </Link>

            <Link to="/signup">
              <button className="group px-8 py-4 rounded-2xl font-poppins font-bold text-text text-lg border-2 border-text/15 bg-white/40 backdrop-blur-sm transition-all duration-300 hover:border-primary/40 hover:bg-white/70 hover:shadow-lg hover:scale-105 active:scale-[0.98]">
                <span className="flex items-center gap-2">
                  Create Account
                  <svg className="w-5 h-5 text-primary transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </span>
              </button>
            </Link>
          </div>

          {/* Social Proof */}
          <div
            className="mt-12 flex flex-col sm:flex-row items-center gap-4"
            style={heroAnim(650)}
          >
            <div className="flex -space-x-3">
              {socialAvatars.map((avatar) => (
                <div
                  key={avatar.id}
                  className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatar.gradient} text-white text-sm font-bold border-2 border-white shadow-md transition-transform duration-200 hover:scale-110 hover:z-10`}
                >
                  {avatar.initial}
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
              <span className="text-yellow-500 tracking-wider text-lg" aria-label="5 stars">★★★★★</span>
              <p className="text-sm text-text/50">
                Loved by <span className="font-semibold text-text/70">50,000+</span> people
              </p>
            </div>
          </div>
        </div>

        <ScrollIndicator />
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECOND SECTION — ALL CONTENT
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="relative min-h-screen">

        {/* Additional background blobs for second section */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0">
          <div className="absolute top-20 -left-32 h-96 w-96 rounded-full bg-indigo-400/10 filter blur-[100px] animate-blob" />
          <div className="absolute top-1/2 -right-32 h-96 w-96 rounded-full bg-rose-400/10 filter blur-[100px] animate-blob animation-delay-2000" />
          <div className="absolute bottom-40 left-1/4 h-96 w-96 rounded-full bg-amber-300/10 filter blur-[100px] animate-blob animation-delay-4000" />
        </div>

        <div className="relative z-10">

          {/* ────────────── HOW IT WORKS ────────────── */}
          <section className="px-4 pt-20 pb-16 sm:px-6 lg:px-8" aria-labelledby="how-heading">
            <div className="mx-auto max-w-6xl">
              <Reveal>
                <div className="text-center mb-14">
                  <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary font-semibold text-sm mb-4 tracking-wide uppercase">
                    Simple as 1-2-3
                  </span>
                  <h2 id="how-heading" className="font-poppins text-4xl md:text-5xl font-bold text-text">
                    How VibeMeet works
                  </h2>
                </div>
              </Reveal>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                {steps.map((step, i) => (
                  <Reveal key={step.number} delay={i * 150} direction="up">
                    <div
                      className={`group relative rounded-3xl border border-white/40 bg-white/50 backdrop-blur-md p-8 shadow-lg ${step.glow} transition-all duration-500 hover:bg-white/80 hover:shadow-xl hover:-translate-y-2 hover:border-white/60 overflow-hidden`}
                      style={{ animation: "pulseGlow 4s ease-in-out infinite", animationDelay: `${i * 0.5}s` }}
                    >
                      {/* Gradient top border */}
                      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${step.gradient} opacity-60 group-hover:opacity-100 transition-opacity duration-300`} />

                      {/* Hover glow */}
                      <div className={`absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br ${step.gradient} rounded-full opacity-0 group-hover:opacity-10 filter blur-3xl transition-opacity duration-500`} />

                      <div className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl ${step.iconBg} ${step.iconColor} font-poppins text-xl font-bold transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                        {step.number}
                      </div>
                      <h3 className="mt-6 font-poppins text-xl font-bold text-text">
                        {step.title}
                      </h3>
                      <p className="mt-3 text-text/60 leading-relaxed">
                        {step.description}
                      </p>

                      {/* Arrow connector (hidden on last card and mobile) */}
                      {i < steps.length - 1 && (
                        <div className="hidden md:block absolute -right-5 top-1/2 -translate-y-1/2 z-20">
                          <svg className="w-8 h-8 text-text/15" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>

          {/* ────────────── FEATURES ────────────── */}
          <section className="px-4 py-16 sm:px-6 lg:px-8" aria-labelledby="features-heading">
            <div className="mx-auto max-w-6xl">
              <Reveal>
                <div className="text-center mb-14">
                  <span className="inline-block px-4 py-1.5 rounded-full bg-accent/10 text-accent font-semibold text-sm mb-4 tracking-wide uppercase">
                    Packed with love
                  </span>
                  <h2 id="features-heading" className="font-poppins text-4xl md:text-5xl font-bold text-text">
                    Everything you need to connect
                  </h2>
                </div>
              </Reveal>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                {features.map((feature, i) => (
                  <Reveal key={feature.title} delay={i * 150} direction="up">
                    <div className="group relative rounded-3xl border border-white/40 bg-white/50 backdrop-blur-md p-8 shadow-lg transition-all duration-500 hover:bg-white/80 hover:shadow-xl hover:-translate-y-2 hover:border-white/60 overflow-hidden">
                      {/* Gradient top border */}
                      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${feature.gradient} opacity-60 group-hover:opacity-100 transition-opacity duration-300`} />

                      {/* Hover glow */}
                      <div className={`absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br ${feature.gradient} rounded-full opacity-0 group-hover:opacity-10 filter blur-3xl transition-opacity duration-500`} />

                      <div className="text-4xl mb-6 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                        {feature.emoji}
                      </div>
                      <h3 className="font-poppins text-xl font-bold text-text">
                        {feature.title}
                      </h3>
                      <p className="mt-3 text-text/60 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>

          {/* ────────────── TESTIMONIALS + FINAL CTA (UNIFIED) ────────────── */}
          <section className="px-4 py-16 sm:px-6 lg:px-8" aria-labelledby="community-heading">
            <div className="mx-auto max-w-6xl">

              {/* Section Header */}
              <Reveal>
                <div className="text-center mb-14">
                  <span className="inline-block px-4 py-1.5 rounded-full bg-secondary/10 text-secondary font-semibold text-sm mb-4 tracking-wide uppercase">
                    Community love
                  </span>
                  <h2 id="community-heading" className="font-poppins text-4xl md:text-5xl font-bold text-text">
                    Real people, real connections
                  </h2>
                  <p className="mt-4 text-lg text-text/50 max-w-2xl mx-auto">
                    Don't just take our word for it — hear from the people who found their crew on VibeMeet.
                  </p>
                </div>
              </Reveal>

              {/* Testimonial Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                {testimonials.map((t, i) => (
                  <Reveal key={t.id} delay={i * 150} direction="up">
                    <figure className="group relative rounded-3xl border border-white/40 bg-white/50 backdrop-blur-md p-8 shadow-lg transition-all duration-500 hover:bg-white/80 hover:shadow-xl hover:-translate-y-2 hover:border-white/60 overflow-hidden h-full flex flex-col">
                      {/* Gradient top border */}
                      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${t.gradient} opacity-60 group-hover:opacity-100 transition-opacity duration-300`} />

                      {/* Hover glow */}
                      <div className={`absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br ${t.gradient} rounded-full opacity-0 group-hover:opacity-10 filter blur-3xl transition-opacity duration-500`} />

                      {/* Quote mark */}
                      <div className="absolute top-4 right-6 text-7xl text-text/[0.04] font-serif leading-none pointer-events-none select-none">
                        "
                      </div>

                      {/* Author */}
                      <div className="flex items-center gap-3 mb-5">
                        <div
                          className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${t.gradient} text-white font-bold text-lg shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}
                        >
                          {t.initial}
                        </div>
                        <figcaption>
                          <p className="font-poppins font-bold text-text leading-tight">
                            {t.name}
                          </p>
                          <p className="text-sm text-text/50">{t.city}</p>
                        </figcaption>
                      </div>

                      {/* Stars */}
                      <div className="text-yellow-500 text-sm tracking-wider mb-4" aria-label="5 out of 5 stars">
                        ★★★★★
                      </div>

                      {/* Quote */}
                      <blockquote className="text-text/70 leading-relaxed italic flex-1">
                        "{t.quote}"
                      </blockquote>

                      {/* Bottom gradient line on hover */}
                      <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${t.gradient} opacity-0 group-hover:opacity-40 transition-opacity duration-500`} />
                    </figure>
                  </Reveal>
                ))}
              </div>

              {/* ── Integrated CTA Banner ── */}
              <Reveal delay={200}>
                <div
                  className="relative mt-16 rounded-3xl p-10 md:p-16 text-center overflow-hidden"
                  style={{
                    background: "linear-gradient(135deg, #8b5cf6, #ec4899, #f59e0b)",
                    backgroundSize: "200% 200%",
                    animation: "gradientShift 6s ease infinite",
                  }}
                >
                  {/* Decorative circles */}
                  <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
                    <div className="absolute top-8 left-8 w-28 h-28 border border-white/10 rounded-full" />
                    <div className="absolute bottom-8 right-8 w-44 h-44 border border-white/10 rounded-full" />
                    <div className="absolute top-1/2 left-1/4 w-16 h-16 border border-white/10 rounded-full" />
                    <div className="absolute top-1/3 right-1/4 w-24 h-24 border border-white/[0.07] rounded-full" />
                    {/* Floating mini dots */}
                    <div className="absolute top-12 right-1/3 w-2 h-2 bg-white/20 rounded-full" />
                    <div className="absolute bottom-16 left-1/3 w-3 h-3 bg-white/15 rounded-full" />
                    <div className="absolute top-1/2 right-12 w-1.5 h-1.5 bg-white/25 rounded-full" />
                  </div>

                  <div className="relative z-10 mx-auto max-w-2xl">
                    {/* Social proof row inside CTA */}
                    <div className="flex justify-center mb-8">
                      <div className="flex -space-x-3">
                        {socialAvatars.map((avatar) => (
                          <div
                            key={`cta-${avatar.id}`}
                            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 border-white/50 bg-white/20 text-white text-sm font-bold shadow-md backdrop-blur-sm"
                          >
                            {avatar.initial}
                          </div>
                        ))}
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 border-white/50 bg-white/20 text-white text-xs font-bold shadow-md backdrop-blur-sm">
                          +50k
                        </div>
                      </div>
                    </div>

                    <h2 className="font-poppins text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-tight">
                      Ready to find your people?
                    </h2>

                    <p className="mt-4 text-base sm:text-lg text-white/80 leading-relaxed max-w-xl mx-auto">
                      Less endless scrolling. More real plans, real laughs, and real friends nearby. Your next best friend is one tap away.
                    </p>

                    {/* Buttons */}
                    <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
                      <Link to="/signup">
                        <button className="group px-8 py-4 rounded-2xl font-poppins font-bold text-primary text-lg bg-white shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-105 active:scale-[0.98]">
                          <span className="flex items-center gap-2">
                            Join VibeMeet Free
                            <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                          </span>
                        </button>
                      </Link>

                      <Link to="/login">
                        <button className="group px-8 py-4 rounded-2xl font-poppins font-bold text-white text-lg border-2 border-white/30 bg-white/10 backdrop-blur-sm transition-all duration-300 hover:bg-white/20 hover:border-white/50 hover:scale-105 active:scale-[0.98]">
                          <span className="flex items-center gap-2">
                            I have an account
                            <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                          </span>
                        </button>
                      </Link>
                    </div>

                    {/* Trust badge */}
                    <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 text-white/50 text-sm">
                      <span className="flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        Verified profiles
                      </span>
                      <span className="hidden sm:inline text-white/20">·</span>
                      <span className="flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        End-to-end privacy
                      </span>
                      <span className="hidden sm:inline text-white/20">·</span>
                      <span className="flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        Free forever
                      </span>
                    </div>
                  </div>
                </div>
              </Reveal>

            </div>
          </section>
          {/* ────────────── FOOTER ────────────── */}
          <footer className="py-10 text-center text-sm text-text/40">
            <Reveal delay={100}>
              <p className="text-base">
                Made with{" "}
                <span className="text-red-500 inline-block transition-transform duration-300 hover:scale-125" aria-label="love">
                  ❤️
                </span>{" "}
                for real connections
              </p>

              <nav aria-label="Footer links" className="mt-4">
                <ul className="flex items-center justify-center gap-4">
                  {["Privacy", "Terms", "Contact"].map((label, i, arr) => (
                    <li key={label} className="flex items-center gap-4">
                      <a
                        href={`/${label.toLowerCase()}`}
                        className="transition-colors duration-200 hover:text-text focus-visible:text-text focus-visible:outline-none focus-visible:underline"
                      >
                        {label}
                      </a>
                      {i < arr.length - 1 && (
                        <span aria-hidden="true" className="text-text/20">·</span>
                      )}
                    </li>
                  ))}
                </ul>
              </nav>

              <p className="mt-6 text-xs text-text/30">
                © {new Date().getFullYear()} VibeMeet. All vibes reserved.
              </p>
            </Reveal>
          </footer>

        </div>
      </div>
    </div>
  );
}