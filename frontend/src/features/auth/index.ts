/**
 * PUBLIC API GATEWAY — DOMAIN AUTH
 */

export type {
  User,
  UserRole,
  GoogleAuthPayload,
  GoogleAuthResponseData,
  UpdateProfilePayload,
  AuthContextValue,
} from './types';
export type { AuthStatus, UseGoogleIdentityServicesReturn } from './hooks';

// Context & Auth Provider
export { AuthProvider } from './context/AuthContext';
export { useAuth } from './hooks/useAuth';

// API Hooks & Queries
export {
  useCurrentUserQuery,
  fetchCurrentUser,
  CURRENT_USER_QUERY_KEY,
} from './api/useCurrentUserQuery';
export { useGoogleAuthMutation, loginWithGoogle } from './api/useGoogleAuthMutation';
export { useUpdateProfileMutation, updateUserProfile } from './api/useUpdateProfileMutation';
export { useLogoutMutation, logoutUser } from './api/useLogoutMutation';

// Headless Client Logic & Hooks
export {
  useGoogleIdentityServices,
  usePhoneCompletionForm,
  useUserProfileForm,
  useEscapeKey,
} from './hooks';

// Presentational & Dialog Components
export { GoogleAuthModal } from './components/GoogleAuthModal';
export { PhoneCompletionModal } from './components/PhoneCompletionModal';
export { UserProfileDrawer } from './components/UserProfileDrawer';

// MSW Mocks
export { authHandlers } from './mocks';
