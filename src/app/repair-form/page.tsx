'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Client, Service, RepairData, RepairFormData, SelectedService } from '@/types';

export default function RepairFormPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientIdFromUrl = searchParams.get('clientId');
  const repairIdFromUrl = searchParams.get('id');
  const isEditMode = !!repairIdFromUrl;

  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedService, setSelectedService] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [repairData, setRepairData] = useState<RepairData | null>(null);
  const [formData, setFormData] = useState<RepairFormData>({
    ownerName: '',
    phone: '',
    make: '',
    model: '',
    engineSize: '',
    vin: '',
    repairs: '',
    selectedServices: [],
    cost: '',
    additionalInfo: '',
    status: 'Изпратена оферта',
  });

  // First load clients and services
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchClients(), fetchServices()]);
      setIsLoading(false);
    };

    loadData();
  }, []);

  // Then fetch repair data if in edit mode
  useEffect(() => {
    if (repairIdFromUrl) {
      fetchRepair(repairIdFromUrl);
    }
  }, [repairIdFromUrl]);

  // Set the matching client when clients are loaded and we have repair data
  useEffect(() => {
    if (repairData && clients.length > 0) {
      // Find client and set as selected
      const clientId = clients.find(c =>
        c.ownerName === repairData.ownerName &&
        c.make === repairData.make &&
        c.model === repairData.model
      )?.id;

      if (clientId) {
        console.log('Found matching client:', clientId);
        setSelectedClient(clientId);
      }
    }
  }, [repairData, clients]);

  // Effect to handle client selection from URL parameter (for new repairs)
  useEffect(() => {
    if (clientIdFromUrl && clients.length > 0 && !isEditMode) {
      setSelectedClient(clientIdFromUrl);
      const client = clients.find(c => c.id === clientIdFromUrl);
      if (client) {
        setFormData(prev => ({
          ...prev,
          ownerName: client.ownerName,
          make: client.make,
          model: client.model,
          engineSize: client.engineSize,
          phone: client.phone,
          vin: client.vin || '',
        }));
      }
    }
  }, [clientIdFromUrl, clients, isEditMode]);

  // Calculate total cost when selectedServices changes
  useEffect(() => {
    if (formData.selectedServices.length > 0) {
      const totalCost = formData.selectedServices.reduce((sum, service) => sum + service.price, 0);
      setFormData(prev => ({
        ...prev,
        cost: totalCost.toString()
      }));

      // Update repairs field with list of service names
      const serviceNames = formData.selectedServices.map(s => s.name).join('\n');
      setFormData(prev => ({
        ...prev,
        repairs: serviceNames
      }));
    }
  }, [formData.selectedServices]);

  const fetchRepair = async (repairId: string) => {
    setIsLoading(true);
    try {
      const repairDoc = await getDoc(doc(db, 'repairs', repairId));
      if (repairDoc.exists()) {
        const data = repairDoc.data();
        setRepairData(data);

        // If there's no selectedServices array (old format), create it from repairs and cost
        const selectedServices = data.selectedServices || [];

        setFormData({
          ownerName: data.ownerName || '',
          phone: data.phone || '',
          make: data.make || '',
          model: data.model || '',
          engineSize: data.engineSize || '',
          vin: data.vin || '',
          repairs: data.repairs || '',
          selectedServices: selectedServices,
          cost: data.cost ? data.cost.toString() : '',
          additionalInfo: data.additionalInfo || '',
          status: data.status || 'Изпратена оферта',
        });
      }
    } catch (error) {
      console.error("Error fetching repair:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const q = query(collection(db, 'clients'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const clientsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ownerName: doc.data().ownerName,
        phone: doc.data().phone || '',
        make: doc.data().make,
        model: doc.data().model,
        engineSize: doc.data().engineSize,
        vin: doc.data().vin || '',
      }));

      // Remove duplicates based on ownerName
      const uniqueClients = clientsData.reduce((acc: Client[], current) => {
        const x = acc.find(item => item.ownerName === current.ownerName);
        if (!x) {
          return acc.concat([current]);
        } else {
          return acc;
        }
      }, []);

      setClients(uniqueClients);
      console.log('Clients loaded:', uniqueClients.length);
      return uniqueClients;
    } catch (error) {
      console.error("Error fetching clients:", error);
      return [];
    }
  };

  const fetchServices = async () => {
    try {
      const q = query(collection(db, 'services'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const servicesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        price: doc.data().price,
        description: doc.data().description,
      })) as Service[];
      setServices(servicesData);
      console.log('Services loaded:', servicesData.length);
      return servicesData;
    } catch (error) {
      console.error("Error fetching services:", error);
      return [];
    }
  };

  const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const clientId = e.target.value;
    setSelectedClient(clientId);

    if (clientId) {
      const client = clients.find(c => c.id === clientId);
      if (client) {
        setFormData(prev => ({
          ...prev,
          ownerName: client.ownerName,
          make: client.make,
          model: client.model,
          engineSize: client.engineSize,
          phone: client.phone,
          vin: client.vin || '',
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        ownerName: '',
        make: '',
        model: '',
        engineSize: '',
        phone: '',
        vin: '',
      }));
    }
  };

  const handleServiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const serviceId = e.target.value;
    setSelectedService(serviceId);
  };

  const addService = () => {
    if (!selectedService) return;

    const service = services.find(s => s.id === selectedService);
    if (!service) return;

    // Check if service is already added
    if (formData.selectedServices.some(s => s.id === service.id)) {
      return;
    }

    // Add service to the list
    const newSelectedService: SelectedService = {
      id: service.id,
      name: service.name,
      price: service.price
    };

    setFormData(prev => ({
      ...prev,
      selectedServices: [...prev.selectedServices, newSelectedService]
    }));

    // Reset selected service dropdown
    setSelectedService('');
  };

  const removeService = (serviceId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedServices: prev.selectedServices.filter(s => s.id !== serviceId)
    }));
  };

  const handleCustomService = (e: React.FormEvent) => {
    e.preventDefault();

    const customServiceName = (document.getElementById('customServiceName') as HTMLInputElement).value;
    const customServicePrice = (document.getElementById('customServicePrice') as HTMLInputElement).value;

    if (!customServiceName || !customServicePrice) return;

    // Create a custom service
    const newCustomService: SelectedService = {
      id: `custom-${Date.now()}`,
      name: customServiceName,
      price: parseFloat(customServicePrice),
    };

    setFormData(prev => ({
      ...prev,
      selectedServices: [...prev.selectedServices, newCustomService]
    }));

    // Clear form fields
    (document.getElementById('customServiceName') as HTMLInputElement).value = '';
    (document.getElementById('customServicePrice') as HTMLInputElement).value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!selectedClient && !isEditMode) {
        alert('Моля, изберете клиент');
        setIsLoading(false);
        return;
      }

      if (formData.selectedServices.length === 0) {
        alert('Моля, добавете поне една услуга');
        setIsLoading(false);
        return;
      }

      const dataToSave = {
        ...formData,
        cost: parseFloat(formData.cost),
      };

      if (isEditMode) {
        // Update existing repair
        await updateDoc(doc(db, 'repairs', repairIdFromUrl!), {
          ...dataToSave,
          updatedAt: serverTimestamp(),
        });
      } else {
        // Add new repair
        await addDoc(collection(db, 'repairs'), {
          ...dataToSave,
          createdAt: serverTimestamp(),
        });
      }

      router.push('/repairs');
    } catch (error) {
      console.error('Error saving repair:', error);
      alert('Грешка при запис на ремонта. Моля опитайте отново.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">{isEditMode ? 'Редактиране на ремонт' : 'Нов ремонт'}</h1>

      {isLoading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-25 z-50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}

      {clientIdFromUrl && selectedClient && !isEditMode && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-blue-800">Клиентът е предварително избран от предишната страница.</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Клиент
            </label>
            <select
              className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md ${
                clientIdFromUrl ? 'border-blue-500 bg-blue-50' : ''
              }`}
              value={selectedClient}
              onChange={handleClientChange}
              required={!isEditMode}
              disabled={isEditMode}
            >
              <option value="">Избери клиент</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.ownerName} - {client.make} {client.model}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              Статус
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Изпратена оферта">Изпратена оферта</option>
              <option value="В процес">В процес</option>
              <option value="Завършен">Завършен</option>
              <option value="Отказан">Отказан</option>
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Телефон на клиента
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
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

          <div className="md:col-span-2 space-y-2 border-t border-gray-200 pt-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-medium text-gray-900">Услуги</h3>
              <span className="text-sm text-gray-500">Общо: {parseFloat(formData.cost).toFixed(2)} лв.</span>
            </div>

            {/* Selected services list */}
            {formData.selectedServices.length > 0 ? (
              <div className="mb-4 bg-gray-50 rounded-md p-3">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Избрани услуги:</h4>
                <ul className="divide-y divide-gray-200">
                  {formData.selectedServices.map((service) => (
                    <li key={service.id} className="py-2 flex justify-between items-center">
                      <div>
                        <span className="font-medium">{service.name}</span>
                        <span className="ml-2 text-gray-600">{service.price.toFixed(2)} лв.</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeService(service.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-md">
                Няма избрани услуги. Моля, добавете поне една услуга.
              </div>
            )}

            {/* Add service from list */}
            <div className="flex space-x-2">
              <select
                id="service"
                value={selectedService}
                onChange={handleServiceChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Избери услуга</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name} - {service.price} лв.
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={addService}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex-shrink-0"
                disabled={!selectedService}
              >
                Добави
              </button>
            </div>

            {/* Custom service form */}
            <div className="mt-4 border-t border-gray-200 pt-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Добави ръчно услуга:</h4>
              <div className="flex flex-wrap gap-2">
                <input
                  type="text"
                  id="customServiceName"
                  placeholder="Име на услугата"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  id="customServicePrice"
                  placeholder="Цена"
                  step="0.01"
                  min="0"
                  className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleCustomService}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Добави ръчно
                </button>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 space-y-2">
            <label htmlFor="additionalInfo" className="block text-sm font-medium text-gray-700">
              Допълнителна информация
            </label>
            <textarea
              id="additionalInfo"
              name="additionalInfo"
              value={formData.additionalInfo}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            disabled={isLoading}
          >
            Отказ
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            disabled={isLoading}
          >
            {isLoading ? 'Запазване...' : 'Запази'}
          </button>
        </div>
      </form>
    </div>
  );
}