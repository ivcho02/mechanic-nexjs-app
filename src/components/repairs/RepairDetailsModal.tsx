import { Repair } from '@/types';
import { formatDate, getNextStatus } from '@/helpers/repairHelpers';

interface RepairDetailsModalProps {
  isOpen: boolean;
  repair: Repair;
  onClose: () => void;
  onUpdateStatus: (repair: Repair, newStatus: string) => void;
  onCancelRepair: (repair: Repair) => void;
  onGeneratePDF: (repair: Repair) => void;
  updatingId: string | null;
  pdfLoading: boolean;
  pdfMakeAvailable: boolean;
  lang: string;
  dict: any; // Using any for simplicity, ideally this would be properly typed
}

export default function RepairDetailsModal({
  isOpen,
  repair,
  onClose,
  onUpdateStatus,
  onCancelRepair,
  onGeneratePDF,
  updatingId,
  pdfLoading,
  pdfMakeAvailable,
  lang,
  dict
}: RepairDetailsModalProps) {
  if (!isOpen || !repair) return null;

  return (
    <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-blue-600 text-white py-4 px-6 flex justify-between items-center">
          <h3 className="text-lg font-semibold">{repair.ownerName} - {repair.make} {repair.model}</h3>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {/* Client Information */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold mb-2 text-gray-700 border-b pb-2">{dict.repairs.client}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">{dict.clients.name}</p>
                <p className="font-medium">{repair.ownerName}</p>
              </div>
              {repair.phone && (
                <div>
                  <p className="text-sm text-gray-500">{dict.clients.phone}</p>
                  <p className="font-medium">{repair.phone}</p>
                </div>
              )}
            </div>
          </div>

          {/* Vehicle Information */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold mb-2 text-gray-700 border-b pb-2">{dict.repairs.car}</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">{lang === 'bg' ? 'Марка' : 'Make'}</p>
                <p className="font-medium">{repair.make}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{lang === 'bg' ? 'Модел' : 'Model'}</p>
                <p className="font-medium">{repair.model}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{lang === 'bg' ? 'Обем на двигателя' : 'Engine Size'}</p>
                <p className="font-medium">{repair.engineSize}</p>
              </div>
              {repair.vin && (
                <div className="md:col-span-3">
                  <p className="text-sm text-gray-500">VIN</p>
                  <p className="font-medium">{repair.vin}</p>
                </div>
              )}
            </div>
          </div>

          {/* Service Information */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold mb-2 text-gray-700 border-b pb-2">{dict.repairs.service}</h4>
            {repair.selectedServices && repair.selectedServices.length > 0 ? (
              <div className="bg-gray-50 p-4 rounded-lg">
                <ul className="divide-y divide-gray-200">
                  {repair.selectedServices.map((service, index) => (
                    <li key={index} className="py-2 flex justify-between">
                      <span>{service.name}</span>
                      <span className="font-medium">{service.price.toFixed(2)} {lang === 'bg' ? 'лв.' : 'BGN'}</span>
                    </li>
                  ))}
                  <li className="py-2 flex justify-between font-semibold">
                    <span>{lang === 'bg' ? 'Общо:' : 'Total:'}</span>
                    <span>{repair.cost.toFixed(2)} {lang === 'bg' ? 'лв.' : 'BGN'}</span>
                  </li>
                </ul>
              </div>
            ) : (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="whitespace-pre-line">{repair.repairs}</p>
                <div className="mt-4 flex justify-between font-semibold">
                  <span>{lang === 'bg' ? 'Общо:' : 'Total:'}</span>
                  <span>{repair.cost.toFixed(2)} {lang === 'bg' ? 'лв.' : 'BGN'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Additional Information */}
          {repair.additionalInfo && (
            <div className="mb-6">
              <h4 className="text-lg font-semibold mb-2 text-gray-700 border-b pb-2">{lang === 'bg' ? 'Допълнителна информация' : 'Additional Information'}</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="whitespace-pre-line">{repair.additionalInfo}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 mt-8 pt-4 border-t">
            <button
              onClick={() => onGeneratePDF(repair)}
              disabled={pdfLoading || !pdfMakeAvailable}
              className={`bg-green-100 hover:bg-green-200 text-green-700 px-4 py-2 rounded-md ${
                pdfLoading || !pdfMakeAvailable ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {pdfLoading ? (lang === 'bg' ? 'Генериране...' : 'Generating...') : (lang === 'bg' ? 'Изтегли оферта' : 'Download Quote')}
            </button>

            {(repair.status === 'Изпратена оферта' || repair.status === 'В процес') && (
              <button
                onClick={() => {
                  onUpdateStatus(repair, getNextStatus(repair.status));
                  onClose();
                }}
                disabled={!!updatingId}
                className={`bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md ${
                  updatingId === repair.id ? 'opacity-50 cursor-wait' : ''
                }`}
              >
                {updatingId === repair.id
                  ? (lang === 'bg' ? 'Обновяване...' : 'Updating...')
                  : repair.status === 'Изпратена оферта'
                    ? (lang === 'bg' ? 'Започни ремонт' : 'Start Repair')
                    : (lang === 'bg' ? 'Завърши ремонт' : 'Complete Repair')
                }
              </button>
            )}

            {(repair.status === 'Изпратена оферта' || repair.status === 'В процес') && (
              <button
                onClick={() => {
                  onCancelRepair(repair);
                  onClose();
                }}
                disabled={!!updatingId}
                className={`bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-md ${
                  updatingId === repair.id ? 'opacity-50 cursor-wait' : ''
                }`}
              >
                {lang === 'bg' ? 'Откажи ремонт' : 'Cancel Repair'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}