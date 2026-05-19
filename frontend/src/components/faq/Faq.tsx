import { FaPlus, FaMinus } from "react-icons/fa";
import { useState } from "react";
import { useScrollReveal } from "../../hooks/useScrollReveal";

interface FaqItem {
  question: string;
  answer: string;
}

const Faq = () => {
  useScrollReveal();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const faqs: FaqItem[] = [
    {
      question: "Do I need an account to use this?",
      answer:
        "No account is needed. Students and visitors can freely browse the Lost Items Board and Found Items Board without logging in.",
    },
    {
      question: "How do I report my lost item?",
      answer:
        "Go to the Lost Items page and click 'Report Lost Item'. Fill in the details including item description, location it was lost, and date. You'll receive a confirmation email.",
    },
    {
      question: " I found an item. What should I do?",
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
    <div className="py-10 lg:py-20 relative overflow-hidden bg-gray-950 min-h-[500px] lg:min-h-[650px] reveal">

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
              Everything you need to know about the SAS Lost & Found.
            </p>
          </div>

          {/* Right — accordion */}
          <ul className="lg:basis-2/3 divide-y divide-white/5 bg-gray-900/50 backdrop-blur-sm border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
            {faqs.map((faq, index) => (
              <li key={index} className="group">
                <button
                  className="w-full flex items-center justify-between gap-6 px-6 py-5 lg:px-10 lg:py-8 text-left hover:bg-white/[0.03] transition-all duration-300 focus:outline-none select-none"
                  onClick={() => toggleFaq(index)}
                  aria-expanded={expandedIndex === index}
                >
                  <p className={`text-sm lg:text-lg font-bold leading-relaxed transition-colors duration-300 ${
                    expandedIndex === index ? "text-blue-400" : "text-white group-hover:text-blue-300"
                  }`}>
                    {faq.question}
                  </p>
                  <div className={`shrink-0 ml-2 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                    expandedIndex === index ? "bg-blue-500/20 rotate-180" : "bg-white/5"
                  }`}>
                    {expandedIndex === index
                      ? <FaMinus size={14} className="text-blue-400" />
                      : <FaPlus  size={14} className="text-gray-500 group-hover:text-blue-400" />}
                  </div>
                </button>
                <div className={`grid transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                  expandedIndex === index 
                    ? "grid-rows-[1fr] opacity-100" 
                    : "grid-rows-[0fr] opacity-0"
                }`}>
                  <div className="overflow-hidden px-6 lg:px-10">
                    <div className="pb-6 lg:pb-10 border-t border-white/5 pt-4">
                      <p className="text-gray-400 text-sm lg:text-base leading-relaxed text-justify lg:text-left">
                        {faq.answer}
                      </p>
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