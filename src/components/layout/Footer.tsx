import React from 'react';
import Link from 'next/link';
import { FaFacebookF, FaYoutube, FaInstagram, FaTiktok, FaArrowUp } from 'react-icons/fa';

const socialLinks = [
  { href: '#', label: 'Facebook', icon: FaFacebookF },
  { href: '#', label: 'YouTube', icon: FaYoutube },
  { href: '#', label: 'Instagram', icon: FaInstagram },
  { href: '#', label: 'TikTok', icon: FaTiktok },
];

const linkColumns = [
  {
    title: 'ComparePCO',
    links: [
      { href: '/about', label: 'About us' },
      { href: '/contact', label: 'Contact us' },
      { href: '/services', label: 'Services' },
      { href: '/legal/privacy-policy', label: 'Privacy policy' },
      { href: '/legal/terms-and-conditions', label: 'Terms & conditions' },
    ],
  },
  {
    title: 'Guides',
    links: [
      { href: '/rental-advice', label: 'Rental advice' },
      { href: '/faq', label: 'FAQ' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 mt-16 text-gray-700 dark:text-gray-300">
      {/* Social bar */}
      <div className="max-w-7xl mx-auto px-4 py-10 text-center space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Follow us on social media</h3>
        <p className="text-gray-500 dark:text-gray-400">All the latest news for you</p>
        <div className="flex justify-center gap-6 pt-4">
          {socialLinks.map(({ href, label, icon: Icon }) => (
            <Link key={label} href={href} aria-label={label} className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition text-2xl">
              <Icon />
            </Link>
          ))}
        </div>
      </div>

      {/* Link columns */}
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Logo and copyright */}
        <div className="flex flex-col space-y-4">
          <Link href="/" className="text-2xl font-extrabold text-blue-700 dark:text-blue-400">COMPAREPCO</Link>
          <p className="text-sm text-gray-500 dark:text-gray-400">&copy; {new Date().getFullYear()} ComparePCO. All rights reserved.</p>
        </div>

        {/* Dynamic columns */}
        {linkColumns.map(col => (
          <div key={col.title} className="space-y-3">
            <h4 className="font-semibold text-gray-900 dark:text-white">{col.title}</h4>
            <ul className="space-y-2 text-sm">
              {col.links.map(link => (
                <li key={link.label}>
                  <Link href={link.href} className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </footer>
  );
} 