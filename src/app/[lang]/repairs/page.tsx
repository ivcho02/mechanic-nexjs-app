'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Repair, RepairStatus, Timestamp } from '@/types';
import { getDictionaryClient, Dictionary } from '@/dictionaries/client';

type SortField = 'date' | 'name' | 'car' | 'status' | 'cost';
type SortOrder = 'asc' | 'desc';

// Define a type for the PDF generator
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PDFMakeType = any;

export default function RepairsPage() {
  const params = useParams();
  const lang = params.lang as string;

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

  useEffect(() => {
    const loadDictionary = async () => {
      const dictionary = await getDictionaryClient(lang);
      setDict(dictionary);
    };

    loadDictionary();
    setIsClient(true);
    setMounted(true);
    fetchRepairs();

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
  }, [lang]);

  const fetchRepairs = async () => {
    setIsLoading(true);
    try {
      const q = query(collection(db, 'repairs'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const repairsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Repair[];
      setRepairs(repairsData);
    } catch (error) {
      console.error("Error fetching repairs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (timestamp: Timestamp) => {
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString(lang === 'bg' ? 'bg-BG' : 'en-US');
  };

  const getStatusColor = (status: RepairStatus) => {
    switch (status) {
      case 'Изпратена оферта':
        return 'bg-yellow-100 text-yellow-800';
      case 'В процес':
        return 'bg-blue-100 text-blue-800';
      case 'Завършен':
        return 'bg-green-100 text-green-800';
      case 'Отказан':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  const generatePDF = async (repair: Repair) => {
    if (!isClient || !pdfMake) return;
    setPdfLoading(true);

    try {
      const docDefinition = {
        defaultStyle: {
          font: 'Roboto'
        },
        content: [
          // Header
          { text: lang === 'bg' ? 'Автосервиз' : 'Auto Service', style: 'header', alignment: 'center' },
          { text: lang === 'bg' ? 'Оферта за ремонт' : 'Repair Quote', style: 'subheader', alignment: 'center', margin: [0, 0, 0, 10] },

          // Date and Offer Number
          { text: `${lang === 'bg' ? 'Дата' : 'Date'}: ${formatDate(repair.createdAt)}`, margin: [0, 5, 0, 0] },
          { text: `${lang === 'bg' ? 'Номер на оферта' : 'Quote Number'}: ${repair.id}`, margin: [0, 0, 0, 10] },

          // Client Information
          {
            table: {
              headerRows: 1,
              widths: ['*'],
              body: [
                [{ text: lang === 'bg' ? 'Информация за клиента' : 'Client Information', style: 'tableHeader', fillColor: '#2980b9', color: '#ffffff' }],
                [{ text: `${lang === 'bg' ? 'Име' : 'Name'}: ${repair.ownerName}` }],
                ...(repair.phone ? [[{ text: `${lang === 'bg' ? 'Телефон' : 'Phone'}: ${repair.phone}` }]] : []),
                [{ text: `${lang === 'bg' ? 'Автомобил' : 'Vehicle'}: ${repair.make} ${repair.model}` }],
                [{ text: `${lang === 'bg' ? 'Обем на двигателя' : 'Engine Size'}: ${repair.engineSize}` }]
              ]
            },
            margin: [0, 0, 0, 10]
          },

          // Repair Details
          {
            table: {
              headerRows: 1,
              widths: ['*'],
              body: [
                [{ text: lang === 'bg' ? 'Предложени ремонтни дейности' : 'Proposed Repair Services', style: 'tableHeader', fillColor: '#2980b9', color: '#ffffff' }],
                [{ text: repair.repairs }]
              ]
            },
            margin: [0, 0, 0, 10]
          },

          // Financial Information
          {
            table: {
              headerRows: 1,
              widths: ['*'],
              body: [
                [{ text: lang === 'bg' ? 'Финансова информация' : 'Financial Information', style: 'tableHeader', fillColor: '#2980b9', color: '#ffffff' }],
                [{ text: `${lang === 'bg' ? 'Обща сума' : 'Total Amount'}: ${repair.cost} ${lang === 'bg' ? 'лв.' : 'BGN'}` }],
                [{ text: `${lang === 'bg' ? 'ДДС' : 'VAT'}: ${(repair.cost * 0.2).toFixed(2)} ${lang === 'bg' ? 'лв.' : 'BGN'}` }],
                [{ text: `${lang === 'bg' ? 'Крайна сума' : 'Final Amount'}: ${(repair.cost * 1.2).toFixed(2)} ${lang === 'bg' ? 'лв.' : 'BGN'}` }]
              ]
            },
            margin: [0, 0, 0, 10]
          },

          // Additional Information (if available)
          ...(repair.additionalInfo ? [{
            table: {
              headerRows: 1,
              widths: ['*'],
              body: [
                [{ text: lang === 'bg' ? 'Допълнителна информация' : 'Additional Information', style: 'tableHeader', fillColor: '#2980b9', color: '#ffffff' }],
                [{ text: repair.additionalInfo }]
              ]
            },
            margin: [0, 0, 0, 10]
          }] : []),

          // Terms and Conditions
          {
            table: {
              headerRows: 1,
              widths: ['*'],
              body: [
                [{ text: lang === 'bg' ? 'Общи условия' : 'Terms and Conditions', style: 'tableHeader', fillColor: '#2980b9', color: '#ffffff' }],
                [{ text: lang === 'bg'
                  ? '1. Срокът за ремонт е приблизителен и може да се промени в зависимост от наличността на части.'
                  : '1. The repair timeframe is approximate and may change depending on parts availability.' }],
                [{ text: lang === 'bg'
                  ? '2. Офертата е валидна 7 дни от датата на издаване.'
                  : '2. The quote is valid for 7 days from the date of issue.' }]
              ]
            },
            margin: [0, 0, 0, 10]
          },

          // Footer
          { text: lang === 'bg' ? 'С уважение,' : 'Best regards,', margin: [0, 20, 0, 0] },
          { text: lang === 'bg' ? 'Екипът на Автосервиз' : 'The Auto Service Team', margin: [0, 5, 0, 0] }
        ],
        styles: {
          header: {
            fontSize: 22,
            bold: true,
            margin: [0, 0, 0, 5]
          },
          subheader: {
            fontSize: 14,
            bold: true,
            margin: [0, 0, 0, 20]
          },
          tableHeader: {
            bold: true,
            fontSize: 12,
            color: 'white'
          }
        }
      };

      // Generate PDF
      const fileName = lang === 'bg'
        ? `оферта_ремонт_${repair.id}.pdf`
        : `repair_quote_${repair.id}.pdf`;
      pdfMake.createPdf(docDefinition).download(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setPdfLoading(false);
    }
  };

  // Get the next status in the workflow
  const getNextStatus = (currentStatus: RepairStatus): RepairStatus => {
    switch (currentStatus) {
      case 'Изпратена оферта':
        return 'В процес';
      case 'В процес':
        return 'Завършен';
      case 'Завършен':
      case 'Отказан':
      default:
        return currentStatus;
    }
  };

  // Get button text based on current status
  const getStatusButtonText = (status: RepairStatus): string => {
    if (!dict) return '';

    switch (status) {
      case 'Изпратена оферта':
        return lang === 'bg' ? 'Започни ремонт' : 'Start Repair';
      case 'В процес':
        return lang === 'bg' ? 'Завърши ремонт' : 'Complete Repair';
      case 'Завършен':
        return lang === 'bg' ? 'Завършен' : 'Completed';
      case 'Отказан':
        return lang === 'bg' ? 'Отказан' : 'Cancelled';
      default:
        return lang === 'bg' ? 'Промени статус' : 'Change Status';
    }
  };

  // Update repair status
  const updateStatus = async (repair: Repair, newStatus: RepairStatus) => {
    if (updatingId) return; // Prevent multiple simultaneous updates

    setUpdatingId(repair.id);
    try {
      const repairRef = doc(db, 'repairs', repair.id);
      await updateDoc(repairRef, {
        status: newStatus
      });

      // Update local state to reflect the change
      setRepairs(prevRepairs =>
        prevRepairs.map(r =>
          r.id === repair.id ? { ...r, status: newStatus } : r
        )
      );
    } catch (error) {
      console.error('Error updating repair status:', error);
    } finally {
      setUpdatingId(null);
    }
  };

  const cancelRepair = async (repair: Repair) => {
    if (updatingId) return; // Prevent multiple simultaneous updates

    setUpdatingId(repair.id);
    try {
      const repairRef = doc(db, 'repairs', repair.id);
      await updateDoc(repairRef, {
        status: 'Отказан' as RepairStatus
      });

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

  // Filter repairs based on search term
  let filteredRepairs = repairs.filter(repair =>
    repair.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${repair.make} ${repair.model}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    repair.repairs.toLowerCase().includes(searchTerm.toLowerCase()) ||
    repair.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort repairs based on current sort field and order
  filteredRepairs = [...filteredRepairs].sort((a, b) => {
    let comparison = 0;

    if (sortField === 'date') {
      comparison = a.createdAt.seconds - b.createdAt.seconds;
    } else if (sortField === 'name') {
      comparison = a.ownerName.localeCompare(b.ownerName);
    } else if (sortField === 'car') {
      const carA = `${a.make} ${a.model}`;
      const carB = `${b.make} ${b.model}`;
      comparison = carA.localeCompare(carB);
    } else if (sortField === 'status') {
      comparison = a.status.localeCompare(b.status);
    } else if (sortField === 'cost') {
      comparison = a.cost - b.cost;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  if (!mounted || !dict || !isClient) {
    return null; // Prevent rendering during hydration
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">{dict.repairs.title}</h1>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <input
            type="text"
            placeholder={dict.repairs.searchPlaceholder}
            className="px-4 py-2 border border-gray-300 rounded-md w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <Link
            href={`/${lang}/repair-form`}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors duration-200"
          >
            {dict.repairs.addRepair}
          </Link>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRepairs.map((repair) => (
              <div
                key={repair.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
              >
                <div className="bg-blue-600 text-white py-3 px-4 flex justify-between items-center">
                  <h3 className="font-semibold truncate">{repair.ownerName}</h3>
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
                      <p className="text-sm text-gray-600">{dict.repairs.car}</p>
                      <div className="divide-y divide-gray-200">
                        <div className="py-3 flex justify-between items-center">
                          <div className="flex items-center">
                            <span className="font-semibold">{repair.make} {repair.model}</span>
                            <span className="ml-2 text-sm text-gray-500">({repair.engineSize})</span>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(repair.status)}`}>
                            {repair.status}
                          </span>
                        </div>

                        <div className="py-3">
                          <h4 className="font-medium mb-1">{dict.repairs.client}</h4>
                          <p>{repair.ownerName}</p>
                          {repair.phone && <p className="text-sm text-gray-600">{lang === 'bg' ? 'Тел:' : 'Tel:'} {repair.phone}</p>}
                          {repair.vin && <p className="text-sm text-gray-600">VIN: {repair.vin}</p>}
                        </div>

                        <div className="py-3">
                          <h4 className="font-medium mb-1">{dict.repairs.service}</h4>
                          {repair.selectedServices && repair.selectedServices.length > 0 ? (
                            <ul className="space-y-1">
                              {repair.selectedServices.map((service, index) => (
                                <li key={index} className="flex justify-between">
                                  <span>{service.name}</span>
                                  <span className="text-gray-600">{service.price.toFixed(2)} {lang === 'bg' ? 'лв.' : 'BGN'}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="whitespace-pre-line">{repair.repairs}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start mb-3">
                    <div className="bg-blue-100 rounded-full p-2 mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V5z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">{dict.repairs.date}</p>
                      <p className="font-medium">{formatDate(repair.createdAt)}</p>
                    </div>
                  </div>

                  <div className="flex items-start mb-4">
                    <div className="bg-blue-100 rounded-full p-2 mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 6.987 6 8c0 1.013.602 1.766 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 13.013 14 12c0-1.013-.602-1.766-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">{dict.repairs.totalCost}</p>
                      <p className="text-lg font-semibold">{repair.cost.toFixed(2)} {lang === 'bg' ? 'лв.' : 'BGN'}</p>
                    </div>
                  </div>

                  <div className="border-t pt-4 flex flex-col gap-3">
                    <div className="flex justify-between">
                      <Link
                        href={`/${lang}/repair-form?id=${repair.id}`}
                        className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200"
                      >
                        {dict.repairs.edit}
                      </Link>
                      <button
                        onClick={() => generatePDF(repair)}
                        disabled={pdfLoading || !pdfMake}
                        className={`bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 ${
                          pdfLoading || !pdfMake ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {pdfLoading ? (lang === 'bg' ? 'Генериране...' : 'Generating...') : (lang === 'bg' ? 'Изтегли оферта' : 'Download Quote')}
                      </button>
                    </div>

                    <div className="flex justify-between mt-2">
                      {(repair.status === 'Изпратена оферта' || repair.status === 'В процес') && (
                        <button
                          onClick={() => updateStatus(repair, getNextStatus(repair.status))}
                          disabled={!!updatingId}
                          className={`w-3/5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                            updatingId === repair.id ? 'opacity-50 cursor-wait' : ''
                          }`}
                        >
                          {updatingId === repair.id ? (lang === 'bg' ? 'Обновяване...' : 'Updating...') : getStatusButtonText(repair.status)}
                        </button>
                      )}

                      {(repair.status === 'Изпратена оферта' || repair.status === 'В процес') && (
                        <button
                          onClick={() => cancelRepair(repair)}
                          disabled={!!updatingId}
                          className={`${repair.status === 'Изпратена оферта' || repair.status === 'В процес' ? 'w-1/3' : 'w-full'} bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                            updatingId === repair.id ? 'opacity-50 cursor-wait' : ''
                          }`}
                        >
                          {lang === 'bg' ? 'Откажи' : 'Cancel'}
                        </button>
                      )}

                      {(repair.status === 'Завършен' || repair.status === 'Отказан') && (
                        <div className="w-full text-center py-2 text-sm text-gray-500">
                          {lang === 'bg' ? 'Статус:' : 'Status:'} {repair.status === 'Завършен'
                            ? (lang === 'bg' ? 'Ремонтът е завършен' : 'Repair is completed')
                            : (lang === 'bg' ? 'Ремонтът е отказан' : 'Repair is cancelled')}
                        </div>
                      )}
                    </div>
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