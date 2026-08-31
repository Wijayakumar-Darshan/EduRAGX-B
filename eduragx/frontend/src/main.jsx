import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import './styles/global.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Toaster
          position="top-right"
          gutter={12}
          toastOptions={{
            duration: 4000,
            style: {
              background: 'rgba(15, 23, 42, 0.95)',
              color: '#e2e8f0',
              border: '1px solid rgba(34, 197, 94, 0.15)',
              borderRadius: '12px',
              padding: '12px 16px',
              fontSize: '13.5px',
              fontFamily: 'DM Sans, system-ui, sans-serif',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.35)',
              backdropFilter: 'blur(8px)',
            },
            success: {
              iconTheme: {
                primary: '#22c55e',
                secondary: '#0f172a',
              },
              style: {
                border: '1px solid rgba(34, 197, 94, 0.25)',
              },
            },
            error: {
              iconTheme: {
                primary: '#f87171',
                secondary: '#0f172a',
              },
              style: {
                border: '1px solid rgba(248, 113, 113, 0.25)',
              },
            },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
)