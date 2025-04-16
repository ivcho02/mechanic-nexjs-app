'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/authContext';
import { getDictionaryClient, Dictionary } from '@/dictionaries/client';
import { Client, Repair, SortField, SortOrder } from '@/types';
import { formatDate, getStatusColor } from '@/helpers/repairHelpers';
import RepairDetailsModal from '@/components/repairs/RepairDetailsModal';

export default function MyRepairsPage() {
  const router = useRouter();
  const params = useParams();
  const lang = params.lang as string || 'en';
  const { user, loading: authLoading } = useAuth();

  const [client, setClient] = useState<Client | null>(null);
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dict, setDict] = useState<Dictionary | null>(null);
  const [selectedRepair, setSelectedRepair] = useState<Repair | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Set up state for sorting
  const [sortBy, setSortBy] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Track all repairs with their match reason for debugging
  type RepairInfo = {
    id: string;
    ownerName?: string;
    ownerEmail?: string;
    phone?: string;
    make?: string;
    model?: string;
    createdAt: string;
  };

  // Define fetchClientRepairs with useCallback
  const fetchClientRepairs = useCallback(async (clientData: Client) => {
    if (!user?.email) return;

    try {
      setIsLoading(true);
      // Get ALL repairs to analyze
      const repairsRef = collection(db, 'repairs');

      console.log("Client info for matching:", {
        email: user.email,
        name: clientData.ownerName,
        phone: clientData.phone,
        make: clientData.make,
        model: clientData.model
      });

      // Get all repairs
      const allRepairsQuery = query(
        repairsRef,
        orderBy('createdAt', 'desc')
      );

      const allRepairsSnapshot = await getDocs(allRepairsQuery);

      console.log(`Found ${allRepairsSnapshot.docs.length} total repairs in database`);

      const allRepairsWithReason: Array<{repair: RepairInfo, reason: string, matched: boolean}> = [];

      // Combine results and remove duplicates
      const repairsMap = new Map();

      // Check each repair if it should match this client
      allRepairsSnapshot.docs.forEach(doc => {
        const repairData = doc.data();
        let matched = false;
        let matchReason = "";

        // Check email match
        if (repairData.ownerEmail === user.email) {
          repairsMap.set(doc.id, { id: doc.id, ...repairData });
          matched = true;
          matchReason = "Email match";
        }
        // Check name match
        else if (repairData.ownerName === clientData.ownerName) {
          repairsMap.set(doc.id, { id: doc.id, ...repairData });
          matched = true;
          matchReason = "Name match";
        }
        // Check phone match
        else if (clientData.phone && repairData.phone === clientData.phone) {
          repairsMap.set(doc.id, { id: doc.id, ...repairData });
          matched = true;
          matchReason = "Phone match";
        }
        // Check vehicle match
        else if (
          repairData.make &&
          repairData.model &&
          clientData.make &&
          clientData.model &&
          repairData.make.toLowerCase() === clientData.make.toLowerCase() &&
          repairData.model.toLowerCase() === clientData.model.toLowerCase()
        ) {
          repairsMap.set(doc.id, { id: doc.id, ...repairData });
          matched = true;
          matchReason = "Vehicle match";
        }

        // For debugging, store all repairs with match status
        allRepairsWithReason.push({
          repair: {
            id: doc.id,
            ownerName: repairData.ownerName,
            ownerEmail: repairData.ownerEmail,
            phone: repairData.phone,
            make: repairData.make,
            model: repairData.model,
            createdAt: repairData.createdAt ? new Date(repairData.createdAt.seconds * 1000).toISOString() : 'unknown'
          },
          reason: matchReason,
          matched
        });
      });

      // Convert map to array
      const repairsData = Array.from(repairsMap.values()) as Repair[];

      // Ensure all repairs have ownerEmail set
      repairsData.forEach(repair => {
        if (!repair.ownerEmail && user.email) {
          repair.ownerEmail = user.email;
        }
      });

      // Sort by date (newest first)
      repairsData.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt.seconds * 1000) : new Date(0);
        const dateB = b.createdAt ? new Date(b.createdAt.seconds * 1000) : new Date(0);
        return dateB.getTime() - dateA.getTime();
      });

      console.log(`Found ${repairsData.length} repairs that matched this client`);
      console.log("All repairs with match status:", allRepairsWithReason);

      // If the repairs weren't matched, we will store ANY repairs where any field includes any of the client's data
      if (repairsData.length === 0) {
        console.log("No matches found. Checking for partial matches...");

        allRepairsSnapshot.docs.forEach(doc => {
          const repairData = doc.data();
          const repairDataString = JSON.stringify(repairData).toLowerCase();
          const clientEmail = user.email?.toLowerCase() || '';
          const clientName = clientData.ownerName.toLowerCase();
          const clientPhone = clientData.phone?.toLowerCase() || '';

          if (
            (clientEmail && repairDataString.includes(clientEmail)) ||
            (clientName && repairDataString.includes(clientName)) ||
            (clientPhone && repairDataString.includes(clientPhone))
          ) {
            console.log("Found partial match:", { id: doc.id, ...repairData });
            if (!repairsMap.has(doc.id)) {
              repairsMap.set(doc.id, { id: doc.id, ...repairData });
            }
          }
        });

        // Update repairsData with new matches
        const newRepairsData = Array.from(repairsMap.values()) as Repair[];
        console.log(`Found ${newRepairsData.length} repairs after partial matching`);

        // Only update if we found new matches
        if (newRepairsData.length > 0) {
          setRepairs(newRepairsData);
        } else {
          // If still no matches, just show the 5 most recent repairs for debugging
          const recentRepairs = allRepairsSnapshot.docs
            .slice(0, 5)
            .map(doc => ({ id: doc.id, ...doc.data() } as Repair));

          console.log("No matches at all. Here are the 5 most recent repairs for reference:", recentRepairs);

          // Set repairs to an empty array since no matches
          setRepairs([]);
        }
      } else {
        setRepairs(repairsData);
      }
    } catch (error) {
      console.error('Error fetching client repairs:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Define fetchClientData with useCallback
  const fetchClientData = useCallback(async () => {
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

        // Now fetch repairs for this client
        fetchClientRepairs(clientData);
      } else {
        // No client record found, set loading to false
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error fetching client data:', error);
      setIsLoading(false);
    }
  }, [user, fetchClientRepairs]);

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
  }, [user, authLoading, router, lang, fetchClientData]);

  // Check if repair ID is in the URL and open that repair's details
  useEffect(() => {
    const checkRepairId = async () => {
      // Get repair ID from URL if present
      const url = new URL(window.location.href);
      const repairId = url.searchParams.get('id');

      if (repairId && repairs.length > 0) {
        // Find repair in current repairs
        const repair = repairs.find(r => r.id === repairId);

        if (repair) {
          // Open modal with this repair
          setSelectedRepair(repair);
          setIsModalOpen(true);
        } else {
          // Try to fetch the repair if it's not in the list
          try {
            const repairDoc = await getDoc(doc(db, 'repairs', repairId));
            if (repairDoc.exists()) {
              const repairData = { id: repairDoc.id, ...repairDoc.data() } as Repair;

              // Check if this repair belongs to this client
              if (client && (
                repairData.ownerEmail === user?.email ||
                (repairData.ownerName === client.ownerName &&
                 repairData.make === client.make &&
                 repairData.model === client.model)
              )) {
                setSelectedRepair(repairData);
                setIsModalOpen(true);
              }
            }
          } catch (error) {
            console.error('Error fetching repair:', error);
          }
        }
      }
    };

    if (repairs.length > 0 && typeof window !== 'undefined') {
      checkRepairId();
    }
  }, [repairs, user, client]);

  // Open the modal with repair details
  const openRepairDetails = (repair: Repair) => {
    setSelectedRepair(repair);
    setIsModalOpen(true);
  };

  // Close the modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRepair(null);

    // Clear the URL parameter if it exists
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (url.searchParams.has('id')) {
        url.searchParams.delete('id');
        window.history.replaceState({}, '', url.toString());
      }
    }
  };

  // Filter repairs based on search term
  const filteredRepairs = repairs.filter(repair => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    return (
      (repair.make && repair.make.toLowerCase().includes(searchLower)) ||
      (repair.model && repair.model.toLowerCase().includes(searchLower)) ||
      (repair.repairs && repair.repairs.toLowerCase().includes(searchLower)) ||
      (repair.status && repair.status.toLowerCase().includes(searchLower)) ||
      (repair.selectedServices && repair.selectedServices.some(
        service => service.name.toLowerCase().includes(searchLower)
      ))
    );
  });

  const sortRepairs = (repairs: Repair[]): Repair[] => {
    return [...repairs].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'date':
          const dateA = a.createdAt ? new Date(a.createdAt.seconds * 1000) : new Date(0);
          const dateB = b.createdAt ? new Date(b.createdAt.seconds * 1000) : new Date(0);
          comparison = dateA.getTime() - dateB.getTime();
          break;
        case 'name':
          comparison = a.ownerName.localeCompare(b.ownerName);
          break;
        case 'car':
          const carA = `${a.make} ${a.model}`;
          const carB = `${b.make} ${b.model}`;
          comparison = carA.localeCompare(carB);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'cost':
          comparison = a.cost - b.cost;
          break;
        default:
          comparison = 0;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  };

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      // If already sorting by this field, toggle order
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Otherwise, set new sort field and default to ascending
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortBy !== field) return null;

    return sortOrder === 'asc' ? (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  if (authLoading || isLoading || !dict) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">{dict.repairs.title}</h1>
        <p className="mb-4">{dict.auth?.loginRequired || 'Please log in to view your repairs.'}</p>
        <Link
          href={`/${lang}/login`}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors duration-200"
        >
          {dict.nav.login}
        </Link>
      </div>
    );
  }

  // Apply sorting
  const sortedRepairs = sortRepairs(filteredRepairs);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">
          {dict.nav.myRepairs || 'My Repairs'}
        </h1>

        <div className="w-full md:w-1/3">
          <input
            type="text"
            placeholder={dict.repairs.searchPlaceholder}
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {!client ? (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-600 mb-4">
            {lang === 'bg' ?
              'Не сте предоставили информация за своя автомобил.' :
              'You have not provided information about your vehicle yet.'}
          </p>
          <Link
            href={`/${lang}/profile`}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            {lang === 'bg' ?
              'Актуализирайте своя профил с данни за автомобила' :
              'Update your profile with vehicle details'}
          </Link>
        </div>
      ) : sortedRepairs.length > 0 ? (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('date')}
                  >
                    {dict.repairs.date} {getSortIcon('date')}
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('car')}
                  >
                    {dict.repairs.car} {getSortIcon('car')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {dict.repairs.service}
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('status')}
                  >
                    {dict.repairs.status} {getSortIcon('status')}
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('cost')}
                  >
                    {dict.repairs.totalCost} {getSortIcon('cost')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedRepairs.map((repair) => (
                  <tr key={repair.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(repair.createdAt, lang)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{repair.make} {repair.model}</div>
                      {repair.engineSize && (
                        <div className="text-sm text-gray-500">{repair.engineSize}</div>
                      )}
                      {repair.ownerEmail && (
                        <div className="text-xs text-gray-400 mt-1">{repair.ownerEmail}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {repair.selectedServices && repair.selectedServices.length > 0 ? (
                        <ul className="list-disc list-inside">
                          {repair.selectedServices.slice(0, 2).map((service, index) => (
                            <li key={index} className="truncate max-w-xs">
                              {service.name}
                            </li>
                          ))}
                          {repair.selectedServices.length > 2 && (
                            <li className="text-gray-500 italic">
                              +{repair.selectedServices.length - 2} {lang === 'bg' ? 'още' : 'more'}
                            </li>
                          )}
                        </ul>
                      ) : (
                        <p className="truncate max-w-xs">{repair.repairs}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(repair.status)}`}>
                        {repair.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {repair.cost.toFixed(2)} {lang === 'bg' ? 'лв.' : 'BGN'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openRepairDetails(repair)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        {lang === 'bg' ? 'Детайли' : 'Details'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-10">
          <div className="text-5xl text-gray-300 mb-4">🔧</div>
          <p className="text-xl text-gray-500 mb-2">
            {searchTerm ?
              (lang === 'bg' ? 'Няма намерени ремонти за това търсене' : 'No repairs match your search') :
              (lang === 'bg' ? 'Нямате ремонти все още.' : 'You don\'t have any repairs yet.')}
          </p>
          {searchTerm && (
            <button
              className="mt-4 text-blue-600 hover:text-blue-800"
              onClick={() => setSearchTerm('')}
            >
              {lang === 'bg' ? 'Изчисти търсенето' : 'Clear search'}
            </button>
          )}
        </div>
      )}

      {/* Repair details modal */}
      <RepairDetailsModal
        isOpen={isModalOpen}
        repair={selectedRepair as Repair}
        onClose={closeModal}
        onUpdateStatus={() => {}} // Clients can't update status
        onCancelRepair={() => {}} // Clients can't cancel repairs
        onGeneratePDF={() => {}} // Empty function as PDF generation is removed
        updatingId={null}
        pdfLoading={false}
        pdfMakeAvailable={false}
        lang={lang}
        dict={dict}
        isAdmin={false} // Client view only
      />
    </div>
  );
}