import { Session, User } from "@supabase/supabase-js";

export interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export interface Role {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Permission {
  id: string;
  page_key: string;
  can_access: boolean;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface RolePermission {
  id: string;
  role_id: string;
  permission_id: string;
  created_at: string;
}

export interface UserSettings {
  id: string;
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserWithRole {
  id: string;
  email?: string;
  user_metadata: {
    [key: string]: any;
  };
  app_metadata: {
    [key: string]: any;
  };
  role?: Role | null;
  permissions?: Permission[] | null;
}

export interface PermissionMap {
  [pageKey: string]: boolean;
} 