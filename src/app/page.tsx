'use client';

import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { CarService } from '@/types';

export default function Home() {
  const [services, setServices] = useState<CarService[]>([]);
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    engineSize: '',
    repairs: '',
    cost: '',
    ownerName: '',
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    const q = query(collection(db, 'services'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const servicesData = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
    })) as CarService[];
    setServices(servicesData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'services'), {
        ...formData,
        cost: Number(formData.cost),
        createdAt: new Date(),
      });
      setFormData({
        make: '',
        model: '',
        engineSize: '',
        repairs: '',
        cost: '',
        ownerName: '',
      });
      fetchServices();
    } catch (error) {
      console.error('Error adding service:', error);
    }
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Механик Сервиз</h1>

      <form onSubmit={handleSubmit} className="mb-8 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Марка</label>
            <input
              type="text"
              value={formData.make}
              onChange={(e) => setFormData({...formData, make: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Модел</label>
            <input
              type="text"
              value={formData.model}
              onChange={(e) => setFormData({...formData, model: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Обем на двигателя</label>
            <input
              type="text"
              value={formData.engineSize}
              onChange={(e) => setFormData({...formData, engineSize: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Ремонти</label>
            <input
              type="text"
              value={formData.repairs}
              onChange={(e) => setFormData({...formData, repairs: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Цена (лв.)</label>
            <input
              type="number"
              value={formData.cost}
              onChange={(e) => setFormData({...formData, cost: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Име на собственика</label>
            <input
              type="text"
              value={formData.ownerName}
              onChange={(e) => setFormData({...formData, ownerName: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              required
            />
          </div>
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600"
        >
          Добави сервиз
        </button>
      </form>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold mb-4">Списък с сервизи</h2>
        {services.map((service) => (
          <div key={service.id} className="bg-white p-4 rounded-lg shadow">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="font-semibold">Марка и модел:</p>
                <p>{service.make} {service.model}</p>
              </div>
              <div>
                <p className="font-semibold">Обем на двигателя:</p>
                <p>{service.engineSize}</p>
              </div>
              <div>
                <p className="font-semibold">Ремонти:</p>
                <p>{service.repairs}</p>
              </div>
              <div>
                <p className="font-semibold">Цена:</p>
                <p>{service.cost} лв.</p>
              </div>
              <div>
                <p className="font-semibold">Собственик:</p>
                <p>{service.ownerName}</p>
              </div>
              <div>
                <p className="font-semibold">Дата:</p>
                <p>{service.createdAt.toLocaleDateString('bg-BG')}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
