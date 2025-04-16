'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Client, Timestamp } from '@/types';
import { getDictionaryClient, Dictionary } from '@/dictionaries/client';
import { fetchClients, deleteClient } from '@/helpers/firebaseHelpers';

type SortField = 'date' | 'name' | 'car';
type SortOrder = 'asc' | 'desc';

export default function ClientsPage() {
  const params = useParams();
  const lang = params.lang as string;

  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [dict, setDict] = useState<Dictionary | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);
  const [openActionsMenu, setOpenActionsMenu] = useState<string | null>(null);
  const dropdownRefs = useRef<{[key: string]: HTMLDivElement | null}>({});

  useEffect(() => {
    const loadDictionary = async () => {
      const dictionary = await getDictionaryClient(lang);
      setDict(dictionary);
    };

    loadDictionary();
    setMounted(true);
    loadClients();
  }, [lang]);

  // Modified click outside handler to work with multiple dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openActionsMenu &&
          dropdownRefs.current[openActionsMenu] &&
          !dropdownRefs.current[openActionsMenu]?.contains(event.target as Node)) {
        setOpenActionsMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openActionsMenu]);

  const loadClients = async () => {
    setIsLoading(true);
    try {
      const clientsData = await fetchClients();
      setClients(clientsData);
    } catch (error) {
      console.error("Error loading clients:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    // Show confirmation before deleting
    setClientToDelete(clientId);
    setOpenActionsMenu(null); // Close the actions menu
  };

  const confirmDelete = async () => {
    if (!clientToDelete) return;

    setIsDeleting(true);
    try {
      await deleteClient(clientToDelete);
      // Remove client from local state
      setClients(clients.filter(client => client.id !== clientToDelete));
      // Reset delete state
      setClientToDelete(null);
    } catch (error) {
      console.error("Error deleting client:", error);
      alert("Error deleting client. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setClientToDelete(null);
  };

  const toggleActionsMenu = (event: React.MouseEvent, clientId: string) => {
    event.stopPropagation(); // Prevent the click from closing the menu immediately
    setOpenActionsMenu(prev => prev === clientId ? null : clientId);
  };

  const sortClients = (a: Client, b: Client, field: SortField, order: SortOrder) => {
    const multiplier = order === 'asc' ? 1 : -1;

    switch (field) {
      case 'date':
        if (!a.createdAt && !b.createdAt) return 0;
        if (!a.createdAt) return 1 * multiplier;
        if (!b.createdAt) return -1 * multiplier;
        return (b.createdAt.seconds - a.createdAt.seconds) * multiplier;
      case 'name':
        return a.ownerName.localeCompare(b.ownerName) * multiplier;
      case 'car':
        const aCar = `${a.make} ${a.model}`;
        const bCar = `${b.make} ${b.model}`;
        return aCar.localeCompare(bCar) * multiplier;
      default:
        return 0;
    }
  };

  const formatDate = (timestamp: Timestamp | undefined) => {
    if (!timestamp) return lang === 'bg' ? 'Неизвестна дата' : 'Unknown date';
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString(lang === 'bg' ? 'bg-BG' : 'en-US');
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  let filteredClients = clients.filter(client =>
    client.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.model.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort clients based on current sort field and order
  filteredClients = [...filteredClients].sort((a, b) => sortClients(a, b, sortField, sortOrder));

  if (!mounted || !dict) {
    return null; // Prevent rendering during hydration
  }

  // Translations
  const clientsTitle = dict.clients.title;
  const searchPlaceholder = dict.clients.searchPlaceholder;
  const addClientButton = dict.clients.addClient;
  const clientsFound = dict.clients.clientsFound;
  const clientFound = dict.clients.clientFound;
  const searchResultsFor = dict.clients.searchResultsFor;
  const sortBy = dict.clients.sortBy;
  const date = dict.clients.date;
  const name = dict.clients.name;
  const car = dict.clients.car;
  const phone = dict.clients.phone;
  const notSpecified = dict.clients.notSpecified;
  const engineSize = dict.clients.engineSize;
  const vinNumber = dict.clients.vinNumber;
  const newRepair = dict.clients.newRepair;
  const edit = dict.clients.edit;
  const viewRepairs = dict.clients.viewRepairs;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Delete confirmation modal */}
      {clientToDelete && dict && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">{dict.clients.deleteConfirm}</h3>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md font-medium"
                disabled={isDeleting}
              >
                {dict.clientForm.cancel}
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {dict.clientForm.loading}
                  </span>
                ) : dict.clients.delete}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">{clientsTitle}</h1>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <input
            type="text"
            placeholder={searchPlaceholder}
            className="px-4 py-2 border border-gray-300 rounded-md w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <Link
            href={`/${lang}/client-form`}
            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white px-4 py-2 rounded-md font-medium transition-colors duration-200 text-center"
          >
            {addClientButton}
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredClients.length > 0 ? (
        <>
          <div className="flex flex-wrap justify-between items-center mb-4">
            <p className="text-gray-600 mb-2 sm:mb-0">
              {filteredClients.length} {filteredClients.length === 1 ? clientFound : clientsFound}
              {searchTerm && ` ${searchResultsFor} "${searchTerm}"`}
            </p>

            <div className="flex gap-2">
              <div className="text-sm text-gray-600 self-center">{sortBy}:</div>
              <button
                onClick={() => toggleSort('date')}
                className={`px-3 py-1 rounded-md text-sm transition-colors ${
                  sortField === 'date'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {date}
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
                {name}
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
                {car}
                {sortField === 'car' && (
                  <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredClients.map((client) => (
              <div
                key={client.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
              >
                {/* Client card header with title and actions button */}
                <div className="bg-blue-600 text-white py-3 px-4 flex justify-between items-center">
                  <h3 className="font-semibold truncate">{client.ownerName}</h3>

                  {/* Actions Menu Button - Moved to header */}
                  <div
                    className="relative"
                    ref={(el) => { dropdownRefs.current[client.id] = el; }}
                  >
                    <button
                      onClick={(e) => toggleActionsMenu(e, client.id)}
                      className="bg-white text-blue-700 px-2 py-1 rounded-md text-sm font-medium transition-colors duration-200 flex items-center hover:bg-blue-50"
                    >
                      <span className="mr-1">{dict.nav.actions}</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>

                    {/* Dropdown Menu */}
                    {openActionsMenu === client.id && (
                      <div
                        className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50 border origin-top-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="py-1">
                          <Link
                            href={`/${lang}/client-form?id=${client.id}`}
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                            {edit}
                          </Link>
                          <Link
                            href={`/${lang}/repairs?clientId=${client.id}`}
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                            </svg>
                            {viewRepairs}
                          </Link>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClient(client.id);
                            }}
                            className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {dict.clients.delete}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex items-start mb-3">
                    <div className="bg-blue-100 rounded-full p-2 mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                        <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H11a1 1 0 001-1v-1h3.05a2.5 2.5 0 014.9 0H19a1 1 0 001-1v-6a1 1 0 00-.3-.7l-4-4A1 1 0 0015 2H3a1 1 0 00-1 1v1z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">{car}</p>
                      <p className="font-medium">{client.make} {client.model}</p>
                    </div>
                  </div>

                  {client.vin && (
                    <div className="flex items-start mb-3">
                      <div className="bg-blue-100 rounded-full p-2 mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">{vinNumber}</p>
                        <p className="font-medium">{client.vin}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start mb-3">
                    <div className="bg-blue-100 rounded-full p-2 mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">{phone}</p>
                      <p className="font-medium">{client.phone || notSpecified}</p>
                    </div>
                  </div>

                  <div className="flex items-start mb-3">
                    <div className="bg-blue-100 rounded-full p-2 mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V5z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">{date}</p>
                      <p className="font-medium">{formatDate(client.createdAt)}</p>
                    </div>
                  </div>

                  <div className="flex items-start mb-4">
                    <div className="bg-blue-100 rounded-full p-2 mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">{engineSize}</p>
                      <p className="font-medium">{client.engineSize}</p>
                    </div>
                  </div>

                  {/* Actions section - Keep only the New Repair button */}
                  <div className="mt-4 border-t pt-4 flex justify-center">
                    {/* Primary Action */}
                    <Link
                      className="flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 w-full"
                      href={`/${lang}/repair-form?clientId=${client.id}`}
                    >
                      <span>{newRepair}</span>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-10">
          <div className="text-5xl text-gray-300 mb-4">🔍</div>
          <p className="text-xl text-gray-500 mb-2">
            {searchTerm ? dict.clients.noSearchResults : dict.clients.noClients}
          </p>
          <p className="text-gray-500">
            {searchTerm ? dict.clients.tryDifferentSearch : dict.clients.addYourFirstClient}
          </p>
        </div>
      )}
    </div>
  );
}