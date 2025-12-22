export interface User {
  id: number;
  email: string;
  name: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserCreate {
  email: string;
  name?: string | null;
}

export interface UserUpdate {
  email?: string;
  name?: string | null;
  is_active?: boolean;
}
