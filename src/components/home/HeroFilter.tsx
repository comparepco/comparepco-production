import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaSearch } from 'react-icons/fa';
import { Car } from './CarCard';

interface Props {
  cars: Car[];
}

export default function HeroFilter({ cars }: Props) {
  const router = useRouter();

  // Form state
  const [selectedMake, setSelectedMake] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  // New filter states
  const [selectedCarSize, setSelectedCarSize] = useState('');
  const [selectedTransmission, setSelectedTransmission] = useState('');
  const [selectedInsurance, setSelectedInsurance] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const makeOptions = useMemo(() => {
    const set = new Set<string>();
    if (cars && Array.isArray(cars)) {
      cars.forEach((c) => c.make && set.add(c.make));
    }
    return Array.from(set);
  }, [cars]);

  const modelOptions = useMemo(() => {
    const set = new Set<string>();
    if (cars && Array.isArray(cars)) {
      cars.forEach((c) => {
        if (c.make === selectedMake && c.model) set.add(c.model);
      });
    }
    return Array.from(set);
  }, [cars, selectedMake]);

  const carSizeOptions = ['','Small','Medium','Large','SUV','MPV'];
  const transmissionOptions = ['','Automatic','Manual'];
  const insuranceOptions = ['','Included','Not included'];
  const categoryOptions = ['', 'X', 'EXEC', 'LUX', 'COMFORT', 'GREEN', 'PET'];

  const handleSearch = () => {
    const qs = new URLSearchParams();
    if (selectedMake) qs.set('make', selectedMake);
    if (selectedModel) qs.set('model', selectedModel);
    if (minPrice) qs.set('min', minPrice);
    if (maxPrice) qs.set('max', maxPrice);
    if (selectedCategory) qs.set('category', selectedCategory);
    if (selectedCarSize) qs.set('size', selectedCarSize);
    if (selectedTransmission) qs.set('transmission', selectedTransmission);
    if (selectedInsurance) qs.set('insurance', selectedInsurance);
    router.push(`/compare?${qs.toString()}`);
  };

  const reset = () => {
    setSelectedMake('');
    setSelectedModel('');
    setMinPrice('');
    setMaxPrice('');
    setSelectedCategory('');
    setSelectedCarSize('');
    setSelectedTransmission('');
    setSelectedInsurance('');
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-md">
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Make */}
        <select
          value={selectedMake}
          onChange={(e) => {
            setSelectedMake(e.target.value);
            setSelectedModel('');
          }}
          className="w-full px-5 py-4 rounded-full border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Make</option>
          {makeOptions.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        {/* Model */}
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          disabled={!selectedMake}
          className={`w-full px-5 py-4 rounded-full border focus:outline-none ${
            selectedMake ? 'border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500' : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
          }`}
        >
          <option value="">Model</option>
          {modelOptions.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Min Price */}
        <input
          type="number"
          placeholder="Min Price"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
          className="w-full px-5 py-4 rounded-full border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {/* Max Price */}
        <input
          type="number"
          placeholder="Max Price"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          className="w-full px-5 py-4 rounded-full border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Car Size */}
        <select
          value={selectedCarSize}
          onChange={(e) => setSelectedCarSize(e.target.value)}
          className="w-full px-5 py-4 rounded-full border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Car Size</option>
          {carSizeOptions.slice(1).map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
        {/* Transmission */}
        <select
          value={selectedTransmission}
          onChange={(e) => setSelectedTransmission(e.target.value)}
          className="w-full px-5 py-4 rounded-full border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Transmission</option>
          {transmissionOptions.slice(1).map((trans) => (
            <option key={trans} value={trans}>
              {trans}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Insurance */}
        <select
          value={selectedInsurance}
          onChange={(e) => setSelectedInsurance(e.target.value)}
          className="w-full px-5 py-4 rounded-full border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Insurance</option>
          {insuranceOptions.slice(1).map((ins) => (
            <option key={ins} value={ins}>
              {ins}
            </option>
          ))}
        </select>
        {/* Category */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full px-5 py-4 rounded-full border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Category</option>
          {categoryOptions.slice(1).map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleSearch}
          className="flex-1 bg-blue-600 text-white py-4 px-6 rounded-full font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          <FaSearch className="w-4 h-4" />
          Search Cars
        </button>
        <button
          onClick={reset}
          className="px-6 py-4 border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 transition-colors"
        >
          Reset
        </button>
      </div>
    </div>
  );
}