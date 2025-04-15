'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getCarMakes, getCarModels, getCarEngines } from '@/lib/carData';
import { Client } from '@/types';

export default function ClientFormPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientId = searchParams.get('id');
  const isEditMode = !!clientId;

  const [formData, setFormData] = useState({
    ownerName: '',
    phone: '',
    make: '',
    model: '',
    engineSize: '',
    vin: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [carMakes, setCarMakes] = useState<string[]>([]);
  const [carModels, setCarModels] = useState<string[]>([]);
  const [engineSizes, setEngineSizes] = useState<string[]>([]);
  const [loading, setLoading] = useState({
    makes: false,
    models: false,
    details: false
  });

  // Fetch client data if in edit mode
  useEffect(() => {
    if (isEditMode && clientId) {
      fetchClient(clientId);
    }
  }, [clientId, isEditMode]);

  const fetchClient = async (id: string) => {
    setIsLoading(true);
    try {
      const clientDoc = await getDoc(doc(db, 'clients', id));
      if (clientDoc.exists()) {
        const clientData = clientDoc.data() as Client;
        setFormData({
          ownerName: clientData.ownerName || '',
          phone: clientData.phone || '',
          make: clientData.make || '',
          model: clientData.model || '',
          engineSize: clientData.engineSize || '',
          vin: clientData.vin || '',
        });
      } else {
        console.error("Client not found");
        router.push('/clients');
      }
    } catch (error) {
      console.error("Error fetching client:", error);
    } finally {
      setIsLoading(false);
    }
  };

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

      // Only reset model and engine size when make changes if not in edit mode
      // or if the models list doesn't include the current model
      if (!isEditMode || !models.includes(formData.model)) {
        setFormData(prev => ({
          ...prev,
          model: '',
          engineSize: ''
        }));
      }

      setLoading(prev => ({ ...prev, models: false }));
    }, 300);
  }, [formData.make, isEditMode, formData.model]);

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

      // Only auto-select or reset engine size if not in edit mode
      // or if the sizes list doesn't include the current engine size
      if (!isEditMode || !sizes.includes(formData.engineSize)) {
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
      }

      setLoading(prev => ({ ...prev, details: false }));
    }, 300);
  }, [formData.make, formData.model, isEditMode, formData.engineSize]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isEditMode && clientId) {
        // Update existing client
        await updateDoc(doc(db, 'clients', clientId), {
          ...formData,
          updatedAt: serverTimestamp(),
        });
      } else {
        // Add new client
        await addDoc(collection(db, 'clients'), {
          ...formData,
          createdAt: serverTimestamp(),
        });
      }

      router.push('/clients');
    } catch (error) {
      console.error('Error saving client:', error);
    } finally {
      setIsLoading(false);
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
      <h1 className="text-2xl font-bold mb-6">
        {isEditMode ? 'Редактиране на клиент' : 'Добавяне на нов клиент'}
      </h1>

      {isLoading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-25 z-50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}

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
            <label htmlFor="vin" className="block text-sm font-medium text-gray-700">
              VIN номер
            </label>
            <input
              type="text"
              id="vin"
              name="vin"
              value={formData.vin}
              onChange={handleChange}
              placeholder="WVWZZZ1JZ3W386752"
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

          <div className="flex justify-end space-x-4 mt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              disabled={isLoading}
            >
              Отказ
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
              disabled={isLoading}
            >
              {isLoading ? 'Запазване...' : isEditMode ? 'Запази промените' : 'Добави клиент'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}