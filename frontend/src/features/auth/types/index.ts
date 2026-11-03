export type UserRole = 'customer' | 'super_admin';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  avatar_url: string | null;
  phone_number: string | null;
  is_phone_locked: boolean;
  birth_date: string | null;
  is_profile_completed: boolean;
  created_at: string;
}

export interface GoogleAuthPayload {
  id_token: string;
}

export interface GoogleAuthResponseData {
  token: string;
  is_new_user: boolean;
  user: User;
}

export interface UpdateProfilePayload {
  name?: string;
  birth_date?: string;
  phone_number?: string;
}

export interface AuthContextValue {
  currentUser: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  isPhoneCompletionModalOpen: boolean;
  isProfileDrawerOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  openPhoneCompletionModal: () => void;
  closePhoneCompletionModal: () => void;
  openProfileDrawer: () => void;
  closeProfileDrawer: () => void;
  loginWithGoogleToken: (
    idToken: string,
    onVerified?: (data: GoogleAuthResponseData) => Promise<void> | void
  ) => Promise<GoogleAuthResponseData>;
  updateProfile: (payload: UpdateProfilePayload) => Promise<User>;
  logout: () => void;
}
