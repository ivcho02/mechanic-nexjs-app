export interface CarService {
  id: string;
  make: string;
  model: string;
  engineSize: string;
  repairs: string;
  cost: number;
  ownerName: string;
  createdAt: Date;
}