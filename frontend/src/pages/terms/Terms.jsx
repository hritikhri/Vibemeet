// src/pages/Terms.jsx

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function Terms() {
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
    { id: "acceptance", label: "Acceptance of Terms" },
    { id: "eligibility", label: "Eligibility" },
    { id: "your-account", label: "Your Account" },
    { id: "acceptable-use", label: "Acceptable Use" },
    { id: "user-content", label: "Your Content" },
    { id: "safety", label: "Safety & Meetups" },
    { id: "subscriptions", label: "Subscriptions & Payments" },
    { id: "termination", label: "Termination" },
    { id: "disclaimers", label: "Disclaimers" },
    { id: "liability", label: "Limitation of Liability" },
    { id: "governing-law", label: "Governing Law" },
    { id: "changes", label: "Changes to Terms" },
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
            <p className="text-accent font-semibold text-sm mb-3 tracking-wide uppercase">
              Terms of Service
            </p>
            <h1 className="font-poppins text-4xl md:text-5xl font-extrabold text-text leading-tight">
              Terms of Service
            </h1>
            <p className="mt-4 text-text/50 text-lg leading-relaxed">
              These terms govern your use of VibeMeet. By using our app, you agree to these terms. We've written them to be as clear and fair as possible — if anything is confusing, just{" "}
              <Link to="/contact" className="text-primary hover:underline">
                reach out
              </Link>
              .
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

        {/* Body */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex gap-12">
            {/* Sidebar */}
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

            {/* Content */}
            <article className="flex-1 max-w-3xl">
              <div className="prose-custom">

                {/* 1 */}
                <section id="acceptance" data-section className="scroll-mt-24 mb-16">
                  <h2 className="font-poppins text-2xl font-bold text-text mb-6">
                    1. Acceptance of Terms
                  </h2>
                  <p className="text-text/60 leading-relaxed mb-4">
                    By accessing or using VibeMeet — including our website, mobile applications, and any related services — you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use VibeMeet.
                  </p>
                  <p className="text-text/60 leading-relaxed">
                    These Terms constitute a legally binding agreement between you and VibeMeet Inc. ("VibeMeet," "we," "us," or "our"). They apply to all users of the service, including visitors, registered users, and anyone who accesses VibeMeet in any way.
                  </p>
                </section>

                <hr className="border-text/5 my-12" />

                {/* 2 */}
                <section id="eligibility" data-section className="scroll-mt-24 mb-16">
                  <h2 className="font-poppins text-2xl font-bold text-text mb-6">
                    2. Eligibility
                  </h2>
                  <p className="text-text/60 leading-relaxed mb-4">
                    You must be at least 18 years old to create an account or use VibeMeet. By registering, you represent and warrant that you are at least 18 years of age and have the legal capacity to enter into this agreement.
                  </p>
                  <p className="text-text/60 leading-relaxed">
                    If we discover or have reason to believe that a user is under 18, we will immediately terminate that account and delete all associated personal data. If you are aware of anyone under 18 using VibeMeet, please report it to{" "}
                    <a href="mailto:safety@vibemeet.app" className="text-primary hover:underline">
                      safety@vibemeet.app
                    </a>
                    .
                  </p>
                </section>

                <hr className="border-text/5 my-12" />

                {/* 3 */}
                <section id="your-account" data-section className="scroll-mt-24 mb-16">
                  <h2 className="font-poppins text-2xl font-bold text-text mb-6">
                    3. Your Account
                  </h2>

                  <h3 className="font-poppins font-semibold text-text/90 text-lg mt-8 mb-3">
                    Registration
                  </h3>
                  <p className="text-text/60 leading-relaxed mb-4">
                    You agree to provide accurate, current, and complete information when creating your account. Your profile should represent the real you — fake profiles, impersonation, and misleading information are not allowed and will result in account termination.
                  </p>

                  <h3 className="font-poppins font-semibold text-text/90 text-lg mt-8 mb-3">
                    Account Security
                  </h3>
                  <p className="text-text/60 leading-relaxed mb-4">
                    You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account. Do not share your password with anyone. If you suspect unauthorized access, notify us immediately at{" "}
                    <a href="mailto:security@vibemeet.app" className="text-primary hover:underline">
                      security@vibemeet.app
                    </a>
                    .
                  </p>

                  <h3 className="font-poppins font-semibold text-text/90 text-lg mt-8 mb-3">
                    One Account Per Person
                  </h3>
                  <p className="text-text/60 leading-relaxed">
                    Each person may only maintain one VibeMeet account. Creating multiple accounts — whether to circumvent a ban, manipulate the matching system, or for any other reason — is prohibited.
                  </p>
                </section>

                <hr className="border-text/5 my-12" />

                {/* 4 */}
                <section id="acceptable-use" data-section className="scroll-mt-24 mb-16">
                  <h2 className="font-poppins text-2xl font-bold text-text mb-6">
                    4. Acceptable Use
                  </h2>
                  <p className="text-text/60 leading-relaxed mb-6">
                    VibeMeet exists to help real people build real friendships. To keep our community safe and welcoming, you agree not to:
                  </p>

                  <ul className="space-y-3 mb-6">
                    {[
                      "Harass, bully, threaten, intimidate, or stalk other users",
                      "Post or share content that is hateful, discriminatory, violent, sexually explicit, or promotes self-harm",
                      "Impersonate another person or misrepresent your identity, age, or affiliations",
                      "Use VibeMeet for commercial purposes, advertising, solicitation, or spam of any kind",
                      "Attempt to scam, defraud, or deceive other users",
                      "Share other people's private information without their explicit consent",
                      "Use bots, scrapers, crawlers, or other automated tools to access VibeMeet",
                      "Reverse-engineer, decompile, or attempt to extract the source code of our software",
                      "Attempt to circumvent any security measures, access controls, or rate limits",
                      "Use VibeMeet to promote illegal activities or violate any applicable laws",
                    ].map((item, i) => (
                      <li key={i} className="flex gap-3 text-text/60 leading-relaxed">
                        <span className="mt-2 w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="rounded-2xl bg-rose-50/80 border border-rose-200/50 p-6">
                    <p className="text-rose-800 font-semibold font-poppins mb-2">
                      Zero tolerance for harassment
                    </p>
                    <p className="text-rose-700/70 text-sm leading-relaxed">
                      Any form of harassment — including but not limited to unwanted sexual advances, hate speech, threats, or sustained unwelcome contact — will result in immediate and permanent account termination. We take every report seriously and review all cases within 24 hours.
                    </p>
                  </div>
                </section>

                <hr className="border-text/5 my-12" />

                {/* 5 */}
                <section id="user-content" data-section className="scroll-mt-24 mb-16">
                  <h2 className="font-poppins text-2xl font-bold text-text mb-6">
                    5. Your Content
                  </h2>

                  <h3 className="font-poppins font-semibold text-text/90 text-lg mt-8 mb-3">
                    Ownership
                  </h3>
                  <p className="text-text/60 leading-relaxed mb-4">
                    You retain full ownership of all content you create and share on VibeMeet, including photos, text, and other media. We do not claim ownership of your content.
                  </p>

                  <h3 className="font-poppins font-semibold text-text/90 text-lg mt-8 mb-3">
                    License Grant
                  </h3>
                  <p className="text-text/60 leading-relaxed mb-4">
                    By posting content on VibeMeet, you grant us a non-exclusive, royalty-free, worldwide license to use, display, reproduce, and distribute that content solely within the VibeMeet platform and for the purpose of operating and promoting the service. This license ends when you delete your content or your account.
                  </p>

                  <h3 className="font-poppins font-semibold text-text/90 text-lg mt-8 mb-3">
                    Content Responsibility
                  </h3>
                  <p className="text-text/60 leading-relaxed mb-4">
                    You are solely responsible for the content you post. Do not share anything you don't have the right to share, including copyrighted material, confidential information, or content that violates anyone else's rights.
                  </p>

                  <h3 className="font-poppins font-semibold text-text/90 text-lg mt-8 mb-3">
                    Content Moderation
                  </h3>
                  <p className="text-text/60 leading-relaxed">
                    We reserve the right to review, moderate, and remove any content that violates these Terms or our Community Guidelines. We may use a combination of automated systems and human moderators for content review. Decisions to remove content are made at our discretion, and we will notify you when content is removed along with the reason.
                  </p>
                </section>

                <hr className="border-text/5 my-12" />

                {/* 6 */}
                <section id="safety" data-section className="scroll-mt-24 mb-16">
                  <h2 className="font-poppins text-2xl font-bold text-text mb-6">
                    6. Safety & Real-Life Meetups
                  </h2>
                  <p className="text-text/60 leading-relaxed mb-4">
                    VibeMeet is designed to help people meet in real life. While we provide safety features and guidelines, your personal safety when meeting someone in person is ultimately your responsibility.
                  </p>

                  <div className="rounded-2xl bg-amber-50/80 border border-amber-200/50 p-6 mb-6">
                    <p className="text-amber-800 font-semibold font-poppins mb-3">
                      Safety guidelines for meetups
                    </p>
                    <ul className="space-y-2 text-amber-700/70 text-sm">
                      {[
                        "Always meet in public, well-lit places for the first few meetups",
                        "Tell a friend or family member where you're going and who you're meeting",
                        "Arrange your own transportation to and from the meetup",
                        "Trust your instincts — if something feels off, leave",
                        "Use VibeMeet's check-in feature to share your location with trusted contacts",
                        "Report any concerning behavior immediately through the app",
                      ].map((item, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-amber-500 flex-shrink-0">→</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <p className="text-text/60 leading-relaxed">
                    VibeMeet is not responsible for the actions, behavior, or conduct of any user, whether online or offline. We do not conduct criminal background checks on users. We provide reporting tools, verification features, and safety guidelines, but we cannot guarantee the identity or intentions of any user.
                  </p>
                </section>

                <hr className="border-text/5 my-12" />

                {/* 7 */}
                <section id="subscriptions" data-section className="scroll-mt-24 mb-16">
                  <h2 className="font-poppins text-2xl font-bold text-text mb-6">
                    7. Subscriptions & Payments
                  </h2>

                  <h3 className="font-poppins font-semibold text-text/90 text-lg mt-8 mb-3">
                    Free Tier
                  </h3>
                  <p className="text-text/60 leading-relaxed mb-4">
                    VibeMeet's core functionality is free and will remain free. This includes creating a profile, receiving matches, messaging connections, and discovering local events. We believe social connection shouldn't be locked behind a paywall.
                  </p>

                  <h3 className="font-poppins font-semibold text-text/90 text-lg mt-8 mb-3">
                    Premium Features
                  </h3>
                  <p className="text-text/60 leading-relaxed mb-4">
                    We may offer optional premium features or subscriptions in the future. Any paid features will be clearly labeled with transparent pricing before you make any purchase. No hidden fees, no surprise charges.
                  </p>

                  <h3 className="font-poppins font-semibold text-text/90 text-lg mt-8 mb-3">
                    Refund Policy
                  </h3>
                  <p className="text-text/60 leading-relaxed">
                    If you purchase a premium feature and are unsatisfied, you may request a full refund within 14 days of purchase by contacting{" "}
                    <a href="mailto:billing@vibemeet.app" className="text-primary hover:underline">
                      billing@vibemeet.app
                    </a>
                    . Refunds will be processed to the original payment method within 5–10 business days.
                  </p>
                </section>

                <hr className="border-text/5 my-12" />

                {/* 8 */}
                <section id="termination" data-section className="scroll-mt-24 mb-16">
                  <h2 className="font-poppins text-2xl font-bold text-text mb-6">
                    8. Termination
                  </h2>

                  <h3 className="font-poppins font-semibold text-text/90 text-lg mt-8 mb-3">
                    By You
                  </h3>
                  <p className="text-text/60 leading-relaxed mb-4">
                    You can delete your account at any time through Settings → Account → Delete Account. Upon deletion, your profile, matches, messages, and personal data will be permanently removed within 30 days, except where we are legally required to retain certain records.
                  </p>

                  <h3 className="font-poppins font-semibold text-text/90 text-lg mt-8 mb-3">
                    By Us
                  </h3>
                  <p className="text-text/60 leading-relaxed mb-4">
                    We may suspend or permanently terminate your account if you violate these Terms, our Community Guidelines, or applicable law. In most cases, we will provide notice and an explanation. However, we reserve the right to terminate accounts immediately and without notice in cases involving severe violations (such as threats of violence, child exploitation, or fraud).
                  </p>

                  <h3 className="font-poppins font-semibold text-text/90 text-lg mt-8 mb-3">
                    Effect of Termination
                  </h3>
                  <p className="text-text/60 leading-relaxed">
                    When your account is terminated — whether by you or by us — your right to access and use VibeMeet ceases immediately. Certain provisions of these Terms that by their nature should survive termination (including disclaimers, limitations of liability, and dispute resolution) will continue to apply.
                  </p>
                </section>

                <hr className="border-text/5 my-12" />

                {/* 9 */}
                <section id="disclaimers" data-section className="scroll-mt-24 mb-16">
                  <h2 className="font-poppins text-2xl font-bold text-text mb-6">
                    9. Disclaimers
                  </h2>
                  <p className="text-text/60 leading-relaxed mb-4">
                    VibeMeet is provided on an "as is" and "as available" basis, without warranties of any kind, either express or implied. We do not warrant that the service will be uninterrupted, error-free, or completely secure.
                  </p>
                  <p className="text-text/60 leading-relaxed">
                    We make no guarantees about the quality of matches, the behavior of other users, or the outcome of any real-life meetups arranged through VibeMeet. While we work hard to create the best possible experience, we cannot guarantee specific results from using the service.
                  </p>
                </section>

                <hr className="border-text/5 my-12" />

                {/* 10 */}
                <section id="liability" data-section className="scroll-mt-24 mb-16">
                  <h2 className="font-poppins text-2xl font-bold text-text mb-6">
                    10. Limitation of Liability
                  </h2>
                  <p className="text-text/60 leading-relaxed mb-4">
                    To the maximum extent permitted by applicable law, VibeMeet, its officers, directors, employees, and agents shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or relating to your use of the service.
                  </p>
                  <p className="text-text/60 leading-relaxed">
                    Our total aggregate liability for any claims arising from or related to these Terms or your use of VibeMeet shall not exceed the greater of (a) the amount you have paid to VibeMeet in the 12 months preceding the claim, or (b) one hundred U.S. dollars ($100).
                  </p>
                </section>

                <hr className="border-text/5 my-12" />

                {/* 11 */}
                <section id="governing-law" data-section className="scroll-mt-24 mb-16">
                  <h2 className="font-poppins text-2xl font-bold text-text mb-6">
                    11. Governing Law & Disputes
                  </h2>
                  <p className="text-text/60 leading-relaxed mb-4">
                    These Terms are governed by and construed in accordance with the laws of the State of California, United States, without regard to its conflict of law principles.
                  </p>
                  <p className="text-text/60 leading-relaxed">
                    Any disputes arising from these Terms or your use of VibeMeet shall first be attempted to be resolved through good-faith negotiation. If negotiation fails, disputes shall be resolved through binding arbitration in San Francisco County, California, under the rules of the American Arbitration Association. You retain the right to bring claims in small claims court if they qualify.
                  </p>
                </section>

                <hr className="border-text/5 my-12" />

                {/* 12 */}
                <section id="changes" data-section className="scroll-mt-24 mb-16">
                  <h2 className="font-poppins text-2xl font-bold text-text mb-6">
                    12. Changes to These Terms
                  </h2>
                  <p className="text-text/60 leading-relaxed mb-4">
                    We may revise these Terms from time to time. When we make material changes, we will notify you at least 30 days before the revised terms take effect — either through a notification in the app or via email to the address associated with your account.
                  </p>
                  <p className="text-text/60 leading-relaxed">
                    We encourage you to review these Terms periodically. Your continued use of VibeMeet after the revised Terms take effect constitutes your acceptance of the changes. If you disagree with the updated Terms, you should stop using VibeMeet and delete your account.
                  </p>
                </section>

                <hr className="border-text/5 my-12" />

                {/* 13 */}
                <section id="contact-us" data-section className="scroll-mt-24 mb-8">
                  <h2 className="font-poppins text-2xl font-bold text-text mb-6">
                    13. Contact Us
                  </h2>
                  <p className="text-text/60 leading-relaxed mb-6">
                    If you have questions about these Terms or need to report a violation, get in touch:
                  </p>

                  <div className="rounded-2xl bg-white/60 border border-text/10 p-6 space-y-3">
                    <p className="text-text/70">
                      <strong className="text-text/80">General inquiries:</strong>{" "}
                      <a href="mailto:hello@vibemeet.app" className="text-primary hover:underline">
                        hello@vibemeet.app
                      </a>
                    </p>
                    <p className="text-text/70">
                      <strong className="text-text/80">Legal:</strong>{" "}
                      <a href="mailto:legal@vibemeet.app" className="text-primary hover:underline">
                        legal@vibemeet.app
                      </a>
                    </p>
                    <p className="text-text/70">
                      <strong className="text-text/80">Safety reports:</strong>{" "}
                      <a href="mailto:safety@vibemeet.app" className="text-primary hover:underline">
                        safety@vibemeet.app
                      </a>
                    </p>
                    <p className="text-text/70">
                      <strong className="text-text/80">Mailing address:</strong>{" "}
                      VibeMeet Inc., 548 Market Street, Suite 35, San Francisco, CA 94104
                    </p>
                  </div>
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