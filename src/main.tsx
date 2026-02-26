import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n/config'
import App from './App.tsx'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

async function init() {
  try {
    const response = await fetch('/assets/config.json');
    const config = await response.json();
    (window as any)['__RUNTIME_CONFIG__'] = config;
  } catch (error) {
    console.error('Failed to load configuration:', error);
    // Fallback if config.json fails to load
    (window as any)['__RUNTIME_CONFIG__'] = {
      VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'
    };
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </StrictMode>,
  )
}

init();
