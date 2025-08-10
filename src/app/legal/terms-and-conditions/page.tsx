'use client';

import React from 'react';
import Link from 'next/link';

export default function TermsAndConditionsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-8">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Terms and Conditions</h1>
            <p className="text-gray-600 text-lg">Last updated: {new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>

          <div className="prose prose-lg max-w-none space-y-10">
            {/* 1. Introduction */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
              <p className="text-gray-800 mb-4">
                Welcome to ComparePCO ("we," "our," or "us"). These Terms and Conditions ("Terms") govern your use of our vehicle rental platform and services. By accessing or using our platform, you agree to be bound by these Terms. If you do not agree, you must not use our services.
              </p>
              <p className="text-gray-800">
                ComparePCO operates as a digital marketplace connecting vehicle partners (fleet owners, companies, or individuals) with drivers seeking PCO (Private Hire) licensed vehicles for rental purposes. We are an intermediary platform and not a party to any rental contract between drivers and partners.
              </p>
            </section>

            {/* 2. Definitions */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Definitions</h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-800">
                <li><strong>"Platform"</strong> means the ComparePCO website, mobile application, and all related services.</li>
                <li><strong>"Driver"</strong> means any individual seeking to rent a PCO-licensed vehicle via ComparePCO.</li>
                <li><strong>"Partner"</strong> means any business, fleet owner, or individual offering vehicles for rent on ComparePCO.</li>
                <li><strong>"Services"</strong> means the vehicle rental marketplace and related services provided by ComparePCO.</li>
                <li><strong>"Vehicle"</strong> means any PCO-licensed vehicle available for rental through our platform.</li>
                <li><strong>"Booking"</strong> means a confirmed rental agreement between a Driver and a Partner.</li>
                <li><strong>"User"</strong> means any person or entity using the Platform, including Drivers and Partners.</li>
                <li><strong>"Account"</strong> means a registered user profile on ComparePCO.</li>
                <li><strong>"Content"</strong> means all information, data, text, images, and other material uploaded or transmitted via the Platform.</li>
              </ul>
            </section>

            {/* 3. General Platform Terms */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. General Platform Terms</h2>
              <div className="space-y-4 text-gray-800">
                <h3 className="text-lg font-semibold">3.1 Our Role as Intermediary</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>ComparePCO is a neutral intermediary and does not own, operate, or control any vehicles listed on the Platform.</li>
                  <li>We do not act as an agent, insurer, or employer for Drivers or Partners.</li>
                  <li>All rental contracts are strictly between the Driver and the Partner. ComparePCO is not a party to any rental agreement.</li>
                  <li>We do not guarantee the availability, condition, legality, or suitability of any vehicle or user.</li>
                  <li>We do not provide insurance coverage for rentals unless explicitly stated in writing.</li>
                </ul>
                <h3 className="text-lg font-semibold mt-4">3.2 Acceptance of Terms</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>By using the Platform, you confirm that you have read, understood, and agree to these Terms and our Privacy Policy.</li>
                  <li>If you are using the Platform on behalf of a company or other legal entity, you represent that you have authority to bind that entity to these Terms.</li>
                </ul>
                <h3 className="text-lg font-semibold mt-4">3.3 Changes to Terms</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>We may update these Terms at any time. Changes will be posted on this page with the updated date.</li>
                  <li>Your continued use of the Platform after changes are posted constitutes your acceptance of the new Terms.</li>
                </ul>
              </div>
            </section>

            {/* 4. Driver & Partner Eligibility */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Driver & Partner Eligibility</h2>
              <div className="space-y-4 text-gray-800">
                <h3 className="text-lg font-semibold">4.1 Driver Eligibility</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Drivers must be at least 21 years old and legally eligible to work in the UK.</li>
                  <li>Drivers must hold a valid UK driving licence for a minimum of 3 years.</li>
                  <li>Drivers must possess a valid PCO licence issued by Transport for London (TfL) or equivalent authority.</li>
                  <li>Drivers must provide accurate proof of identity, address, and all required documentation.</li>
                  <li>Drivers must pass all verification and background checks required by ComparePCO or Partners.</li>
                </ul>
                <h3 className="text-lg font-semibold mt-4">4.2 Partner Eligibility</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Partners must be registered businesses or individual vehicle owners in the UK.</li>
                  <li>Partners must hold all necessary business, insurance, and vehicle licences.</li>
                  <li>Partners must ensure all vehicles are roadworthy, insured, and compliant with all regulations.</li>
                  <li>Partners must provide accurate and up-to-date information about their vehicles and business.</li>
                </ul>
              </div>
            </section>

            {/* 5. Account Registration & Security */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Account Registration & Security</h2>
              <div className="space-y-4 text-gray-800">
                <ul className="list-disc pl-6 space-y-1">
                  <li>Users must register for an account to access most services on the Platform.</li>
                  <li>Users are responsible for maintaining the confidentiality of their account credentials.</li>
                  <li>Users must provide accurate, complete, and up-to-date information at all times.</li>
                  <li>Users must notify ComparePCO immediately of any unauthorised account access or security breach.</li>
                  <li>Users are responsible for all activities that occur under their account.</li>
                </ul>
              </div>
            </section>

            {/* 6. Booking, Payment & Cancellations */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Booking, Payment & Cancellations</h2>
              <div className="space-y-4 text-gray-800">
                <h3 className="text-lg font-semibold">6.1 Booking Process</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Drivers may browse, compare, and request bookings for available vehicles.</li>
                  <li>All booking requests are subject to Partner approval and document verification.</li>
                  <li>Partners may accept or reject booking requests at their sole discretion.</li>
                  <li>Bookings are confirmed only after payment is received and all documents are verified.</li>
                </ul>
                <h3 className="text-lg font-semibold mt-4">6.2 Payments</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>All prices are displayed in GBP and include applicable taxes unless otherwise stated.</li>
                  <li>Payment is required in advance of vehicle collection via approved payment methods.</li>
                  <li>ComparePCO may charge service fees for facilitating bookings; these are non-refundable except in cases of platform error.</li>
                  <li>Additional charges may apply for damages, late returns, or policy violations.</li>
                </ul>
                <h3 className="text-lg font-semibold mt-4">6.3 Cancellations & Refunds</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Cancellation policies are set by Partners and displayed during booking.</li>
                  <li>Refunds are processed within 5-10 business days, subject to Partner approval and platform policy.</li>
                  <li>No refunds are given for violations of these Terms or illegal activities.</li>
                  <li>Early termination refunds are calculated on a pro-rata basis, if applicable.</li>
                </ul>
              </div>
            </section>

            {/* 7. User Responsibilities */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. User Responsibilities</h2>
              <div className="space-y-4 text-gray-800">
                <h3 className="text-lg font-semibold">7.1 Driver Responsibilities</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Maintain valid driving and PCO licences throughout the rental period.</li>
                  <li>Use vehicles only for lawful private hire activities.</li>
                  <li>Report any accidents, damage, or issues immediately to the Partner and ComparePCO.</li>
                  <li>Return vehicles in the same condition as received, subject to fair wear and tear.</li>
                  <li>Comply with all traffic laws, regulations, and Partner policies.</li>
                  <li>Not sublet, transfer, or share rental agreements with third parties.</li>
                </ul>
                <h3 className="text-lg font-semibold mt-4">7.2 Partner Responsibilities</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Ensure vehicles are roadworthy, insured, and properly maintained at all times.</li>
                  <li>Provide accurate vehicle descriptions, availability, and pricing.</li>
                  <li>Maintain appropriate insurance coverage for all vehicles and rentals.</li>
                  <li>Respond promptly to booking requests, issues, and complaints.</li>
                  <li>Comply with all applicable vehicle licensing and business requirements.</li>
                </ul>
              </div>
            </section>

            {/* 8. Prohibited Activities */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Prohibited Activities</h2>
              <div className="space-y-4 text-gray-800">
                <ul className="list-disc pl-6 space-y-1">
                  <li>Use the Platform for any illegal, fraudulent, or unauthorised purpose.</li>
                  <li>Provide false, misleading, or incomplete information.</li>
                  <li>Attempt to circumvent or disable security features of the Platform.</li>
                  <li>Use vehicles for activities other than licensed private hire.</li>
                  <li>Engage in abusive, harassing, or threatening behaviour towards other users or staff.</li>
                  <li>Violate any applicable laws, regulations, or third-party rights.</li>
                  <li>Use automated systems to access, scrape, or disrupt the Platform.</li>
                </ul>
              </div>
            </section>

            {/* 9. Insurance & Liability */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Insurance & Liability</h2>
              <div className="space-y-4 text-gray-800">
                <h3 className="text-lg font-semibold">9.1 Insurance Requirements</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Partners must maintain comprehensive insurance for all vehicles listed on the Platform.</li>
                  <li>Drivers must hold valid private hire insurance as required by law.</li>
                  <li>Insurance details must be provided and verified before any vehicle handover.</li>
                  <li>Any insurance claims must be reported to all relevant parties, including ComparePCO.</li>
                </ul>
                <h3 className="text-lg font-semibold mt-4">9.2 Platform Liability Disclaimer</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>ComparePCO is not responsible for the condition, safety, legality, or roadworthiness of any vehicle.</li>
                  <li>We do not guarantee the actions, conduct, or suitability of any Driver or Partner.</li>
                  <li>All rental agreements, insurance claims, and disputes are strictly between Drivers and Partners.</li>
                </ul>
                <h3 className="text-lg font-semibold mt-4">9.3 Fines, Penalties & Legal Compliance</h3>
                <ul className="list-disc pl-6 space-y-1 text-gray-800">
                  <li><strong>Driver Responsibility:</strong> Drivers are solely responsible for all fines, penalties, speeding tickets, congestion charges, parking violations, tolls, and any other legal infractions incurred during the rental period.</li>
                  <li><strong>Partner Notification:</strong> Partners must promptly notify Drivers and ComparePCO of any fines or penalties received in connection with a booking and provide relevant evidence or documentation.</li>
                  <li><strong>Payment Facilitation:</strong> ComparePCO may, at its discretion, facilitate the transfer of liability or payment processing for such fines, but is not responsible for paying or settling them.</li>
                  <li><strong>Information Sharing:</strong> By using the Platform, Users authorise ComparePCO to share relevant personal data with Partners, insurers, authorities, and enforcement agencies as necessary to process or resolve fines, penalties, or legal claims.</li>
                  <li><strong>Outstanding Fines:</strong> Failure to pay fines or penalties may result in suspension of the User's account, additional administrative fees, or legal action.</li>
                </ul>
              </div>
            </section>

            {/* 10. Limitation of Liability */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Limitation of Liability</h2>
              <div className="space-y-4 text-gray-800">
                <ul className="list-disc pl-6 space-y-1">
                  <li>To the maximum extent permitted by law, ComparePCO and its directors, officers, employees, and affiliates are not liable for any indirect, incidental, special, consequential, or punitive damages.</li>
                  <li>We are not liable for loss of profits, revenue, business opportunities, or data.</li>
                  <li>We are not liable for vehicle breakdowns, accidents, theft, or mechanical failures.</li>
                  <li>We are not liable for actions or omissions of Drivers, Partners, or third parties.</li>
                  <li>Our total liability to any user for any claim arising out of or relating to the Platform is limited to the total fees paid by that user in the 12 months preceding the claim.</li>
                </ul>
              </div>
            </section>

            {/* 11. Indemnification */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Indemnification</h2>
              <div className="space-y-4 text-gray-800">
                <ul className="list-disc pl-6 space-y-1">
                  <li>Users agree to indemnify, defend, and hold harmless ComparePCO and its affiliates from any claims, damages, losses, liabilities, costs, or expenses (including legal fees) arising from:</li>
                  <ul className="list-disc pl-10 space-y-1">
                    <li>User's use or misuse of the Platform</li>
                    <li>Violation of these Terms or any law</li>
                    <li>Infringement of any third-party rights</li>
                    <li>Any dispute or claim between Driver and Partner</li>
                  </ul>
                </ul>
              </div>
            </section>

            {/* 12. Dispute Resolution */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Dispute Resolution</h2>
              <div className="space-y-4 text-gray-800">
                <h3 className="text-lg font-semibold">12.1 Internal Resolution</h3>
                <p>We encourage users to first attempt to resolve disputes through our customer support team. ComparePCO may offer mediation but is not obligated to resolve disputes between Drivers and Partners.</p>
                <h3 className="text-lg font-semibold mt-4">12.2 Legal Proceedings</h3>
                <p>Any legal disputes will be subject to the exclusive jurisdiction of the courts of England and Wales. These Terms are governed by English law.</p>
                <h3 className="text-lg font-semibold mt-4">12.3 Alternative Dispute Resolution</h3>
                <p>For consumer disputes, you may access the Online Dispute Resolution platform provided by the European Commission at <a href="https://ec.europa.eu/consumers/odr/" className="text-blue-600 underline">ec.europa.eu/consumers/odr/</a></p>
              </div>
            </section>

            {/* 13. Intellectual Property */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Intellectual Property</h2>
              <div className="space-y-4 text-gray-800">
                <ul className="list-disc pl-6 space-y-1">
                  <li>All content, features, and functionality of the Platform are owned by ComparePCO and protected by copyright, trademark, and other intellectual property laws.</li>
                  <li>You may not copy, modify, distribute, or create derivative works from our content without written permission.</li>
                  <li>User-generated content remains your property, but you grant ComparePCO a worldwide, royalty-free license to use, display, and distribute such content for platform purposes.</li>
                  <li>You must not infringe on third-party intellectual property rights.</li>
                  <li>We respect intellectual property rights and respond to valid infringement claims.</li>
                </ul>
              </div>
            </section>

            {/* 14. Termination */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Termination</h2>
              <div className="space-y-4 text-gray-800">
                <h3 className="text-lg font-semibold">14.1 Termination by User</h3>
                <p>You may terminate your account at any time by contacting our support team. Active bookings must be completed or cancelled according to applicable policies.</p>
                <h3 className="text-lg font-semibold mt-4">14.2 Termination by ComparePCO</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>We may suspend or terminate your account if you violate these Terms, engage in fraudulent or illegal activities, or pose a risk to other users or the Platform.</li>
                  <li>We may retain certain data as required by law or for legitimate business purposes.</li>
                </ul>
                <h3 className="text-lg font-semibold mt-4">14.3 Effect of Termination</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Your access to the Platform will be revoked.</li>
                  <li>Outstanding obligations remain in effect.</li>
                  <li>Active bookings will be handled according to our policies.</li>
                </ul>
              </div>
            </section>

            {/* 15. General Provisions */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">15. General Provisions</h2>
              <div className="space-y-4 text-gray-800">
                <h3 className="text-lg font-semibold">15.1 Severability</h3>
                <p>If any provision of these Terms is found to be unenforceable, the remaining provisions will continue in full force and effect.</p>
                <h3 className="text-lg font-semibold mt-4">15.2 Entire Agreement</h3>
                <p>These Terms, together with our Privacy Policy and any additional terms specific to certain services, constitute the entire agreement between you and ComparePCO.</p>
                <h3 className="text-lg font-semibold mt-4">15.3 Waiver</h3>
                <p>Our failure to enforce any provision of these Terms does not constitute a waiver of that provision or any other provision.</p>
                <h3 className="text-lg font-semibold mt-4">15.4 Assignment</h3>
                <p>You may not assign your rights or obligations under these Terms without our written consent. We may assign our rights and obligations without restriction.</p>
                <h3 className="text-lg font-semibold mt-4">15.5 Force Majeure</h3>
                <p>We are not liable for any failure or delay in performance due to events beyond our reasonable control, including but not limited to natural disasters, war, terrorism, labour disputes, or government action.</p>
              </div>
            </section>

            {/* 16. Document Retention & Data Protection */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">16. Document Retention & Data Protection</h2>
              <div className="space-y-4 text-gray-800">
                <ul className="list-disc pl-6 space-y-1">
                  <li><strong>Retention Period:</strong> We retain driver and partner documents (including licences, proof of address, insurance certificates, identification documents, and any verification data) only while your account remains active.</li>
                  <li><strong>Account Deletion:</strong> Upon confirmed deletion of your account and cessation of Platform use, we will securely delete your documents and personal data within 60 days, except where retention is required by law or for legitimate business purposes.</li>
                  <li><strong>Legal & Legitimate Interests:</strong> We may retain certain information beyond account deletion to comply with legal obligations, resolve disputes, enforce our agreements, prevent fraud, or manage outstanding fines, penalties, or legal claims.</li>
                  <li><strong>Security Measures:</strong> All retained documents are stored using appropriate technical and organisational measures to protect against unauthorised access, loss, or misuse.</li>
                  <li><strong>Your Rights:</strong> You may request access to, or deletion of, your personal data at any time, subject to legal and regulatory requirements. See our <Link href="/legal/privacy-policy">Privacy Policy</Link> for full details.</li>
                </ul>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
} 