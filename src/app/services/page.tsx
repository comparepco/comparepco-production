'use client';

import React from 'react';
import Link from 'next/link';
import { FaCarSide, FaShieldAlt, FaTools, FaClock, FaMapMarkerAlt, FaCreditCard, FaHeadset, FaFileAlt } from 'react-icons/fa';

export default function ServicesPage() {
  const services = [
    {
      icon: FaCarSide,
      title: 'Vehicle Rentals',
      description: 'Access to a wide range of PCO-compliant vehicles from trusted partners across the UK.',
      features: [
        'PCO-compliant vehicles only',
        'Flexible rental terms',
        'Comprehensive insurance included',
        '24/7 roadside assistance'
      ],
      color: 'blue'
    },
    {
      icon: FaShieldAlt,
      title: 'Insurance Solutions',
      description: 'Comprehensive insurance coverage for all our rental vehicles with transparent terms.',
      features: [
        'Fully comprehensive coverage',
        'PCO license protection',
        'Third-party liability',
        'No hidden fees'
      ],
      color: 'green'
    },
    {
      icon: FaTools,
      title: 'Maintenance & Support',
      description: 'Regular maintenance and 24/7 technical support to keep you on the road.',
      features: [
        'Regular maintenance checks',
        '24/7 technical support',
        'Replacement vehicle service',
        'Emergency roadside assistance'
      ],
      color: 'orange'
    },
    {
      icon: FaClock,
      title: 'Flexible Booking',
      description: 'Book vehicles for any duration with flexible terms that suit your business needs.',
      features: [
        'Daily, weekly, monthly rentals',
        'No long-term commitments',
        'Easy booking process',
        'Instant confirmation'
      ],
      color: 'purple'
    },
    {
      icon: FaMapMarkerAlt,
      title: 'Nationwide Coverage',
      description: 'Access vehicles from our network of partners across the entire United Kingdom.',
      features: [
        'Coverage across all UK regions',
        'Local pickup and drop-off',
        'Partner network support',
        'Regional vehicle availability'
      ],
      color: 'red'
    },
    {
      icon: FaCreditCard,
      title: 'Transparent Pricing',
      description: 'Clear, upfront pricing with no hidden fees or surprise charges.',
      features: [
        'All-inclusive pricing',
        'No hidden fees',
        'Transparent terms',
        'Competitive rates'
      ],
      color: 'indigo'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      orange: 'bg-orange-100 text-orange-600',
      purple: 'bg-purple-100 text-purple-600',
      red: 'bg-red-100 text-red-600',
      indigo: 'bg-indigo-100 text-indigo-600'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-blue-600 text-white py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Our Services</h1>
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto">
              Comprehensive solutions designed to support PCO drivers at every step of their journey
            </p>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-shadow">
                <div className={`w-16 h-16 ${getColorClasses(service.color)} rounded-2xl flex items-center justify-center mb-6`}>
                  <service.icon className="text-2xl" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{service.title}</h3>
                <p className="text-gray-700 mb-6">{service.description}</p>
                <ul className="space-y-3">
                  {service.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center text-sm text-gray-600">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Browse Vehicles</h3>
              <p className="text-gray-700">
                Search through our extensive selection of PCO-compliant vehicles with detailed specifications and pricing.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Compare Options</h3>
              <p className="text-gray-700">
                Compare different vehicles, pricing, and features to find the perfect match for your needs.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Book & Verify</h3>
              <p className="text-gray-700">
                Complete your booking and upload required documents for verification within minutes.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                4
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Start Driving</h3>
              <p className="text-gray-700">
                Collect your vehicle and start earning with our comprehensive support behind you.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Additional Services */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Additional Services</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center mb-6">
                <FaHeadset className="text-4xl text-blue-600 mr-4" />
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">24/7 Customer Support</h3>
                  <p className="text-gray-600">Round-the-clock assistance for all your needs</p>
                </div>
              </div>
              <ul className="space-y-3 text-gray-700">
                <li>• Phone support during business hours</li>
                <li>• Email support with 24-hour response</li>
                <li>• Live chat for urgent issues</li>
                <li>• WhatsApp support for quick questions</li>
              </ul>
            </div>
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center mb-6">
                <FaFileAlt className="text-4xl text-blue-600 mr-4" />
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Document Management</h3>
                  <p className="text-gray-600">Streamlined document handling and verification</p>
                </div>
              </div>
              <ul className="space-y-3 text-gray-700">
                <li>• Secure document upload</li>
                <li>• Fast verification process</li>
                <li>• Digital contract signing</li>
                <li>• Document storage and access</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Explore our services and find the perfect vehicle for your PCO business.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/compare" 
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Browse Vehicles
            </Link>
            <Link 
              href="/contact" 
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
} 