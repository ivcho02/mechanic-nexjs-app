'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getCarMakes, getCarModels, getCarEngines } from '@/lib/carData';
import { Client } from '@/types';
import { getDictionaryClient, Dictionary } from '@/dictionaries/client';

interface ClientFormProps {
  lang?: string;
}

export default function ClientForm({ lang = 'en' }: ClientFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientId = searchParams.get('id');
  const isEditMode = !!clientId;
  const [dict, setDict] = useState<Dictionary | null>(null);
  const [mounted, setMounted] = useState(false);

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

  useEffect(() => {
    const loadDictionary = async () => {
      const dictionary = await getDictionaryClient(lang);
      setDict(dictionary);
    };

    loadDictionary();
    setMounted(true);
  }, [lang]);

  // Define fetchClient with useCallback before using it in useEffect
  const fetchClient = useCallback(async (id: string) => {
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
        router.push(`/${lang}/clients`);
      }
    } catch (error) {
      console.error("Error fetching client:", error);
    } finally {
      setIsLoading(false);
    }
  }, [router, lang, setFormData]);

  // Fetch client data if in edit mode
  useEffect(() => {
    if (isEditMode && clientId) {
      fetchClient(clientId);
    }
  }, [clientId, isEditMode, fetchClient]);

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
      try {
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
        } else {
          console.log(`Keeping current model: ${formData.model}`);
        }
      } catch (error) {
        console.error('Error fetching car models:', error);
        setCarModels([]);
      } finally {
        setLoading(prev => ({ ...prev, models: false }));
      }
    }, 300);
  }, [formData.make, isEditMode]);

  // Get engine sizes when model changes
  useEffect(() => {
    if (!formData.make || !formData.model) {
      setEngineSizes([]);
      return;
    }

    setLoading(prev => ({ ...prev, details: true }));
    // Simulate a slight delay for better UI feedback
    setTimeout(() => {
      try {
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
        } else {
          console.log(`Keeping current engine size: ${formData.engineSize}`);
        }
      } catch (error) {
        console.error('Error fetching engine sizes:', error);
        setEngineSizes([]);
      } finally {
        setLoading(prev => ({ ...prev, details: false }));
      }
    }, 300);
  }, [formData.make, formData.model, isEditMode]);

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

      router.push(`/${lang}/clients`);
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

  if (!mounted || !dict) {
    return null; // Prevent rendering during hydration
  }

  // Translations
  const formTitle = isEditMode
    ? dict.clientForm.editClient
    : dict.clientForm.addClient;
  const ownerNameLabel = dict.clientForm.ownerName;
  const phoneLabel = dict.clientForm.phone;
  const makeLabel = dict.clientForm.make;
  const modelLabel = dict.clientForm.model;
  const engineSizeLabel = dict.clientForm.engineSize;
  const vinLabel = dict.clientForm.vin;
  const selectMakeText = dict.clientForm.selectMake;
  const selectModelText = dict.clientForm.selectModel;
  const selectEngineSizeText = dict.clientForm.selectEngineSize;
  const customEngineSizeText = dict.clientForm.customEngineSize;
  const cancelButtonText = dict.clientForm.cancel;
  const saveButtonText = dict.clientForm.save;
  const loadingText = dict.clientForm.loading;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">
        {formTitle}
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
              {ownerNameLabel}
            </label>
            <input
              type="text"
              id="ownerName"
              name="ownerName"
              value={formData.ownerName}
              onChange={handleChange}
              required
              className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              {phoneLabel}
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="make" className="block text-sm font-medium text-gray-700">
              {makeLabel}
            </label>
            <div className="relative">
              <select
                id="make"
                name="make"
                value={formData.make}
                onChange={handleChange}
                required
                className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 appearance-none"
              >
                <option value="">{selectMakeText}</option>
                {carMakes.map(make => (
                  <option key={make} value={make}>{make}</option>
                ))}
              </select>
              {loading.makes && (
                <div className="absolute right-2 top-2">
                  <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="model" className="block text-sm font-medium text-gray-700">
              {modelLabel}
            </label>
            <div className="relative">
              <select
                id="model"
                name="model"
                value={formData.model}
                onChange={handleChange}
                required
                disabled={!formData.make || loading.models}
                className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 appearance-none disabled:bg-gray-100 disabled:text-gray-500"
              >
                <option value="">{selectModelText}</option>
                {carModels.map(model => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
              {loading.models && (
                <div className="absolute right-2 top-2">
                  <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="engineSize" className="block text-sm font-medium text-gray-700">
              {engineSizeLabel}
            </label>
            <div className="relative">
              <select
                id="engineSize"
                name="engineSize"
                value={formData.engineSize}
                onChange={handleChange}
                required
                disabled={!formData.model || loading.details}
                className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 appearance-none disabled:bg-gray-100 disabled:text-gray-500"
              >
                <option value="">{selectEngineSizeText}</option>
                {engineSizes.map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
              {loading.details && (
                <div className="absolute right-2 top-2">
                  <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              )}
            </div>

            {formData.model && engineSizes.length === 0 && !loading.details && (
              <div className="mt-3">
                <label htmlFor="customEngineSize" className="block text-sm font-medium text-gray-700">
                  {customEngineSizeText}
                </label>
                <input
                  type="text"
                  id="customEngineSize"
                  value={formData.engineSize}
                  onChange={handleCustomEngineSize}
                  required
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="vin" className="block text-sm font-medium text-gray-700">
              {vinLabel}
            </label>
            <input
              type="text"
              id="vin"
              name="vin"
              value={formData.vin}
              onChange={handleChange}
              className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex justify-between pt-4">
            <button
              type="button"
              onClick={() => router.push(`/${lang}/clients`)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
            >
              {cancelButtonText}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 disabled:bg-blue-400"
            >
              {isLoading ? loadingText : saveButtonText}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}