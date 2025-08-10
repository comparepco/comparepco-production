'use client';
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
  FaHeadset, FaQuestionCircle, FaEnvelope, FaPhone, FaComments, FaBook,
  FaVideo, FaFileAlt, FaDownload, FaSearch, FaTicketAlt, FaClock,
  FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaArrowRight,
  FaWhatsapp, FaTwitter, FaFacebook, FaLinkedin, FaYoutube, FaGithub,
  FaCog, FaUser, FaCar, FaCreditCard, FaShieldAlt, FaChartLine,
  FaFileContract, FaCalendarAlt, FaMapMarkerAlt, FaGlobe
} from 'react-icons/fa';

interface SupportCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  items: SupportItem[];
}

interface SupportItem {
  title: string;
  description: string;
  link?: string;
  action?: () => void;
}

export default function PartnerSupportPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const supportCategories: SupportCategory[] = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      description: 'Learn the basics of using the partner platform',
      icon: FaUser,
      color: 'bg-blue-500',
      items: [
        {
          title: 'Complete Setup Guide',
          description: 'Step-by-step guide to set up your partner account',
          link: '/partner/support/guides/setup'
        },
        {
          title: 'Adding Your First Vehicle',
          description: 'How to add and configure your first vehicle',
          link: '/partner/support/guides/add-vehicle'
        },
        {
          title: 'Understanding the Dashboard',
          description: 'Learn about all dashboard features and metrics',
          link: '/partner/support/guides/dashboard'
        },
        {
          title: 'Setting Up Payments',
          description: 'Configure your payment methods and preferences',
          link: '/partner/support/guides/payments'
        }
      ]
    },
    {
      id: 'fleet-management',
      title: 'Fleet Management',
      description: 'Manage your vehicles and drivers effectively',
      icon: FaCar,
      color: 'bg-green-500',
      items: [
        {
          title: 'Adding New Vehicles',
          description: 'Add vehicles to your fleet with proper documentation',
          link: '/partner/support/guides/add-vehicle'
        },
        {
          title: 'Vehicle Maintenance Tracking',
          description: 'Track and schedule vehicle maintenance',
          link: '/partner/support/guides/maintenance'
        },
        {
          title: 'Driver Management',
          description: 'Add and manage drivers in your fleet',
          link: '/partner/support/guides/drivers'
        },
        {
          title: 'Fleet Analytics',
          description: 'Understand your fleet performance metrics',
          link: '/partner/support/guides/analytics'
        }
      ]
    },
    {
      id: 'bookings',
      title: 'Bookings & Operations',
      description: 'Handle bookings and day-to-day operations',
      icon: FaCalendarAlt,
      color: 'bg-purple-500',
      items: [
        {
          title: 'Managing Bookings',
          description: 'Accept, reject, and manage incoming bookings',
          link: '/partner/support/guides/bookings'
        },
        {
          title: 'Booking Notifications',
          description: 'Set up and manage booking notifications',
          link: '/partner/support/guides/notifications'
        },
        {
          title: 'Customer Communication',
          description: 'Communicate with customers effectively',
          link: '/partner/support/guides/communication'
        },
        {
          title: 'Dispute Resolution',
          description: 'Handle booking disputes and issues',
          link: '/partner/support/guides/disputes'
        }
      ]
    },
    {
      id: 'payments',
      title: 'Payments & Finance',
      description: 'Manage payments, invoices, and financial matters',
      icon: FaCreditCard,
      color: 'bg-yellow-500',
      items: [
        {
          title: 'Payment Methods',
          description: 'Set up and manage payment methods',
          link: '/partner/support/guides/payment-methods'
        },
        {
          title: 'Invoice Management',
          description: 'Generate and manage invoices',
          link: '/partner/support/guides/invoices'
        },
        {
          title: 'Commission Structure',
          description: 'Understand your commission rates and structure',
          link: '/partner/support/guides/commission'
        },
        {
          title: 'Financial Reports',
          description: 'Access and understand financial reports',
          link: '/partner/support/guides/reports'
        }
      ]
    },
    {
      id: 'marketing',
      title: 'Marketing & Promotions',
      description: 'Promote your services and attract customers',
      icon: FaGlobe,
      color: 'bg-pink-500',
      items: [
        {
          title: 'Creating Promo Codes',
          description: 'Create and manage promotional codes',
          link: '/partner/support/guides/promo-codes'
        },
        {
          title: 'Social Media Campaigns',
          description: 'Set up and manage social media campaigns',
          link: '/partner/support/guides/social-campaigns'
        },
        {
          title: 'Referral Programs',
          description: 'Implement customer referral programs',
          link: '/partner/support/guides/referrals'
        },
        {
          title: 'Marketing Analytics',
          description: 'Track marketing campaign performance',
          link: '/partner/support/guides/marketing-analytics'
        }
      ]
    },
    {
      id: 'technical',
      title: 'Technical Support',
      description: 'Technical issues and platform features',
      icon: FaCog,
      color: 'bg-gray-500',
      items: [
        {
          title: 'Platform Features',
          description: 'Learn about all platform features',
          link: '/partner/support/guides/features'
        },
        {
          title: 'API Documentation',
          description: 'Access API documentation for developers',
          link: '/partner/support/guides/api'
        },
        {
          title: 'Mobile App Guide',
          description: 'Using the mobile app effectively',
          link: '/partner/support/guides/mobile'
        },
        {
          title: 'Troubleshooting',
          description: 'Common issues and solutions',
          link: '/partner/support/guides/troubleshooting'
        }
      ]
    }
  ];

  const quickActions = [
    {
      title: 'Contact Support',
      description: 'Get help from our support team',
      icon: FaHeadset,
      color: 'bg-blue-500',
      action: () => router.push('/partner/support/contact')
    },
    {
      title: 'Live Chat',
      description: 'Chat with support in real-time',
      icon: FaComments,
      color: 'bg-green-500',
      action: () => router.push('/partner/support/chat')
    },
    {
      title: 'Video Tutorials',
      description: 'Watch step-by-step tutorials',
      icon: FaVideo,
      color: 'bg-purple-500',
      action: () => router.push('/partner/support/videos')
    },
    {
      title: 'Download Resources',
      description: 'Download guides and documentation',
      icon: FaDownload,
      color: 'bg-orange-500',
      action: () => router.push('/partner/support/resources')
    }
  ];

  const contactMethods = [
    {
      title: 'Email Support',
      description: 'support@comparepco.com',
      icon: FaEnvelope,
      color: 'text-blue-600',
      action: () => window.open('mailto:support@comparepco.com', '_blank')
    },
    {
      title: 'Phone Support',
      description: '+44 20 1234 5678',
      icon: FaPhone,
      color: 'text-green-600',
      action: () => window.open('tel:+442012345678', '_blank')
    },
    {
      title: 'WhatsApp',
      description: 'Message us on WhatsApp',
      icon: FaWhatsapp,
      color: 'text-green-500',
      action: () => window.open('https://wa.me/442012345678', '_blank')
    },
    {
      title: 'Emergency Line',
      description: '24/7 emergency support',
      icon: FaExclamationTriangle,
      color: 'text-red-600',
      action: () => window.open('tel:+442012345679', '_blank')
    }
  ];

  const filteredCategories = supportCategories.filter(category =>
    category.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.items.some(item => 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const selectedCategoryData = selectedCategory 
    ? supportCategories.find(cat => cat.id === selectedCategory)
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-6 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg flex items-center justify-center">
                <FaHeadset className="text-xl" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Partner Support</h1>
                <p className="text-gray-600">
                  Get help with your partner account and platform features
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FaInfoCircle className="text-gray-400" />
              <span>Need urgent help? Contact us 24/7</span>
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
              placeholder="Search for help topics, guides, or features..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-left"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${action.color} text-white rounded-lg flex items-center justify-center`}>
                    <action.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{action.title}</h3>
                    <p className="text-sm text-gray-600">{action.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Contact Methods */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Support</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {contactMethods.map((method, index) => (
              <button
                key={index}
                onClick={method.action}
                className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-left"
              >
                <div className="flex items-center gap-3">
                  <method.icon className={`w-5 h-5 ${method.color}`} />
                  <div>
                    <h3 className="font-medium text-gray-900">{method.title}</h3>
                    <p className="text-sm text-gray-600">{method.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Help Categories */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Help Categories</h2>
            {selectedCategory && (
              <button
                onClick={() => setSelectedCategory(null)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                ← Back to all categories
              </button>
            )}
          </div>

          {!selectedCategory ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-left"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 ${category.color} text-white rounded-lg flex items-center justify-center`}>
                      <category.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{category.title}</h3>
                      <p className="text-sm text-gray-600">{category.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">{category.items.length} topics</span>
                    <FaArrowRight className="w-4 h-4 text-gray-400" />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-12 h-12 ${selectedCategoryData?.color || 'bg-gray-500'} text-white rounded-lg flex items-center justify-center`}>
                  {selectedCategoryData?.icon && <selectedCategoryData.icon className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{selectedCategoryData?.title}</h3>
                  <p className="text-gray-600">{selectedCategoryData?.description}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedCategoryData?.items.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => item.link && router.push(item.link)}
                    className="text-left p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <h4 className="font-medium text-gray-900 mb-1">{item.title}</h4>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Support Status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <FaCheckCircle className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Support Status</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Email Support: Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Live Chat: Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Phone Support: Available</span>
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Follow Us</h3>
          <div className="flex gap-4">
            <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors">
              <FaTwitter className="w-6 h-6" />
            </a>
            <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors">
              <FaFacebook className="w-6 h-6" />
            </a>
            <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors">
              <FaLinkedin className="w-6 h-6" />
            </a>
            <a href="#" className="text-gray-400 hover:text-red-600 transition-colors">
              <FaYoutube className="w-6 h-6" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
} 