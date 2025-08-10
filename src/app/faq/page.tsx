'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { FaChevronDown, FaChevronUp, FaQuestionCircle, FaCarSide, FaShieldAlt, FaCreditCard, FaFileAlt, FaClock } from 'react-icons/fa';

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggleItem = (index: number) => {
    setOpenItems(prev => 
      prev.includes(index) 
        ? prev.filter(item => item !== index)
        : [...prev, index]
    );
  };

  const faqCategories = [
    {
      title: 'Booking & Rental',
      icon: FaCarSide,
      questions: [
        {
          question: 'How do I book a PCO vehicle?',
          answer: 'Browse our available vehicles, select the one that suits your needs, and click "View Details" to proceed with the booking. You\'ll need to provide your PCO license and other required documents during the process.'
        },
        {
          question: 'What documents do I need to rent a vehicle?',
          answer: 'You\'ll need your PCO license, driving license, proof of address, national insurance number, and a recent passport-style photograph. We\'ll guide you through the document upload process.'
        },
        {
          question: 'How long does the booking process take?',
          answer: 'The initial booking can be completed in minutes. Document verification typically takes 24-48 hours, after which you can collect your vehicle.'
        },
        {
          question: 'Can I extend my rental period?',
          answer: 'Yes, most rentals can be extended subject to vehicle availability. Contact us at least 48 hours before your current rental ends to arrange an extension.'
        }
      ]
    },
    {
      title: 'Insurance & Safety',
      icon: FaShieldAlt,
      questions: [
        {
          question: 'Is insurance included with the rental?',
          answer: 'Yes, all our vehicles come with comprehensive insurance coverage. The insurance details are clearly displayed on each vehicle listing, so you know exactly what\'s covered.'
        },
        {
          question: 'What happens if I damage the vehicle?',
          answer: 'All vehicles come with comprehensive insurance. Minor damage is typically covered, but you may be responsible for the excess amount. Always report any damage immediately and document it with photos.'
        },
        {
          question: 'What if the vehicle breaks down?',
          answer: 'We provide 24/7 roadside assistance. If your vehicle breaks down, contact our support team immediately. We\'ll arrange for repairs or provide a replacement vehicle if necessary.'
        },
        {
          question: 'Are the vehicles regularly maintained?',
          answer: 'Yes, all vehicles undergo regular maintenance checks and are serviced according to manufacturer recommendations. We ensure all vehicles meet safety standards before rental.'
        }
      ]
    },
    {
      title: 'Pricing & Payments',
      icon: FaCreditCard,
      questions: [
        {
          question: 'What is included in the rental price?',
          answer: 'The rental price includes the vehicle, comprehensive insurance, and basic maintenance. Fuel costs are typically your responsibility, though some packages may include fuel.'
        },
        {
          question: 'Are there any hidden fees?',
          answer: 'No, we believe in transparent pricing. All costs are clearly displayed upfront, including any deposits, insurance excess, or additional charges.'
        },
        {
          question: 'What payment methods do you accept?',
          answer: 'We accept all major credit and debit cards, as well as bank transfers. Payment is typically required in advance or at the time of vehicle collection.'
        },
        {
          question: 'Do you offer any discounts?',
          answer: 'Yes, we offer discounts for longer rental periods and returning customers. Contact our team to discuss available options for your specific needs.'
        }
      ]
    },
    {
      title: 'Documentation & Legal',
      icon: FaFileAlt,
      questions: [
        {
          question: 'What is a PCO license and do I need one?',
          answer: 'A PCO (Private Hire) license is required to drive for ride-hailing services like Uber in London. You must have a valid PCO license to rent our vehicles for commercial use.'
        },
        {
          question: 'How do I upload my documents?',
          answer: 'During the booking process, you\'ll be prompted to upload your documents through our secure portal. We accept PDF, JPG, and PNG formats.'
        },
        {
          question: 'How long does document verification take?',
          answer: 'Document verification typically takes 24-48 hours. We\'ll notify you via email once your documents have been approved.'
        },
        {
          question: 'What if my documents are rejected?',
          answer: 'If your documents are rejected, we\'ll provide specific feedback on what needs to be corrected. You can re-upload the corrected documents and we\'ll review them again.'
        }
      ]
    },
    {
      title: 'Support & Service',
      icon: FaClock,
      questions: [
        {
          question: 'What support is available if I have issues?',
          answer: 'We provide 24/7 customer support through phone, email, and live chat. Our team is always available to help with any questions or issues you may have.'
        },
        {
          question: 'How do I return the vehicle?',
          answer: 'Return the vehicle to the designated location at the agreed time. Ensure it\'s clean, fueled, and in the same condition as when you received it. Our team will conduct a final inspection.'
        },
        {
          question: 'Can I get a replacement vehicle if needed?',
          answer: 'Yes, if your vehicle needs repairs or maintenance, we can provide a replacement vehicle subject to availability. Contact our support team to arrange this.'
        },
        {
          question: 'What areas do you serve?',
          answer: 'We serve the entire United Kingdom with a network of partners across all regions. Contact us to confirm availability in your specific area.'
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-blue-600 text-white py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Frequently Asked Questions</h1>
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto">
              Find answers to the most common questions about PCO vehicle rentals
            </p>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center mb-6">
              <FaQuestionCircle className="text-3xl text-blue-600 mr-4" />
              <h2 className="text-2xl font-bold text-gray-900">Can't find what you're looking for?</h2>
            </div>
            <p className="text-gray-700 mb-6">
              Search through our comprehensive FAQ or contact our support team for personalized assistance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                href="/contact" 
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-center"
              >
                Contact Support
              </Link>
              <Link 
                href="/rental-advice" 
                className="border-2 border-blue-600 text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-600 hover:text-white transition-colors text-center"
              >
                View Rental Advice
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Categories */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          {faqCategories.map((category, categoryIndex) => (
            <div key={categoryIndex} className="mb-12">
              <div className="flex items-center mb-8">
                <category.icon className="text-3xl text-blue-600 mr-4" />
                <h2 className="text-3xl font-bold text-gray-900">{category.title}</h2>
              </div>
              <div className="space-y-4">
                {category.questions.map((item, itemIndex) => {
                  const globalIndex = categoryIndex * 100 + itemIndex;
                  const isOpen = openItems.includes(globalIndex);
                  
                  return (
                    <div key={itemIndex} className="bg-white rounded-xl shadow-lg overflow-hidden">
                      <button
                        onClick={() => toggleItem(globalIndex)}
                        className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                      >
                        <h3 className="text-lg font-semibold text-gray-900 pr-4">{item.question}</h3>
                        {isOpen ? (
                          <FaChevronUp className="text-blue-600 text-xl flex-shrink-0" />
                        ) : (
                          <FaChevronDown className="text-blue-600 text-xl flex-shrink-0" />
                        )}
                      </button>
                      {isOpen && (
                        <div className="px-6 pb-4">
                          <p className="text-gray-700 leading-relaxed">{item.answer}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Additional Help */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Still Need Help?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <FaClock className="text-4xl text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">24/7 Support</h3>
              <p className="text-gray-700 mb-4">
                Our support team is available around the clock to help with any questions or issues.
              </p>
              <Link 
                href="/contact" 
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                Contact Us →
              </Link>
            </div>
            <div className="text-center">
              <FaFileAlt className="text-4xl text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Rental Guide</h3>
              <p className="text-gray-700 mb-4">
                Comprehensive guide covering everything you need to know about PCO vehicle rentals.
              </p>
              <Link 
                href="/rental-advice" 
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                Read Guide →
              </Link>
            </div>
            <div className="text-center">
              <FaCarSide className="text-4xl text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Browse Vehicles</h3>
              <p className="text-gray-700 mb-4">
                Explore our available vehicles and find the perfect match for your PCO business.
              </p>
              <Link 
                href="/compare" 
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                View Vehicles →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
} 