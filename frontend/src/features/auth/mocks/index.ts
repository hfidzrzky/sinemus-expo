/**
 * PUBLIC API GATEWAY — AUTH MOCKS
 *
 * Ekspor dari domain auth/mocks untuk digunakan di MSW test suite.
 *
 * Naming convention auth-module (canonical):
 *   - authHandlers  → MSW request handlers
 *   - resetMockUser / setMockUser → state control helpers untuk testing
 *   - initialMockUser / mockAdminUser → fixture users
 *
 * Backward-compat alias untuk branch staging:
 *   - MOCK_USER_DATA → alias ke initialMockUser
 */

export { authHandlers, resetMockUser, setMockUser } from './authHandlers';
export { initialMockUser, mockAdminUser } from './authFixtures';

// Backward-compatibility alias — digunakan oleh branch staging.
// Menghindari breaking change pada kode yang masih import MOCK_USER_DATA.
export { initialMockUser as MOCK_USER_DATA } from './authFixtures';
