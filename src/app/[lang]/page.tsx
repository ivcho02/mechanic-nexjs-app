'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Dictionary, getDictionaryClient } from '@/dictionaries/client';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/authContext';
import { RepairStatusEnum } from '@/types';

export default function Page() {
  const params = useParams();
  const lang = params.lang as string;
  const [dict, setDict] = useState<Dictionary | null>(null);
  const [mounted, setMounted] = useState(false);
  const { isAdmin } = useAuth();

  // Statistics state
  const [stats, setStats] = useState({
    activeRepairs: 0,
    completedRepairs: 0,
    totalClients: 0,
    totalServices: 0,
    isLoading: true
  });

  useEffect(() => {
    const loadDictionary = async () => {
      const dictionary = await getDictionaryClient(lang);
      setDict(dictionary);
    };

    loadDictionary();
    setMounted(true);
  }, [lang]);

  // Fetch statistics for admin users
  useEffect(() => {
    if (isAdmin && mounted) {
      const fetchStats = async () => {
        try {
          // Fetch active repairs (pending + in progress)
          const activeRepairsQuery = query(
            collection(db, 'repairs'),
            where('status', 'in', [RepairStatusEnum.PENDING, RepairStatusEnum.IN_PROGRESS])
          );
          const activeRepairsSnapshot = await getDocs(activeRepairsQuery);

          // Fetch completed repairs
          const completedRepairsQuery = query(
            collection(db, 'repairs'),
            where('status', '==', RepairStatusEnum.COMPLETED)
          );
          const completedRepairsSnapshot = await getDocs(completedRepairsQuery);

          // Fetch clients
          const clientsSnapshot = await getDocs(collection(db, 'clients'));

          // Fetch services
          const servicesSnapshot = await getDocs(collection(db, 'services'));

          setStats({
            activeRepairs: activeRepairsSnapshot.size,
            completedRepairs: completedRepairsSnapshot.size,
            totalClients: clientsSnapshot.size,
            totalServices: servicesSnapshot.size,
            isLoading: false
          });
        } catch (error) {
          console.error('Error fetching statistics:', error);
          setStats(prev => ({ ...prev, isLoading: false }));
        }
      };

      fetchStats();
    }
  }, [isAdmin, mounted]);

  if (!mounted || !dict) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{dict.home.title}</h1>
        <p className="text-xl text-gray-600 mt-2">{dict.home.subtitle}</p>
      </div>

      {/* Statistics Section - Only visible for admin users */}
      {isAdmin && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">{dict.home.statistics}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* Active Repairs */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">{dict.home.activeRepairs}</p>
                  <h3 className="text-2xl font-bold mt-1">
                    {stats.isLoading ? (
                      <div className="h-8 w-8 rounded-full border-2 border-blue-300 border-t-blue-600 animate-spin"></div>
                    ) : (
                      stats.activeRepairs
                    )}
                  </h3>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                  </svg>
                </div>
              </div>
              <div className="mt-2">
                <Link href={`/${lang}/repairs?status=pending,inProgress`} className="text-sm text-blue-600 hover:text-blue-800">
                  {dict.home.viewAll} →
                </Link>
              </div>
            </div>

            {/* Completed Repairs */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">{dict.home.completedRepairs}</p>
                  <h3 className="text-2xl font-bold mt-1">
                    {stats.isLoading ? (
                      <div className="h-8 w-8 rounded-full border-2 border-green-300 border-t-green-600 animate-spin"></div>
                    ) : (
                      stats.completedRepairs
                    )}
                  </h3>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="mt-2">
                <Link href={`/${lang}/repairs?status=completed`} className="text-sm text-green-600 hover:text-green-800">
                  {dict.home.viewAll} →
                </Link>
              </div>
            </div>

            {/* Total Clients */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 font-medium">{dict.home.totalClients}</p>
                  <h3 className="text-2xl font-bold mt-1">
                    {stats.isLoading ? (
                      <div className="h-8 w-8 rounded-full border-2 border-purple-300 border-t-purple-600 animate-spin"></div>
                    ) : (
                      stats.totalClients
                    )}
                  </h3>
                </div>
                <div className="bg-purple-100 p-3 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <div className="mt-2">
                <Link href={`/${lang}/clients`} className="text-sm text-purple-600 hover:text-purple-800">
                  {dict.home.viewAll} →
                </Link>
              </div>
            </div>

            {/* Available Services */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-amber-600 font-medium">{dict.home.totalServices}</p>
                  <h3 className="text-2xl font-bold mt-1">
                    {stats.isLoading ? (
                      <div className="h-8 w-8 rounded-full border-2 border-amber-300 border-t-amber-600 animate-spin"></div>
                    ) : (
                      stats.totalServices
                    )}
                  </h3>
                </div>
                <div className="bg-amber-100 p-3 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>
              <div className="mt-2">
                <Link href={`/${lang}/services`} className="text-sm text-amber-600 hover:text-amber-800">
                  {dict.home.viewAll} →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
