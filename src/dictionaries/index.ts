import 'server-only';

// Define dictionary type
export type Dictionary = {
  home: {
    title: string;
    subtitle: string;
    services: string;
    clients: string;
    repairs: string;
    viewAll: string;
  };
  nav: {
    home: string;
    clients: string;
    repairs: string;
    services: string;
    addClient: string;
    addRepair: string;
    mainMenu: string;
    actions: string;
  };
  clients: {
    title: string;
    searchPlaceholder: string;
    addClient: string;
    clientsFound: string;
    clientFound: string;
    searchResultsFor: string;
    sortBy: string;
    date: string;
    name: string;
    car: string;
    phone: string;
    notSpecified: string;
    engineSize: string;
    vinNumber: string;
    newRepair: string;
    edit: string;
    viewRepairs: string;
    noSearchResults: string;
    noClients: string;
    tryDifferentSearch: string;
    addYourFirstClient: string;
  };
  clientForm: {
    addClient: string;
    editClient: string;
    ownerName: string;
    phone: string;
    make: string;
    model: string;
    engineSize: string;
    vin: string;
    selectMake: string;
    selectModel: string;
    selectEngineSize: string;
    customEngineSize: string;
    cancel: string;
    save: string;
    loading: string;
  };
  repairs: {
    title: string;
    searchPlaceholder: string;
    addRepair: string;
    repairsFound: string;
    repairFound: string;
    searchResultsFor: string;
    sortBy: string;
    date: string;
    client: string;
    car: string;
    service: string;
    status: string;
    totalCost: string;
    noRepairs: string;
    noSearchResults: string;
    tryDifferentSearch: string;
    addYourFirstRepair: string;
    filterBy: string;
    allStatuses: string;
    pending: string;
    inProgress: string;
    completed: string;
    viewDetails: string;
    edit: string;
  };
  repairForm: {
    addRepair: string;
    editRepair: string;
    client: string;
    selectClient: string;
    service: string;
    addService: string;
    removeService: string;
    selectedServices: string;
    noServicesSelected: string;
    totalCost: string;
    status: string;
    notes: string;
    notesPlaceholder: string;
    cancel: string;
    save: string;
    loading: string;
  };
};

// Import dictionaries
const dictionaries = {
  en: () => import('./en.json').then((module) => module.default) as Promise<Dictionary>,
  bg: () => import('./bg.json').then((module) => module.default) as Promise<Dictionary>,
};

export const getDictionary = async (locale: string): Promise<Dictionary> => {
  // Default to 'en' if the locale is not supported
  return dictionaries[locale as 'en' | 'bg']() || dictionaries.en();
};
