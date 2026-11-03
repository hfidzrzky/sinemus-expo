import React from 'react';
import { Toaster } from 'sonner';
import { QueryProvider } from './query-provider';
import { AuthProvider } from '@/features/auth';

interface AppProviderProps {
  children: React.ReactNode;
}

export function AppProvider({ children }: AppProviderProps): React.JSX.Element {
  return (
    <QueryProvider>
      <AuthProvider>
        {children}
        <Toaster
          theme="dark"
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            style: {
              background: '#121212',
              borderColor: '#2E2E2E',
              color: '#FAFAFA',
            },
            classNames: {
              toast: 'pr-9',
              closeButton:
                '!left-auto !right-3 !top-3.5 !transform-none !border !border-neutral-800 !bg-neutral-900 !text-neutral-400 hover:!text-white hover:!bg-neutral-800 hover:!border-neutral-700 transition-colors',
            },
          }}
        />
      </AuthProvider>
    </QueryProvider>
  );
}
