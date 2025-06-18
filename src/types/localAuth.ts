export type UserRole = 'admin' | 'manager' | 'finance' | 'telly caller' | 'marketing' | 'backoffice';

export interface User {
  id: string;
  email: string;
  password: string; // In a real app, this would be hashed
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface PagePermission {
  pageId: string;
  pageName: string;
  path: string;
  roles: UserRole[];
}

export interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  getPermissions: () => PagePermission[];
  updatePagePermissions: (pageId: string, roles: UserRole[]) => void;
  getUsers: () => User[];
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (user: User) => void;
  deleteUser: (userId: string) => void;
  hasPermission: (pageId: string) => boolean;
} 