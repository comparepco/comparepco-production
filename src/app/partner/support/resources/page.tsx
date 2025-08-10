'use client';
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
  FaDownload, FaFilePdf, FaFileWord, FaFileExcel, FaFilePowerpoint,
  FaArrowLeft, FaSearch, FaBook, FaUser, FaCar, FaCreditCard,
  FaCalendarAlt, FaGlobe, FaCog, FaShieldAlt, FaChartLine,
  FaCheckCircle, FaClock, FaFileAlt
} from 'react-icons/fa';

interface Resource {
  id: string;
  title: string;
  description: string;
  category: string;
  fileType: 'pdf' | 'docx' | 'xlsx' | 'pptx';
  fileSize: string;
  downloadUrl: string;
  tags: string[];
  updatedAt: string;
}

export default function PartnerResourcesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedFileType, setSelectedFileType] = useState<string | null>(null);

  const categories = [
    { id: 'getting-started', name: 'Getting Started', icon: FaUser, color: 'bg-blue-500' },
    { id: 'fleet-management', name: 'Fleet Management', icon: FaCar, color: 'bg-green-500' },
    { id: 'bookings', name: 'Bookings & Operations', icon: FaCalendarAlt, color: 'bg-purple-500' },
    { id: 'payments', name: 'Payments & Finance', icon: FaCreditCard, color: 'bg-yellow-500' },
    { id: 'marketing', name: 'Marketing & Promotions', icon: FaGlobe, color: 'bg-pink-500' },
    { id: 'technical', name: 'Technical Support', icon: FaCog, color: 'bg-gray-500' },
    { id: 'security', name: 'Security & Compliance', icon: FaShieldAlt, color: 'bg-red-500' },
    { id: 'analytics', name: 'Analytics & Reports', icon: FaChartLine, color: 'bg-indigo-500' }
  ];

  const fileTypes = [
    { id: 'pdf', name: 'PDF', icon: FaFilePdf, color: 'text-red-600' },
    { id: 'docx', name: 'Word', icon: FaFileWord, color: 'text-blue-600' },
    { id: 'xlsx', name: 'Excel', icon: FaFileExcel, color: 'text-green-600' },
    { id: 'pptx', name: 'PowerPoint', icon: FaFilePowerpoint, color: 'text-orange-600' }
  ];

  const resources: Resource[] = [
    {
      id: '1',
      title: 'Partner Platform User Guide',
      description: 'Complete guide to using the ComparePCO partner platform, including all features and best practices.',
      category: 'getting-started',
      fileType: 'pdf',
      fileSize: '2.4 MB',
      downloadUrl: '/resources/partner-platform-guide.pdf',
      tags: ['guide', 'platform', 'user-manual'],
      updatedAt: '2024-01-15'
    },
    {
      id: '2',
      title: 'Vehicle Registration Checklist',
      description: 'Comprehensive checklist for registering vehicles on the platform with all required documentation.',
      category: 'fleet-management',
      fileType: 'xlsx',
      fileSize: '156 KB',
      downloadUrl: '/resources/vehicle-registration-checklist.xlsx',
      tags: ['vehicle', 'registration', 'checklist'],
      updatedAt: '2024-01-10'
    },
    {
      id: '3',
      title: 'Booking Management Handbook',
      description: 'Detailed handbook for managing bookings, customer communication, and dispute resolution.',
      category: 'bookings',
      fileType: 'pdf',
      fileSize: '1.8 MB',
      downloadUrl: '/resources/booking-management-handbook.pdf',
      tags: ['bookings', 'management', 'customer-service'],
      updatedAt: '2024-01-12'
    },
    {
      id: '4',
      title: 'Payment Processing Guide',
      description: 'Guide to payment methods, commission structure, and financial reporting.',
      category: 'payments',
      fileType: 'pdf',
      fileSize: '1.2 MB',
      downloadUrl: '/resources/payment-processing-guide.pdf',
      tags: ['payments', 'commission', 'finance'],
      updatedAt: '2024-01-08'
    },
    {
      id: '5',
      title: 'Marketing Campaign Templates',
      description: 'Ready-to-use templates for creating marketing campaigns, promo codes, and referral programs.',
      category: 'marketing',
      fileType: 'docx',
      fileSize: '890 KB',
      downloadUrl: '/resources/marketing-campaign-templates.docx',
      tags: ['marketing', 'templates', 'campaigns'],
      updatedAt: '2024-01-05'
    },
    {
      id: '6',
      title: 'API Documentation',
      description: 'Complete API documentation for developers integrating with the ComparePCO platform.',
      category: 'technical',
      fileType: 'pdf',
      fileSize: '3.1 MB',
      downloadUrl: '/resources/api-documentation.pdf',
      tags: ['api', 'documentation', 'technical'],
      updatedAt: '2024-01-20'
    },
    {
      id: '7',
      title: 'Security Best Practices',
      description: 'Security guidelines and best practices for protecting your account and customer data.',
      category: 'security',
      fileType: 'pdf',
      fileSize: '956 KB',
      downloadUrl: '/resources/security-best-practices.pdf',
      tags: ['security', 'best-practices', 'compliance'],
      updatedAt: '2024-01-18'
    },
    {
      id: '8',
      title: 'Analytics Dashboard Guide',
      description: 'Guide to understanding analytics, performance metrics, and generating reports.',
      category: 'analytics',
      fileType: 'pptx',
      fileSize: '2.1 MB',
      downloadUrl: '/resources/analytics-dashboard-guide.pptx',
      tags: ['analytics', 'dashboard', 'reports'],
      updatedAt: '2024-01-14'
    },
    {
      id: '9',
      title: 'Mobile App User Guide',
      description: 'Complete guide to using the ComparePCO mobile app for partners.',
      category: 'technical',
      fileType: 'pdf',
      fileSize: '1.5 MB',
      downloadUrl: '/resources/mobile-app-guide.pdf',
      tags: ['mobile', 'app', 'guide'],
      updatedAt: '2024-01-16'
    },
    {
      id: '10',
      title: 'Troubleshooting Manual',
      description: 'Common issues and their solutions for the partner platform.',
      category: 'technical',
      fileType: 'pdf',
      fileSize: '1.3 MB',
      downloadUrl: '/resources/troubleshooting-manual.pdf',
      tags: ['troubleshooting', 'issues', 'solutions'],
      updatedAt: '2024-01-11'
    }
  ];

  const filteredResources = resources.filter(resource => {
    const matchesSearch = searchQuery === '' || 
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = !selectedCategory || resource.category === selectedCategory;
    const matchesFileType = !selectedFileType || resource.fileType === selectedFileType;
    
    return matchesSearch && matchesCategory && matchesFileType;
  });

  const getCategoryIcon = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.icon || FaFileAlt;
  };

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.color || 'bg-gray-500';
  };

  const getFileTypeIcon = (fileType: string) => {
    const type = fileTypes.find(t => t.id === fileType);
    return type?.icon || FaFileAlt;
  };

  const getFileTypeColor = (fileType: string) => {
    const type = fileTypes.find(t => t.id === fileType);
    return type?.color || 'text-gray-600';
  };

  const handleDownload = (resource: Resource) => {
    // Simulate download
    const link = document.createElement('a');
    link.href = resource.downloadUrl;
    link.download = resource.title;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/partner/support')}
                className="text-gray-600 hover:text-gray-900"
              >
                <FaArrowLeft className="w-5 h-5" />
              </button>
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg flex items-center justify-center">
                <FaDownload className="text-xl" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Resources & Downloads</h1>
                <p className="text-gray-600">Download guides, templates, and documentation</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={selectedCategory || ''}
                onChange={(e) => setSelectedCategory(e.target.value || null)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <select
                value={selectedFileType || ''}
                onChange={(e) => setSelectedFileType(e.target.value || null)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="">All Types</option>
                {fileTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Resources Grid */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {filteredResources.length} {filteredResources.length === 1 ? 'Resource' : 'Resources'} Found
            </h2>
            {(searchQuery || selectedCategory || selectedFileType) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory(null);
                  setSelectedFileType(null);
                }}
                className="text-orange-600 hover:text-orange-800 text-sm font-medium"
              >
                Clear filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.map((resource) => {
              const CategoryIcon = getCategoryIcon(resource.category);
              const categoryColor = getCategoryColor(resource.category);
              const FileTypeIcon = getFileTypeIcon(resource.fileType);
              const fileTypeColor = getFileTypeColor(resource.fileType);
              
              return (
                <div key={resource.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 ${categoryColor} text-white rounded-lg flex items-center justify-center`}>
                          <CategoryIcon className="w-4 h-4" />
                        </div>
                        <FileTypeIcon className={`w-5 h-5 ${fileTypeColor}`} />
                      </div>
                      <span className="text-xs text-gray-500">{resource.fileSize}</span>
                    </div>
                    
                    <h3 className="font-semibold text-gray-900 mb-2">{resource.title}</h3>
                    <p className="text-sm text-gray-600 mb-4">{resource.description}</p>
                    
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex flex-wrap gap-1">
                        {resource.tags.slice(0, 2).map((tag, index) => (
                          <span key={index} className="px-2 py-1 bg-gray-100 text-xs text-gray-600 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <span className="text-xs text-gray-500">
                        Updated {new Date(resource.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <button
                      onClick={() => handleDownload(resource)}
                      className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <FaDownload className="w-4 h-4" />
                      Download
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredResources.length === 0 && (
            <div className="text-center py-12">
              <FaDownload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No resources found</h3>
              <p className="text-gray-600 mb-6">
                Try adjusting your search terms or filters
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory(null);
                  setSelectedFileType(null);
                }}
                className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
              >
                Browse All Resources
              </button>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Need more help?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => router.push('/partner/support/contact')}
              className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <FaBook className="w-5 h-5 text-blue-600" />
              <div className="text-left">
                <h4 className="font-medium text-gray-900">Contact Support</h4>
                <p className="text-sm text-gray-600">Get personalized help</p>
              </div>
            </button>
            <button
              onClick={() => router.push('/partner/support/videos')}
              className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <FaBook className="w-5 h-5 text-purple-600" />
              <div className="text-left">
                <h4 className="font-medium text-gray-900">Video Tutorials</h4>
                <p className="text-sm text-gray-600">Watch step-by-step guides</p>
              </div>
            </button>
            <button
              onClick={() => router.push('/partner/support/faq')}
              className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <FaBook className="w-5 h-5 text-green-600" />
              <div className="text-left">
                <h4 className="font-medium text-gray-900">FAQ</h4>
                <p className="text-sm text-gray-600">Find quick answers</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 