import type { ReactNode } from 'react';
import { Toaster } from 'react-hot-toast';
import { useSocketEvents } from '../../hooks/useSocketEvents';

export function Layout({ children }: { children: ReactNode }) {
  useSocketEvents();
  return (
    <div className="min-h-screen flex flex-col font-nunito">
      <main className="flex-1 w-full relative flex flex-col">
        {children}
      </main>
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#fff',
            color: '#333',
            borderRadius: '12px',
            fontFamily: 'Nunito, sans-serif',
            fontWeight: 600,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            border: '2px solid #e0e0e0',
          },
          success: {
            iconTheme: {
              primary: '#4CAF50',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#F44336',
              secondary: '#fff',
            },
          },
        }} 
      />
    </div>
  );
}
