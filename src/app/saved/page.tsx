'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase/client';
import CarCard from '../../components/home/CarCard';
import Link from 'next/link';

export default function SavedCarsPage() {
  const { user } = useAuth();
  const [savedCars, setSavedCars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [similarCars, setSimilarCars] = useState<any[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    const fetchSavedCars = async () => {
      try {
        // Fetch saved cars for this user
        const { data: savedCarsData, error: savedError } = await supabase
          .from('saved_cars')
          .select('car_id')
          .eq('user_id', user.id);

        if (savedError) {
          console.error('Error fetching saved cars:', savedError);
          setLoading(false);
          return;
        }

        if (!savedCarsData || savedCarsData.length === 0) {
          setSavedCars([]);
          setLoading(false);
          return;
        }

        // Fetch car data for each saved car
        const carIds = savedCarsData.map(item => item.car_id);
        const { data: carsData, error: carsError } = await supabase
          .from('cars')
          .select('*')
          .in('id', carIds);

        if (carsError) {
          console.error('Error fetching cars:', carsError);
          setLoading(false);
          return;
        }

        const filtered = carsData || [];
        setSavedCars(filtered);
        setLoading(false);

        // Load similar cars when some saved cars are unavailable
        const loadSimilar = async () => {
          const similarMap: Record<string, any> = {};
          
          for (const car of filtered) {
            if (!car) continue;
            if (car.is_available) continue;
            
            const make = car.make || '';
            if (!make) continue;
            
            const { data: similarData, error: similarError } = await supabase
              .from('cars')
              .select('*')
              .eq('make', make)
              .eq('is_available', true)
              .limit(3);

            if (!similarError && similarData) {
              similarData.forEach(similarCar => {
                if (!similarMap[similarCar.id]) {
                  similarMap[similarCar.id] = similarCar;
                }
              });
            }
          }
          
          setSimilarCars(Object.values(similarMap));
        };

        loadSimilar();
      } catch (error) {
        console.error('Error in fetchSavedCars:', error);
        setLoading(false);
      }
    };

    fetchSavedCars();
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center max-w-md w-full">
          <h1 className="text-3xl font-extrabold mb-3 text-blue-600">Saved Cars</h1>
          <p className="mb-6 text-gray-600 text-center">Sign in to view and manage your saved cars. Your favorite vehicles will appear here for quick access and future bookings.</p>
          <Link href="/auth/login" className="inline-block px-6 py-2 rounded-lg bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition">Log In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center text-blue-600">Saved Cars</h1>
        {loading ? (
          <div className="text-center text-gray-500">Loading...</div>
        ) : savedCars.length === 0 ? (
          <div className="text-center text-gray-500">You have no saved cars yet.</div>
        ) : (
          <div className="relative">
            {/* Left Arrow */}
            {savedCars.length > 3 && (
              <button
                onClick={() => scrollContainerRef.current?.scrollBy({ left: -300, behavior: 'smooth' })}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow rounded-full p-2 hover:bg-gray-100"
              >
                ◀
              </button>
            )}
            {/* Scrollable List */}
            <div
              ref={scrollContainerRef}
              className="flex gap-6 overflow-x-auto pb-4 scroll-smooth"
            >
              {savedCars.map(car => (
                <div key={car.id} className={`flex-shrink-0 w-72 ${!car.is_available ? 'opacity-50 grayscale' : ''}`}>
                  <CarCard car={car} />
                  {!car.is_available && (
                    <div className="text-center text-xs text-red-600 mt-2 font-semibold">Unavailable</div>
                  )}
                </div>
              ))}
            </div>
            {/* Right Arrow */}
            {savedCars.length > 3 && (
              <button
                onClick={() => scrollContainerRef.current?.scrollBy({ left: 300, behavior: 'smooth' })}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow rounded-full p-2 hover:bg-gray-100"
              >
                ▶
              </button>
            )}
          </div>
        )}

        {/* Similar Cars Section */}
        {similarCars.length > 0 && (
          <div className="mt-14">
            <h2 className="text-2xl font-bold mb-6 text-center">Similar Available Cars</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
              {similarCars.map(car => (
                <CarCard key={car.id} car={car} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 