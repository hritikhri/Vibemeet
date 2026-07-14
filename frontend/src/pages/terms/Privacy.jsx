// src/pages/Privacy.jsx

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function Privacy() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-20% 0px -60% 0px" }
    );

    document.querySelectorAll("[data-section]").forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const navItems = [
    { id: "info-collect", label: "Information We Collect" },
    { id: "info-use", label: "How We Use It" },
    { id: "info-share", label: "Sharing & Disclosure" },
    { id: "data-security", label: "Data Security" },
    { id: "your-rights", label: "Your Rights" },
    { id: "cookies", label: "Cookies" },
    { id: "children", label: "Children's Privacy" },
    { id: "changes", label: "Policy Changes" },
    { id: "contact-us", label: "Contact Us" },
  ];

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
            <p className="text-primary font-semibold text-sm mb-3 tracking-wide uppercase">
              Privacy Policy
            </p>
            <h1 className="font-poppins text-4xl md:text-5xl font-extrabold text-text leading-tight">
              Privacy Policy
            </h1>
            <p className="mt-4 text-text/50 text-lg leading-relaxed">
              Your privacy is fundamental to everything we build at VibeMeet. This policy explains what data we collect, why we collect it, and how you stay in control.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-text/40">
              <span>
                Effective date:{" "}
                <span className="text-text/60">January 15, 2025</span>
              </span>
              <span className="text-text/20">|</span>
              <span>
                Last updated:{" "}
                <span className="text-text/60">
                  {new Date().toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </span>
            </div>
          </div>
        </header>

        {/* Body — sidebar + content */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex gap-12">
            {/* Sidebar nav — desktop only */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-24">
                <p className="text-xs font-semibold text-text/30 uppercase tracking-wider mb-4">
                  On this page
                </p>
                <nav className="space-y-1">
                  {navItems.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className={`block py-2 px-3 text-sm rounded-lg transition-all duration-200 ${
                        activeSection === item.id
                          ? "text-primary bg-primary/5 font-medium"
                          : "text-text/45 hover:text-text/70 hover:bg-text/[0.03]"
                      }`}
                    >
                      {item.label}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>

            {/* Main content — single flowing document */}
            <article className="flex-1 max-w-3xl">
              <div className="prose-custom">
                {/* Section 1 */}
                <section id="info-collect" data-section className="scroll-mt-24 mb-16">
                  <h2 className="font-poppins text-2xl font-bold text-text mb-6">
                    1. Information We Collect
                  </h2>

                  <h3 className="font-poppins font-semibold text-text/90 text-lg mt-8 mb-3">
                    Account Information
                  </h3>
                  <p className="text-text/60 leading-relaxed mb-4">
                    When you create a VibeMeet account, we collect your name, email address, date of birth, and optional profile photo. You may also choose to share your interests, bio, and vibe preferences to help us find better matches for you.
                  </p>

                  <h3 className="font-poppins font-semibold text-text/90 text-lg mt-8 mb-3">
                    Location Data
                  </h3>
                  <p className="text-text/60 leading-relaxed mb-4">
                    With your explicit permission, we collect your approximate location to match you with nearby people and local events. We want to be crystal clear about this:{" "}
                    <strong className="text-text/80">
                      we never share your precise location with other users.
                    </strong>{" "}
                    Other people on VibeMeet only see general proximity — for example, "about 2 miles away." You can revoke location access at any time through your device settings.
                  </p>

                  <h3 className="font-poppins font-semibold text-text/90 text-lg mt-8 mb-3">
                    Usage Data
                  </h3>
                  <p className="text-text/60 leading-relaxed mb-4">
                    We collect information about how you interact with VibeMeet, including which features you use, how often you open the app, and how you interact with other users. This data is used in aggregate to improve the product — we don't build individual behavioral profiles for advertising purposes.
                  </p>

                  <h3 className="font-poppins font-semibold text-text/90 text-lg mt-8 mb-3">
                    Device Information
                  </h3>
                  <p className="text-text/60 leading-relaxed">
                    We may collect device type, operating system version, browser type, and unique device identifiers. This information is used for security (detecting suspicious login attempts), performance optimization, and debugging issues you might report.
                  </p>
                </section>

                <hr className="border-text/5 my-12" />

                {/* Section 2 */}
                <section id="info-use" data-section className="scroll-mt-24 mb-16">
                  <h2 className="font-poppins text-2xl font-bold text-text mb-6">
                    2. How We Use Your Information
                  </h2>

                  <p className="text-text/60 leading-relaxed mb-6">
                    We use your personal information for the following purposes:
                  </p>

                  <ul className="space-y-4 mb-6">
                    {[
                      {
                        title: "Providing our core service",
                        desc: "— matching you with compatible people nearby, surfacing relevant events, and enabling communication between matched users.",
                      },
                      {
                        title: "Safety and security",
                        desc: "— verifying accounts, detecting fraudulent activity, preventing abuse, and maintaining a safe community for everyone.",
                      },
                      {
                        title: "Product improvement",
                        desc: "— analyzing usage patterns in aggregate (never individually) to improve our matching algorithms, fix bugs, and build features our community actually wants.",
                      },
                      {
                        title: "Communications",
                        desc: "— sending you service-related messages (account verification, security alerts) and optional product updates. You can opt out of non-essential emails at any time.",
                      },
                    ].map((item, i) => (
                      <li key={i} className="flex gap-3 text-text/60 leading-relaxed">
                        <span className="mt-2 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                        <span>
                          <strong className="text-text/80">{item.title}</strong>
                          {item.desc}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <p className="text-text/60 leading-relaxed">
                    We do not use your personal data to train AI models, build advertising profiles, or sell insights to third parties. Period.
                  </p>
                </section>

                <hr className="border-text/5 my-12" />

                {/* Section 3 */}
                <section id="info-share" data-section className="scroll-mt-24 mb-16">
                  <h2 className="font-poppins text-2xl font-bold text-text mb-6">
                    3. Sharing & Disclosure
                  </h2>

                  <h3 className="font-poppins font-semibold text-text/90 text-lg mt-8 mb-3">
                    With Other Users
                  </h3>
                  <p className="text-text/60 leading-relaxed mb-4">
                    Your profile information — including your name, photo, bio, and interests — is visible to other VibeMeet users. Your exact location, email address, and phone number are never shared with other users.
                  </p>

                  <h3 className="font-poppins font-semibold text-text/90 text-lg mt-8 mb-3">
                    Service Providers
                  </h3>
                  <p className="text-text/60 leading-relaxed mb-4">
                    We work with a small number of trusted third-party services for infrastructure (cloud hosting), analytics, and transactional email delivery. These providers are contractually obligated to protect your data and may only use it to provide services to VibeMeet. We regularly audit our vendors for compliance.
                  </p>

                  <h3 className="font-poppins font-semibold text-text/90 text-lg mt-8 mb-3">
                    Legal Requirements
                  </h3>
                  <p className="text-text/60 leading-relaxed mb-6">
                    We may disclose your information if required by law, valid court order, or government request. We may also disclose information if we believe in good faith that disclosure is necessary to protect the rights, safety, or property of VibeMeet, our users, or the public.
                  </p>

                  <div className="rounded-2xl bg-emerald-50/80 border border-emerald-200/50 p-6">
                    <p className="text-emerald-800 font-semibold font-poppins mb-2">
                      We never sell your data
                    </p>
                    <p className="text-emerald-700/70 text-sm leading-relaxed">
                      We do not sell, rent, lease, or trade your personal information to third parties for their marketing or any other purposes. This isn't just a policy — it's a core principle of how we built VibeMeet. Our business model is based on building a great product, not monetizing your personal data.
                    </p>
                  </div>
                </section>

                <hr className="border-text/5 my-12" />

                {/* Section 4 */}
                <section id="data-security" data-section className="scroll-mt-24 mb-16">
                  <h2 className="font-poppins text-2xl font-bold text-text mb-6">
                    4. Data Security
                  </h2>

                  <p className="text-text/60 leading-relaxed mb-6">
                    We take the security of your data seriously and employ industry-standard measures to protect it:
                  </p>

                  <ul className="space-y-4 mb-6">
                    {[
                      {
                        title: "Encryption in transit and at rest",
                        desc: "— all data is encrypted using TLS 1.3 during transmission and AES-256 at rest. Messages between users are protected with end-to-end encryption.",
                      },
                      {
                        title: "Access controls",
                        desc: "— access to personal data is strictly limited to employees who require it to provide our services. All access is logged, monitored, and audited regularly.",
                      },
                      {
                        title: "Regular security audits",
                        desc: "— we conduct internal security reviews quarterly and engage independent third-party security firms for annual penetration testing.",
                      },
                      {
                        title: "Incident response",
                        desc: "— we maintain a comprehensive security incident response plan. In the event of a data breach affecting your personal information, we will notify you within 72 hours as required by applicable law.",
                      },
                    ].map((item, i) => (
                      <li key={i} className="flex gap-3 text-text/60 leading-relaxed">
                        <span className="mt-2 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                        <span>
                          <strong className="text-text/80">{item.title}</strong>
                          {item.desc}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <p className="text-text/60 leading-relaxed">
                    While no system is 100% secure, we continuously work to protect your information and promptly address any vulnerabilities.
                  </p>
                </section>

                <hr className="border-text/5 my-12" />

                {/* Section 5 */}
                <section id="your-rights" data-section className="scroll-mt-24 mb-16">
                  <h2 className="font-poppins text-2xl font-bold text-text mb-6">
                    5. Your Rights & Choices
                  </h2>

                  <p className="text-text/60 leading-relaxed mb-6">
                    You have full control over your personal data. Here's what you can do:
                  </p>

                  <div className="space-y-6">
                    {[
                      {
                        title: "Access & download your data",
                        desc: "You can request a complete copy of all personal data we hold about you. Go to Settings → Privacy → Download My Data, or email us and we'll provide it within 30 days.",
                      },
                      {
                        title: "Correct your information",
                        desc: "You can update your profile information at any time directly in the app. If you notice inaccuracies in other data we hold, contact us and we'll correct it promptly.",
                      },
                      {
                        title: "Delete your account",
                        desc: "You can permanently delete your account at any time from Settings → Account → Delete Account. When you delete your account, we remove your personal data within 30 days, except where we're legally required to retain certain records.",
                      },
                      {
                        title: "Control location sharing",
                        desc: "You can revoke location permissions at any time through your device settings. VibeMeet will still work, but location-based matching and event suggestions will be unavailable.",
                      },
                      {
                        title: "Manage communications",
                        desc: "You can opt out of marketing emails at any time by clicking 'Unsubscribe' in any email or adjusting your notification preferences in Settings. We will always send essential service-related communications (like security alerts).",
                      },
                    ].map((item, i) => (
                      <div key={i}>
                        <h3 className="font-poppins font-semibold text-text/90 mb-2">
                          {item.title}
                        </h3>
                        <p className="text-text/60 leading-relaxed">{item.desc}</p>
                      </div>
                    ))}
                  </div>

                  <p className="text-text/60 leading-relaxed mt-6">
                    If you're in the European Union, you also have the right to data portability and the right to object to certain processing under GDPR. California residents have additional rights under the CCPA. We honor all applicable data protection regulations regardless of where you live.
                  </p>
                </section>

                <hr className="border-text/5 my-12" />

                {/* Section 6 */}
                <section id="cookies" data-section className="scroll-mt-24 mb-16">
                  <h2 className="font-poppins text-2xl font-bold text-text mb-6">
                    6. Cookies & Tracking
                  </h2>

                  <h3 className="font-poppins font-semibold text-text/90 text-lg mt-8 mb-3">
                    Essential Cookies
                  </h3>
                  <p className="text-text/60 leading-relaxed mb-4">
                    We use essential cookies to keep you logged in, remember your preferences, and ensure the app functions correctly. These cookies are necessary for the service to work and cannot be disabled.
                  </p>

                  <h3 className="font-poppins font-semibold text-text/90 text-lg mt-8 mb-3">
                    Analytics
                  </h3>
                  <p className="text-text/60 leading-relaxed mb-4">
                    We use privacy-friendly analytics (currently Plausible Analytics) to understand how people use VibeMeet in aggregate. These tools do not use cookies, do not track individuals across websites, and are fully GDPR-compliant without requiring consent banners.
                  </p>

                  <h3 className="font-poppins font-semibold text-text/90 text-lg mt-8 mb-3">
                    What We Don't Do
                  </h3>
                  <p className="text-text/60 leading-relaxed">
                    We do not use advertising cookies, retargeting pixels, social media tracking scripts, or any third-party trackers that follow you around the web. We don't participate in ad exchanges or data broker networks.
                  </p>
                </section>

                <hr className="border-text/5 my-12" />

                {/* Section 7 */}
                <section id="children" data-section className="scroll-mt-24 mb-16">
                  <h2 className="font-poppins text-2xl font-bold text-text mb-6">
                    7. Children's Privacy
                  </h2>
                  <p className="text-text/60 leading-relaxed">
                    VibeMeet is designed for users who are 18 years of age or older. We do not knowingly collect personal information from anyone under 18. If we become aware that we have collected data from a minor, we will take immediate steps to delete that information and terminate the associated account. If you believe a minor is using VibeMeet, please contact us at{" "}
                    <a href="mailto:safety@vibemeet.app" className="text-primary hover:underline">
                      safety@vibemeet.app
                    </a>
                    .
                  </p>
                </section>

                <hr className="border-text/5 my-12" />

                {/* Section 8 */}
                <section id="changes" data-section className="scroll-mt-24 mb-16">
                  <h2 className="font-poppins text-2xl font-bold text-text mb-6">
                    8. Changes to This Policy
                  </h2>
                  <p className="text-text/60 leading-relaxed mb-4">
                    We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. When we make material changes, we will:
                  </p>
                  <ul className="space-y-3 mb-4">
                    {[
                      "Notify you through the app or via email at least 30 days before changes take effect",
                      "Clearly highlight what has changed",
                      "Give you the opportunity to review the updated policy before it applies to you",
                    ].map((item, i) => (
                      <li key={i} className="flex gap-3 text-text/60 leading-relaxed">
                        <span className="mt-2 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-text/60 leading-relaxed">
                    Your continued use of VibeMeet after changes become effective constitutes acceptance of the updated policy.
                  </p>
                </section>

                <hr className="border-text/5 my-12" />

                {/* Section 9 */}
                <section id="contact-us" data-section className="scroll-mt-24 mb-8">
                  <h2 className="font-poppins text-2xl font-bold text-text mb-6">
                    9. Contact Us
                  </h2>
                  <p className="text-text/60 leading-relaxed mb-6">
                    If you have any questions, concerns, or requests related to this Privacy Policy or your personal data, we're here to help:
                  </p>

                  <div className="rounded-2xl bg-white/60 border border-text/10 p-6 space-y-3">
                    <p className="text-text/70">
                      <strong className="text-text/80">Email:</strong>{" "}
                      <a href="mailto:privacy@vibemeet.app" className="text-primary hover:underline">
                        privacy@vibemeet.app
                      </a>
                    </p>
                    <p className="text-text/70">
                      <strong className="text-text/80">Data Protection Officer:</strong>{" "}
                      <a href="mailto:dpo@vibemeet.app" className="text-primary hover:underline">
                        dpo@vibemeet.app
                      </a>
                    </p>
                    <p className="text-text/70">
                      <strong className="text-text/80">Mailing address:</strong>{" "}
                      VibeMeet Inc., 548 Market Street, Suite 35, San Francisco, CA 94104
                    </p>
                  </div>

                  <p className="text-text/50 text-sm mt-6 leading-relaxed">
                    We aim to respond to all privacy-related inquiries within 5 business days. If you are not satisfied with our response, you have the right to lodge a complaint with your local data protection authority.
                  </p>
                </section>

              </div>
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