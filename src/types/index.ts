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