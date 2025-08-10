'use client';

import React from 'react';
import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
            <p className="text-gray-600">Last updated: {new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>

          <div className="prose prose-lg max-w-none space-y-8">
            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
              <p className="text-gray-700 mb-4">
                ComparePCO Limited ("we," "our," or "us") is committed to protecting your privacy and personal data. This Privacy Policy explains how we collect, use, store, and protect your information when you use our vehicle rental platform and services.
              </p>
              <p className="text-gray-700">
                This policy applies to all users of our platform, including drivers seeking vehicle rentals and partners providing vehicles. We process personal data in accordance with UK GDPR, the Data Protection Act 2018, and other applicable privacy laws.
              </p>
            </section>

            {/* Data Controller */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Data Controller</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700 mb-2"><strong>ComparePCO Limited</strong></p>
                <p className="text-gray-700">Email: privacy@comparepco.com</p>
                <p className="text-gray-700">Phone: +44 (0) 20 1234 5678</p>
                <p className="text-gray-700">Address: [Company Address]</p>
                <p className="text-gray-700">Company Registration: [Registration Number]</p>
                <p className="text-gray-700 mt-2">
                  <strong>Data Protection Officer:</strong> dpo@comparepco.com
                </p>
              </div>
            </section>

            {/* Information We Collect */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Information We Collect</h2>
              
              <div className="space-y-4 text-gray-700">
                <h3 className="text-lg font-semibold">3.1 Information You Provide</h3>
                <p><strong>Account Registration:</strong></p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Full name and contact details (email, phone, address)</li>
                  <li>Date of birth and age verification</li>
                  <li>Account credentials (username, password)</li>
                  <li>Marketing and communication preferences</li>
                </ul>

                <p className="mt-4"><strong>Driver-Specific Information:</strong></p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Driving licence details and history</li>
                  <li>PCO licence information</li>
                  <li>Identity verification documents</li>
                  <li>Proof of address documentation</li>
                  <li>Insurance details and certificates</li>
                  <li>Background check information</li>
                </ul>
              </div>
            </section>

            {/* Your Rights */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Your Privacy Rights</h2>
              
              <div className="space-y-4 text-gray-700">
                <p>Under UK GDPR and Data Protection Act 2018, you have the following rights:</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">Right of Access</h3>
                    <p className="text-sm">Request a copy of your personal data we hold</p>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">Right to Rectification</h3>
                    <p className="text-sm">Correct inaccurate or incomplete information</p>
                  </div>
                  
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">Right to Erasure</h3>
                    <p className="text-sm">Request deletion of your personal data</p>
                  </div>
                  
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">Right to Restriction</h3>
                    <p className="text-sm">Limit how we process your data</p>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg mt-6">
                  <h3 className="text-lg font-semibold mb-2">How to Exercise Your Rights</h3>
                  <p className="mb-2">To exercise any of these rights, contact us at:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Email: privacy@comparepco.com</li>
                    <li>Through your account settings</li>
                    <li>By calling our support line: +44 (0) 20 1234 5678</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 5. Data Retention & Deletion */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Retention & Deletion</h2>
              <p className="text-gray-700 mb-4">We retain your documents and personal data only for as long as your account remains active on the Platform.</p>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li><strong>Account Deletion:</strong> When you delete your account and notify us that you no longer wish to use the Platform, we will securely delete your documents and personal data within 60 days, except where retention is required by law or legitimate business purposes (e.g., outstanding fines or legal claims).</li>
                <li><strong>Legal Obligations:</strong> We may retain certain records to comply with tax, accounting, anti-fraud, or other legal requirements.</li>
                <li><strong>Security:</strong> All retained data is stored using industry-standard security measures to protect against unauthorised access, loss, or misuse.</li>
              </ul>
            </section>

            {/* 6. Fines, Penalties & Legal Claims */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Fines, Penalties & Legal Claims</h2>
              <p className="text-gray-700 mb-4">If you incur a fine, penalty, or legal claim while using the Platform (for example, a speeding ticket or congestion charge), we may process and share your relevant personal data as follows:</p>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li>Share necessary information with Partners, insurers, authorities, or enforcement agencies to identify the responsible party and facilitate payment or transfer of liability.</li>
                <li>Retain records of the fine or penalty until it is resolved and any legal or regulatory retention period has expired.</li>
                <li>Notify you via email or in-app communication about the fine, including the amount, issuing authority, and payment instructions where applicable.</li>
              </ul>
            </section>

            {/* 7. Contact Us */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Contact Us</h2>
              <div className="space-y-4 text-gray-700">
                <p>If you have questions about this Privacy Policy or wish to exercise your data rights, please contact us:</p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Privacy Inquiries</h3>
                  <p>Email: privacy@comparepco.com</p>
                  <p>Phone: +44 (0) 20 1234 5678</p>
                  <p>Response time: Within 30 days</p>
                </div>
              </div>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
              <p className="text-sm text-gray-600">
                © {new Date().getFullYear()} ComparePCO Limited. All rights reserved.
              </p>
              <div className="flex space-x-6">
                <Link href="/legal/terms-and-conditions" className="text-sm text-blue-600 hover:text-blue-800 underline">
                  Terms & Conditions
                </Link>
                <Link href="/contact" className="text-sm text-blue-600 hover:text-blue-800 underline">
                  Contact Us
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 