// ================= HELP CENTER PAGE =================
import { useState } from 'react';
import { Mail, MessageCircle, HelpCircle, Clock, ChevronDown } from 'lucide-react';

export function HelpCenter() {
  const [activeFAQ, setActiveFAQ] = useState(null);

  const faqs = [
    {
      id: 1,
      question: "How do I edit my profile?",
      answer: "Go to your Profile → Click on the Edit Profile button. You can update your bio, interests, photos, and other details from there."
    },
    {
      id: 2,
      question: "How can I reset my password?",
      answer: "You can reset your password from the login page by clicking 'Forgot Password?' or from Settings → Security → Change Password."
    },
    {
      id: 3,
      question: "How do I connect with other users?",
      answer: "Browse through the Discover or Nearby section. You can filter users by interests and send them a connection request or start a chat directly."
    },
    {
      id: 4,
      question: "How do I create a new Vibe/Activity?",
      answer: "Click on the '+' button at the bottom navigation. Fill in the details like title, description, and interests, then publish your vibe."
    },
    {
      id: 5,
      question: "Is my data secure?",
      answer: "Yes. We use industry-standard encryption (AES-256) and never share your personal information with third parties without your explicit consent."
    }
  ];

  const toggleFAQ = (id) => {
    setActiveFAQ(activeFAQ === id ? null : id);
  };

  const handleContact = (type) => {
    if (type === 'email') {
      window.location.href = "mailto:support@vibemeet.com?subject=Help%20Request%20from%20Help%20Center";
    } else {
      alert("Live Chat is currently under development.\n\nPlease email us at support@vibemeet.com");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white py-12 px-6">
      <div className="max-w-3xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-zinc-800 rounded-3xl mb-6">
            <HelpCircle className="w-11 h-11 text-blue-500" />
          </div>
          <h1 className="text-4xl font-semibold mb-4">How can we help you?</h1>
          <p className="text-gray-400 text-lg max-w-md mx-auto">
            Find quick answers or get in touch with our support team.
          </p>
        </div>

        {/* FAQ Section */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <h2 className="text-2xl font-semibold">Frequently Asked Questions</h2>
            <Clock className="w-5 h-5 text-gray-500" />
          </div>

          <div className="space-y-4">
            {faqs.map((faq) => {
              const isOpen = activeFAQ === faq.id;
              return (
                <div
                  key={faq.id}
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden"
                >
                  <button
                    onClick={() => toggleFAQ(faq.id)}
                    className="w-full px-7 py-6 text-left flex items-center justify-between hover:bg-zinc-800/50 transition-all group"
                  >
                    <h3 className="font-medium text-lg pr-10 leading-tight text-white">
                      {faq.question}
                    </h3>
                    <div className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                      <ChevronDown className="w-6 h-6 text-gray-400 group-hover:text-gray-300" />
                    </div>
                  </button>

                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isOpen ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="px-7 pb-8 pt-2 text-gray-400 leading-relaxed border-t border-zinc-800">
                      {faq.answer}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Contact Support */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-10">
          <h2 className="text-2xl font-semibold mb-3">Still need help?</h2>
          <p className="text-gray-400 mb-10">
            Our friendly support team is here to help. Reach out anytime.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => handleContact('email')}
              className="flex items-center justify-center gap-3 px-8 py-4 bg-white hover:bg-gray-200 text-black rounded-2xl font-semibold transition-all active:scale-[0.985]"
            >
              <Mail size={22} />
              Email Support
            </button>

            <button
              onClick={() => handleContact('chat')}
              className="flex items-center justify-center gap-3 px-8 py-4 border border-zinc-700 hover:bg-zinc-800 text-white rounded-2xl font-semibold transition-all active:scale-[0.985]"
            >
              <MessageCircle size={22} />
              Live Chat
            </button>
          </div>

          <div className="text-center mt-10">
            <p className="text-xs text-gray-500">
              Average response time: <span className="font-medium text-emerald-500">Under 2 hours</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}