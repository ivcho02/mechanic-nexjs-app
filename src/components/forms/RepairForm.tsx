'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Client, Service, RepairData, RepairFormData, SelectedService } from '@/types';
import { getDictionaryClient, Dictionary } from '@/dictionaries/client';

// Extend the Dictionary type locally to include priceUnit
type ExtendedDictionary = Dictionary & {
  services: Dictionary['services'] & {
    priceUnit: string;
  }
};

export default function RepairForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const lang = params.lang as string || 'en';

  const clientIdFromUrl = searchParams.get('clientId');
  const repairIdFromUrl = searchParams.get('id');
  const isEditMode = !!repairIdFromUrl;

  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedService, setSelectedService] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [repairData, setRepairData] = useState<RepairData | null>(null);
  const [dict, setDict] = useState<ExtendedDictionary | null>(null);
  const [mounted, setMounted] = useState(false);
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

  // Load dictionary
  useEffect(() => {
    const loadDictionary = async () => {
      const dictionary = await getDictionaryClient(lang);
      setDict(dictionary as ExtendedDictionary);
    };

    loadDictionary();
    setMounted(true);
  }, [lang]);

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
          phone: client.phone,
          make: client.make,
          model: client.model,
          engineSize: client.engineSize,
          vin: client.vin || '',
        }));
      }
    } else {
      // Reset form if no client selected
      setFormData(prev => ({
        ...prev,
        ownerName: '',
        phone: '',
        make: '',
        model: '',
        engineSize: '',
        vin: '',
      }));
    }
  };

  const handleAddService = () => {
    if (selectedService) {
      const service = services.find(s => s.id === selectedService);
      if (service) {
        // Check if service is already added
        const isAlreadyAdded = formData.selectedServices.some(s => s.id === service.id);

        if (!isAlreadyAdded) {
          const newSelectedService: SelectedService = {
            id: service.id,
            name: service.name,
            price: service.price,
            description: service.description || '',
          };

          setFormData(prev => ({
            ...prev,
            selectedServices: [...prev.selectedServices, newSelectedService]
          }));
        }

        // Reset the service selector
        setSelectedService('');
      }
    }
  };

  const handleRemoveService = (serviceId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedServices: prev.selectedServices.filter(s => s.id !== serviceId)
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const repairDataToSave = {
        ...formData,
        cost: parseFloat(formData.cost),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      if (isEditMode && repairIdFromUrl) {
        // Update existing repair
        await updateDoc(doc(db, 'repairs', repairIdFromUrl), {
          ...repairDataToSave,
          updatedAt: serverTimestamp(),
        });
      } else {
        // Add new repair
        await addDoc(collection(db, 'repairs'), repairDataToSave);
      }

      router.push('/repairs');
    } catch (error) {
      console.error('Error saving repair:', error);
      alert('Error saving the repair!');
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted || !dict) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">
        {isEditMode ? dict.repairForm.editRepair : dict.repairForm.addRepair}
      </h1>

      {isLoading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-25 z-50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label htmlFor="clientId" className="block text-sm font-medium text-gray-700">
              {dict.repairForm.client}
            </label>
            <select
              id="clientId"
              value={selectedClient}
              onChange={handleClientChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              disabled={isEditMode}
            >
              <option value="">{dict.repairForm.selectClient}</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.ownerName} - {client.make} {client.model}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="ownerName" className="block text-sm font-medium text-gray-700">
              {dict.clientForm.ownerName}
            </label>
            <input
              type="text"
              id="ownerName"
              name="ownerName"
              value={formData.ownerName}
              onChange={handleChange}
              required
              disabled
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-100"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              {dict.clientForm.phone}
            </label>
            <input
              type="text"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              disabled
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-100"
            />
          </div>

          <div>
            <label htmlFor="make" className="block text-sm font-medium text-gray-700">
              {dict.clientForm.make}
            </label>
            <input
              type="text"
              id="make"
              name="make"
              value={formData.make}
              onChange={handleChange}
              disabled
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-100"
            />
          </div>

          <div>
            <label htmlFor="model" className="block text-sm font-medium text-gray-700">
              {dict.clientForm.model}
            </label>
            <input
              type="text"
              id="model"
              name="model"
              value={formData.model}
              onChange={handleChange}
              disabled
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-100"
            />
          </div>

          <div>
            <label htmlFor="engineSize" className="block text-sm font-medium text-gray-700">
              {dict.clientForm.engineSize}
            </label>
            <input
              type="text"
              id="engineSize"
              name="engineSize"
              value={formData.engineSize}
              onChange={handleChange}
              disabled
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-100"
            />
          </div>

          <div>
            <label htmlFor="vin" className="block text-sm font-medium text-gray-700">
              {dict.clientForm.vin}
            </label>
            <input
              type="text"
              id="vin"
              name="vin"
              value={formData.vin}
              onChange={handleChange}
              disabled
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-100"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="serviceId" className="block text-sm font-medium text-gray-700">
              {dict.repairForm.addService}
            </label>
            <div className="flex space-x-2">
              <select
                id="serviceId"
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className="flex-grow mt-1 block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">{dict.repairForm.service}</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name} - {service.price} {dict.services.priceUnit}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddService}
                disabled={!selectedService}
                className="mt-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400"
              >
                {dict.repairForm.addService}
              </button>
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {dict.repairForm.selectedServices}
            </label>
            {formData.selectedServices.length > 0 ? (
              <div className="border rounded-md divide-y">
                {formData.selectedServices.map((service) => (
                  <div key={service.id} className="flex justify-between items-center p-3">
                    <div>
                      <p className="font-medium">{service.name}</p>
                      {service.description && (
                        <p className="text-sm text-gray-500">{service.description}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="font-medium">{service.price} {dict.services.priceUnit}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveService(service.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
                <div className="p-3 bg-gray-50 flex justify-between">
                  <span className="font-bold">{dict.repairForm.totalCost}:</span>
                  <span className="font-bold">{formData.cost} {dict.services.priceUnit}</span>
                </div>
              </div>
            ) : (
              <div className="text-gray-500 italic">{dict.repairForm.noServicesSelected}</div>
            )}
          </div>

          <div className="md:col-span-2">
            <label htmlFor="additionalInfo" className="block text-sm font-medium text-gray-700">
              {dict.repairForm.notes}
            </label>
            <textarea
              id="additionalInfo"
              name="additionalInfo"
              value={formData.additionalInfo}
              onChange={handleChange}
              rows={3}
              placeholder={dict.repairForm.notesPlaceholder}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              {dict.repairForm.status}
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="Изпратена оферта">{dict.repairs.pending}</option>
              <option value="В процес">{dict.repairs.inProgress}</option>
              <option value="Завършен">{dict.repairs.completed}</option>
            </select>
          </div>

          <div className="flex justify-end space-x-4 md:col-span-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              disabled={isLoading}
            >
              {dict.repairForm.cancel}
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
              disabled={isLoading}
            >
              {isLoading ? dict.repairForm.loading : dict.repairForm.save}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}