import type { User } from '../types';

export const initialMockUser: User = {
  id: 1,
  name: 'Penonton Sinemus',
  email: 'penonton@example.com',
  avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  phone_number: '081234567890',
  is_phone_locked: true,
  birth_date: '2000-01-15',
  is_profile_completed: true,
  role: 'customer',
  created_at: new Date('2026-01-01T00:00:00.000Z').toISOString(),
};

export const mockAdminUser: User = {
  id: 99,
  name: 'Admin Sinemus',
  email: 'admin@sinemus.id',
  avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
  phone_number: '081299998888',
  is_phone_locked: true,
  birth_date: '1995-08-17',
  is_profile_completed: true,
  role: 'super_admin',
  created_at: new Date('2026-01-01T00:00:00.000Z').toISOString(),
};
