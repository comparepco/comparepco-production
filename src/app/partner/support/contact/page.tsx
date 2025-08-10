'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'react-hot-toast';
import {
  FaHeadset, FaQuestionCircle, FaEnvelope, FaPhone, FaComments, FaBook,
  FaVideo, FaFileAlt, FaDownload, FaSearch, FaTicketAlt, FaClock,
  FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaArrowRight,
  FaWhatsapp, FaTwitter, FaFacebook, FaLinkedin, FaYoutube, FaGithub,
  FaCog, FaUser, FaCar, FaCreditCard, FaShieldAlt, FaChartLine,
  FaFileContract, FaCalendarAlt, FaMapMarkerAlt, FaGlobe, FaBuilding,
  FaUsers, FaMoneyBillWave, FaFileInvoiceDollar, FaCarSide, FaParking,
  FaOilCan, FaTachometerAlt, FaPaperPlane
} from 'react-icons/fa';

interface ContactForm {
  name: string;
  email: string;
  subject: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'technical' | 'billing' | 'account' | 'vehicle' | 'booking' | 'payment' | 'documentation' | 'general';
}

export default function PartnerContactPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [form, setForm] = useState<ContactForm>({
    name: user?.name || '',
    email: user?.email || '',
    subject: '',
    message: '',
    priority: 'medium',
    category: 'general'
  });

  const contactMethods = [
    {
      title: 'Email Support',
      description: 'support@comparepco.com',
      icon: FaEnvelope,
      color: 'text-blue-600',
      action: () => window.open('mailto:support@comparepco.com', '_blank'),
      response: 'Within 24 hours'
    },
    {
      title: 'Phone Support',
      description: '+44 20 1234 5678',
      icon: FaPhone,
      color: 'text-green-600',
      action: () => window.open('tel:+442012345678', '_blank'),
      response: 'Mon-Fri 9AM-6PM'
    },
    {
      title: 'Live Chat',
      description: 'Chat with us online',
      icon: FaComments,
      color: 'text-purple-600',
      action: () => startLiveChat(),
      response: 'Instant response'
    },
    {
      title: 'WhatsApp',
      description: 'Message us on WhatsApp',
      icon: FaWhatsapp,
      color: 'text-green-500',
      action: () => window.open('https://wa.me/442012345678', '_blank'),
      response: 'Within 2 hours'
    },
    {
      title: 'Emergency Line',
      description: '24/7 emergency support',
      icon: FaExclamationTriangle,
      color: 'text-red-600',
      action: () => window.open('tel:+442012345679', '_blank'),
      response: 'Immediate response'
    }
  ];

  const businessCategories = [
    {
      value: 'vehicle',
      label: 'Vehicle Management',
      description: 'Fleet issues, vehicle registration, maintenance',
      icon: FaCar
    },
    {
      value: 'booking',
      label: 'Booking System',
      description: 'Rental bookings, availability, scheduling',
      icon: FaCalendarAlt
    },
    {
      value: 'payment',
      label: 'Payment & Billing',
      description: 'Invoices, payments, financial matters',
      icon: FaMoneyBillWave
    },
    {
      value: 'documentation',
      label: 'Documentation',
      description: 'Compliance, certificates, legal documents',
      icon: FaFileContract
    },
    {
      value: 'technical',
      label: 'Technical Support',
      description: 'Platform issues, app problems, system errors',
      icon: FaCog
    },
    {
      value: 'account',
      label: 'Account Management',
      description: 'Profile updates, settings, access issues',
      icon: FaUser
    },
    {
      value: 'billing',
      label: 'Billing Inquiries',
      description: 'Billing questions, payment processing',
      icon: FaFileInvoiceDollar
    },
    {
      value: 'general',
      label: 'General Inquiry',
      description: 'General questions and information',
      icon: FaQuestionCircle
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please log in to submit a support request');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create support ticket
      const { data: ticket, error: ticketError } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user.id,
          user_type: 'partner',
          subject: form.subject,
          description: form.message,
          category: form.category,
          priority: form.priority,
          status: 'open'
        })
        .select()
        .single();

      if (ticketError) throw ticketError;

      toast.success('Support request submitted successfully!');
      setSubmitted(true);
      setForm({
        name: user.name || '',
        email: user.email || '',
        subject: '',
        message: '',
        priority: 'medium',
        category: 'general'
      });

    } catch (error) {
      console.error('Error submitting support request:', error);
      toast.error('Failed to submit support request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const startLiveChat = async () => {
    if (!user) {
      toast.error('Please log in to start a live chat');
      return;
    }

    try {
      // Create chat session
      const { data: chatSession, error } = await supabase
        .from('chat_sessions')
        .insert({
          customer_id: user.id,
          customer_type: 'partner',
          category: 'general',
          priority: 'medium',
          status: 'waiting',
          subject: 'Partner Support Chat'
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Live chat session created! An agent will join shortly.');
      // You can redirect to a chat interface or open a modal
      router.push(`/partner/support/chat/${chatSession.id}`);
    } catch (error) {
      console.error('Error starting live chat:', error);
      toast.error('Failed to start live chat. Please try again.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaCheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Support Request Submitted!
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
              Thank you for contacting us. Our support team will review your request and get back to you as soon as possible.
            </p>
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">What happens next?</h3>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• Your request has been logged in our system</li>
                  <li>• A support agent will review your case</li>
                  <li>• You'll receive updates via email</li>
                  <li>• For urgent issues, you can call our support line</li>
                </ul>
              </div>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => setSubmitted(false)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Submit Another Request
                </button>
                <button
                  onClick={() => router.push('/partner/support')}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Back to Support
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <section className="bg-blue-600 text-white py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Partner Support</h1>
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto">
              Get the help you need to manage your fleet and grow your business
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Submit Support Request</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Subject *
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Brief description of your issue"
                />
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category *
                </label>
                <select
                  id="category"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  {businessCategories.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Priority *
                </label>
                <select
                  id="priority"
                  name="priority"
                  value={form.priority}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="low">Low - General inquiry</option>
                  <option value="medium">Medium - Standard issue</option>
                  <option value="high">High - Business impact</option>
                  <option value="urgent">Urgent - Critical issue</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Please provide detailed information about your issue..."
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <FaPaperPlane className="w-4 h-4 mr-2" />
                    Submit Request
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Contact Information */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Get in Touch</h2>
              <p className="text-lg text-gray-700 dark:text-gray-400 mb-8">
                Our dedicated partner support team is here to help you succeed. Choose the method that works best for you.
              </p>
            </div>

            <div className="space-y-6">
              {contactMethods.map((method, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <div className={`p-3 rounded-lg ${method.color} bg-opacity-10`}>
                    <method.icon className="text-2xl" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      {method.title}
                    </h3>
                    <p className="text-gray-700 dark:text-gray-400 mb-2">{method.description}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mb-3">{method.response}</p>
                    <button
                      onClick={method.action}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                    >
                      Contact Now →
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Business Hours */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Business Hours</h3>
              <div className="space-y-2 text-gray-700 dark:text-gray-400">
                <div className="flex justify-between">
                  <span>Monday - Friday</span>
                  <span>9:00 AM - 6:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Saturday</span>
                  <span>10:00 AM - 4:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Sunday</span>
                  <span>Closed</span>
                </div>
                <div className="flex justify-between">
                  <span>Emergency Support</span>
                  <span>24/7 Available</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 