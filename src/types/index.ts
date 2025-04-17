// Common timestamp type
export interface Timestamp {
  seconds: number;
  nanoseconds: number;
}

export interface CarService {
  id: string;
  make: string;
  model: string;
  engineSize: string;
  repairs: string;
  cost: number;
  ownerName: string;
  additionalInfo?: string;
  createdAt: Date;
}

export interface Client {
  id: string;
  ownerName: string;
  phone: string;
  make: string;
  model: string;
  engineSize: string;
  vin?: string;
  createdAt?: Timestamp;
}

export interface Service {
  id: string;
  name: string;
  price: number;
  description: string;
  createdAt?: Timestamp;
}

// Repair status as enum for use in code
export enum RepairStatusEnum {
  PENDING = 'Изпратена оферта',
  IN_PROGRESS = 'В процес',
  COMPLETED = 'Завършен',
  CANCELLED = 'Отказан'
}

// Repair status as type for type checking
export type RepairStatus = 'Изпратена оферта' | 'В процес' | 'Завършен' | 'Отказан';

export interface SelectedService {
  id: string;
  name: string;
  price: number;
  description?: string;
}

export interface RepairData {
  ownerName?: string;
  phone?: string;
  make?: string;
  model?: string;
  engineSize?: string;
  vin?: string;
  repairs?: string;
  selectedServices?: SelectedService[];
  cost?: number;
  additionalInfo?: string;
  status?: RepairStatus;
}

export interface RepairFormData {
  ownerName: string;
  phone: string;
  make: string;
  model: string;
  engineSize: string;
  vin: string;
  repairs: string;
  selectedServices: SelectedService[];
  cost: string;
  additionalInfo: string;
  status: RepairStatus;
}

// From repairs/page.tsx
export interface Repair {
  id: string;
  ownerName: string;
  make: string;
  model: string;
  engineSize: string;
  vin?: string;
  repairs: string;
  selectedServices?: SelectedService[];
  cost: number;
  additionalInfo?: string;
  status: RepairStatus;
  createdAt: Timestamp;
  phone?: string;
  userEmail?: string;
  ownerEmail?: string;
}

// Sorting types
export type SortField = 'date' | 'name' | 'car' | 'status' | 'cost';
export type SortOrder = 'asc' | 'desc';

// From lib/carData.ts
export interface CarMake {
  id: string;
  name: string;
}

export interface CarModel {
  id: string;
  makeId: string;
  name: string;
}

// Navigation menu types
export interface MenuItem {
  id: string;
  text: string;
  key: string;
  url: string;
  icon: string;
  requiresAuth?: boolean;
  adminOnly?: boolean;
  guestOnly?: boolean;
  clientOnly?: boolean;
}

export interface NavigationMenu {
  mainMenu: MenuItem[];
  secondaryMenu: MenuItem[];
}