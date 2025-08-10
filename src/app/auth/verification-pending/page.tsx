"use client";

import Link from 'next/link';
import { FaClock, FaEnvelope } from 'react-icons/fa';

export default function VerificationPendingPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaClock className="w-8 h-8 text-yellow-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Verification Pending
          </h1>
          
          <p className="text-gray-600 mb-6">
            Thank you for your registration! Your account is currently being reviewed by our team. 
            You will receive an email notification once your account has been verified.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <FaEnvelope className="text-blue-600 mt-1 mr-3 flex-shrink-0" />
              <div className="text-left">
                <h3 className="font-semibold text-blue-900 mb-1">What happens next?</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• We'll review your application within 24-48 hours</li>
                  <li>• You'll receive an email with the verification result</li>
                  <li>• Once approved, you can access your dashboard</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <Link
              href="/auth/login"
              className="block w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition"
            >
              Back to Login
            </Link>
            
            <Link
              href="/"
              className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold transition"
            >
              Return to Home
            </Link>
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Need help? Contact our support team at{' '}
              <a href="mailto:support@comparepco.com" className="text-blue-600 hover:underline">
                support@comparepco.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 