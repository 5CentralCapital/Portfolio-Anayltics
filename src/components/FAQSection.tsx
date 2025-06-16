import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs: FAQItem[] = [
    {
      question: "What is your investment strategy?",
      answer: "We focus on acquiring undervalued multifamily properties (10+ units) in Florida markets, executing strategic renovations and operational improvements, then refinancing to extract capital while retaining ownership for long-term appreciation."
    },
    {
      question: "How do you finance your acquisitions?",
      answer: "We utilize 85% LTC bridge loans for acquisitions, allowing us to minimize cash requirements. After completing value-add improvements, we refinance into permanent financing and extract capital for the next deal."
    },
    {
      question: "What returns do you target?",
      answer: "We target 15-25% cash-on-cash returns and 3-4x return on invested capital through our proven value-add strategy. Our focus is on sustainable, long-term wealth building rather than quick flips."
    },
    {
      question: "Can I invest with 5Central Capital?",
      answer: "We're currently developing our investor portal and will soon offer accredited investors the opportunity to co-invest in select deals. Join our investor list to be notified when opportunities become available."
    }
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="space-y-4">
      {faqs.map((faq, index) => (
        <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden">
          <button
            onClick={() => toggleFAQ(index)}
            className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <h3 className="text-lg font-semibold text-gray-900">{faq.question}</h3>
            {openIndex === index ? (
              <ChevronUp className="h-5 w-5 text-primary" />
            ) : (
              <ChevronDown className="h-5 w-5 text-primary" />
            )}
          </button>
          {openIndex === index && (
            <div className="px-6 pb-4">
              <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default FAQSection;