export interface UserProfile {
  id: number;
  username: string;
  profileImage: any;
  role: string;
}


export interface UserResponse {
  id: number;
  name: string;
  username: string;
  role: string;
  birthDate: string;
  profileImage: string | null;
  createdAt: string;
}
