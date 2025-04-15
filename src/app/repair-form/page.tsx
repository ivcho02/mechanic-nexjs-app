'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Client {
  id: string;
  ownerName: string;
  phone: string;
  make: string;
  model: string;
  engineSize: string;
}

interface Service {
  id: string;
  name: string;
  price: number;
  description: string;
}

type RepairStatus = 'Изпратена оферта' | 'В процес' | 'Завършен' | 'Отказан';

export default function RepairFormPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientIdFromUrl = searchParams.get('clientId');

  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedService, setSelectedService] = useState<string>('');
  const [formData, setFormData] = useState({
    ownerName: '',
    phone: '',
    make: '',
    model: '',
    engineSize: '',
    repairs: '',
    cost: '',
    additionalInfo: '',
    status: 'Изпратена оферта' as RepairStatus,
  });

  useEffect(() => {
    fetchClients();
    fetchServices();
  }, []);

  // Effect to handle client selection from URL parameter
  useEffect(() => {
    if (clientIdFromUrl && clients.length > 0) {
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
        }));
      }
    }
  }, [clientIdFromUrl, clients]);

  const fetchClients = async () => {
    const q = query(collection(db, 'clients'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const clientsData = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ownerName: doc.data().ownerName,
      phone: doc.data().phone || '',
      make: doc.data().make,
      model: doc.data().model,
      engineSize: doc.data().engineSize,
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
  };

  const fetchServices = async () => {
    const q = query(collection(db, 'services'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const servicesData = querySnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      price: doc.data().price,
      description: doc.data().description,
    })) as Service[];
    setServices(servicesData);
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
      }));
    }
  };

  const handleServiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const serviceId = e.target.value;
    setSelectedService(serviceId);

    if (serviceId) {
      const service = services.find(s => s.id === serviceId);
      if (service) {
        setFormData(prev => ({
          ...prev,
          repairs: service.name,
          cost: service.price.toString(),
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        repairs: '',
        cost: '',
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedClient) {
      alert('Моля, изберете клиент');
      return;
    }

    if (!selectedService) {
      alert('Моля, изберете услуга');
      return;
    }

    try {
      await addDoc(collection(db, 'repairs'), {
        ...formData,
        cost: parseFloat(formData.cost),
        createdAt: serverTimestamp(),
      });

      router.push('/repairs');
    } catch (error) {
      console.error('Error adding repair:', error);
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
      <h1 className="text-3xl font-bold mb-6">Формуляр за ремонт</h1>

      {clientIdFromUrl && selectedClient && (
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
              required
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
            <label htmlFor="service" className="block text-sm font-medium text-gray-700">
              Избери услуга
            </label>
            <select
              id="service"
              value={selectedService}
              onChange={handleServiceChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Избери услуга</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name} - {service.price} лв.
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
            <label htmlFor="repairs" className="block text-sm font-medium text-gray-700">
              Ремонти
            </label>
            <textarea
              id="repairs"
              name="repairs"
              value={formData.repairs}
              onChange={handleChange}
              required
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="cost" className="block text-sm font-medium text-gray-700">
              Цена (лв.)
            </label>
            <input
              type="number"
              id="cost"
              name="cost"
              value={formData.cost}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
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