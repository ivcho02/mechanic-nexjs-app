import { collection, getDocs, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Repair, RepairStatus, Client, Service } from '@/types';

/**
 * Fetches all repairs from Firestore, ordered by creation date
 */
export const fetchRepairs = async (): Promise<Repair[]> => {
  try {
    const q = query(collection(db, 'repairs'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const repairsData = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Repair[];
    return repairsData;
  } catch (error) {
    console.error("Error fetching repairs:", error);
    throw error;
  }
};

/**
 * Fetches all clients from Firestore, ordered by creation date
 * Filters out duplicates based on owner name
 */
export const fetchClients = async (): Promise<Client[]> => {
  try {
    const q = query(collection(db, 'clients'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const clientsData = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ownerName: doc.data().ownerName,
      phone: doc.data().phone || '',
      make: doc.data().make,
      model: doc.data().model,
      engineSize: doc.data().engineSize,
      vin: doc.data().vin || '',
    }));

    // Remove duplicates based on ownerName
    const uniqueClients = clientsData.reduce((acc: Client[], current) => {
      const x = acc.find(item => item.ownerName === current.ownerName);
      if (!x) {
        return acc.concat([current]);
      } else {
        return acc;
      }
    }, []);

    return uniqueClients;
  } catch (error) {
    console.error("Error fetching clients:", error);
    throw error;
  }
};

/**
 * Fetches all services from Firestore, ordered by creation date
 */
export const fetchServices = async (): Promise<Service[]> => {
  try {
    const q = query(collection(db, 'services'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const servicesData = querySnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      price: doc.data().price,
      description: doc.data().description || '',
    })) as Service[];

    return servicesData;
  } catch (error) {
    console.error("Error fetching services:", error);
    throw error;
  }
};

/**
 * Updates the status of a repair
 */
export const updateRepairStatus = async (repairId: string, newStatus: RepairStatus): Promise<void> => {
  try {
    const repairRef = doc(db, 'repairs', repairId);
    await updateDoc(repairRef, {
      status: newStatus
    });
  } catch (error) {
    console.error('Error updating repair status:', error);
    throw error;
  }
};

/**
 * Cancels a repair by setting its status to 'Отказан'
 */
export const cancelRepair = async (repairId: string): Promise<void> => {
  try {
    const repairRef = doc(db, 'repairs', repairId);
    await updateDoc(repairRef, {
      status: 'Отказан' as RepairStatus
    });
  } catch (error) {
    console.error('Error cancelling repair:', error);
    throw error;
  }
};