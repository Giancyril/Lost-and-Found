import { FaPlus, FaMinus } from "react-icons/fa";
import { useState } from "react";

interface FaqItem {
  question: string;
  answer: string;
}

const Faq = () => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const faqs: FaqItem[] = [
    {
      question: "Do I need an account to use this system?",
      answer:
        "No account is needed. Students and visitors can freely browse the Lost Items Board and Found Items Board without logging in.",
    },
    {
      question: "How do I report my lost item?",
      answer:
        "Go to the Lost Items page and click 'Report Lost Item'. Fill in the details including item description, location it was lost, and date. You'll receive a confirmation email.",
    },
    {
      question: "I found an item on campus. What should I do?",
      answer:
        "You have two options: browse the Lost Items Board to see if the item matches a report, then click 'I Found This Item' on that listing or bring the item directly to the SAS Office",
    },
    {
      question: "How do I claim a found item?",
      answer:
        "Browse the Found Items page, find your item, and click 'Claim'. You'll need to provide proof of ownership.",
    },
    {
      question: "How do I use Smart Search?",
      answer:
        "Smart Search uses AI to help you find matching items based on your description. Simply describe what you lost or found in natural language and the system will surface the most relevant results from both boards.",
    },
  ];

  return (
    <div className="py-10 lg:py-20 relative overflow-hidden bg-gray-950">

      {/* Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-gray-950 to-gray-900" />
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 60px, rgba(255,255,255,0.05) 60px, rgba(255,255,255,0.05) 61px), repeating-linear-gradient(90deg, transparent, transparent 60px, rgba(255,255,255,0.05) 60px, rgba(255,255,255,0.05) 61px)`,
          }}
        />
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 px-4 sm:px-6 lg:px-8 mx-auto max-w-7xl">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-6 lg:gap-12">

          {/* Left — heading */}
          <div className="flex flex-col text-left lg:basis-1/2">
            <p className="inline-block font-semibold text-blue-400 mb-2 lg:mb-4 text-sm lg:text-base">FAQ</p>
            <h2 className="text-2xl sm:text-3xl lg:text-5xl font-extrabold text-white mb-2 lg:mb-4 leading-tight">
              Frequently Asked{" "}
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Questions
              </span>
            </h2>
            <p className="text-gray-400 text-sm lg:text-lg leading-relaxed text-justify">
              Everything you need to know about the SAS Lost & Found system.
            </p>
          </div>

          {/* Right — accordion */}
          <ul className="lg:basis-1/2 space-y-1.5 lg:space-y-2">
            {faqs.map((faq, index) => (
              <li
                key={index}
                className="bg-white/5 border border-white/10 rounded-lg overflow-hidden backdrop-blur-sm"
              >
                <button
                  className="relative flex gap-3 items-center w-full px-4 py-3 lg:p-6 text-sm lg:text-base font-semibold text-left hover:bg-white/5 transition-all duration-200"
                  onClick={() => toggleFaq(index)}
                  aria-expanded={expandedIndex === index}
                >
                  <span className="flex-1 text-white text-left text-sm lg:text-base leading-snug">
                    {faq.question}
                  </span>
                  <div className="text-blue-400 shrink-0 text-xs lg:text-sm">
                    {expandedIndex === index ? <FaMinus /> : <FaPlus />}
                  </div>
                </button>
                <div
                  className={`transition-[max-height] duration-500 ease-in-out overflow-hidden ${
                    expandedIndex === index ? "max-h-[300px]" : "max-h-0"
                  }`}
                >
                  <div
                    className={`px-4 pb-4 lg:px-6 lg:pb-6 transform transition-transform duration-500 ${
                      expandedIndex === index ? "translate-y-0" : "-translate-y-4"
                    }`}
                  >
                    <div className="text-gray-400 text-xs lg:text-sm leading-relaxed text-justify">
                      {faq.answer}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>

        </div>
      </div>
    </div>
  );
};

export default Faq;