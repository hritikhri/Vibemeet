// src/pages/Contact.jsx

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function Contact() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [focused, setFocused] = useState("");

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSending(true);

    // Simulate API call
    setTimeout(() => {
      setSending(false);
      setSubmitted(true);
      console.log("Contact form submitted:", formData);
    }, 1500);
  };

  const handleReset = () => {
    setSubmitted(false);
    setFormData({ name: "", email: "", subject: "", message: "" });
  };

  const inputClass = (field) =>
    `w-full px-4 py-3 rounded-xl border bg-white/60 backdrop-blur-sm text-text placeholder-text/30 outline-none transition-all duration-200 text-sm ${
      focused === field
        ? "border-primary/40 bg-white/80 shadow-sm shadow-primary/5 ring-2 ring-primary/10"
        : "border-text/10 hover:border-text/20"
    }`;

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      {/* Background */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute top-0 -left-32 h-96 w-96 rounded-full bg-purple-500/10 filter blur-[100px] animate-blob mix-blend-multiply" />
        <div className="absolute top-1/3 -right-32 h-96 w-96 rounded-full bg-pink-500/10 filter blur-[100px] animate-blob animation-delay-2000 mix-blend-multiply" />
        <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-yellow-400/10 filter blur-[100px] animate-blob animation-delay-4000 mix-blend-multiply" />
      </div>

      <div className="relative z-10">
        {/* Nav */}
        <nav className="border-b border-text/10 bg-background/70 backdrop-blur-sm sticky top-0 z-30">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <Link
              to="/"
              className="bg-gradient-to-r from-primary to-accent bg-clip-text font-poppins text-2xl font-extrabold text-transparent"
            >
              VibeMeet
            </Link>
            <Link
              to="/"
              className="text-sm text-text/50 hover:text-text transition-colors duration-200 flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to home
            </Link>
          </div>
        </nav>

        {/* Header */}
        <header className="px-4 pt-16 pb-8 sm:px-6 lg:px-8 border-b border-text/5">
          <div className="mx-auto max-w-3xl">
            <p className="text-emerald-600 font-semibold text-sm mb-3 tracking-wide uppercase">
              Contact Us
            </p>
            <h1 className="font-poppins text-4xl md:text-5xl font-extrabold text-text leading-tight">
              Get in touch
            </h1>
            <p className="mt-4 text-text/50 text-lg leading-relaxed">
              Have a question, found a bug, or just want to share feedback? We're a small team that reads and responds to every message. We'd love to hear from you.
            </p>
          </div>
        </header>

        {/* Body */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col lg:flex-row gap-12">

            {/* Left Column — Contact Info */}
            <aside className="lg:w-80 flex-shrink-0">
              <div className="lg:sticky lg:top-24 space-y-10">

                {/* Direct Contacts */}
                <div>
                  <p className="text-xs font-semibold text-text/30 uppercase tracking-wider mb-6">
                    Reach us directly
                  </p>

                  <div className="space-y-6">
                    {/* General */}
                    <div className="flex gap-3">
                      <div className="mt-0.5">
                        <svg className="w-5 h-5 text-text/30" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-text/80">General inquiries</p>
                        <a href="mailto:hello@vibemeet.app" className="text-sm text-primary hover:underline">
                          hello@vibemeet.app
                        </a>
                        <p className="text-xs text-text/40 mt-1">For questions, feedback, and partnerships</p>
                      </div>
                    </div>

                    {/* Support */}
                    <div className="flex gap-3">
                      <div className="mt-0.5">
                        <svg className="w-5 h-5 text-text/30" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-text/80">Account support</p>
                        <a href="mailto:support@vibemeet.app" className="text-sm text-primary hover:underline">
                          support@vibemeet.app
                        </a>
                        <p className="text-xs text-text/40 mt-1">Login issues, bugs, and technical help</p>
                      </div>
                    </div>

                    {/* Safety */}
                    <div className="flex gap-3">
                      <div className="mt-0.5">
                        <svg className="w-5 h-5 text-text/30" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-text/80">Safety & reporting</p>
                        <a href="mailto:safety@vibemeet.app" className="text-sm text-primary hover:underline">
                          safety@vibemeet.app
                        </a>
                        <p className="text-xs text-text/40 mt-1">Report harassment, abuse, or safety concerns</p>
                      </div>
                    </div>

                    {/* Press */}
                    <div className="flex gap-3">
                      <div className="mt-0.5">
                        <svg className="w-5 h-5 text-text/30" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-text/80">Press & media</p>
                        <a href="mailto:press@vibemeet.app" className="text-sm text-primary hover:underline">
                          press@vibemeet.app
                        </a>
                        <p className="text-xs text-text/40 mt-1">Media inquiries and press kit requests</p>
                      </div>
                    </div>

                    {/* Legal */}
                    <div className="flex gap-3">
                      <div className="mt-0.5">
                        <svg className="w-5 h-5 text-text/30" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-text/80">Legal</p>
                        <a href="mailto:legal@vibemeet.app" className="text-sm text-primary hover:underline">
                          legal@vibemeet.app
                        </a>
                        <p className="text-xs text-text/40 mt-1">Legal notices and compliance inquiries</p>
                      </div>
                    </div>
                  </div>
                </div>

                <hr className="border-text/5" />

                {/* Office */}
                <div>
                  <p className="text-xs font-semibold text-text/30 uppercase tracking-wider mb-4">
                    Our Office
                  </p>
                  <div className="flex gap-3">
                    <div className="mt-0.5">
                      <svg className="w-5 h-5 text-text/30" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-text/70 leading-relaxed">
                        VibeMeet Inc.<br />
                        548 Market Street, Suite 35<br />
                        San Francisco, CA 94104<br />
                        United States
                      </p>
                    </div>
                  </div>
                </div>

                <hr className="border-text/5" />

                {/* Response Times */}
                <div>
                  <p className="text-xs font-semibold text-text/30 uppercase tracking-wider mb-4">
                    Response times
                  </p>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-text/50">General inquiries</span>
                      <span className="text-text/70 font-medium">1–2 business days</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text/50">Account support</span>
                      <span className="text-text/70 font-medium">Within 24 hours</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text/50">Safety reports</span>
                      <span className="text-text/70 font-medium">Within 4 hours</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text/50">Press inquiries</span>
                      <span className="text-text/70 font-medium">Within 24 hours</span>
                    </div>
                  </div>

                  <p className="text-xs text-text/30 mt-4">
                    Business hours: Mon–Fri, 9 AM – 6 PM Pacific Time
                  </p>
                </div>

              </div>
            </aside>

            {/* Right Column — Form + FAQ */}
            <article className="flex-1 max-w-3xl">

              {/* ─── Contact Form ─── */}
              <section className="mb-16">
                <h2 className="font-poppins text-2xl font-bold text-text mb-2">
                  Send us a message
                </h2>
                <p className="text-text/50 text-sm mb-8 leading-relaxed">
                  Fill out the form below and we'll get back to you as soon as possible. All fields marked with * are required.
                </p>

                {submitted ? (
                  <div className="rounded-2xl bg-emerald-50/80 border border-emerald-200/50 p-8 text-center">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                      <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="font-poppins font-bold text-emerald-800 text-lg mb-2">
                      Message sent successfully
                    </h3>
                    <p className="text-emerald-700/70 text-sm mb-6">
                      Thanks for reaching out! We've received your message and will respond within 1–2 business days. Check your email for a confirmation.
                    </p>
                    <button
                      onClick={handleReset}
                      className="text-sm text-emerald-600 hover:text-emerald-700 font-medium hover:underline transition-colors duration-200"
                    >
                      Send another message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Name + Email row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label htmlFor="contact-name" className="block text-sm font-medium text-text/70 mb-1.5">
                          Full name <span className="text-red-400">*</span>
                        </label>
                        <input
                          id="contact-name"
                          name="name"
                          type="text"
                          required
                          value={formData.name}
                          onChange={handleChange}
                          onFocus={() => setFocused("name")}
                          onBlur={() => setFocused("")}
                          placeholder="Jane Doe"
                          className={inputClass("name")}
                          autoComplete="name"
                        />
                      </div>
                      <div>
                        <label htmlFor="contact-email" className="block text-sm font-medium text-text/70 mb-1.5">
                          Email address <span className="text-red-400">*</span>
                        </label>
                        <input
                          id="contact-email"
                          name="email"
                          type="email"
                          required
                          value={formData.email}
                          onChange={handleChange}
                          onFocus={() => setFocused("email")}
                          onBlur={() => setFocused("")}
                          placeholder="jane@example.com"
                          className={inputClass("email")}
                          autoComplete="email"
                        />
                      </div>
                    </div>

                    {/* Subject */}
                    <div>
                      <label htmlFor="contact-subject" className="block text-sm font-medium text-text/70 mb-1.5">
                        What's this about? <span className="text-red-400">*</span>
                      </label>
                      <select
                        id="contact-subject"
                        name="subject"
                        required
                        value={formData.subject}
                        onChange={handleChange}
                        onFocus={() => setFocused("subject")}
                        onBlur={() => setFocused("")}
                        className={inputClass("subject")}
                      >
                        <option value="">Select a topic...</option>
                        <option value="general">General question</option>
                        <option value="support">Account support</option>
                        <option value="safety">Safety concern or report</option>
                        <option value="feedback">Product feedback</option>
                        <option value="bug">Bug report</option>
                        <option value="billing">Billing issue</option>
                        <option value="privacy">Privacy or data request</option>
                        <option value="press">Press or media inquiry</option>
                        <option value="partnership">Partnership opportunity</option>
                        <option value="other">Something else</option>
                      </select>
                    </div>

                    {/* Message */}
                    <div>
                      <label htmlFor="contact-message" className="block text-sm font-medium text-text/70 mb-1.5">
                        Your message <span className="text-red-400">*</span>
                      </label>
                      <textarea
                        id="contact-message"
                        name="message"
                        required
                        rows="6"
                        value={formData.message}
                        onChange={handleChange}
                        onFocus={() => setFocused("message")}
                        onBlur={() => setFocused("")}
                        placeholder="Tell us what's on your mind. The more detail you provide, the faster we can help..."
                        className={`${inputClass("message")} resize-none`}
                      />
                      <p className="text-xs text-text/30 mt-1.5">
                        {formData.message.length > 0 && `${formData.message.length} characters`}
                      </p>
                    </div>

                    {/* Submit */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <button
                        type="submit"
                        disabled={sending}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-poppins font-semibold text-white text-sm transition-all duration-200 hover:shadow-lg hover:shadow-primary/20 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                        style={{
                          background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
                        }}
                      >
                        {sending ? (
                          <>
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Sending...
                          </>
                        ) : (
                          <>
                            Send message
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                          </>
                        )}
                      </button>

                      <p className="text-xs text-text/30">
                        We'll respond within 1–2 business days.
                      </p>
                    </div>
                  </form>
                )}
              </section>

              <hr className="border-text/5 my-12" />

              {/* ─── FAQ ─── */}
              <section>
                <h2 className="font-poppins text-2xl font-bold text-text mb-2">
                  Frequently asked questions
                </h2>
                <p className="text-text/50 text-sm mb-8 leading-relaxed">
                  Quick answers to the most common questions. If you don't see your question here, use the form above and we'll help you out.
                </p>

                <div className="space-y-0">
                  {[
                    {
                      q: "How do I reset my password?",
                      a: 'On the login screen, tap "Forgot password?" and enter the email address associated with your account. You\'ll receive a password reset link within a few minutes. If you don\'t see it, check your spam folder or contact support@vibemeet.app.',
                    },
                    {
                      q: "How do I delete my account?",
                      a: "Go to Settings → Account → Delete Account. You'll be asked to confirm your decision. Once confirmed, your profile, matches, messages, and personal data will be permanently deleted within 30 days. This action cannot be undone.",
                    },
                    {
                      q: "How do I report someone?",
                      a: 'Tap the three dots (⋯) on any user\'s profile or within a conversation and select "Report." Choose the reason for your report and add any additional context. Our safety team reviews every report within 24 hours — often much sooner for urgent matters. You can also email safety@vibemeet.app directly.',
                    },
                    {
                      q: "Is VibeMeet free?",
                      a: "Yes. VibeMeet's core features — including creating a profile, matching with people, messaging, and discovering events — are completely free and always will be. We may offer optional premium features in the future, but the essentials will never be behind a paywall.",
                    },
                    {
                      q: "How does vibe matching work?",
                      a: "Our matching algorithm considers multiple factors beyond surface-level interests: your personality traits, social energy level, preferred group size, communication style, and what you're looking for in friendships. The result is matches that feel natural — people you'd actually click with in real life.",
                    },
                    {
                      q: "Is my location shared with other users?",
                      a: 'Never precisely. Other users only see approximate distance — for example, "about 2 miles away." Your exact coordinates, home address, and workplace are never visible to anyone. You can disable location sharing entirely in your device settings; VibeMeet will still work but location-based features will be limited.',
                    },
                    {
                      q: "Can I use VibeMeet for dating?",
                      a: "VibeMeet is designed specifically for platonic friendships and group social connections — not dating. While we can't control what happens between consenting adults, our matching algorithm, features, and community guidelines are all built around helping people find genuine friendships and social groups.",
                    },
                    {
                      q: "What cities is VibeMeet available in?",
                      a: "VibeMeet is available everywhere! However, the experience is best in areas with an active user base. We're currently seeing the most activity in major U.S. cities including San Francisco, New York, Austin, Los Angeles, Chicago, and Seattle. We're growing fast — invite your friends to build the community in your area.",
                    },
                    {
                      q: "How do I request my personal data?",
                      a: 'Go to Settings → Privacy → Download My Data, or email privacy@vibemeet.app with the subject line "Data Request." We\'ll provide a complete copy of all personal data we hold about you within 30 days, as required by applicable data protection law.',
                    },
                  ].map((faq, i) => (
                    <FAQItem key={i} question={faq.q} answer={faq.a} />
                  ))}
                </div>

                <p className="text-sm text-text/40 mt-8 leading-relaxed">
                  Still have questions? Don't hesitate to{" "}
                  <a href="mailto:hello@vibemeet.app" className="text-primary hover:underline">
                    email us directly
                  </a>{" "}
                  or use the contact form above. We're happy to help.
                </p>
              </section>

              <hr className="border-text/5 my-12" />

              {/* ─── Additional Resources ─── */}
              <section className="mb-8">
                <h2 className="font-poppins text-2xl font-bold text-text mb-6">
                  Helpful resources
                </h2>

                <div className="space-y-4">
                  <Link
                    to="/privacy"
                    className="flex items-center justify-between p-4 rounded-xl border border-text/10 bg-white/40 hover:bg-white/60 hover:border-text/15 transition-all duration-200 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-primary/5 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4.5 h-4.5 text-primary/60" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-text/80">Privacy Policy</p>
                        <p className="text-xs text-text/40">Learn how we handle and protect your data</p>
                      </div>
                    </div>
                    <svg className="w-4 h-4 text-text/20 group-hover:text-text/40 group-hover:translate-x-0.5 transition-all duration-200" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>

                  <Link
                    to="/terms"
                    className="flex items-center justify-between p-4 rounded-xl border border-text/10 bg-white/40 hover:bg-white/60 hover:border-text/15 transition-all duration-200 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-accent/5 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4.5 h-4.5 text-accent/60" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-text/80">Terms of Service</p>
                        <p className="text-xs text-text/40">Our community rules and guidelines</p>
                      </div>
                    </div>
                    <svg className="w-4 h-4 text-text/20 group-hover:text-text/40 group-hover:translate-x-0.5 transition-all duration-200" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>

                  <a
                    href="https://status.vibemeet.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 rounded-xl border border-text/10 bg-white/40 hover:bg-white/60 hover:border-text/15 transition-all duration-200 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-emerald-500/5 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4.5 h-4.5 text-emerald-500/60" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-text/80 flex items-center gap-1.5">
                          System Status
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                        </p>
                        <p className="text-xs text-text/40">Check if VibeMeet services are running normally</p>
                      </div>
                    </div>
                    <svg className="w-4 h-4 text-text/20 group-hover:text-text/40 group-hover:translate-x-0.5 transition-all duration-200" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                    </svg>
                  </a>
                </div>
              </section>

            </article>
          </div>
        </div>

        {/* Footer */}
        <footer className="py-8 text-center text-sm text-text/40 border-t border-text/5">
          <p>
            Made with <span className="text-red-500">❤️</span> for real connections
          </p>
          <nav aria-label="Footer links" className="mt-3">
            <ul className="flex items-center justify-center gap-4">
              {[
                { label: "Privacy", href: "/privacy" },
                { label: "Terms", href: "/terms" },
                { label: "Contact", href: "/contact" },
              ].map((link, i, arr) => (
                <li key={link.label} className="flex items-center gap-4">
                  <Link to={link.href} className="transition-colors duration-200 hover:text-text">
                    {link.label}
                  </Link>
                  {i < arr.length - 1 && <span className="text-text/20">·</span>}
                </li>
              ))}
            </ul>
          </nav>
          <p className="mt-4 text-xs text-text/25">
            © {new Date().getFullYear()} VibeMeet Inc. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
}

// ─── FAQ Accordion ────────────────────────────────────────────────────────────
function FAQItem({ question, answer }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-text/5 last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start justify-between py-5 text-left group"
        aria-expanded={open}
      >
        <span className="font-poppins font-semibold text-text/80 text-sm pr-8 group-hover:text-text transition-colors duration-200 leading-relaxed">
          {question}
        </span>
        <svg
          className={`w-4 h-4 text-text/30 flex-shrink-0 mt-1 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          maxHeight: open ? "300px" : "0px",
          opacity: open ? 1 : 0,
        }}
      >
        <p className="text-text/55 text-sm leading-relaxed pb-5 pr-8">
          {answer}
        </p>
      </div>
    </div>
  );
}