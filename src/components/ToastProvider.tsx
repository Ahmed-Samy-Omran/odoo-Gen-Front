import { Toaster } from 'react-hot-toast';

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3200,
        style: {
          background: 'rgba(10, 14, 24, 0.95)',
          color: '#f8fafc',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 12px 35px rgba(0,0,0,0.35)',
        },
        success: {
          iconTheme: {
            primary: '#34d399',
            secondary: '#052e16',
          },
        },
        error: {
          iconTheme: {
            primary: '#f87171',
            secondary: '#2c0f14',
          },
        },
      }}
    />
  );
}
