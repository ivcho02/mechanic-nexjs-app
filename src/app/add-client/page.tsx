'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getCarMakes, getCarModels, getCarEngines } from '@/lib/carData';

export default function AddClientPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    ownerName: '',
    phone: '',
    make: '',
    model: '',
    engineSize: '',
  });

  const [carMakes, setCarMakes] = useState<string[]>([]);
  const [carModels, setCarModels] = useState<string[]>([]);
  const [engineSizes, setEngineSizes] = useState<string[]>([]);
  const [loading, setLoading] = useState({
    makes: false,
    models: false,
    details: false
  });

  // Fetch car makes immediately from our static database
  useEffect(() => {
    setLoading(prev => ({ ...prev, makes: true }));
    // Simulate a slight delay for better UI feedback
    setTimeout(() => {
      const makes = getCarMakes();
      setCarMakes(makes);
      setLoading(prev => ({ ...prev, makes: false }));
    }, 300);
  }, []);

  // Get car models when make changes
  useEffect(() => {
    if (!formData.make) {
      setCarModels([]);
      return;
    }

    setLoading(prev => ({ ...prev, models: true }));
    // Simulate a slight delay for better UI feedback
    setTimeout(() => {
      const models = getCarModels(formData.make);
      setCarModels(models);

      // Reset model and engine size when make changes
      setFormData(prev => ({
        ...prev,
        model: '',
        engineSize: ''
      }));

      setLoading(prev => ({ ...prev, models: false }));
    }, 300);
  }, [formData.make]);

  // Get engine sizes when model changes
  useEffect(() => {
    if (!formData.make || !formData.model) {
      setEngineSizes([]);
      return;
    }

    setLoading(prev => ({ ...prev, details: true }));
    // Simulate a slight delay for better UI feedback
    setTimeout(() => {
      const sizes = getCarEngines(formData.make, formData.model);
      setEngineSizes(sizes);

      if (sizes.length === 1) {
        // If only one engine size is available, select it automatically
        setFormData(prev => ({
          ...prev,
          engineSize: sizes[0]
        }));
      } else {
        // Reset engine size when model changes and multiple options exist
        setFormData(prev => ({
          ...prev,
          engineSize: ''
        }));
      }

      setLoading(prev => ({ ...prev, details: false }));
    }, 300);
  }, [formData.make, formData.model]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await addDoc(collection(db, 'clients'), {
        ...formData,
        createdAt: serverTimestamp(),
      });

      router.push('/clients');
    } catch (error) {
      console.error('Error adding client:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCustomEngineSize = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      engineSize: value,
    }));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Добавяне на нов клиент</h1>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow">
        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-2">
            <label htmlFor="ownerName" className="block text-sm font-medium text-gray-700">
              Име на собственика
            </label>
            <input
              type="text"
              id="ownerName"
              name="ownerName"
              value={formData.ownerName}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Телефонен номер
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              placeholder="0888 123 456"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="make" className="block text-sm font-medium text-gray-700">
              Марка
            </label>
            <select
              id="make"
              name="make"
              value={formData.make}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Избери марка</option>
              {carMakes.map((make) => (
                <option key={make} value={make}>
                  {make}
                </option>
              ))}
            </select>
            {loading.makes && (
              <div className="text-sm text-gray-500">Зареждане на марки...</div>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="model" className="block text-sm font-medium text-gray-700">
              Модел
            </label>
            <select
              id="model"
              name="model"
              value={formData.model}
              onChange={handleChange}
              required
              disabled={!formData.make || loading.models}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
            >
              <option value="">Избери модел</option>
              {carModels.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
            {loading.models && (
              <div className="text-sm text-gray-500">Зареждане на модели...</div>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="engineSize" className="block text-sm font-medium text-gray-700">
              Обем на двигателя
            </label>
            <div className="flex flex-col space-y-2">
              {engineSizes.length > 0 ? (
                <select
                  id="engineSize"
                  name="engineSize"
                  value={formData.engineSize}
                  onChange={handleChange}
                  required
                  disabled={!formData.model || loading.details}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                >
                  <option value="">Избери обем на двигателя</option>
                  {engineSizes.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  id="engineSize"
                  name="engineSize"
                  value={formData.engineSize}
                  onChange={handleCustomEngineSize}
                  placeholder={formData.model ? "Въведи обем на двигателя" : "Първо избери марка и модел"}
                  required
                  disabled={!formData.model}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                />
              )}
              {loading.details && (
                <div className="text-sm text-gray-500">Зареждане на данни за двигателя...</div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Отказ
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Запази
          </button>
        </div>
      </form>
    </div>
  );
}