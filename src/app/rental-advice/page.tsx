'use client';

import React from 'react';
import Link from 'next/link';
import { FaCarSide, FaShieldAlt, FaFileAlt, FaClock, FaPoundSign, FaExclamationTriangle, FaCheckCircle, FaQuestionCircle } from 'react-icons/fa';

export default function RentalAdvicePage() {
  const adviceSections = [
    {
      icon: FaFileAlt,
      title: 'Required Documents',
      description: 'Essential documents you need to rent a PCO vehicle',
      items: [
        'Valid PCO license',
        'Full UK driving license',
        'Proof of address (utility bill or bank statement)',
        'National Insurance number',
        'Passport or UK residence permit',
        'Recent passport-style photograph'
      ],
      color: 'blue'
    },
    {
      icon: FaPoundSign,
      title: 'Cost Considerations',
      description: 'Understanding the full cost of PCO vehicle rental',
      items: [
        'Weekly/monthly rental fee',
        'Insurance excess (if applicable)',
        'Fuel costs',
        'Maintenance and servicing',
        'Any additional equipment or accessories',
        'Early termination fees (if applicable)'
      ],
      color: 'green'
    },
    {
      icon: FaShieldAlt,
      title: 'Insurance & Safety',
      description: 'Important insurance and safety information',
      items: [
        'Comprehensive insurance coverage',
        'PCO license protection',
        'Third-party liability coverage',
        'Vehicle tracking systems',
        'Regular safety inspections',
        'Emergency roadside assistance'
      ],
      color: 'orange'
    },
    {
      icon: FaClock,
      title: 'Rental Duration',
      description: 'Flexible rental options to suit your needs',
      items: [
        'Short-term rentals (1-7 days)',
        'Weekly rentals (1-4 weeks)',
        'Monthly rentals (1-12 months)',
        'Long-term contracts available',
        'Flexible extension options',
        'Early return policies'
      ],
      color: 'purple'
    }
  ];

  const tips = [
    {
      icon: FaCheckCircle,
      title: 'Do Your Research',
      content: 'Compare different vehicles and rental companies to find the best deal for your specific needs.'
    },
    {
      icon: FaCheckCircle,
      title: 'Read the Fine Print',
      content: 'Carefully review all terms and conditions, especially regarding insurance, maintenance, and early termination.'
    },
    {
      icon: FaCheckCircle,
      title: 'Check Vehicle Condition',
      content: 'Inspect the vehicle thoroughly before accepting it, and document any existing damage with photos.'
    },
    {
      icon: FaCheckCircle,
      title: 'Understand Your Obligations',
      content: 'Know your responsibilities regarding fuel, maintenance, and returning the vehicle in good condition.'
    },
    {
      icon: FaExclamationTriangle,
      title: 'Keep Records',
      content: 'Maintain detailed records of all communications, payments, and any issues that arise during your rental.'
    },
    {
      icon: FaExclamationTriangle,
      title: 'Plan for Emergencies',
      content: 'Have a backup plan in case of vehicle breakdowns or other emergencies that might affect your business.'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      orange: 'bg-orange-100 text-orange-600',
      purple: 'bg-purple-100 text-purple-600'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-blue-600 text-white py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Rental Advice</h1>
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto">
              Essential information and tips to help you make the best decisions when renting a PCO vehicle
            </p>
          </div>
        </div>
      </section>

      {/* Introduction */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Making Informed Decisions</h2>
            <p className="text-lg text-gray-700 mb-6">
              Renting a PCO vehicle is a significant decision that can impact your business success. 
              We've compiled comprehensive advice to help you navigate the process and make the best choices 
              for your specific needs.
            </p>
            <p className="text-lg text-gray-700">
              Whether you're a new PCO driver or an experienced professional, this guide will help you 
              understand the key considerations, avoid common pitfalls, and ensure you get the most value 
              from your vehicle rental.
            </p>
          </div>
        </div>
      </section>

      {/* Advice Sections */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {adviceSections.map((section, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-xl p-8">
                <div className="flex items-center mb-6">
                  <div className={`w-12 h-12 ${getColorClasses(section.color)} rounded-xl flex items-center justify-center mr-4`}>
                    <section.icon className="text-xl" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{section.title}</h3>
                    <p className="text-gray-600">{section.description}</p>
                  </div>
                </div>
                <ul className="space-y-3">
                  {section.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start text-gray-700">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tips Section */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Pro Tips for PCO Drivers</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tips.map((tip, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-center mb-4">
                  <tip.icon className={`text-2xl mr-3 ${tip.icon === FaCheckCircle ? 'text-green-600' : 'text-orange-600'}`} />
                  <h3 className="text-lg font-semibold text-gray-900">{tip.title}</h3>
                </div>
                <p className="text-gray-700">{tip.content}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Common Questions */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Common Questions</h2>
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">What happens if I damage the vehicle?</h3>
              <p className="text-gray-700">
                All our vehicles come with comprehensive insurance. Minor damage is typically covered, 
                but you may be responsible for the excess amount. Always report any damage immediately 
                and document it with photos.
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Can I extend my rental period?</h3>
              <p className="text-gray-700">
                Yes, most rentals can be extended subject to vehicle availability. Contact us at least 
                48 hours before your current rental ends to arrange an extension.
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">What if the vehicle breaks down?</h3>
              <p className="text-gray-700">
                We provide 24/7 roadside assistance. If your vehicle breaks down, contact our support 
                team immediately. We'll arrange for repairs or provide a replacement vehicle if necessary.
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">How do I return the vehicle?</h3>
              <p className="text-gray-700">
                Return the vehicle to the designated location at the agreed time. Ensure it's clean, 
                fueled, and in the same condition as when you received it. Our team will conduct a 
                final inspection.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Start?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Now that you're informed, browse our available vehicles and find the perfect match for your PCO business.
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
              Get Advice
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
} 