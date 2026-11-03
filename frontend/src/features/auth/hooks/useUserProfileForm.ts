import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

interface UseUserProfileFormOptions {
  onSuccess?: () => void;
}

export function useUserProfileForm({ onSuccess }: UseUserProfileFormOptions = {}) {
  const { currentUser, updateProfile } = useAuth();

  const [name, setName] = useState(currentUser?.name || '');
  const [birthDate, setBirthDate] = useState(currentUser?.birth_date || '');
  const [isSaving, setIsSaving] = useState(false);

  // Sync internal state when currentUser changes
  useEffect(() => {
    if (currentUser) {
      const timer = setTimeout(() => {
        setName(currentUser.name);
        setBirthDate(currentUser.birth_date || '');
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [currentUser]);

  const isNameChanged = Boolean(currentUser && name.trim() !== currentUser.name);
  const isBirthDateChanged = Boolean(
    currentUser && (birthDate || '') !== (currentUser.birth_date || '')
  );
  const hasChanges = isNameChanged || isBirthDateChanged;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasChanges || !name.trim()) return;

    try {
      setIsSaving(true);
      await updateProfile({
        name: name.trim(),
        birth_date: birthDate || undefined,
      });
      onSuccess?.();
    } catch {
      // Error handled by toast in AuthContext
    } finally {
      setIsSaving(false);
    }
  };

  return {
    name,
    setName,
    birthDate,
    setBirthDate,
    isSaving,
    hasChanges,
    handleSave,
  };
}
