import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  carCount: number;
}

export default function HeroSearch({ carCount }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState('');

  const handleSubmit = () => {
    const qs = new URLSearchParams();
    if (search) qs.set('search', search);
    router.push(`/compare?${qs.toString()}`);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md space-y-3">
      <input
        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Search make or model"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <button
        onClick={handleSubmit}
        className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
      >
        <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        Search {carCount.toLocaleString()} cars
      </button>
    </div>
  );
} 