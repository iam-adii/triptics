import { v4 as uuidv4 } from 'uuid';
import { User, UserRole, PagePermission } from '@/types/localAuth';

// Local storage keys
const USERS_STORAGE_KEY = 'triptics_users';
const PERMISSIONS_STORAGE_KEY = 'triptics_permissions';
const CURRENT_USER_KEY = 'triptics_current_user';

// Default users
const defaultUsers: User[] = [
  {
    id: uuidv4(),
    email: 'admin@triptics.in',
    password: 'admin123', // In a real app, this would be hashed
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
  },
  {
    id: uuidv4(),
    email: 'manager@triptics.in',
    password: 'manager123',
    firstName: 'Manager',
    lastName: 'User',
    role: 'manager',
  },
  {
    id: uuidv4(),
    email: 'finance@triptics.in',
    password: 'finance123',
    firstName: 'Finance',
    lastName: 'User',
    role: 'finance',
  },
  {
    id: uuidv4(),
    email: 'telly@triptics.in',
    password: 'telly123',
    firstName: 'Telly',
    lastName: 'Caller',
    role: 'telly caller',
  },
  {
    id: uuidv4(),
    email: 'marketing@triptics.in',
    password: 'marketing123',
    firstName: 'Marketing',
    lastName: 'User',
    role: 'marketing',
  },
  {
    id: uuidv4(),
    email: 'backoffice@triptics.in',
    password: 'backoffice123',
    firstName: 'Back',
    lastName: 'Office',
    role: 'backoffice',
  },
];

// Default page permissions
const defaultPermissions: PagePermission[] = [
  { pageId: 'dashboard', pageName: 'Dashboard', path: '/', roles: ['admin', 'manager', 'finance', 'telly caller', 'marketing', 'backoffice'] },
  { pageId: 'leads', pageName: 'Leads', path: '/leads', roles: ['admin', 'manager', 'telly caller', 'marketing'] },
  { pageId: 'customers', pageName: 'Customers', path: '/customers', roles: ['admin', 'manager', 'finance', 'backoffice'] },
  { pageId: 'itineraries', pageName: 'Itineraries', path: '/itineraries', roles: ['admin', 'manager', 'marketing'] },
  { pageId: 'bookings', pageName: 'Bookings', path: '/bookings', roles: ['admin', 'manager', 'finance', 'backoffice'] },
  { pageId: 'payments', pageName: 'Payments', path: '/payments', roles: ['admin', 'finance'] },
  { pageId: 'transfers', pageName: 'Transfers', path: '/transfers', roles: ['admin', 'manager', 'backoffice'] },
  { pageId: 'hotels', pageName: 'Hotels', path: '/hotels', roles: ['admin', 'manager'] },
  { pageId: 'reports', pageName: 'Reports', path: '/reports', roles: ['admin', 'manager', 'finance'] },
  { pageId: 'calendar', pageName: 'Calendar', path: '/calendar', roles: ['admin', 'manager', 'backoffice'] },
  { pageId: 'settings', pageName: 'Settings', path: '/settings', roles: ['admin'] },
];

// Initialize local storage with default data if empty
const initializeStorage = () => {
  if (!localStorage.getItem(USERS_STORAGE_KEY)) {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(defaultUsers));
  }

  if (!localStorage.getItem(PERMISSIONS_STORAGE_KEY)) {
    localStorage.setItem(PERMISSIONS_STORAGE_KEY, JSON.stringify(defaultPermissions));
  }
};

// User management functions
export const getUsers = (): User[] => {
  initializeStorage();
  const usersJson = localStorage.getItem(USERS_STORAGE_KEY);
  return usersJson ? JSON.parse(usersJson) : [];
};

export const getUserByEmail = (email: string): User | undefined => {
  const users = getUsers();
  return users.find(user => user.email.toLowerCase() === email.toLowerCase());
};

export const addUser = (user: Omit<User, 'id'>): User => {
  const users = getUsers();
  const newUser = { ...user, id: uuidv4() };
  users.push(newUser);
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  return newUser;
};

export const updateUser = (updatedUser: User): void => {
  const users = getUsers();
  const index = users.findIndex(user => user.id === updatedUser.id);
  if (index !== -1) {
    users[index] = updatedUser;
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  }
};

export const deleteUser = (userId: string): void => {
  const users = getUsers().filter(user => user.id !== userId);
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
};

// Permission management functions
export const getPermissions = (): PagePermission[] => {
  initializeStorage();
  const permissionsJson = localStorage.getItem(PERMISSIONS_STORAGE_KEY);
  return permissionsJson ? JSON.parse(permissionsJson) : [];
};

export const updatePagePermissions = (pageId: string, roles: UserRole[]): void => {
  const permissions = getPermissions();
  const index = permissions.findIndex(p => p.pageId === pageId);
  if (index !== -1) {
    permissions[index].roles = roles;
    localStorage.setItem(PERMISSIONS_STORAGE_KEY, JSON.stringify(permissions));
  }
};

// Current user management
export const setCurrentUser = (user: User): void => {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
};

export const getCurrentUser = (): User | null => {
  const userJson = localStorage.getItem(CURRENT_USER_KEY);
  return userJson ? JSON.parse(userJson) : null;
};

export const removeCurrentUser = (): void => {
  localStorage.removeItem(CURRENT_USER_KEY);
};

// Authentication functions
export const login = async (email: string, password: string): Promise<User | null> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const user = getUserByEmail(email);
  if (user && user.password === password) {
    setCurrentUser(user);
    return user;
  }
  return null;
};

export const logout = (): void => {
  removeCurrentUser();
};

// Check if user has permission for a specific page
export const hasPermission = (pageId: string, userRole: UserRole): boolean => {
  const permissions = getPermissions();
  const page = permissions.find(p => p.pageId === pageId);
  return page ? page.roles.includes(userRole) : false;
}; 