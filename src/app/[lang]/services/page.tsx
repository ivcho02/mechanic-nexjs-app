'use client';

import { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Service } from '@/types';
import { useParams } from 'next/navigation';
import { getDictionaryClient, Dictionary } from '@/dictionaries/client';
import { fetchServices, deleteService } from '@/helpers/firebaseHelpers';

// Extend the Dictionary type to include missing properties
type ExtendedDictionary = Dictionary & {
  services: Dictionary['services'] & {
    notAvailable?: string;
    priceUnit: string;
    addService: string;
    name: string;
    deleteConfirmation: string;
    deleteConfirmationMessage: string;
  }
};

export default function ServicesPage() {
  const params = useParams();
  const lang = params.lang as string;

  const [services, setServices] = useState<Service[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
  });
  const [dict, setDict] = useState<ExtendedDictionary | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);

  useEffect(() => {
    const loadDictionary = async () => {
      const dictionary = await getDictionaryClient(lang);
      setDict(dictionary as ExtendedDictionary);
    };

    loadDictionary();
    setMounted(true);
    loadServices();
  }, [lang]);

  const loadServices = async () => {
    try {
      const servicesData = await fetchServices();
      setServices(servicesData);
    } catch (error) {
      console.error("Error loading services:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await addDoc(collection(db, 'services'), {
        ...formData,
        price: parseFloat(formData.price),
        createdAt: serverTimestamp(),
      });

      setFormData({
        name: '',
        price: '',
        description: '',
      });

      loadServices();
    } catch (error) {
      console.error('Error adding service:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const confirmDelete = (serviceId: string) => {
    setServiceToDelete(serviceId);
    setIsDeleting(true);
  };

  const handleDelete = async () => {
    if (!serviceToDelete) return;

    try {
      await deleteService(serviceToDelete);
      setServices(services.filter(service => service.id !== serviceToDelete));
      setIsDeleting(false);
      setServiceToDelete(null);
    } catch (error) {
      console.error('Error deleting service:', error);
    }
  };

  const cancelDelete = () => {
    setIsDeleting(false);
    setServiceToDelete(null);
  };

  if (!mounted || !dict) {
    return null; // Prevent rendering during hydration
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{dict.services.title}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">{dict.services.addNewService}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                {dict.services.serviceName}
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                {dict.services.price} ({dict.services.priceUnit})
              </label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                {dict.services.description}
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600"
            >
              {dict.services.addService}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <h2 className="text-xl font-semibold p-4 bg-gray-50 border-b">{dict.services.servicesList}</h2>
          {services.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {dict.services.name}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {dict.services.price}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                    {dict.services.actions}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {services.map((service) => (
                  <tr key={service.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <div className="relative group">
                        <span>{service.name}</span>
                        {service.description && (
                          <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-10 w-64 p-2 bg-gray-800 text-white text-xs rounded shadow-lg">
                            {service.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {service.price} {dict.services.priceUnit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                      <button
                        onClick={() => confirmDelete(service.id)}
                        className="text-red-600 hover:text-red-900"
                        title={dict.services.delete}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-4 text-center text-gray-500">{dict.services.noServices}</div>
          )}
        </div>
      </div>

      {isDeleting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-medium mb-4">{dict.services.deleteConfirmation || "Are you sure you want to delete this service?"}</h3>
            <p className="text-sm text-gray-600 mb-4">
              {dict.services.deleteConfirmationMessage || "This action cannot be undone."}
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md"
              >
                {dict.services.cancel}
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md"
              >
                {dict.services.delete}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}