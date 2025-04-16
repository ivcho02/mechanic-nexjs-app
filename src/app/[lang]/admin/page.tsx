'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { addAdminEmail, isEmailAdmin } from '@/lib/firebase';
import { getDictionaryClient, Dictionary } from '@/dictionaries/client';

export default function AdminPage() {
  const router = useRouter();
  const params = useParams();
  const lang = params.lang as string;
  const { user, isAdmin, loading } = useAuth();

  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [dict, setDict] = useState<Dictionary | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const loadDictionary = async () => {
      const dictionary = await getDictionaryClient(lang);
      setDict(dictionary);
    };

    loadDictionary();
    setMounted(true);
  }, [lang]);

  useEffect(() => {
    // Redirect if not admin
    if (!loading && (!user || !isAdmin)) {
      router.push(`/${lang}`);
    }
  }, [user, isAdmin, loading, router, lang]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!email.trim()) {
      setError('Please enter an email address');
      return;
    }

    // Check if already admin
    if (isEmailAdmin(email)) {
      setError('This email is already registered as a mechanic');
      return;
    }

    // Add to admin list
    const success = addAdminEmail(email);
    if (success) {
      setMessage(`${email} has been added as a mechanic`);
      setEmail('');
    } else {
      setError('Failed to add email as mechanic');
    }
  };

  if (!mounted || !dict || loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  // If not admin, show message
  if (!isAdmin) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Admin Access Required</h1>
        <p>You need mechanic privileges to access this page.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Mechanic Management</h1>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Add New Mechanic</h2>
        <p className="mb-4 text-gray-600">
          Add a customer&apos;s email to give them mechanic (admin) privileges. This will allow them to manage clients, services, and all repairs.
        </p>

        <form onSubmit={handleSubmit} className="max-w-md">
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="customer@example.com"
              required
            />
          </div>

          {error && (
            <div className="mb-4 p-2 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}

          {message && (
            <div className="mb-4 p-2 bg-green-100 text-green-700 rounded-md">
              {message}
            </div>
          )}

          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Add as Mechanic
          </button>
        </form>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Important Note</h2>
        <p className="text-gray-600">
          This implementation is for demonstration purposes only. In a production environment, you should:
        </p>
        <ul className="list-disc ml-5 mt-2 text-gray-600">
          <li>Store admin users in a database collection rather than in code</li>
          <li>Use Firebase Auth custom claims or roles for proper permission management</li>
          <li>Add server-side validation to ensure only authorized users can promote others</li>
        </ul>
      </div>
    </div>
  );
}