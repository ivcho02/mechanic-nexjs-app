'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Repair, RepairStatus } from '@/types';
import { getDictionaryClient, Dictionary } from '@/dictionaries/client';
import { generatePDF } from '@/helpers/pdfHelper';
import { fetchRepairs, updateRepairStatus, cancelRepair } from '@/helpers/firebaseHelpers';
import {
  SortField,
  SortOrder,
  formatDate,
  getStatusColor,
  getNextStatus,
  filterRepairsBySearchTerm,
  sortRepairs
} from '@/helpers/repairHelpers';
import RepairDetailsModal from '@/components/repairs/RepairDetailsModal';
import { useAuth } from '@/lib/authContext';

// Define a type for the PDF generator
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PDFMakeType = any;

export default function RepairsPage() {
  const params = useParams();
  const router = useRouter();
  const lang = params.lang as string;
  const { user, isAdmin, loading: authLoading } = useAuth();

  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfMake, setPdfMake] = useState<PDFMakeType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [dict, setDict] = useState<Dictionary | null>(null);
  const [mounted, setMounted] = useState(false);
  const [selectedRepair, setSelectedRepair] = useState<Repair | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!authLoading && !user) {
      router.push(`/${lang}/login`);
      return;
    }

    const loadDictionary = async () => {
      const dictionary = await getDictionaryClient(lang);
      setDict(dictionary);
    };

    loadDictionary();
    setIsClient(true);
    setMounted(true);

    if (user) {
      loadRepairs();
    }

    // Only load PDF generator in browser environment
    if (typeof window !== 'undefined') {
      import('pdfmake/build/pdfmake').then(pdfMakeModule => {
        // Only load fonts when pdfmake is loaded
        import('pdfmake/build/vfs_fonts').then(vfsFontsModule => {
          const pdfMakeInstance = pdfMakeModule.default || pdfMakeModule;

          // Use type assertions to avoid TypeScript errors
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const vfsFonts = vfsFontsModule as any;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const pdfInstance = pdfMakeInstance as any;

          try {
            // Try different possible structures of the fonts module
            if (vfsFonts.default?.pdfMake?.vfs) {
              pdfInstance.vfs = vfsFonts.default.pdfMake.vfs;
            } else if (vfsFonts.pdfMake?.vfs) {
              pdfInstance.vfs = vfsFonts.pdfMake.vfs;
            } else if (vfsFonts.default?.vfs) {
              pdfInstance.vfs = vfsFonts.default.vfs;
            } else if (vfsFonts.vfs) {
              pdfInstance.vfs = vfsFonts.vfs;
            } else {
              console.warn('Could not find VFS in the pdfmake fonts module');
            }

            setPdfMake(pdfInstance);
          } catch (err) {
            console.error('Error setting up PDF fonts:', err);
          }
        }).catch(err => {
          console.error('Error loading fonts:', err);
        });
      }).catch(err => {
        console.error('Error loading pdfmake:', err);
      });
    }
  }, [lang, user, authLoading, router]);

  const loadRepairs = async () => {
    setIsLoading(true);
    try {
      const repairsData = await fetchRepairs();

      // Filter repairs based on user role
      // Admin sees all repairs, regular users see only their own
      const userRepairs = isAdmin
        ? repairsData
        : repairsData.filter(repair => repair.userEmail === user?.email || repair.ownerEmail === user?.email);

      setRepairs(userRepairs);
    } catch (error) {
      console.error("Error loading repairs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Update repair status
  const handleUpdateStatus = async (repair: Repair, newStatus: string) => {
    if (updatingId) return; // Prevent multiple simultaneous updates

    setUpdatingId(repair.id);
    try {
      await updateRepairStatus(repair.id, newStatus as RepairStatus);

      // Update local state to reflect the change
      setRepairs(prevRepairs =>
        prevRepairs.map(r =>
          r.id === repair.id ? { ...r, status: newStatus as RepairStatus } : r
        )
      );
    } catch (error) {
      console.error('Error updating repair status:', error);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCancelRepair = async (repair: Repair) => {
    if (updatingId) return; // Prevent multiple simultaneous updates

    setUpdatingId(repair.id);
    try {
      await cancelRepair(repair.id);

      // Update local state to reflect the change
      setRepairs(prevRepairs =>
        prevRepairs.map(r =>
          r.id === repair.id ? { ...r, status: 'Отказан' } : r
        )
      );
    } catch (error) {
      console.error('Error cancelling repair:', error);
    } finally {
      setUpdatingId(null);
    }
  };

  // Get filtered and sorted repairs
  const filteredRepairs = sortRepairs(
    filterRepairsBySearchTerm(repairs, searchTerm),
    sortField,
    sortOrder
  );

  // New function to open the modal with repair details
  const openRepairDetails = (repair: Repair) => {
    setSelectedRepair(repair);
    setIsModalOpen(true);
  };

  // Close the modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRepair(null);
  };

  // Handle PDF generation
  const handleGeneratePDF = (repair: Repair) => {
    if (!isClient || !pdfMake) return;
    generatePDF(repair, pdfMake, lang, setPdfLoading);
  };

  if (!mounted || !dict || !isClient || authLoading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  // If user is not authenticated, show login prompt
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">{dict.repairs.title}</h1>
        <p className="mb-4">{dict.auth?.loginRequired || 'Please log in to view your repairs'}</p>
        <Link
          href={`/${lang}/login`}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors duration-200"
        >
          {dict.nav.login}
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">
          {isAdmin ? dict.repairs.title : (dict.nav.myRepairs || 'My Repairs')}
        </h1>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <input
            type="text"
            placeholder={dict.repairs.searchPlaceholder}
            className="px-4 py-2 border border-gray-300 rounded-md w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          {isAdmin && (
            <Link
              href={`/${lang}/repair-form`}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors duration-200"
            >
              {dict.repairs.addRepair}
            </Link>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredRepairs.length > 0 ? (
        <>
          <div className="flex flex-wrap justify-between items-center mb-4">
            <p className="text-gray-600 mb-2 sm:mb-0">
              {filteredRepairs.length} {filteredRepairs.length === 1 ? dict.repairs.repairFound : dict.repairs.repairsFound}
              {searchTerm && ` ${dict.repairs.searchResultsFor} "${searchTerm}"`}
            </p>

            <div className="flex gap-2 flex-wrap">
              <div className="text-sm text-gray-600 self-center">{dict.repairs.sortBy}:</div>
              <button
                onClick={() => toggleSort('date')}
                className={`px-3 py-1 rounded-md text-sm transition-colors ${
                  sortField === 'date'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {dict.repairs.date}
                {sortField === 'date' && (
                  <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                )}
              </button>
              <button
                onClick={() => toggleSort('name')}
                className={`px-3 py-1 rounded-md text-sm transition-colors ${
                  sortField === 'name'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {dict.clients.name}
                {sortField === 'name' && (
                  <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                )}
              </button>
              <button
                onClick={() => toggleSort('car')}
                className={`px-3 py-1 rounded-md text-sm transition-colors ${
                  sortField === 'car'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {dict.repairs.car}
                {sortField === 'car' && (
                  <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                )}
              </button>
              <button
                onClick={() => toggleSort('status')}
                className={`px-3 py-1 rounded-md text-sm transition-colors ${
                  sortField === 'status'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {dict.repairs.status}
                {sortField === 'status' && (
                  <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                )}
              </button>
              <button
                onClick={() => toggleSort('cost')}
                className={`px-3 py-1 rounded-md text-sm transition-colors ${
                  sortField === 'cost'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {lang === 'bg' ? 'Цена' : 'Cost'}
                {sortField === 'cost' && (
                  <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                )}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{dict.clients.name}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{dict.repairs.car}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{dict.repairs.date}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{dict.repairs.status}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{dict.repairs.totalCost}</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{lang === 'bg' ? 'Действия' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRepairs.map((repair) => (
                  <tr key={repair.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{repair.ownerName}</div>
                      {repair.phone && <div className="text-sm text-gray-500">{repair.phone}</div>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-medium">{repair.make} {repair.model}</div>
                      <div className="text-sm text-gray-500">{repair.engineSize}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(repair.createdAt, lang)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(repair.status)}`}>
                        {repair.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                      {repair.cost.toFixed(2)} {lang === 'bg' ? 'лв.' : 'BGN'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => openRepairDetails(repair)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          {lang === 'bg' ? 'Детайли' : 'Details'}
                        </button>
                        {isAdmin && (
                          <Link
                            href={`/${lang}/repair-form?id=${repair.id}`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            {dict.repairs.edit}
                          </Link>
                        )}

                        {isAdmin && (repair.status === 'Изпратена оферта' || repair.status === 'В процес') && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(repair, getNextStatus(repair.status))}
                              disabled={!!updatingId}
                              className={`text-blue-600 hover:text-blue-900 ${
                                updatingId === repair.id ? 'opacity-50 cursor-wait' : ''
                              }`}
                            >
                              {updatingId === repair.id
                                ? '...'
                                : repair.status === 'Изпратена оферта'
                                  ? (lang === 'bg' ? 'Започни' : 'Start')
                                  : (lang === 'bg' ? 'Завърши' : 'Complete')
                              }
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Replace the modal implementation with the new component */}
          <RepairDetailsModal
            isOpen={isModalOpen}
            repair={selectedRepair as Repair}
            onClose={closeModal}
            onUpdateStatus={handleUpdateStatus}
            onCancelRepair={handleCancelRepair}
            onGeneratePDF={handleGeneratePDF}
            updatingId={updatingId}
            pdfLoading={pdfLoading}
            pdfMakeAvailable={!!pdfMake}
            lang={lang}
            dict={dict}
            isAdmin={isAdmin}
          />
        </>
      ) : (
        <div className="text-center py-10">
          <div className="text-5xl text-gray-300 mb-4">🔍</div>
          <p className="text-xl text-gray-500 mb-2">
            {searchTerm ? dict.repairs.noSearchResults : dict.repairs.noRepairs}
          </p>
          <p className="text-gray-500">
            {searchTerm ? (
              <button
                className="mt-4 text-blue-600 hover:text-blue-800"
                onClick={() => setSearchTerm('')}
              >
                {dict.repairs.tryDifferentSearch}
              </button>
            ) : (
              <Link
                href={`/${lang}/repair-form`}
                className="text-blue-600 hover:text-blue-800"
              >
                {dict.repairs.addYourFirstRepair}
              </Link>
            )}
          </p>
        </div>
      )}
    </div>
  );
}