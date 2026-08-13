import { Toaster } from 'react-hot-toast';

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3200,
        style: {
          background: 'rgb(var(--surface) / 0.95)',
          color: 'rgb(var(--fg))',
          border: '1px solid rgb(var(--fg) / 0.15)',
          boxShadow: '0 12px 35px rgb(0 0 0 / 0.35)',
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
