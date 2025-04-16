'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/authContext';
import { getDictionaryClient, Dictionary } from '@/dictionaries/client';
import { Client } from '@/types';

export default function ProfilePage() {
  const router = useRouter();
  const params = useParams();
  const lang = params.lang as string || 'en';
  const { user, loading: authLoading } = useAuth();

  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [dict, setDict] = useState<Dictionary | null>(null);
  const [formData, setFormData] = useState({
    ownerName: '',
    phone: '',
    make: '',
    model: '',
    engineSize: '',
    vin: '',
  });

  useEffect(() => {
    const loadDictionary = async () => {
      const dictionary = await getDictionaryClient(lang);
      setDict(dictionary);
    };

    loadDictionary();
  }, [lang]);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!authLoading && !user) {
      router.push(`/${lang}/login`);
      return;
    }

    if (user) {
      fetchClientData();
    }
  }, [user, authLoading, router, lang]);

  const fetchClientData = async () => {
    if (!user?.email) return;

    setIsLoading(true);
    try {
      const clientsRef = collection(db, 'clients');
      const q = query(clientsRef, where('email', '==', user.email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const clientDoc = querySnapshot.docs[0];
        const clientData = clientDoc.data() as Client;
        clientData.id = clientDoc.id;
        setClient(clientData);
        setFormData({
          ownerName: clientData.ownerName || '',
          phone: clientData.phone || '',
          make: clientData.make || '',
          model: clientData.model || '',
          engineSize: clientData.engineSize || '',
          vin: clientData.vin || '',
        });
      }
    } catch (error) {
      console.error('Error fetching client data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) return;

    setIsSaving(true);
    setMessage('');

    try {
      const clientRef = doc(db, 'clients', client.id);
      await updateDoc(clientRef, {
        ...formData,
        updatedAt: serverTimestamp(),
      });

      setMessage(lang === 'bg' ? 'Профилът е актуализиран успешно!' : 'Profile updated successfully!');

      // Update client data in state
      setClient(prev => {
        if (!prev) return null;
        return { ...prev, ...formData };
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage(lang === 'bg' ? 'Грешка при актуализиране на профила.' : 'Error updating profile.');
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || isLoading || !dict) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">{lang === 'bg' ? 'Профил' : 'Profile'}</h1>
        <p className="mb-4">{dict.auth?.loginRequired || 'Please log in to view your profile.'}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">
          {lang === 'bg' ? 'Моят профил' : 'My Profile'}
        </h1>

        {client ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  {dict.auth?.email || 'Email'}
                </label>
                <input
                  type="email"
                  id="email"
                  value={user.email || ''}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {lang === 'bg' ? 'Имейлът не може да бъде променен' : 'Email cannot be changed'}
                </p>
              </div>

              <div className="mb-4">
                <label htmlFor="ownerName" className="block text-sm font-medium text-gray-700 mb-1">
                  {dict.clientForm.ownerName}
                </label>
                <input
                  type="text"
                  id="ownerName"
                  name="ownerName"
                  value={formData.ownerName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="mb-4">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  {dict.clientForm.phone}
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="mb-4">
                <label htmlFor="make" className="block text-sm font-medium text-gray-700 mb-1">
                  {dict.clientForm.make}
                </label>
                <input
                  type="text"
                  id="make"
                  name="make"
                  value={formData.make}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="mb-4">
                <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-1">
                  {dict.clientForm.model}
                </label>
                <input
                  type="text"
                  id="model"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="mb-4">
                <label htmlFor="engineSize" className="block text-sm font-medium text-gray-700 mb-1">
                  {dict.clientForm.engineSize}
                </label>
                <input
                  type="text"
                  id="engineSize"
                  name="engineSize"
                  value={formData.engineSize}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="mb-6">
                <label htmlFor="vin" className="block text-sm font-medium text-gray-700 mb-1">
                  {dict.clientForm.vin}
                </label>
                <input
                  type="text"
                  id="vin"
                  name="vin"
                  value={formData.vin}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {message && (
                <div className="mb-4 p-3 rounded-md bg-blue-50 text-blue-700">
                  {message}
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300"
                >
                  {isSaving ?
                    (lang === 'bg' ? 'Запазване...' : 'Saving...') :
                    (lang === 'bg' ? 'Запази промените' : 'Save Changes')}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <p className="text-gray-600">
              {lang === 'bg' ? 'Не са намерени данни за клиент. Моля, свържете се с администратор.' : 'No client data found. Please contact an administrator.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}