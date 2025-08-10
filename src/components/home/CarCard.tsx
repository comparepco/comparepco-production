import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FaHeart, FaRegHeart, FaShieldAlt, FaExclamationTriangle } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';
import { saveCar, unsaveCar, isCarSaved } from '@/lib/supabase/utils';

export interface Car {
  id: string;
  name: string;
  make: string;
  model: string;
  pricePerWeek: number;
  salePricePerWeek?: number;
  imageUrl?: string;
  imageUrls?: string[];
  status?: string;
  insuranceIncluded?: boolean;
  pricing?: {
    minTermMonths?: number;
    depositRequired?: boolean;
    depositAmount?: number;
  };
  category?: string;
  fuelType?: string;
}

export default function CarCard({ car }: { car: Car }) {
  const img = car.imageUrl || car.imageUrls?.[0];
  const [saved, setSaved] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const { user } = useAuth();

  const toggleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setLoading(true);
    
    if (!user) {
      // TODO: Redirect to login or show login modal
      console.log('User must be logged in to save cars');
      setLoading(false);
      return;
    }

    try {
      if (saved) {
        await unsaveCar(user.id, car.id);
        setSaved(false);
      } else {
        await saveCar(user.id, car.id);
        setSaved(true);
      }
    } catch (error) {
      console.error('Error saving car:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-72 flex-shrink-0 bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-100 relative flex flex-col">
      <div className="relative w-full h-48 group">
        {img ? (
          <Image src={img} alt={car.name} fill className="object-cover transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">No Image</div>
        )}
        {car.imageUrls && car.imageUrls.length > 1 && (
          <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-0.5 bg-gray-800/70 text-white text-xs rounded-md">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M4 7h3l2-2h6l2 2h3a1 1 0 0 1 1 1v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a1 1 0 0 1 1-1Zm0 2v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9H4Zm8 1a3 3 0 1 1 0 6a3 3 0 0 1 0-6Zm0 2a1 1 0 1 0 0 2a1 1 0 0 0 0-2Z"/></svg>
            {car.imageUrls.length}
          </div>
        )}
        <button
          className="absolute top-3 right-3 text-2xl text-red-500 bg-white/80 rounded-full p-1 hover:bg-white shadow"
          onClick={toggleSave}
          disabled={loading}
          aria-label={saved ? 'Unsave car' : 'Save car'}
        >
          {saved ? <FaHeart /> : <FaRegHeart />}
        </button>
      </div>
      <div className="px-4 pt-4 pb-2 flex flex-col flex-1 text-sm text-gray-800">
        <div className="flex flex-col items-start mb-3">
          <div className="text-lg font-bold text-gray-900 mb-1">{car.make} {car.model}</div>
          <div className="flex items-end gap-2">
            {car.salePricePerWeek && car.salePricePerWeek < car.pricePerWeek ? (
              <>
                <span className="text-xl text-gray-400 line-through">£{Math.round(car.pricePerWeek)}</span>
                <span className="text-3xl font-extrabold text-red-600">£{Math.round(car.salePricePerWeek)}</span>
              </>
            ) : (
              <span className="text-3xl font-extrabold text-blue-600">£{Math.round(car.pricePerWeek)}</span>
            )}
            <span className="text-base text-gray-500 font-medium">/week</span>
          </div>
        </div>
        <div className="text-xs text-gray-500 mb-4">All prices include VAT. Book instantly!</div>
        {/* Tag layout: smart positioning based on tag count */}
        <div className="mb-4">
          {/* Count non-insurance tags */}
          {(() => {
            const nonInsuranceTags = [
              car.pricing?.minTermMonths,
              car.pricing?.depositRequired,
              car.fuelType,
              car.category
            ].filter(Boolean).length;
            
            const totalTags = nonInsuranceTags + (car.insuranceIncluded !== undefined ? 1 : 0);
            
            return (
              <>
                <div className="flex flex-wrap gap-2">
                  {car.pricing?.minTermMonths && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-indigo-100 text-indigo-800">
                      Min {car.pricing.minTermMonths} {car.pricing.minTermMonths === 1 ? 'month' : 'months'}
                    </span>
                  )}
                  {car.pricing?.depositRequired && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-800">
                      Deposit £{car.pricing.depositAmount}
                    </span>
                  )}
                  {car.fuelType && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-800">
                      {car.fuelType}
                    </span>
                  )}
                  {car.category && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800">
                      {car.category}
                    </span>
                  )}
                  {/* Put insurance on same line if more than 2 tags total */}
                  {car.insuranceIncluded !== undefined && totalTags > 2 && (
                    car.insuranceIncluded ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-800">
                        <FaShieldAlt className="w-3 h-3" /> Insurance Included
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-800">
                        <FaExclamationTriangle className="w-3 h-3" /> Insurance Not Included
                      </span>
                    )
                  )}
                </div>
                {/* Put insurance on separate line if 2 tags or fewer */}
                {car.insuranceIncluded !== undefined && totalTags <= 2 && (
                  <div className="mt-2">
                    {car.insuranceIncluded ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-800">
                        <FaShieldAlt className="w-3 h-3" /> Insurance Included
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-800">
                        <FaExclamationTriangle className="w-3 h-3" /> Insurance Not Included
                      </span>
                    )}
                  </div>
                )}
              </>
            );
          })()}
        </div>
        <Link href={`/cars/${car.id}`} className="mt-auto block">
          <div className="py-3 text-center w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow transition-transform duration-200 hover:scale-105">View Details</div>
        </Link>
      </div>
    </div>
  );
} 