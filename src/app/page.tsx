"use client";
import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { FaCarSide, FaShieldAlt, FaTools, FaBolt } from "react-icons/fa";
import HeroFilter from "@/components/home/HeroFilter";
import CarCarousel from "@/components/home/CarCarousel";
import FeatureTile from "@/components/home/FeatureTile";
import { Car } from "@/components/home/CarCard";
import Footer from "@/components/layout/Footer";
import { useBookings } from "@/hooks/useSupabase";
import { Booking } from "@/lib/supabase/utils";

export default function HomePage() {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { bookings: recentBookings, loading: recentLoading } = useBookings();
  const [currentSlide, setCurrentSlide] = useState(0);
  const slideInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchCars = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/cars/available');
        const data = await response.json();
        
        if (data.success) {
          setCars(data.cars);
          if (data.cars.length === 0) {
            setError('No cars available at the moment. Please check back later.');
          }
        } else {
          console.error('Error fetching available cars:', data.error);
          setError('Failed to load cars. Please try again later.');
          setCars([]);
        }
      } catch (err) {
        console.error('Error fetching cars:', err);
        setError('Failed to load cars. Please try again later.');
        setCars([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCars();
  }, []);

  useEffect(() => {
    if (recentBookings.length > 1) {
      slideInterval.current = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % recentBookings.length);
      }, 3500);
      return () => {
        if (slideInterval.current) clearInterval(slideInterval.current);
      };
    }
  }, [recentBookings]);

  const timeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  return (
    <>
      <div className="bg-gray-50 min-h-screen">
        {/* Hero Section */}
        <section className="bg-blue-600 text-white pt-6 pb-4 sm:pt-10 sm:pb-0 relative overflow-hidden px-2 sm:px-6 lg:px-0 min-h-[220px] sm:min-h-[420px] flex items-start justify-start">
          <div className="absolute inset-0 bg-[url('/hero.jpg')] bg-cover bg-center opacity-20" />
          <div className="relative z-10 max-w-6xl mx-auto flex flex-col-reverse sm:flex-row items-center justify-between gap-8 w-full mt-0 sm:mt-2">
            {/* Car image on left, filter box on right for desktop; only filter on mobile */}
            <div className="flex-1 w-full flex flex-col items-start justify-start relative z-10 order-1 sm:order-none">
              {/* Large background slogan - hidden on mobile */}
              <div className="hidden sm:block pointer-events-none absolute top-0 lg:top-2 left-2 md:left-4 z-0">
                <span className="block text-[2.5rem] md:text-6xl lg:text-7xl font-extrabold uppercase text-white/60 leading-none tracking-tight select-none" style={{lineHeight:'1.05'}}>FIND THE BEST</span>
                <span className="block text-[2.5rem] md:text-6xl lg:text-7xl font-extrabold uppercase text-white/60 leading-none tracking-tight select-none" style={{lineHeight:'1.05'}}>PCO</span>
              </div>
              {/* Car image over slogan - hidden on mobile */}
              <div className="hidden sm:block relative z-10 w-full max-w-2xl mx-auto mt-8 overflow-hidden" style={{height:'320px'}}>
                <Image
                  src="/hero-car.png"
                  alt="Car"
                  width={1600}
                  height={700}
                  className="w-full h-full object-cover drop-shadow-xl"
                  priority
                />
              </div>
            </div>
            <div className="w-full max-w-md flex-shrink-0 flex items-center justify-center mx-auto sm:mx-0 my-8 sm:my-12 px-2 z-20 order-2 sm:order-none">
              <HeroFilter cars={cars || []} />
            </div>
          </div>
        </section>

        {/* Carousel Section */}
        <section className="max-w-6xl mx-auto px-4 py-14">
          {/* Recent Bookings Heading and Slide Animation as Card */}
          {recentLoading && (
            <div className="mb-8 text-center text-gray-500">Loading recent bookings…</div>
          )}
          {!recentLoading && recentBookings.length === 0 && (
            <div className="mb-8 text-center text-gray-400">No recent bookings found.</div>
          )}
          {!recentLoading && recentBookings.length > 0 && (
            <div className="mb-12 flex flex-col">
              <h2 className="text-xl font-bold text-gray-900 mb-3">Recent Bookings by Other Drivers</h2>
              <div className="w-full overflow-hidden" style={{maxWidth: '100%'}}>
                <div
                  className="flex transition-transform duration-700 ease-in-out"
                  style={{ transform: `translateX(-${currentSlide * 100}%)`, width: `${recentBookings.length * 260}px` }}
                >
                  {recentBookings.map((booking: Booking, idx: number) => (
                    <div
                      key={booking.id}
                      className="max-w-xs bg-white rounded-2xl shadow-lg border border-green-200 flex flex-col overflow-hidden"
                      style={{ height: '320px', minWidth: '260px', marginRight: idx !== recentBookings.length - 1 ? '16px' : 0 }}
                    >
                      {/* Car Image */}
                      <div className="w-full h-40 relative">
                        <img
                          src="/hero-car.png"
                          alt="BMW 5 Series"
                          className="object-cover w-full h-full"
                        />
                      </div>
                      {/* Card Content */}
                      <div className="flex-1 flex flex-col justify-between p-4 min-h-[120px]">
                        <div>
                          <div className="font-bold text-lg text-gray-900 mb-1 truncate">BMW 5 Series</div>
                          <div className="text-green-700 text-sm font-semibold mb-4">Booked {timeAgo(new Date(booking.start_date))}</div>
                        </div>
                        <div className="flex flex-col">
                          {/* Partner/company name */}
                          <span className="block text-xs font-semibold text-gray-700 truncate max-w-[200px] mb-2">
                            BMW Fleet
                          </span>
                          {/* Price */}
                          <span className="leading-none block" style={{ letterSpacing: '0.5px' }}>
                            <span className="text-blue-700 font-extrabold text-2xl">£{booking.total_amount}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Available cars
          </h2>
          {loading ? (
            <p>Loading…</p>
          ) : (
            <CarCarousel cars={cars?.slice(0, 12) || []} />
          )}
        </section>

        {/* Car Banners Grid Section */}
        <section className="max-w-7xl mx-auto px-4 mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* BMW 5 Series Banner */}
            <div className="bg-blue-600 rounded-3xl overflow-hidden flex flex-col h-full shadow-xl">
              <div className="flex-1 text-white p-8 flex flex-col justify-between">
                <div>
                  <h3 className="text-2xl font-extrabold mb-2">BMW 5 Series PCO Ready</h3>
                  <p className="text-base mb-4">Experience luxury and performance. The BMW 5 Series is now available for PCO drivers—book yours today and drive in style.</p>
                </div>
                <a href="/compare" className="inline-block bg-white text-blue-700 font-bold px-4 py-2 rounded-xl shadow hover:bg-blue-50 transition w-full lg:w-auto text-center">Explore BMW Cars</a>
              </div>
              <div className="flex items-end justify-center p-4 pt-0">
                <img src="/hero-car.png" alt="BMW 5 Series" className="w-full max-w-xs rounded-2xl shadow-lg object-contain" />
              </div>
            </div>
            {/* MG5 EV Banner */}
            <div className="bg-green-600 rounded-3xl overflow-hidden flex flex-col h-full shadow-xl">
              <div className="flex-1 text-white p-8 flex flex-col justify-between">
                <div>
                  <h3 className="text-2xl font-extrabold mb-2">MG5 EV: More Miles, Less Cost.</h3>
                  <p className="text-base mb-4">Electric PCO rentals in London made easy.</p>
                </div>
                <a href="/compare" className="inline-block bg-white text-green-700 font-bold px-4 py-2 rounded-xl shadow hover:bg-green-50 transition w-full lg:w-auto text-center">Explore MG Cars</a>
              </div>
              <div className="flex items-end justify-center p-4 pt-0">
                <img src="/cars/mg5.png" alt="MG5 EV" className="w-full max-w-xs rounded-2xl shadow-lg object-contain" />
              </div>
            </div>
            {/* Kia Niro Banner */}
            <div className="bg-blue-600 rounded-3xl overflow-hidden flex flex-col h-full shadow-xl">
              <div className="flex-1 text-white p-8 flex flex-col justify-between">
                <div>
                  <h3 className="text-2xl font-extrabold mb-2">Drive the Kia Niro: Smarter, Cleaner, Cheaper.</h3>
                  <p className="text-base mb-4">Discover unbeatable PCO rental deals today.</p>
                </div>
                <a href="/compare" className="inline-block bg-white text-blue-700 font-bold px-4 py-2 rounded-xl shadow hover:bg-blue-50 transition w-full lg:w-auto text-center">Compare Kia Niro</a>
              </div>
              <div className="flex items-end justify-center p-4 pt-0">
                <img src="/cars/kia-niro.png" alt="Kia Niro" className="w-full max-w-xs rounded-2xl shadow-lg object-contain" />
              </div>
            </div>
            {/* MG4 Banner */}
            <div className="bg-green-600 rounded-3xl overflow-hidden flex flex-col h-full shadow-xl">
              <div className="flex-1 text-white p-8 flex flex-col justify-between">
                <div>
                  <h3 className="text-2xl font-extrabold mb-2">Go Further with MG4 – London Ready.</h3>
                  <p className="text-base mb-4">Fast bookings, top-rated partners, and 0% emissions.</p>
                </div>
                <a href="/compare" className="inline-block bg-white text-green-700 font-bold px-4 py-2 rounded-xl shadow hover:bg-green-50 transition w-full lg:w-auto text-center">Find Your MG4</a>
              </div>
              <div className="flex items-end justify-center p-4 pt-0">
                <img src="/cars/mg4.png" alt="MG4" className="w-full max-w-xs rounded-2xl shadow-lg object-contain" />
              </div>
            </div>
          </div>
        </section>

        {/* Feature Tiles */}
        <section className="bg-white py-24 mt-12">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-10 text-center">
              Why book with ComparePCO?
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <FeatureTile
                icon={FaCarSide}
                title="Wide Choice"
                text="Electric, hybrid or petrol – we list every PCO-ready vehicle type."
              />
              <FeatureTile
                icon={FaShieldAlt}
                title="Verified Partners"
                text="All rental partners are vetted for compliance and service."
              />
              <FeatureTile
                icon={FaTools}
                title="Maintenance Included"
                text="Most deals include servicing & insurance so you can just drive."
              />
              <FeatureTile
                icon={FaBolt}
                title="Instant Booking"
                text="Reserve a car online in minutes – no phone calls needed."
              />
            </div>
          </div>
        </section>
      </div>
      
      <Footer />
    </>
  );
} 