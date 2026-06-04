export interface User {
  id: number;
  email: string;
  name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}
