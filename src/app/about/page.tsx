'use client';

import React from 'react';
import Link from 'next/link';
import { FaCarSide, FaShieldAlt, FaUsers, FaAward, FaHandshake, FaGlobe } from 'react-icons/fa';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-blue-600 text-white py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">About ComparePCO</h1>
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto">
              The UK's leading platform connecting PCO drivers with premium vehicle rentals
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
              <p className="text-lg text-gray-700 mb-6">
                At ComparePCO, we're revolutionizing the PCO vehicle rental industry by providing drivers 
                with access to the best vehicles, competitive pricing, and exceptional service. Our platform 
                connects drivers with trusted partners across the UK.
              </p>
              <p className="text-lg text-gray-700">
                We believe every PCO driver deserves reliable, well-maintained vehicles that help them 
                succeed in their business. That's why we've built a comprehensive platform that makes 
                finding and booking the perfect vehicle simple and transparent.
              </p>
            </div>
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <FaCarSide className="text-4xl text-blue-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">1000+</h3>
                  <p className="text-gray-600">Vehicles Available</p>
                </div>
                <div className="text-center">
                  <FaUsers className="text-4xl text-blue-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">5000+</h3>
                  <p className="text-gray-600">Happy Drivers</p>
                </div>
                <div className="text-center">
                  <FaShieldAlt className="text-4xl text-blue-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">100%</h3>
                  <p className="text-gray-600">Insured Vehicles</p>
                </div>
                <div className="text-center">
                  <FaAward className="text-4xl text-blue-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">24/7</h3>
                  <p className="text-gray-600">Support Available</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <FaHandshake className="text-5xl text-blue-600 mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Trust & Transparency</h3>
              <p className="text-gray-700">
                We believe in complete transparency. Every vehicle listing includes detailed information 
                about pricing, insurance, and terms. No hidden fees, no surprises.
              </p>
            </div>
            <div className="text-center">
              <FaCarSide className="text-5xl text-blue-600 mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Quality Assurance</h3>
              <p className="text-gray-700">
                Every vehicle on our platform is thoroughly vetted and maintained to the highest standards. 
                We work only with trusted partners who share our commitment to quality.
              </p>
            </div>
            <div className="text-center">
              <FaGlobe className="text-5xl text-blue-600 mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Community Focus</h3>
              <p className="text-gray-700">
                We're building a community of successful PCO drivers. Our platform connects drivers 
                with the resources they need to grow their business and achieve their goals.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Our Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="w-24 h-24 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <FaUsers className="text-3xl text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Customer Success</h3>
              <p className="text-gray-600">
                Our dedicated team ensures every driver gets the support they need, 
                from booking to vehicle delivery and beyond.
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="w-24 h-24 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <FaShieldAlt className="text-3xl text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Quality Control</h3>
              <p className="text-gray-600">
                Our quality team works tirelessly to ensure every vehicle meets our 
                strict standards for safety and reliability.
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="w-24 h-24 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <FaHandshake className="text-3xl text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Partner Relations</h3>
              <p className="text-gray-600">
                We maintain strong relationships with our partner network to ensure 
                drivers have access to the best vehicles and service.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of successful PCO drivers who trust ComparePCO for their vehicle needs.
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