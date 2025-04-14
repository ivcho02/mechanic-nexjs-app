'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';

// Define a type for the PDF generator
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PDFMakeType = any;

type RepairStatus = 'Изпратена оферта' | 'В процес' | 'Завършен' | 'Отказан';

interface Repair {
  id: string;
  ownerName: string;
  make: string;
  model: string;
  engineSize: string;
  repairs: string;
  cost: number;
  additionalInfo: string;
  status: RepairStatus;
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
}

export default function RepairsPage() {
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pdfMake, setPdfMake] = useState<PDFMakeType | null>(null);

  useEffect(() => {
    setIsClient(true);
    fetchRepairs();

    // Only load PDF generator in browser environment
    if (typeof window !== 'undefined') {
      import('pdfmake/build/pdfmake').then(pdfMakeModule => {
        // Only load fonts when pdfmake is loaded
        import('pdfmake/build/vfs_fonts').then(vfsFontsModule => {
          const pdfMakeInstance = pdfMakeModule.default || pdfMakeModule;

          // Handle different module formats
          if (vfsFontsModule.default && vfsFontsModule.default.pdfMake && vfsFontsModule.default.pdfMake.vfs) {
            pdfMakeInstance.vfs = vfsFontsModule.default.pdfMake.vfs;
          } else if (vfsFontsModule.pdfMake && vfsFontsModule.pdfMake.vfs) {
            pdfMakeInstance.vfs = vfsFontsModule.pdfMake.vfs;
          }

          setPdfMake(pdfMakeInstance);
        }).catch(err => {
          console.error('Error loading fonts:', err);
        });
      }).catch(err => {
        console.error('Error loading pdfmake:', err);
      });
    }
  }, []);

  const fetchRepairs = async () => {
    const q = query(collection(db, 'repairs'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const repairsData = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Repair[];
    setRepairs(repairsData);
  };

  const formatDate = (timestamp: { seconds: number; nanoseconds: number }) => {
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString('bg-BG');
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

  const generatePDF = async (repair: Repair) => {
    if (!isClient || !pdfMake) return;
    setLoading(true);

    try {
      const docDefinition = {
        defaultStyle: {
          font: 'Roboto'
        },
        content: [
          // Header
          { text: 'Автосервиз', style: 'header', alignment: 'center' },
          { text: 'Оферта за ремонт', style: 'subheader', alignment: 'center', margin: [0, 0, 0, 10] },

          // Date and Offer Number
          { text: `Дата: ${formatDate(repair.createdAt)}`, margin: [0, 5, 0, 0] },
          { text: `Номер на оферта: ${repair.id}`, margin: [0, 0, 0, 10] },

          // Client Information
          {
            table: {
              headerRows: 1,
              widths: ['*'],
              body: [
                [{ text: 'Информация за клиента', style: 'tableHeader', fillColor: '#2980b9', color: '#ffffff' }],
                [{ text: `Име: ${repair.ownerName}` }],
                [{ text: `Автомобил: ${repair.make} ${repair.model}` }],
                [{ text: `Обем на двигателя: ${repair.engineSize}` }]
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
                [{ text: 'Предложени ремонтни дейности', style: 'tableHeader', fillColor: '#2980b9', color: '#ffffff' }],
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
                [{ text: 'Финансова информация', style: 'tableHeader', fillColor: '#2980b9', color: '#ffffff' }],
                [{ text: `Обща сума: ${repair.cost} лв.` }],
                [{ text: `ДДС: ${(repair.cost * 0.2).toFixed(2)} лв.` }],
                [{ text: `Крайна сума: ${(repair.cost * 1.2).toFixed(2)} лв.` }]
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
                [{ text: 'Допълнителна информация', style: 'tableHeader', fillColor: '#2980b9', color: '#ffffff' }],
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
                [{ text: 'Общи условия', style: 'tableHeader', fillColor: '#2980b9', color: '#ffffff' }],
                [{ text: '1. Срокът за ремонт е приблизителен и може да се промени в зависимост от наличността на части.' }],
                [{ text: '2. Офертата е валидна 7 дни от датата на издаване.' }]
              ]
            },
            margin: [0, 0, 0, 10]
          },

          // Footer
          { text: 'С уважение,', margin: [0, 20, 0, 0] },
          { text: 'Екипът на Автосервиз', margin: [0, 5, 0, 0] }
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
      pdfMake.createPdf(docDefinition).download(`оферта_ремонт_${repair.id}.pdf`);
      setLoading(false);

    } catch (error) {
      console.error('Error generating PDF:', error);
      setLoading(false);
    }
  };

  if (!isClient) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Ремонти</h1>
        <Link
          href="/add-repair"
          className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600"
        >
          Добави нов ремонт
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Дата
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Собственик
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Автомобил
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ремонти
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Цена
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Статус
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {repairs.map((repair) => (
              <tr key={repair.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(repair.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {repair.ownerName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {repair.make} {repair.model} ({repair.engineSize})
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {repair.repairs}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {repair.cost} лв.
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(repair.status)}`}>
                    {repair.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => generatePDF(repair)}
                    disabled={loading || !pdfMake}
                    className={`text-blue-600 hover:text-blue-900 ${loading || !pdfMake ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {loading ? 'Генериране...' : 'Изтегли оферта'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}