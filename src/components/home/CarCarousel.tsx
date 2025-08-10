import React, { useRef } from 'react';
import CarCard, { Car } from './CarCard';

export default function CarCarousel({ cars }: { cars: Car[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  if (!cars.length) return null;

  const scroll = (dir: 'left' | 'right') => {
    if (scrollRef.current) {
      const amount = dir === 'left' ? -300 : 300;
      scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative">
      {/* Left Arrow */}
      <button
        type="button"
        className="hidden md:flex items-center justify-center absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow rounded-full w-10 h-10 hover:bg-blue-100 transition"
        style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
        onClick={() => scroll('left')}
        aria-label="Scroll left"
      >
        <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      {/* Right Arrow */}
      <button
        type="button"
        className="hidden md:flex items-center justify-center absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow rounded-full w-10 h-10 hover:bg-blue-100 transition"
        style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
        onClick={() => scroll('right')}
        aria-label="Scroll right"
      >
        <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
      <div ref={scrollRef} className="overflow-x-auto pb-4 -mx-4 px-4 scroll-smooth">
        <div className="flex space-x-4">
          {cars.map(car => (
            <CarCard key={car.id} car={car} />
          ))}
        </div>
      </div>
    </div>
  );
} 