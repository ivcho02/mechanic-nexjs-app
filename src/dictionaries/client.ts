// Define dictionary type (same as server version)
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
    login: string;
    register: string;
    logout: string;
    myRepairs: string;
    adminPanel: string;
    profile: string;
  };
  auth: {
    login: string;
    register: string;
    email: string;
    password: string;
    confirmPassword: string;
    signIn: string;
    registerButton: string;
    registerPrompt: string;
    loginPrompt: string;
    passwordsDontMatch: string;
    logoutSuccess: string;
    loginRequired: string;
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
    delete: string;
    deleteConfirm: string;
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
  services: {
    title: string;
    addNewService: string;
    serviceName: string;
    price: string;
    description: string;
    save: string;
    cancel: string;
    edit: string;
    delete: string;
    noServices: string;
    servicesList: string;
    actions: string;
    date: string;
  };
};

// Import dictionaries
const dictionaries = {
  en: () => import('./en.json').then((module) => module.default) as Promise<Dictionary>,
  bg: () => import('./bg.json').then((module) => module.default) as Promise<Dictionary>,
};

export const getDictionaryClient = async (locale: string): Promise<Dictionary> => {
  // Default to 'en' if the locale is not supported
  return dictionaries[locale as 'en' | 'bg']() || dictionaries.en();
};