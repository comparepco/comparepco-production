'use client';
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
  FaQuestionCircle, FaSearch, FaChevronDown, FaChevronUp, FaBook,
  FaUser, FaCar, FaCreditCard, FaCalendarAlt, FaGlobe, FaCog,
  FaShieldAlt, FaChartLine, FaFileContract, FaPhone, FaEnvelope,
  FaComments, FaExclamationTriangle, FaCheckCircle, FaTimes,
  FaArrowRight, FaStar, FaDownload, FaVideo, FaFileAlt, FaInfoCircle
} from 'react-icons/fa';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
  helpful: number;
  notHelpful: number;
}

interface FAQCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
}

export default function PartnerFAQPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [helpfulVotes, setHelpfulVotes] = useState<Set<string>>(new Set());
  const [notHelpfulVotes, setNotHelpfulVotes] = useState<Set<string>>(new Set());

  const faqCategories: FAQCategory[] = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      description: 'Account setup and basic platform usage',
      icon: FaUser,
      color: 'bg-blue-500'
    },
    {
      id: 'fleet-management',
      title: 'Fleet Management',
      description: 'Managing vehicles and drivers',
      icon: FaCar,
      color: 'bg-green-500'
    },
    {
      id: 'bookings',
      title: 'Bookings & Operations',
      description: 'Handling bookings and customer service',
      icon: FaCalendarAlt,
      color: 'bg-purple-500'
    },
    {
      id: 'payments',
      title: 'Payments & Finance',
      description: 'Payment processing and financial matters',
      icon: FaCreditCard,
      color: 'bg-yellow-500'
    },
    {
      id: 'marketing',
      title: 'Marketing & Promotions',
      description: 'Promoting your services',
      icon: FaGlobe,
      color: 'bg-pink-500'
    },
    {
      id: 'technical',
      title: 'Technical Support',
      description: 'Platform features and troubleshooting',
      icon: FaCog,
      color: 'bg-gray-500'
    },
    {
      id: 'security',
      title: 'Security & Compliance',
      description: 'Data protection and regulatory compliance',
      icon: FaShieldAlt,
      color: 'bg-red-500'
    },
    {
      id: 'analytics',
      title: 'Analytics & Reports',
      description: 'Understanding your performance data',
      icon: FaChartLine,
      color: 'bg-indigo-500'
    }
  ];

  const faqData: FAQItem[] = [
    // Getting Started
    {
      id: 'gs-1',
      question: 'How do I complete my partner account setup?',
      answer: 'To complete your partner account setup, follow these steps: 1) Verify your email address, 2) Complete your company profile with all required information, 3) Upload necessary documents (business license, insurance, etc.), 4) Add your first vehicle to the fleet, 5) Set up payment methods, 6) Configure notification preferences. You can track your setup progress in the dashboard.',
      category: 'getting-started',
      tags: ['setup', 'account', 'verification'],
      helpful: 45,
      notHelpful: 2
    },
    {
      id: 'gs-2',
      question: 'What documents do I need to provide during registration?',
      answer: 'You\'ll need to provide: Business license or registration certificate, Insurance certificate, Vehicle registration documents, Driver licenses, PCO license (if applicable), Tax registration certificate, and any other relevant permits for your operating area. All documents should be current and valid.',
      category: 'getting-started',
      tags: ['documents', 'registration', 'compliance'],
      helpful: 38,
      notHelpful: 1
    },
    {
      id: 'gs-3',
      question: 'How long does account approval take?',
      answer: 'Account approval typically takes 2-3 business days. We review all submitted documents and verify your business information. You\'ll receive email notifications at each step of the approval process. If additional information is needed, our team will contact you directly.',
      category: 'getting-started',
      tags: ['approval', 'timeline', 'verification'],
      helpful: 52,
      notHelpful: 3
    },
    {
      id: 'gs-4',
      question: 'Can I use the platform before my account is fully approved?',
      answer: 'You can access most platform features during the approval process, but you won\'t be able to receive bookings until your account is fully approved. You can use this time to set up your fleet, configure settings, and familiarize yourself with the platform.',
      category: 'getting-started',
      tags: ['approval', 'access', 'restrictions'],
      helpful: 29,
      notHelpful: 0
    },

    // Fleet Management
    {
      id: 'fm-1',
      question: 'How do I add a new vehicle to my fleet?',
      answer: 'To add a new vehicle: 1) Go to Fleet Management in your dashboard, 2) Click "Add Vehicle", 3) Fill in vehicle details (make, model, year, registration), 4) Upload vehicle documents (registration, insurance, MOT), 5) Set pricing for different ride categories, 6) Submit for approval. The vehicle will be available for bookings once approved.',
      category: 'fleet-management',
      tags: ['vehicle', 'fleet', 'add'],
      helpful: 67,
      notHelpful: 2
    },
    {
      id: 'fm-2',
      question: 'What are the vehicle requirements for the platform?',
      answer: 'Vehicles must meet these requirements: Valid MOT certificate, Comprehensive insurance, Clean and well-maintained condition, Appropriate size for passenger comfort, Working air conditioning, and compliance with local PCO regulations. Electric and hybrid vehicles are preferred.',
      category: 'fleet-management',
      tags: ['requirements', 'vehicle', 'standards'],
      helpful: 41,
      notHelpful: 1
    },
    {
      id: 'fm-3',
      question: 'How do I manage driver assignments?',
      answer: 'You can assign drivers to vehicles through the Fleet Management section. Go to the vehicle details, click "Assign Driver", and select from your registered drivers. You can also set up automatic assignments based on availability and preferences.',
      category: 'fleet-management',
      tags: ['drivers', 'assignment', 'management'],
      helpful: 34,
      notHelpful: 0
    },
    {
      id: 'fm-4',
      question: 'How do I track vehicle maintenance?',
      answer: 'Use the Maintenance section to log service records, set up maintenance reminders, and track vehicle health. You can schedule regular maintenance, log repairs, and monitor vehicle performance metrics. This helps ensure your fleet remains in optimal condition.',
      category: 'fleet-management',
      tags: ['maintenance', 'tracking', 'service'],
      helpful: 28,
      notHelpful: 1
    },

    // Bookings
    {
      id: 'bk-1',
      question: 'How do I accept or reject bookings?',
      answer: 'When a booking comes in, you\'ll receive a notification. You can accept, reject, or modify the booking within the specified time limit. Accepted bookings will be assigned to available vehicles and drivers. You can also set up automatic acceptance rules.',
      category: 'bookings',
      tags: ['bookings', 'accept', 'reject'],
      helpful: 73,
      notHelpful: 4
    },
    {
      id: 'bk-2',
      question: 'What happens if I need to cancel a booking?',
      answer: 'You can cancel bookings through the booking management interface. Cancellations may affect your rating and could result in penalties if done frequently. Always communicate with the customer and provide a valid reason for cancellation.',
      category: 'bookings',
      tags: ['cancellation', 'penalties', 'communication'],
      helpful: 56,
      notHelpful: 2
    },
    {
      id: 'bk-3',
      question: 'How do I handle customer complaints?',
      answer: 'Address complaints promptly and professionally. Use the customer communication tools to respond directly. For serious issues, contact our support team. Document all interactions and resolutions for future reference.',
      category: 'bookings',
      tags: ['complaints', 'customer-service', 'communication'],
      helpful: 39,
      notHelpful: 1
    },
    {
      id: 'bk-4',
      question: 'Can I set my own pricing for different ride types?',
      answer: 'Yes, you can set custom pricing for different ride categories (standard, premium, luxury, etc.) and adjust rates based on time, distance, and demand. Use the Pricing Management section to configure your rates.',
      category: 'bookings',
      tags: ['pricing', 'rates', 'customization'],
      helpful: 48,
      notHelpful: 2
    },

    // Payments
    {
      id: 'pm-1',
      question: 'How do I receive payments from bookings?',
      answer: 'Payments are processed automatically through our secure payment system. You\'ll receive payments weekly, minus our commission. You can track all transactions in the Payments section and download detailed reports.',
      category: 'payments',
      tags: ['payments', 'commission', 'transactions'],
      helpful: 82,
      notHelpful: 3
    },
    {
      id: 'pm-2',
      question: 'What is the commission structure?',
      answer: 'Our commission is typically 15-20% depending on your partnership level and volume. Premium partners may qualify for reduced rates. Commission is calculated on the total booking value and deducted before payment.',
      category: 'payments',
      tags: ['commission', 'rates', 'structure'],
      helpful: 65,
      notHelpful: 1
    },
    {
      id: 'pm-3',
      question: 'How do I set up payment methods?',
      answer: 'Go to Settings > Payment Methods to add your bank account or preferred payment method. You\'ll need to provide account details and complete verification. Payments will be sent to your registered account.',
      category: 'payments',
      tags: ['payment-methods', 'bank-account', 'verification'],
      helpful: 44,
      notHelpful: 0
    },
    {
      id: 'pm-4',
      question: 'When do I receive my payments?',
      answer: 'Payments are processed weekly, typically on Fridays. The payment includes all completed bookings from the previous week. You can view payment schedules and track payment status in the Payments dashboard.',
      category: 'payments',
      tags: ['schedule', 'timing', 'processing'],
      helpful: 37,
      notHelpful: 1
    },

    // Marketing
    {
      id: 'mk-1',
      question: 'How do I create promotional codes?',
      answer: 'Go to Marketing > Promo Codes to create custom promotional offers. Set discount amounts, usage limits, and validity periods. Promo codes can help attract new customers and increase bookings.',
      category: 'marketing',
      tags: ['promo-codes', 'discounts', 'marketing'],
      helpful: 31,
      notHelpful: 0
    },
    {
      id: 'mk-2',
      question: 'Can I run social media campaigns?',
      answer: 'Yes, you can create and manage social media campaigns through the Marketing section. Track performance, engage with customers, and promote your services across various platforms.',
      category: 'marketing',
      tags: ['social-media', 'campaigns', 'promotion'],
      helpful: 25,
      notHelpful: 1
    },
    {
      id: 'mk-3',
      question: 'How do referral programs work?',
      answer: 'Set up referral programs to encourage existing customers to bring new customers. You can offer incentives for successful referrals and track referral performance through the analytics dashboard.',
      category: 'marketing',
      tags: ['referrals', 'incentives', 'tracking'],
      helpful: 19,
      notHelpful: 0
    },

    // Technical
    {
      id: 'tc-1',
      question: 'How do I access the mobile app?',
      answer: 'Download the ComparePCO Partner app from your device\'s app store. Log in with your partner credentials to access all platform features on the go, including booking management and real-time updates.',
      category: 'technical',
      tags: ['mobile-app', 'access', 'download'],
      helpful: 58,
      notHelpful: 2
    },
    {
      id: 'tc-2',
      question: 'What if I experience technical issues?',
      answer: 'For technical issues, first check our troubleshooting guide. If the problem persists, contact our technical support team via email, phone, or live chat. Include screenshots and detailed descriptions for faster resolution.',
      category: 'technical',
      tags: ['troubleshooting', 'support', 'issues'],
      helpful: 42,
      notHelpful: 1
    },
    {
      id: 'tc-3',
      question: 'How do I update my account information?',
      answer: 'Go to Profile > Settings to update your personal information, company details, contact information, and preferences. Changes are typically applied immediately, but some updates may require verification.',
      category: 'technical',
      tags: ['profile', 'settings', 'updates'],
      helpful: 35,
      notHelpful: 0
    },

    // Security
    {
      id: 'sc-1',
      question: 'How is my data protected?',
      answer: 'We use industry-standard encryption and security measures to protect your data. All personal and financial information is encrypted, and we comply with GDPR and other relevant data protection regulations.',
      category: 'security',
      tags: ['data-protection', 'encryption', 'gdpr'],
      helpful: 47,
      notHelpful: 1
    },
    {
      id: 'sc-2',
      question: 'What security measures are in place?',
      answer: 'We implement multiple security layers including SSL encryption, two-factor authentication, regular security audits, and secure payment processing. Your account is protected against unauthorized access.',
      category: 'security',
      tags: ['security', 'authentication', 'protection'],
      helpful: 39,
      notHelpful: 0
    },

    // Analytics
    {
      id: 'an-1',
      question: 'How do I view my performance analytics?',
      answer: 'Access detailed analytics through the Analytics dashboard. View booking trends, revenue data, customer ratings, and performance metrics. Customize reports and export data for further analysis.',
      category: 'analytics',
      tags: ['analytics', 'performance', 'reports'],
      helpful: 51,
      notHelpful: 2
    },
    {
      id: 'an-2',
      question: 'What metrics should I track?',
      answer: 'Key metrics include: booking acceptance rate, customer ratings, revenue per vehicle, utilization rates, and customer satisfaction scores. Regular monitoring helps optimize your operations and improve performance.',
      category: 'analytics',
      tags: ['metrics', 'tracking', 'performance'],
      helpful: 33,
      notHelpful: 1
    }
  ];

  const filteredFAQs = faqData.filter(faq => {
    const matchesSearch = searchQuery === '' || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = !selectedCategory || faq.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const handleHelpfulVote = (id: string) => {
    if (!helpfulVotes.has(id)) {
      setHelpfulVotes(new Set([...Array.from(helpfulVotes), id]));
      setNotHelpfulVotes(new Set([...Array.from(notHelpfulVotes)].filter(vote => vote !== id)));
    }
  };

  const handleNotHelpfulVote = (id: string) => {
    if (!notHelpfulVotes.has(id)) {
      setNotHelpfulVotes(new Set([...Array.from(notHelpfulVotes), id]));
      setHelpfulVotes(new Set([...Array.from(helpfulVotes)].filter(vote => vote !== id)));
    }
  };

  const getCategoryIcon = (categoryId: string) => {
    const category = faqCategories.find(cat => cat.id === categoryId);
    return category?.icon || FaQuestionCircle;
  };

  const getCategoryColor = (categoryId: string) => {
    const category = faqCategories.find(cat => cat.id === categoryId);
    return category?.color || 'bg-gray-500';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-6 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg flex items-center justify-center">
                <FaQuestionCircle className="text-xl" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Frequently Asked Questions</h1>
                <p className="text-gray-600">
                  Find answers to common questions about the partner platform
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FaInfoCircle className="text-gray-400" />
              <span>Can't find what you're looking for? Contact support</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-2xl">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search for questions, topics, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Categories</h2>
            {selectedCategory && (
              <button
                onClick={() => setSelectedCategory(null)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Clear filter
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            {faqCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(selectedCategory === category.id ? null : category.id)}
                className={`p-3 rounded-lg border transition-colors ${
                  selectedCategory === category.id
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className={`w-8 h-8 ${category.color} text-white rounded-lg flex items-center justify-center`}>
                    <category.icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-medium text-center">{category.title}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* FAQ Results */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {filteredFAQs.length} {filteredFAQs.length === 1 ? 'Question' : 'Questions'} Found
            </h2>
            {searchQuery && (
              <span className="text-sm text-gray-600">
                Showing results for "{searchQuery}"
              </span>
            )}
          </div>

          <div className="space-y-4">
            {filteredFAQs.map((faq) => {
              const isExpanded = expandedItems.has(faq.id);
              const IconComponent = getCategoryIcon(faq.category);
              const categoryColor = getCategoryColor(faq.category);
              
              return (
                <div key={faq.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <button
                    onClick={() => toggleExpanded(faq.id)}
                    className="w-full p-6 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`w-8 h-8 ${categoryColor} text-white rounded-lg flex items-center justify-center flex-shrink-0`}>
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 mb-2">{faq.question}</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>{faq.helpful} found helpful</span>
                            <span>•</span>
                            <span>{faq.tags.join(', ')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        {isExpanded ? (
                          <FaChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <FaChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </button>
                  
                  {isExpanded && (
                    <div className="px-6 pb-6">
                      <div className="border-t border-gray-200 pt-4">
                        <p className="text-gray-700 mb-4 leading-relaxed">{faq.answer}</p>
                        
                        {/* Feedback */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-600">Was this helpful?</span>
                            <button
                              onClick={() => handleHelpfulVote(faq.id)}
                              className={`flex items-center gap-1 text-sm px-3 py-1 rounded-full transition-colors ${
                                helpfulVotes.has(faq.id)
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-700'
                              }`}
                            >
                              <FaCheckCircle className="w-3 h-3" />
                              Yes
                            </button>
                            <button
                              onClick={() => handleNotHelpfulVote(faq.id)}
                              className={`flex items-center gap-1 text-sm px-3 py-1 rounded-full transition-colors ${
                                notHelpfulVotes.has(faq.id)
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-700'
                              }`}
                            >
                              <FaTimes className="w-3 h-3" />
                              No
                            </button>
                          </div>
                          <button
                            onClick={() => router.push('/partner/support/contact')}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Contact Support
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {filteredFAQs.length === 0 && (
            <div className="text-center py-12">
              <FaQuestionCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No questions found</h3>
              <p className="text-gray-600 mb-6">
                Try adjusting your search terms or browse all categories
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory(null);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Browse All Questions
              </button>
            </div>
          )}
        </div>

        {/* Contact Support */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Still need help?</h3>
            <p className="text-gray-600 mb-4">
              Can't find the answer you're looking for? Our support team is here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => router.push('/partner/support/contact')}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Contact Support
              </button>
              <button
                onClick={() => window.open('https://chat.comparepco.com', '_blank')}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Live Chat
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 