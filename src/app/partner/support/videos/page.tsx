'use client';
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
  FaVideo, FaPlay, FaClock, FaUser, FaCar, FaCreditCard,
  FaCalendarAlt, FaGlobe, FaCog, FaArrowLeft, FaSearch,
  FaBook, FaDownload, FaShare
} from 'react-icons/fa';

interface VideoTutorial {
  id: string;
  title: string;
  description: string;
  duration: string;
  category: string;
  thumbnail: string;
  videoUrl: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
}

export default function PartnerVideoTutorialsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);

  const categories = [
    { id: 'getting-started', name: 'Getting Started', icon: FaUser, color: 'bg-blue-500' },
    { id: 'fleet-management', name: 'Fleet Management', icon: FaCar, color: 'bg-green-500' },
    { id: 'bookings', name: 'Bookings & Operations', icon: FaCalendarAlt, color: 'bg-purple-500' },
    { id: 'payments', name: 'Payments & Finance', icon: FaCreditCard, color: 'bg-yellow-500' },
    { id: 'marketing', name: 'Marketing & Promotions', icon: FaGlobe, color: 'bg-pink-500' },
    { id: 'technical', name: 'Technical Support', icon: FaCog, color: 'bg-gray-500' }
  ];

  const difficulties = [
    { id: 'beginner', name: 'Beginner', color: 'text-green-600' },
    { id: 'intermediate', name: 'Intermediate', color: 'text-yellow-600' },
    { id: 'advanced', name: 'Advanced', color: 'text-red-600' }
  ];

  const videoTutorials: VideoTutorial[] = [
    {
      id: '1',
      title: 'Complete Platform Setup Guide',
      description: 'Step-by-step guide to set up your partner account, add vehicles, and configure settings.',
      duration: '15:30',
      category: 'getting-started',
      thumbnail: '/images/tutorials/setup.jpg',
      videoUrl: 'https://www.youtube.com/watch?v=example1',
      difficulty: 'beginner',
      tags: ['setup', 'account', 'configuration']
    },
    {
      id: '2',
      title: 'Adding Your First Vehicle',
      description: 'Learn how to add vehicles to your fleet with proper documentation and pricing.',
      duration: '12:45',
      category: 'fleet-management',
      thumbnail: '/images/tutorials/add-vehicle.jpg',
      videoUrl: 'https://www.youtube.com/watch?v=example2',
      difficulty: 'beginner',
      tags: ['vehicle', 'fleet', 'documentation']
    },
    {
      id: '3',
      title: 'Managing Bookings Effectively',
      description: 'Master the booking management system, accept/reject requests, and handle customer communication.',
      duration: '18:20',
      category: 'bookings',
      thumbnail: '/images/tutorials/bookings.jpg',
      videoUrl: 'https://www.youtube.com/watch?v=example3',
      difficulty: 'intermediate',
      tags: ['bookings', 'management', 'communication']
    },
    {
      id: '4',
      title: 'Setting Up Payment Methods',
      description: 'Configure your payment methods, understand commission structure, and manage finances.',
      duration: '14:15',
      category: 'payments',
      thumbnail: '/images/tutorials/payments.jpg',
      videoUrl: 'https://www.youtube.com/watch?v=example4',
      difficulty: 'intermediate',
      tags: ['payments', 'commission', 'finance']
    },
    {
      id: '5',
      title: 'Creating Marketing Campaigns',
      description: 'Learn to create promo codes, social media campaigns, and referral programs.',
      duration: '20:10',
      category: 'marketing',
      thumbnail: '/images/tutorials/marketing.jpg',
      videoUrl: 'https://www.youtube.com/watch?v=example5',
      difficulty: 'advanced',
      tags: ['marketing', 'promo-codes', 'campaigns']
    },
    {
      id: '6',
      title: 'Advanced Analytics & Reporting',
      description: 'Deep dive into analytics, performance metrics, and generating detailed reports.',
      duration: '25:30',
      category: 'technical',
      thumbnail: '/images/tutorials/analytics.jpg',
      videoUrl: 'https://www.youtube.com/watch?v=example6',
      difficulty: 'advanced',
      tags: ['analytics', 'reports', 'metrics']
    },
    {
      id: '7',
      title: 'Mobile App Guide',
      description: 'Complete guide to using the ComparePCO mobile app for partners.',
      duration: '10:45',
      category: 'technical',
      thumbnail: '/images/tutorials/mobile.jpg',
      videoUrl: 'https://www.youtube.com/watch?v=example7',
      difficulty: 'beginner',
      tags: ['mobile', 'app', 'guide']
    },
    {
      id: '8',
      title: 'Troubleshooting Common Issues',
      description: 'Learn how to resolve common platform issues and when to contact support.',
      duration: '16:20',
      category: 'technical',
      thumbnail: '/images/tutorials/troubleshooting.jpg',
      videoUrl: 'https://www.youtube.com/watch?v=example8',
      difficulty: 'intermediate',
      tags: ['troubleshooting', 'issues', 'support']
    }
  ];

  const filteredVideos = videoTutorials.filter(video => {
    const matchesSearch = searchQuery === '' || 
      video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = !selectedCategory || video.category === selectedCategory;
    const matchesDifficulty = !selectedDifficulty || video.difficulty === selectedDifficulty;
    
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const getCategoryIcon = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.icon || FaVideo;
  };

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.color || 'bg-gray-500';
  };

  const getDifficultyColor = (difficulty: string) => {
    const diff = difficulties.find(d => d.id === difficulty);
    return diff?.color || 'text-gray-600';
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
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg flex items-center justify-center">
                <FaVideo className="text-xl" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Video Tutorials</h1>
                <p className="text-gray-600">Learn platform features with step-by-step guides</p>
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
                placeholder="Search tutorials..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={selectedCategory || ''}
                onChange={(e) => setSelectedCategory(e.target.value || null)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <select
                value={selectedDifficulty || ''}
                onChange={(e) => setSelectedDifficulty(e.target.value || null)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">All Levels</option>
                {difficulties.map((difficulty) => (
                  <option key={difficulty.id} value={difficulty.id}>
                    {difficulty.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Video Grid */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {filteredVideos.length} {filteredVideos.length === 1 ? 'Tutorial' : 'Tutorials'} Found
            </h2>
            {(searchQuery || selectedCategory || selectedDifficulty) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory(null);
                  setSelectedDifficulty(null);
                }}
                className="text-purple-600 hover:text-purple-800 text-sm font-medium"
              >
                Clear filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVideos.map((video) => {
              const IconComponent = getCategoryIcon(video.category);
              const categoryColor = getCategoryColor(video.category);
              const difficultyColor = getDifficultyColor(video.difficulty);
              
              return (
                <div key={video.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="relative">
                    <div className="aspect-video bg-gray-200 flex items-center justify-center">
                      <div className="w-16 h-16 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                        <FaPlay className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="absolute top-2 right-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${difficultyColor} bg-white bg-opacity-90`}>
                        {video.difficulty}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`w-6 h-6 ${categoryColor} text-white rounded-lg flex items-center justify-center`}>
                        <IconComponent className="w-3 h-3" />
                      </div>
                      <span className="text-sm text-gray-600">{video.duration}</span>
                    </div>
                    
                    <h3 className="font-semibold text-gray-900 mb-2">{video.title}</h3>
                    <p className="text-sm text-gray-600 mb-4">{video.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {video.tags.slice(0, 2).map((tag, index) => (
                          <span key={index} className="px-2 py-1 bg-gray-100 text-xs text-gray-600 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <button
                        onClick={() => window.open(video.videoUrl, '_blank')}
                        className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                      >
                        Watch
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredVideos.length === 0 && (
            <div className="text-center py-12">
              <FaVideo className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tutorials found</h3>
              <p className="text-gray-600 mb-6">
                Try adjusting your search terms or filters
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory(null);
                  setSelectedDifficulty(null);
                }}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Browse All Tutorials
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
              onClick={() => router.push('/partner/support/faq')}
              className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <FaBook className="w-5 h-5 text-green-600" />
              <div className="text-left">
                <h4 className="font-medium text-gray-900">FAQ</h4>
                <p className="text-sm text-gray-600">Find quick answers</p>
              </div>
            </button>
            <button
              onClick={() => window.open('https://docs.comparepco.com', '_blank')}
              className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <FaDownload className="w-5 h-5 text-purple-600" />
              <div className="text-left">
                <h4 className="font-medium text-gray-900">Documentation</h4>
                <p className="text-sm text-gray-600">Download guides</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 