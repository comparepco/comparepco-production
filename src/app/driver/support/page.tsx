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
  FaFileContract, FaCalendarAlt, FaMapMarkerAlt, FaGlobe, FaTools,
  FaExclamationCircle, FaHandshake, FaMobile, FaLaptop, FaKey,
  FaLock, FaUnlock, FaRoute, FaGasPump, FaWrench, FaCarCrash,
  FaMoneyBillWave, FaReceipt, FaHistory, FaStar, FaThumbsUp,
  FaThumbsDown, FaClipboardList, FaClipboardCheck, FaUserCheck,
  FaBuilding, FaUsers, FaFileInvoiceDollar,
  FaCarSide, FaParking, FaOilCan, FaTachometerAlt
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

export default function DriverSupportPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const supportCategories: SupportCategory[] = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      description: 'Learn the basics of renting PCO vehicles',
      icon: FaUser,
      color: 'bg-blue-500',
      items: [
        {
          title: 'Complete Driver Setup',
          description: 'Step-by-step guide to set up your driver account',
          link: '/driver/support/guides/setup'
        },
        {
          title: 'Profile Verification',
          description: 'How to complete your profile verification process',
          link: '/driver/support/guides/verification'
        },
        {
          title: 'Understanding the Platform',
          description: 'Learn about ComparePCO rental features',
          link: '/driver/support/guides/platform'
        },
        {
          title: 'Setting Up Payments',
          description: 'Configure your payment methods for rentals',
          link: '/driver/support/guides/payments'
        }
      ]
    },
    {
      id: 'vehicle-rentals',
      title: 'Vehicle Rentals',
      description: 'Find and rent PCO vehicles from partners',
      icon: FaCar,
      color: 'bg-green-500',
      items: [
        {
          title: 'Finding Available Vehicles',
          description: 'How to search and find available PCO vehicles',
          link: '/driver/support/guides/find-vehicles'
        },
        {
          title: 'Booking a Vehicle',
          description: 'How to book and reserve a PCO vehicle',
          link: '/driver/support/guides/book-vehicle'
        },
        {
          title: 'Rental Agreements',
          description: 'Understanding rental terms and conditions',
          link: '/driver/support/guides/rental-agreements'
        },
        {
          title: 'Vehicle Collection',
          description: 'Collecting your rented vehicle from partner',
          link: '/driver/support/guides/vehicle-collection'
        }
      ]
    },
    {
      id: 'partners',
      title: 'Working with Partners',
      description: 'Interacting with vehicle rental partners',
      icon: FaBuilding,
      color: 'bg-purple-500',
      items: [
        {
          title: 'Partner Verification',
          description: 'Understanding verified partner requirements',
          link: '/driver/support/guides/partner-verification'
        },
        {
          title: 'Communication with Partners',
          description: 'How to communicate with vehicle partners',
          link: '/driver/support/guides/partner-communication'
        },
        {
          title: 'Partner Disputes',
          description: 'Resolving issues with vehicle partners',
          link: '/driver/support/guides/partner-disputes'
        },
        {
          title: 'Partner Reviews',
          description: 'Reviewing your rental experience',
          link: '/driver/support/guides/partner-reviews'
        }
      ]
    },
    {
      id: 'vehicle-management',
      title: 'Vehicle Management',
      description: 'Managing your rented vehicle',
      icon: FaCarSide,
      color: 'bg-yellow-500',
      items: [
        {
          title: 'Vehicle Inspection',
          description: 'Inspecting vehicle before and after rental',
          link: '/driver/support/guides/vehicle-inspection'
        },
        {
          title: 'Vehicle Maintenance',
          description: 'Reporting maintenance issues during rental',
          link: '/driver/support/guides/maintenance-issues'
        },
        {
          title: 'Fuel & Mileage',
          description: 'Managing fuel and mileage during rental',
          link: '/driver/support/guides/fuel-mileage'
        },
        {
          title: 'Vehicle Return',
          description: 'Properly returning your rented vehicle',
          link: '/driver/support/guides/vehicle-return'
        }
      ]
    },
    {
      id: 'payments',
      title: 'Payments & Billing',
      description: 'Payment issues and rental billing',
      icon: FaCreditCard,
      color: 'bg-orange-500',
      items: [
        {
          title: 'Rental Payments',
          description: 'Understanding rental payment structure',
          link: '/driver/support/guides/rental-payments'
        },
        {
          title: 'Payment Methods',
          description: 'Set up and manage payment methods',
          link: '/driver/support/guides/payment-methods'
        },
        {
          title: 'Billing Issues',
          description: 'Resolve billing problems and disputes',
          link: '/driver/support/guides/billing-issues'
        },
        {
          title: 'Refunds & Cancellations',
          description: 'Understanding refund and cancellation policies',
          link: '/driver/support/guides/refunds-cancellations'
        }
      ]
    },
    {
      id: 'compliance',
      title: 'Compliance & Legal',
      description: 'Legal requirements for PCO vehicle rental',
      icon: FaFileContract,
      color: 'bg-red-500',
      items: [
        {
          title: 'PCO License Requirements',
          description: 'Understanding PCO licensing requirements',
          link: '/driver/support/guides/pco-licensing'
        },
        {
          title: 'Insurance Requirements',
          description: 'Insurance requirements for rented vehicles',
          link: '/driver/support/guides/insurance-requirements'
        },
        {
          title: 'Background Checks',
          description: 'Complete background check requirements',
          link: '/driver/support/guides/background-checks'
        },
        {
          title: 'Legal Compliance',
          description: 'Stay compliant with rental regulations',
          link: '/driver/support/guides/legal-compliance'
        }
      ]
    },
    {
      id: 'safety',
      title: 'Safety & Security',
      description: 'Safety protocols and security concerns',
      icon: FaShieldAlt,
      color: 'bg-indigo-500',
      items: [
        {
          title: 'Vehicle Safety',
          description: 'Safety protocols for rented vehicles',
          link: '/driver/support/guides/vehicle-safety'
        },
        {
          title: 'Emergency Procedures',
          description: 'What to do in emergency situations',
          link: '/driver/support/guides/emergency'
        },
        {
          title: 'Account Security',
          description: 'Protect your account and personal information',
          link: '/driver/support/guides/security'
        },
        {
          title: 'Incident Reporting',
          description: 'Report accidents and incidents properly',
          link: '/driver/support/guides/incidents'
        }
      ]
    },
    {
      id: 'technical',
      title: 'Technical Support',
      description: 'Platform and app technical issues',
      icon: FaCog,
      color: 'bg-gray-500',
      items: [
        {
          title: 'Platform Features',
          description: 'Learn about ComparePCO platform features',
          link: '/driver/support/guides/platform-features'
        },
        {
          title: 'App Troubleshooting',
          description: 'Fix common app issues and bugs',
          link: '/driver/support/guides/app-troubleshooting'
        },
        {
          title: 'Account Access',
          description: 'Reset passwords and recover accounts',
          link: '/driver/support/guides/account-access'
        },
        {
          title: 'Device Compatibility',
          description: 'Check device compatibility and requirements',
          link: '/driver/support/guides/device-compatibility'
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
      action: () => router.push('/driver/support/contact')
    },
    {
      title: 'Live Chat',
      description: 'Chat with support in real-time',
      icon: FaComments,
      color: 'bg-green-500',
      action: () => window.open('https://chat.comparepco.com', '_blank')
    },
    {
      title: 'Report an Issue',
      description: 'Report a rental problem or incident',
      icon: FaExclamationCircle,
      color: 'bg-red-500',
      action: () => router.push('/driver/support/report-issue')
    },
    {
      title: 'Video Tutorials',
      description: 'Watch step-by-step tutorials',
      icon: FaVideo,
      color: 'bg-purple-500',
      action: () => router.push('/driver/support/videos')
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

  const commonIssues = [
    {
      title: 'Can\'t Find Vehicles',
      description: 'Troubleshoot vehicle search issues',
      icon: FaCar,
      color: 'bg-red-100 text-red-800',
      action: () => router.push('/driver/support/guides/find-vehicles')
    },
    {
      title: 'Payment Not Processed',
      description: 'Resolve payment processing issues',
      icon: FaMoneyBillWave,
      color: 'bg-yellow-100 text-yellow-800',
      action: () => router.push('/driver/support/guides/billing-issues')
    },
    {
      title: 'Vehicle Collection Issues',
      description: 'Problems collecting rented vehicle',
      icon: FaCarSide,
      color: 'bg-blue-100 text-blue-800',
      action: () => router.push('/driver/support/guides/vehicle-collection')
    },
    {
      title: 'Partner Communication',
      description: 'Issues communicating with partners',
      icon: FaBuilding,
      color: 'bg-purple-100 text-purple-800',
      action: () => router.push('/driver/support/guides/partner-communication')
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
                <h1 className="text-2xl font-bold text-gray-900">Driver Support</h1>
                <p className="text-gray-600">
                  Get help with renting PCO vehicles from verified partners
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
              placeholder="Search for rental help, guides, or features..."
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

        {/* Common Issues */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Common Issues</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {commonIssues.map((issue, index) => (
              <button
                key={index}
                onClick={issue.action}
                className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-left"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${issue.color} rounded-lg flex items-center justify-center`}>
                    <issue.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{issue.title}</h3>
                    <p className="text-sm text-gray-600">{issue.description}</p>
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

        {/* Driver Resources */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Driver Resources</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <FaDownload className="w-5 h-5 text-blue-600" />
              <div className="text-left">
                <h4 className="font-medium text-gray-900">Rental Guide</h4>
                <p className="text-sm text-gray-600">Download PDF guide</p>
              </div>
            </button>
            <button className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <FaVideo className="w-5 h-5 text-purple-600" />
              <div className="text-left">
                <h4 className="font-medium text-gray-900">Training Videos</h4>
                <p className="text-sm text-gray-600">Watch tutorials</p>
              </div>
            </button>
            <button className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <FaFileAlt className="w-5 h-5 text-green-600" />
              <div className="text-left">
                <h4 className="font-medium text-gray-900">Rental Policies</h4>
                <p className="text-sm text-gray-600">Terms and conditions</p>
              </div>
            </button>
            <button className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <FaReceipt className="w-5 h-5 text-orange-600" />
              <div className="text-left">
                <h4 className="font-medium text-gray-900">Billing Guide</h4>
                <p className="text-sm text-gray-600">Payment information</p>
              </div>
            </button>
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