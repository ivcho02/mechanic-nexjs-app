import { Repair, RepairStatus, Timestamp } from '@/types';

/**
 * Types for sorting repairs
 */
export type SortField = 'date' | 'name' | 'car' | 'status' | 'cost';
export type SortOrder = 'asc' | 'desc';

/**
 * Format a timestamp to a localized date string
 */
export const formatDate = (timestamp: Timestamp, locale: string): string => {
  const date = new Date(timestamp.seconds * 1000);
  return date.toLocaleDateString(locale === 'bg' ? 'bg-BG' : 'en-US');
};

/**
 * Get color classes for displaying repair status
 */
export const getStatusColor = (status: RepairStatus): string => {
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

/**
 * Get the next status in the repair workflow
 */
export const getNextStatus = (currentStatus: RepairStatus): RepairStatus => {
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

/**
 * Filter repairs by search term
 */
export const filterRepairsBySearchTerm = (
  repairs: Repair[],
  searchTerm: string
): Repair[] => {
  if (!searchTerm) return repairs;

  const lowerCaseSearchTerm = searchTerm.toLowerCase();

  return repairs.filter(repair =>
    repair.ownerName.toLowerCase().includes(lowerCaseSearchTerm) ||
    `${repair.make} ${repair.model}`.toLowerCase().includes(lowerCaseSearchTerm) ||
    repair.repairs.toLowerCase().includes(lowerCaseSearchTerm) ||
    repair.status.toLowerCase().includes(lowerCaseSearchTerm)
  );
};

/**
 * Sort repairs by specified field and order
 */
export const sortRepairs = (
  repairs: Repair[],
  sortField: SortField,
  sortOrder: SortOrder
): Repair[] => {
  return [...repairs].sort((a, b) => {
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
};