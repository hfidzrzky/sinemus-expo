import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';

const INDONESIA_PHONE_REGEX = /^(08|\+628)[0-9]{8,12}$/;

interface UsePhoneCompletionFormOptions {
  onSuccess?: () => void;
}

export function usePhoneCompletionForm({ onSuccess }: UsePhoneCompletionFormOptions = {}) {
  const { currentUser, updateProfile } = useAuth();

  const [phoneNumber, setPhoneNumber] = useState(currentUser?.phone_number || '');
  const [birthDate, setBirthDate] = useState(currentUser?.birth_date || '');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [birthDateError, setBirthDateError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync internal state with currentUser updates
  useEffect(() => {
    if (currentUser) {
      const timer = setTimeout(() => {
        if (currentUser.phone_number) {
          setPhoneNumber(currentUser.phone_number);
        }
        if (currentUser.birth_date) {
          setBirthDate(currentUser.birth_date);
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [currentUser]);

  const handlePhoneChange = useCallback((value: string) => {
    setPhoneNumber(value);
    setPhoneError(null);
  }, []);

  const handleBirthDateChange = useCallback((value: string) => {
    setBirthDate(value);
    setBirthDateError(null);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let hasError = false;
    const cleanPhone = phoneNumber.trim().replace(/\s+/g, '').replace(/-/g, '');

    // 1. Validasi Format Nomor WhatsApp Indonesia
    if (!cleanPhone) {
      setPhoneError('Nomor WhatsApp wajib diisi.');
      hasError = true;
    } else if (!INDONESIA_PHONE_REGEX.test(cleanPhone)) {
      setPhoneError('Format nomor tidak valid. Gunakan awalan 08xx atau +628xx (10-14 digit).');
      hasError = true;
    } else {
      setPhoneError(null);
    }

    // 2. Validasi Tanggal Lahir
    if (!birthDate) {
      setBirthDateError('Tanggal lahir wajib diisi.');
      hasError = true;
    } else {
      const birth = new Date(birthDate);
      const today = new Date();
      if (isNaN(birth.getTime()) || birth >= today) {
        setBirthDateError('Tanggal lahir tidak valid.');
        hasError = true;
      } else {
        setBirthDateError(null);
      }
    }

    if (hasError) return;

    try {
      setIsSubmitting(true);
      await updateProfile({
        phone_number: cleanPhone,
        birth_date: birthDate,
      });
      onSuccess?.();
    } catch {
      // Error sudah ditangani toast di AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPhoneLocked = Boolean(currentUser?.is_phone_locked);
  const canDismiss = Boolean(currentUser?.phone_number);

  return {
    currentUser,
    phoneNumber,
    setPhoneNumber,
    handlePhoneChange,
    birthDate,
    setBirthDate,
    handleBirthDateChange,
    phoneError,
    setPhoneError,
    birthDateError,
    setBirthDateError,
    isSubmitting,
    isPhoneLocked,
    canDismiss,
    handleSubmit,
  };
}
