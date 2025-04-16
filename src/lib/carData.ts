// Static database of car makes, models, and engines
// This provides a fallback when online APIs are unavailable or too costly

import carDataJson from '@/data/carData.json';

export interface CarMake {
  name: string;
  models: CarModel[];
}

export interface CarModel {
  name: string;
  engines: string[];
}

// Type assertion for imported JSON data
export const carData = carDataJson as CarMake[];

// Helper functions

/**
 * Get all available car makes
 */
export function getCarMakes(): string[] {
  return carData.map(make => make.name);
}

/**
 * Get all models for a specific car make
 */
export function getCarModels(make: string): string[] {
  if (!make) return [];

  // Log for debugging
  console.log(`Getting models for make: "${make}"`);
  console.log(`Available makes: ${carData.map(m => m.name).join(', ')}`);

  // Normalize make name to improve matching
  const normalizedMakeName = make.trim().toLowerCase();

  const carMake = carData.find(m => m.name.toLowerCase() === normalizedMakeName);

  if (!carMake) {
    console.log(`No make found for: "${make}"`);
    return [];
  }

  console.log(`Found make: ${carMake.name} with ${carMake.models.length} models`);
  return carMake.models.map(model => model.name);
}

/**
 * Get all available engine sizes for a specific car make and model
 */
export function getCarEngines(make: string, model: string): string[] {
  if (!make || !model) return [];

  // Normalize input to improve matching
  const normalizedMakeName = make.trim().toLowerCase();
  const normalizedModelName = model.trim().toLowerCase();

  const carMake = carData.find(m => m.name.toLowerCase() === normalizedMakeName);
  if (!carMake) return [];

  const carModel = carMake.models.find(m => m.name.toLowerCase() === normalizedModelName);
  if (!carModel) return [];

  return carModel.engines;
}