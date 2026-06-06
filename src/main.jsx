import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from '@/App.jsx';
import QueryProvider from '@/providers/QueryProvider';
import AuthProvider from '@/providers/AuthProvider';
import { Toaster } from '@/components/ui/sonner';
import '@/css/app.css';
import '@/index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <QueryProvider>
    <AuthProvider>
      <BrowserRouter>
        <App />
        <Toaster />
      </BrowserRouter>
    </AuthProvider>
  </QueryProvider>,
);
